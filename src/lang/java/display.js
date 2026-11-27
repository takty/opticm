/**
 * Register Java syntax support and immediate classifications for code display.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

import { java } from '@codemirror/lang-java';
import { EditorView } from '@codemirror/view';
import { lezerAnalysis } from '../../analysis/lezer-analysis.js';
import { lezerSyntax } from './lezer-syntax.js';

export const javaDisplayExtensions = [
	java(),
	EditorView.editorAttributes.of({ class: 'cm-java' }),
	lezerAnalysis(lezerSyntax),
];
