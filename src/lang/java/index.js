import { java, javaLanguage as javaSyntax } from '@codemirror/lang-java';
import { EditorView } from '@codemirror/view';
import { createAnalysisClient } from '../../analyzer.js';
import { lezerAnalysis } from '../../analysis/lezer-analysis.js';
import { closeBracketsFor } from '../close-brackets.js';
import { completionTrigger, createCompletionSession } from './completion.js';
import { formatLine } from './formatting.js';
import { lezerSyntax } from './lezer-syntax.js';

export const javaLanguage = {
	supportsFunctionSections: true,
	supportsBracketMatching: true,
	extensions: [
		java(),
		EditorView.editorAttributes.of({ class: 'cm-java' }),
		lezerAnalysis(lezerSyntax),
	],
	closeBrackets: closeBracketsFor(javaSyntax),

	createAnalysisClient(options) {
		return createAnalysisClient('java', options);
	},

	diagnostics(text, locale, _options, client) {
		return client.request(text, undefined, locale);
	},
	completionTrigger,
	createCompletionSession,
	formatLine,
};
