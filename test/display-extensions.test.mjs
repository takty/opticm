import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, gutterLineClass } from '@codemirror/view';
import { createDisplayExtensions, setHighlightedLines } from 'opticm/display';

test('static highlights survive document replacement and display reconfiguration', () => {
	const display = new Compartment();
	const extensions = options => createDisplayExtensions({
		syntaxHighlight: false,
		semanticHighlight: false,
		structureHighlight: false,
		declarationHighlight: false,
		referenceHighlight: false,
		...options,
	});
	const positions = state => {
		const result = [];
		for (const decorations of state.facet(EditorView.decorations)) {
			decorations.between(0, state.doc.length, from => result.push(from));
		}
		const gutterPositions = [];
		for (const markers of state.facet(gutterLineClass)) {
			markers.between(0, state.doc.length, (from, _to, marker) => {
				if (marker.elementClass === 'cm-opticm-highlighted-line-number') gutterPositions.push(from);
			});
		}
		assert.deepEqual(gutterPositions, result);
		return result;
	};
	let state = EditorState.create({ doc: 'a\nbb', extensions: [display.of(extensions())] });
	state = state.update({ effects: setHighlightedLines.of([2, 0, 0]) }).state;
	assert.deepEqual(positions(state), [0]);
	state = state.update({
		changes: { from: 0, to: state.doc.length, insert: 'aaa\nb\nc' },
		effects: display.reconfigure(extensions({ lineNumbers: true, lineNumberStart: 90 })),
	}).state;
	assert.deepEqual(positions(state), [0, 6]);
	for (const invalid of [[-1], [1.5], Array(1)]) {
		assert.throws(() => state.update({ effects: setHighlightedLines.of(invalid) }).state, RangeError);
	}
	state = state.update({ effects: setHighlightedLines.of([]) }).state;
	assert.deepEqual(positions(state), []);
});

test('the display rejects invalid line-number starts', () => {
	for (const lineNumberStart of [0, -1, 1.5, Infinity, '2']) {
		assert.throws(() => createDisplayExtensions({ lineNumberStart }), RangeError);
	}
});
