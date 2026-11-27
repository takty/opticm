/**
 * Highlight specified document lines and their gutter entries.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

import { RangeSet, StateEffect, StateField } from '@codemirror/state';
import { Decoration, EditorView, GutterMarker, gutterLineClass } from '@codemirror/view';
import { extensionStyles } from '../styles.js';
import css from './style.css';

export const setHighlightedLines = StateEffect.define();

const lineHighlight = Decoration.line({ class: 'cm-opticm-highlighted-line' });
const gutterHighlight = new class extends GutterMarker {
	elementClass = 'cm-opticm-highlighted-line-number';
}();

const highlightedLines = StateField.define({
	create: () => ({ lines: [], decorations: Decoration.none, gutterMarkers: RangeSet.empty }),
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
		const markers = [];
		for (const line of lines) {
			if (line >= doc.lines) break;
			const from = doc.line(line + 1).from;
			ranges.push(lineHighlight.range(from));
			markers.push(gutterHighlight.range(from));
		}
		return { lines, decorations: Decoration.set(ranges), gutterMarkers: RangeSet.of(markers) };
	},
	provide: field => [
		EditorView.decorations.from(field, value => value.decorations),
		gutterLineClass.from(field, value => value.gutterMarkers),
	],
});

export const staticLineHighlighting = [highlightedLines, extensionStyles(css)];
