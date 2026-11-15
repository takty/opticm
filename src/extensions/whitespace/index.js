import { Decoration, EditorView, highlightWhitespace, MatchDecorator, ViewPlugin } from '@codemirror/view';
import { extensionStyles } from '../styles.js';
import css from './style.css';

// Alternate classes so adjacent marks remain separate DOM spans.
const spaceMarks = [
	Decoration.mark({ class: 'cm-croq-space cm-croq-space-even' }),
	Decoration.mark({ class: 'cm-croq-space cm-croq-space-odd' }),
];
const fullWidthSpaceMarks = [
	Decoration.mark({ class: 'cm-highlightSpace cm-croq-space cm-croq-full-width-space cm-croq-space-even' }),
	Decoration.mark({ class: 'cm-highlightSpace cm-croq-space cm-croq-full-width-space cm-croq-space-odd' }),
];
const spaces = new MatchDecorator({
	regexp: /[ \u3000]+/g,
	decorate(add, from, _to, match) {
		for (let i = 0; i < match[0].length; i++) {
			const marks = match[0][i] === ' ' ? spaceMarks : fullWidthSpaceMarks;
			add(from + i, from + i + 1, marks[i % 2]);
		}
	},
	boundary: /[^ \u3000]/,
});

const highlightSpaces = ViewPlugin.fromClass(class {
	constructor(view) {
		this.decorations = spaces.createDeco(view);
	}

	update(update) {
		this.decorations = spaces.updateDeco(update, this.decorations);
	}
}, { decorations: plugin => plugin.decorations });

export function whitespaceHighlighting() {
	return [
		highlightWhitespace(),
		highlightSpaces,
		EditorView.editorAttributes.of({ class: 'cm-croq-whitespace' }),
		extensionStyles(css),
	];
}
