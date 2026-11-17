import { javaLanguage as javaSyntax } from '@codemirror/lang-java';
import { createAnalysisClient } from '../../analyzer.js';
import { closeBracketsFor } from '../close-brackets.js';
import { completionTrigger, createCompletionSession } from './completion.js';
import { formatLine } from './formatting.js';
import { javaDisplayExtensions } from './display.js';

export const javaLanguage = {
	supportsFunctionSections: true,
	supportsBracketMatching : true,
	extensions              : javaDisplayExtensions,
	closeBrackets           : closeBracketsFor(javaSyntax),

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
