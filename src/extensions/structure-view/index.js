import { Facet, StateEffect, StateField, countColumn } from '@codemirror/state';
import { EditorView, ViewPlugin, logException } from '@codemirror/view';
import { commonAnalysisState } from '../../analysis/common-analysis.js';
import { extensionStyles } from '../styles.js';
import css from './style.css';

export const setStructure = StateEffect.define();
const retainOnEditFacet = Facet.define({ combine: values => values.some(Boolean) });
const displayOptions = Facet.define({ combine: values => values.at(-1) ?? { structures: true, declarations: true, references: true } });
export const retainStructureOnEdit = retainOnEditFacet.of(true);

export function structureViewOptions(options) {
	if (!options || typeof options.structures !== 'boolean' || typeof options.declarations !== 'boolean' || typeof options.references !== 'boolean') {
		throw new TypeError('Structure view options must specify structures, declarations and references');
	}
	return displayOptions.of(options);
}

function mapUnchangedStructure(items, transaction) {
	const oldDoc = transaction.startState.doc, newDoc = transaction.newDoc;
	const affected = [];
	let unsafeFrom = Infinity;
	transaction.changes.iterChanges((from, to, newFrom, newTo) => {
		const first            = oldDoc.lineAt(from).number - 1, last = oldDoc.lineAt(to).number - 1;
		const removed          = oldDoc.sliceString(from, to), inserted = newDoc.sliceString(newFrom, newTo);
		const changed          = removed + inserted;
		const oldContext       = oldDoc.sliceString(Math.max(0, from - 1), Math.min(oldDoc.length, to + 1));
		const newContext       = newDoc.sliceString(Math.max(0, newFrom - 1), Math.min(newDoc.length, newTo + 1));
		const line             = oldDoc.lineAt(from);
		const prefix           = line.text.slice(0, from - line.from), suffix = line.text.slice(from - line.from);
		const newlineInsertion = from === to && /^[ \t\n]*\n[ \t\n]*$/.test(inserted) &&
			!(/\/\/|\b(?:return|throw|break|continue|yield)\s*$/.test(prefix) && suffix.trim()) &&
			!(/[\w$]$/.test(prefix) && /^[\w$]/.test(suffix));
		const indentation = transaction.isUserEvent('format') && /^[ \t]*$/.test(changed) &&
			/^[ \t]*$/.test(line.text.slice(0, to - line.from));
		const layoutOnly = newlineInsertion || indentation;
		affected.push({ first, last, from, to, layoutOnly });
		if (
			(!layoutOnly && /[()[\]{}/*'"`\\\n;:,?]/.test(changed)) ||
			/\/\/|\/\*|\*\//.test(oldContext + '\n' + newContext)
		) {
			unsafeFrom = Math.min(unsafeFrom, first);
		}
		if (!layoutOnly && /\b(?:else|catch|finally|while)\b/.test(line.text + '\n' + newDoc.lineAt(newFrom).text)) {
			let preceding = first;
			while (preceding > 0 && !oldDoc.line(preceding).text.trim()) {
				preceding--;
			}
			unsafeFrom = Math.min(unsafeFrom, Math.max(0, preceding - 1));
		}
	});
	const offset = position => {
		const line = oldDoc.line(Math.max(1, Math.min(oldDoc.lines, position.line + 1)));
		return line.from + Math.max(0, Math.min(line.length, position.ch ?? 0));
	};
	const mapPosition = (position, assoc) => {
		const mapped = transaction.changes.mapPos(offset(position), assoc);
		const line   = newDoc.lineAt(mapped);
		return { line: line.number - 1, ch: mapped - line.from };
	};
	return items.filter(item => item.to.line < unsafeFrom &&
		!affected.some(({ first, last, from, to, layoutOnly }) => {
			if (!layoutOnly) {
				return item.from.line <= last && item.to.line >= first;
			}
			if (item.kind !== 'token') {
				return false;
			}
			const start = offset(item.from);
			const end   = offset(item.to);
			return from < end && to > start || (from === to && from > start && from < end);
		}))
		.map(item => ({
			...item,
			from: mapPosition(item.from, 1),
			to  : mapPosition(item.to, -1),
			...(item.kind === 'range' ? { branches: item.branches.map(branch => mapPosition(branch, 1)) } : {}),
		}));
}

const structureField = StateField.define({
	create: () => [],
	update(value, transaction) {
		if (transaction.isUserEvent('load')) {
			value = [];
		} else if (transaction.docChanged) {
			value = transaction.state.facet(retainOnEditFacet) ? mapUnchangedStructure(value, transaction) : [];
		}
		for (const effect of transaction.effects) {
			if (effect.is(setStructure)) {
				value = effect.value;
			}
		}
		return value;
	},
});

const structurePlugin = ViewPlugin.fromClass(class {
	constructor(view) {
		this.view = view;
		const document = view.dom.ownerDocument;
		this.overlay = document.createElement('div');
		this.overlay.className = 'cm-structure-overlay';
		this.overlay.setAttribute('aria-hidden', 'true');
		this.canvas = document.createElement('canvas');
		this.canvas.className = 'code-structure-view';
		this.overlay.append(this.canvas);
		view.dom.append(this.overlay);
		this.pendingDraw = null;
		this.measure = {
			key  : this,
			read : view => this.read(view),
			write: data => this.queueDraw(data),
		};
		this.onScroll = () => this.refresh();
		view.scrollDOM.addEventListener('scroll', this.onScroll, { passive: true });
		this.refresh();
	}

	update(update) {
		const before  = update.startState.field(commonAnalysisState, false);
		const after   = update.state.field(commonAnalysisState, false);
		const options = update.state.facet(displayOptions);
		if (
			update.docChanged ||
			update.geometryChanged ||
			update.viewportChanged ||
			Boolean(before) !== Boolean(after) ||
			(options.structures && before?.structures !== after?.structures) ||
			(options.declarations && before?.declarations !== after?.declarations) ||
			(options.references && before?.references !== after?.references) ||
			(!after && update.startState.field(structureField) !== update.state.field(structureField)) ||
			update.startState.facet(displayOptions) !== options
		) {
			this.refresh();
		}
	}

	refresh() {
		this.view.requestMeasure(this.measure);
	}

	read(view) {
		const root     = view.dom.getBoundingClientRect();
		const scroller = view.scrollDOM;
		const frame    = scroller.getBoundingClientRect();
		const content  = view.contentDOM.getBoundingClientRect();
		const window   = view.dom.ownerDocument.defaultView;
		const styles   = window.getComputedStyle(view.dom);
		const { scrollTop, scrollLeft } = scroller;
		const { viewport } = view;

		const appearance = createAppearanceReader(styles);
		const drawStyle  = readDrawStyle(appearance);
		const line = view.contentDOM.querySelector('.cm-line');
		const lineStart = line
			? line.getBoundingClientRect().left + parseFloat(window.getComputedStyle(line).paddingLeft)
			: content.left;
		const left   = Math.max(frame.left, content.left);
		const width  = Math.max(0, frame.left + scroller.clientWidth - left);
		const height = scroller.clientHeight;
		const { doc } = view.state;
		const coords = createCoordinateMapper(view, { frame, left, lineStart });
		const analysis    = view.state.field(commonAnalysisState, false);
		const options     = view.state.facet(displayOptions);
		const source      = analysis ? commonDecorations(analysis, doc, options, appearance) : view.state.field(structureField);
		const decorations = measureDecorations(source, coords, appearance.resolveColor);
		return {
			left      : left - root.left,
			top       : frame.top - root.top,
			width,
			height,
			charWidth  : view.defaultCharacterWidth,
			lineHeight : view.defaultLineHeight,
			scrollTop,
			scrollLeft,
			viewport,
			drawStyle,
			decorations,
		};
	}

	queueDraw(data) {
		const alreadyQueued = this.pendingDraw !== null;
		this.pendingDraw = data;
		if (alreadyQueued) return;

		// CodeMirror can adjust the scroll position after the measure write phase.
		queueMicrotask(() => {
			const pending = this.pendingDraw;
			this.pendingDraw = null;
			if (pending === null) return;

			const { view } = this;
			const { scrollTop, scrollLeft } = view.scrollDOM;
			const { viewport } = view;
			const moved = pending.scrollTop !== scrollTop || pending.scrollLeft !== scrollLeft ||
				pending.viewport.from !== viewport.from || pending.viewport.to !== viewport.to;
			try {
				this.write(moved ? this.read(view) : pending);
			} catch (error) {
				logException(view.state, error);
			}
		});
	}

	write(data) {
		Object.assign(
			this.overlay.style,
			{
				left  : data.left + 'px',
				top   : data.top + 'px',
				width : data.width + 'px',
				height: data.height + 'px',
			}
		);
		const scale = this.canvas.ownerDocument.defaultView.devicePixelRatio;
		const { width, height, charWidth, lineHeight, drawStyle, decorations } = data;
		const drawing = JSON.stringify([
			scale,
			width,
			height,
			charWidth,
			lineHeight,
			drawStyle,
			decorations.map(item => (
				item.kind === 'range'
					? [
						item.kind,
						item.fill,
						item.opacity,
						item.start,
						item.end.y,
						item.spine,
						item.from.line === item.to.line,
						item.branchWidth,
						item.branchRows,
					] : [
						item.kind,
						item.appearance,
						item.fill,
						item.stroke,
						item.start,
						item.end
					]
			)),
		]);
		if (drawing === this.lastDrawing) return;
		drawStructure(this.canvas, data, scale);
		this.lastDrawing = drawing;
	}

	destroy() {
		this.pendingDraw = null;
		this.view.scrollDOM.removeEventListener('scroll', this.onScroll);
		this.overlay.remove();
	}
});

export const structureView = [
	structureField,
	structurePlugin,
	EditorView.editorAttributes.of({ class: 'cm-structure-view' }),
	extensionStyles(css),
];

function createAppearanceReader(styles) {
	const resolveColor = value => {
		const match = /^var\(\s*(--[\w-]+)\s*,\s*(.+)\)$/.exec(value);
		return match ? styles.getPropertyValue(match[1]).trim() || match[2] : value;
	};
	const readValue = name => styles.getPropertyValue(name).trim() ||
		styles.getPropertyValue(name.replace('--opticm-', '--opticm-default-')).trim();
	const readNumber = name => {
		const value = readValue(name);
		const number = Number(value);
		if (!value || !Number.isFinite(number)) {
			throw new TypeError(`CSS custom property ${name} must be a finite number`);
		}
		return number;
	};
	return {
		color : name => resolveColor(readValue(name)),
		number: readNumber,
		resolveColor,
	};
}

function readDrawStyle(appearance) {
	return {
		rangePadding             : appearance.number('--opticm-structure-range-padding'),
		spineInset               : appearance.number('--opticm-structure-spine-inset'),
		fadeLength               : appearance.number('--opticm-structure-fade-length'),
		referenceShadowBlur      : appearance.number('--opticm-structure-reference-shadow-blur'),
		referenceShadowOffsetY   : appearance.number('--opticm-structure-reference-shadow-offset-y'),
		tokenHeightScale         : appearance.number('--opticm-structure-token-height-scale'),
		tokenRadiusScale         : appearance.number('--opticm-structure-token-radius-scale'),
		declarationInset         : appearance.number('--opticm-structure-declaration-padding-left'),
		declarationWidthPadding  : appearance.number('--opticm-structure-declaration-padding-right'),
		declarationBorderWidth   : appearance.number('--opticm-structure-declaration-border-width'),
		declarationSideWidthScale: appearance.number('--opticm-structure-declaration-side-width-scale'),
	};
}

function createCoordinateMapper(view, { frame, left, lineStart }) {
	const { doc, tabSize } = view.state;
	return (pos, side = 1) => {
		const line     = doc.line(Math.max(1, Math.min(doc.lines, pos.line + 1)));
		const offset   = line.from + Math.max(0, Math.min(line.length, pos.ch ?? 0));
		const measured = view.coordsAtPos(offset, side);
		const block    = view.lineBlockAt(offset);
		const lineTop  = view.documentTop + block.top - frame.top;
		if (measured) {
			const glyphTop = (measured.top + measured.bottom - view.defaultLineHeight) / 2 - frame.top;
			const row      = Math.max(0, Math.round((glyphTop - lineTop) / view.defaultLineHeight));
			return {
				x: measured.left - left,
				y: lineTop + row * view.defaultLineHeight
			};
		}
		const columns = countColumn(doc.sliceString(block.from, offset), tabSize);
		return {
			x: lineStart - left + columns * view.defaultCharacterWidth,
			y: lineTop
		};
	};
}

function measureDecorations(source, coords, resolveColor) {
	return source.map(item => {
		const start = coords(item.from);
		const end   = coords(item.to, -1);
		const fill  = resolveColor(item.fill);
		if (item.kind === 'token') {
			return { ...item, fill, stroke: resolveColor(item.stroke), start, end };
		}
		return {
			...item,
			fill,
			start,
			end,
			spine      : coords({ ...item.from, ch: item.from.ch + item.spineChars + 1 }, -1).x - start.x - item.spineChars,
			branchWidth: coords({ ...item.from, ch: item.from.ch + item.branchChars + 1 }, -1).x - start.x - item.branchChars,
			branchRows : item.branches.map(branch => coords(branch).y),
		};
	});
}

function commonDecorations(analysis, doc, options, appearance) {
	const colors = {
		class    : appearance.color('--opticm-structure-class-fill'),
		function : appearance.color('--opticm-structure-function-fill'),
		branch   : appearance.color('--opticm-structure-branch-fill'),
		branch2  : appearance.color('--opticm-structure-branch2-fill'),
		loop     : appearance.color('--opticm-structure-loop-fill'),
		loop2    : appearance.color('--opticm-structure-loop2-fill'),
		exception: appearance.color('--opticm-structure-exception-fill'),
	};
	const position = offset => {
		const line = doc.lineAt(offset);
		return { line: line.number - 1, ch: offset - line.from };
	};
	const decorations = [];
	if (options.structures) {
		for (const it of analysis.structures) {
			decorations.push({
				kind       : 'range',
				from       : position(it.from),
				to         : position(it.to),
				fill       : colors[it.kind],
				spineChars : 3,
				branchChars: 4,
				branches   : it.branches.map(position),
			});
		}
	}
	if (options.declarations) {
		for (const it of analysis.declarations) {
			const colors = it.scope === 'function'
				? [
					appearance.color('--opticm-structure-declaration-var-fill'),
					appearance.color('--opticm-structure-declaration-var-stroke'),
				]
				: it.mutability === 'immutable'
					? [
						appearance.color('--opticm-structure-declaration-immutable-fill'),
						appearance.color('--opticm-structure-declaration-immutable-stroke'),
					]
					: [
						appearance.color('--opticm-structure-declaration-mutable-fill'),
						appearance.color('--opticm-structure-declaration-mutable-stroke'),
					];
			decorations.push({
				kind      : 'token',
				appearance: 'declaration',
				from      : position(it.from),
				to        : position(it.to),
				fill      : colors[0],
				stroke    : colors[1],
			});
		}
	}
	if (options.references) {
		for (const it of analysis.references) {
			if (it.role !== 'reference') continue;
			decorations.push({
				kind      : 'token',
				appearance: 'reference',
				from      : position(it.from),
				to        : position(it.to),
				fill      : appearance.color('--opticm-structure-reference-fill'),
				stroke    : appearance.color('--opticm-structure-reference-stroke'),
			});
		}
	}
	return decorations;
}

export function refreshStructure(view) {
	view.plugin(structurePlugin)?.refresh();
}

function drawStructure(canvas, { width, height, charWidth, lineHeight, drawStyle, decorations }, scale) {
	const pixelsWide = Math.round(width * scale), pixelsHigh = Math.round(height * scale);
	if (canvas.width !== pixelsWide) canvas.width = pixelsWide;
	if (canvas.height !== pixelsHigh) canvas.height = pixelsHigh;
	const ctx = canvas.getContext('2d');
	ctx.setTransform(scale, 0, 0, scale, 0, 0);
	ctx.clearRect(0, 0, width, height);
	if (!width || !height) return;

	const padding = Math.min(drawStyle.rangePadding, lineHeight / 4);
	const band = lineHeight - padding * 2;
	const transparentColor = createTransparentColorReader(canvas);
	for (const it of decorations) {
		ctx.fillStyle = it.fill;

		if (it.kind === 'range') {
			drawRange(ctx, it, charWidth, drawStyle, padding, band, transparentColor);
		} else if (it.appearance === 'reference') {
			drawReference(ctx, it, charWidth, lineHeight, drawStyle);
		} else if (it.appearance === 'declaration') {
			drawDeclaration(ctx, it, charWidth, lineHeight, drawStyle);
		}
	}
}

function createTransparentColorReader(canvas) {
	let colorContext;
	return color => {
		if (!colorContext) {
			const colorCanvas = canvas.ownerDocument.createElement('canvas');
			colorCanvas.width = colorCanvas.height = 1;
			colorContext = colorCanvas.getContext('2d', { willReadFrequently: true });
		}
		colorContext.clearRect(0, 0, 1, 1);
		colorContext.fillStyle = color;
		colorContext.fillRect(0, 0, 1, 1);
		const [red, green, blue] = colorContext.getImageData(0, 0, 1, 1).data;
		return `rgba(${red}, ${green}, ${blue}, 0)`;
	};
}

function drawRange(ctx, it, charWidth, drawStyle, padding, band, transparentColor) {
	const { start, end } = it;
	const left   = start.x + drawStyle.spineInset;
	const spine  = Math.max(1, it.spine - drawStyle.spineInset);
	const top    = start.y + padding;
	const bottom = end.y + padding;
	fill(ctx, left, top, spine, bottom - top + band, [band / 2, 0, 0, band / 2]);

	const capWidth       = Math.max(0, charWidth * drawStyle.fadeLength - spine);
	const fadeColor      = transparentColor(it.fill);
	const fillHorizontal = (x, y, width, radii) => {
		if (width <= 0) return;
		const gradient = ctx.createLinearGradient(x, y, x + width, y);
		gradient.addColorStop(0, it.fill);
		gradient.addColorStop(1, fadeColor);
		ctx.fillStyle = gradient;
		fill(ctx, x, y, width, band, radii);
		ctx.fillStyle = it.fill;
	};
	fillHorizontal(left + spine, top, capWidth, [0, 0, 0, 0]);
	if (it.from.line !== it.to.line) {
		fillHorizontal(left + spine, bottom, capWidth, [0, 0, 0, 0]);
	}
	for (const row of it.branchRows) {
		fillHorizontal(
			left + spine,
			row + padding,
			Math.max(1, it.branchWidth - drawStyle.spineInset),
			[0, band / 2, band / 2, 0],
		);
	}
}

function drawReference(ctx, it, charWidth, lineHeight, drawStyle) {
	const { start, end } = it;
	const x = start.x, h = charWidth * drawStyle.tokenHeightScale;
	const y = start.y + (lineHeight - h) / 2;
	ctx.save();
	ctx.shadowColor   = it.stroke;
	ctx.shadowBlur    = drawStyle.referenceShadowBlur;
	ctx.shadowOffsetY = drawStyle.referenceShadowOffsetY;
	fill(ctx, x, y, end.x - x, h, [0, lineHeight * drawStyle.tokenRadiusScale, lineHeight * drawStyle.tokenRadiusScale, 0]);
	ctx.restore();
}

function drawDeclaration(ctx, it, charWidth, lineHeight, drawStyle) {
	const { start, end } = it;
	const x           = start.x - drawStyle.declarationInset;
	const tokenHeight = charWidth * drawStyle.tokenHeightScale;
	const y           = start.y + (lineHeight - tokenHeight) / 2;
	const h           = end.y - start.y + tokenHeight;
	const radius = lineHeight * drawStyle.tokenRadiusScale;

	if (fill(ctx, x, y, end.x - x + drawStyle.declarationWidthPadding, h, [0, radius, radius, 0])) {
		ctx.strokeStyle = it.stroke;
		ctx.lineWidth   = drawStyle.declarationBorderWidth;
		ctx.stroke();
		ctx.lineWidth = charWidth * drawStyle.declarationSideWidthScale;
		ctx.beginPath();
		ctx.moveTo(x - ctx.lineWidth / 2, y - 0.5);
		ctx.lineTo(x - ctx.lineWidth / 2, y + h + 0.5);
		ctx.stroke();
	}
}

function fill(ctx, x, y, width, height, radii) {
	if (width <= 0 || height <= 0) return false;
	ctx.beginPath();
	ctx.roundRect(x, y, width, height, radii);
	ctx.fill();
	return true;
}
