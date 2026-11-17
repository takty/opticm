import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView } from '@codemirror/view';
import { extensionStyles } from '../styles.js';
import css from './style.css';

export const setHighlightedLines = StateEffect.define();

const lineHighlight = Decoration.line({ class: 'cm-opticm-highlighted-line' });
const highlightedLines = StateField.define({
	create: () => ({ lines: [], decorations: Decoration.none }),
	update(value, transaction) {
		let lines = value.lines;
		for (const effect of transaction.effects) {
			if (!effect.is(setHighlightedLines)) continue;
			if (!Array.isArray(effect.value)) {
				throw new TypeError('Highlighted lines must be an array');
			}
			lines = [...new Set(effect.value)];
			if (lines.some(line => !Number.isSafeInteger(line) || line < 0)) {
				throw new RangeError('Highlighted lines must be zero-based line indices');
			}
			lines.sort((a, b) => a - b);
		}
		if (lines === value.lines && (!lines.length || !transaction.docChanged)) return value;

		const doc = transaction.newDoc;
		const ranges = [];
		for (const line of lines) {
			if (line >= doc.lines) break;
			ranges.push(lineHighlight.range(doc.line(line + 1).from));
		}
		return { lines, decorations: Decoration.set(ranges) };
	},
	provide: field => EditorView.decorations.from(field, value => value.decorations),
});

export const staticLineHighlighting = [highlightedLines, extensionStyles(css)];
