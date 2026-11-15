import { EditorView, highlightWhitespace } from '@codemirror/view';
import { extensionStyles } from '../styles.js';
import css from './style.css';

export function whitespaceHighlighting() {
	return [
		highlightWhitespace(),
		EditorView.editorAttributes.of({ class: 'cm-croq-whitespace' }),
		extensionStyles(css),
	];
}
