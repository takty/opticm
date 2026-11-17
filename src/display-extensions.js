import { commonAnalysisState } from './analysis/common-analysis.js';
import { absoluteLineNumbers, functionLineNumbers } from './extensions/function-line-numbers/index.js';
import { indentRulers } from './extensions/indent-rulers/index.js';
import { syntaxHighlightingExtension, syntaxHighlightingOptions } from './extensions/syntax-highlighting/index.js';
import { structureView, structureViewOptions } from './extensions/structure-view/index.js';

export function createSyntaxExtensions({ syntaxHighlight, semanticHighlight }) {
	if (!syntaxHighlight && !semanticHighlight) return [];
	return [
		syntaxHighlightingExtension,
		syntaxHighlightingOptions({ syntax: syntaxHighlight, semantic: semanticHighlight }),
	];
}

export function createStructureExtensions({ structureHighlight, declarationHighlight, referenceHighlight }) {
	if (!structureHighlight && !declarationHighlight && !referenceHighlight) return [];
	return [
		structureView,
		structureViewOptions({
			structures  : structureHighlight,
			declarations: declarationHighlight,
			references  : referenceHighlight,
		}),
	];
}

export function createDisplayExtensions({
	syntaxHighlight      = true,
	semanticHighlight    = true,
	structureHighlight   = true,
	declarationHighlight = true,
	referenceHighlight   = true,
	lineNumbers          = 'off',
	rulers               = false,
} = {}) {
	if (!['off', 'absolute', 'function'].includes(lineNumbers)) {
		throw new TypeError('lineNumbers must be off, absolute or function');
	}
	const numbers = lineNumbers === 'function' ? functionLineNumbers : absoluteLineNumbers;
	return [
		commonAnalysisState,
		createStructureExtensions({ structureHighlight, declarationHighlight, referenceHighlight }),
		createSyntaxExtensions({ syntaxHighlight, semanticHighlight }),
		lineNumbers === 'off' ? [] : numbers,
		rulers ? indentRulers : [],
	];
}
