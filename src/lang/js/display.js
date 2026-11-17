import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { lezerAnalysis } from '../../analysis/lezer-analysis.js';
import { lezerSyntax } from './lezer-syntax.js';

export const javascriptDisplayExtensions = [
	javascript(),
	EditorView.editorAttributes.of({ class: 'cm-javascript' }),
	lezerAnalysis(lezerSyntax),
];
