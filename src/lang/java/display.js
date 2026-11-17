import { java } from '@codemirror/lang-java';
import { EditorView } from '@codemirror/view';
import { lezerAnalysis } from '../../analysis/lezer-analysis.js';
import { lezerSyntax } from './lezer-syntax.js';

export const javaDisplayExtensions = [
	java(),
	EditorView.editorAttributes.of({ class: 'cm-java' }),
	lezerAnalysis(lezerSyntax),
];
