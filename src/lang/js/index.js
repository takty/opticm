/**
 * Connect JavaScript syntax, analysis, diagnostics, completion, and formatting services.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

import { javascriptLanguage as javascriptSyntax } from '@codemirror/lang-javascript';
import { createAnalysisClient } from '../../analyzer.js';
import { closeBracketsFor } from '../close-brackets.js';
import { completionTrigger, createCompletionSession } from './completion.js';
import { diagnostics } from './diagnostics.js';
import { formatLine } from './formatting.js';
import { javascriptDisplayExtensions } from './display.js';

// Internal language contract: see ../language-interface.md. No Editor private state
// crosses this boundary; the view applies returned data to its own document/UI.
export const javascriptLanguage = {
	supportsFunctionSections: true,
	supportsBracketMatching : true,
	extensions              : javascriptDisplayExtensions,
	closeBrackets           : closeBracketsFor(javascriptSyntax, '`'),

	createAnalysisClient() {
		return createAnalysisClient('javascript');
	},
	diagnostics,
	completionTrigger,
	createCompletionSession,
	formatLine,
};
