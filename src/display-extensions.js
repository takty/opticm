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
