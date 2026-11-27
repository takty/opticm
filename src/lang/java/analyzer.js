/**
 * Convert Java parser nodes into syntax, structure, declaration, and reference ranges.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

import { buildCommonAnalysis } from './common-analysis.js';
import { createLocalVariables, isVariableReference } from './scope-analysis.js';

const KEYWORDS = new Set([
	'abstract',
	'assert',
	'boolean',
	'break',
	'byte',
	'case',
	'catch',
	'char',
	'class',
	'const',
	'continue',
	'default',
	'do',
	'double',
	'else',
	'enum',
	'extends',
	'final',
	'finally',
	'float',
	'for',
	'if',
	'implements',
	'import',
	'instanceof',
	'int',
	'interface',
	'long',
	'native',
	'new',
	'package',
	'private',
	'protected',
	'public',
	'return',
	'short',
	'static',
	'strictfp',
	'super',
	'switch',
	'synchronized',
	'this',
	'throw',
	'throws',
	'transient',
	'try',
	'void',
	'volatile',
	'while',
	'var',
	'yield',
	'record',
	'sealed',
	'permits',
	'non-sealed',
	'module',
	'open',
	'opens',
	'exports',
	'requires',
	'transitive',
	'to',
	'uses',
	'provides',
	'with',
]);

const DECLARATIONS = new Set([
	'class_declaration',
	'interface_declaration',
	'enum_declaration',
	'record_declaration',
	'annotation_type_declaration',
]);
const HIGHLIGHTED_TYPE_DECLARATIONS = new Set(['class_declaration', 'interface_declaration', 'enum_declaration', 'record_declaration']);

const LITERALS = new Set(['string_literal', 'character_literal', 'text_block', 'true', 'false']);
const OPERATORS = new Set([
	'=',
	'+=',
	'-=',
	'*=',
	'/=',
	'%=',
	'&=',
	'|=',
	'^=',
	'<<=',
	'>>=',
	'>>>=',
	'+',
	'-',
	'*',
	'/',
	'%',
	'++',
	'--',
	'==',
	'!=',
	'<',
	'>',
	'<=',
	'>=',
	'&&',
	'||',
	'!',
	'~',
	'&',
	'|',
	'^',
	'<<',
	'>>',
	'>>>',
	'?',
	':',
	'.',
	'::',
]);
const DEFINITION_PARENTS = new Set([
	'variable_declarator',
	'formal_parameter',
	'catch_formal_parameter',
	'enhanced_for_statement',
	'resource',
	'method_declaration',
	'constructor_declaration',
	'compact_constructor_declaration',
	'enum_constant',
	'instanceof_expression',
]);
const FUNCTION_NODES = new Set([
	'method_declaration',
	'constructor_declaration',
	'compact_constructor_declaration',
	'lambda_expression',
]);
const SWITCH_NODES = new Set(['switch_statement', 'switch_expression']);
const LOOP_NODES   = new Set(['enhanced_for_statement', 'for_statement']);
const LOOP2_NODES  = new Set(['do_statement', 'while_statement']);

export function analyzeJava(source, rootNode) {
	const access = createSourceAccess(source, rootNode);
	const context = {
		...access,
		locals          : createLocalVariables(access.textOf),
		syntaxHighlights: [],
		references      : [],
		sectionStarts   : new Set(),
		structures      : [],
		declarations    : [],
		lineStarts      : collectLineStarts(source),
	};
	visitJavaNode(context, rootNode);
	return createJavaResult(context, source.length, !rootNode.hasError);
}

function createSourceAccess(source, rootNode) {
	const bytes           = new TextEncoder().encode(source);
	const decoder         = new TextDecoder();
	const utf8ToUtf16     = createUtf8OffsetMap(source);
	const usesByteOffsets = rootNode.endIndex === bytes.length;
	const toOffset        = usesByteOffsets ? index => utf8ToUtf16[index] : index => index;
	const textOf          = node => usesByteOffsets
		? decoder.decode(bytes.subarray(node.startIndex, node.endIndex))
		: source.slice(node.startIndex, node.endIndex);
	return { toOffset, textOf };
}

function collectLineStarts(source) {
	const lineStarts = [0];
	for (let i = 0; i < source.length; i++) {
		if (source.charCodeAt(i) === 10) {
			lineStarts.push(i + 1);
		}
	}
	return lineStarts;
}

function lineAt(lineStarts, offset) {
	let low = 0, high = lineStarts.length;
	while (low < high) {
		const middle = (low + high) >>> 1;
		if (lineStarts[middle] <= offset) {
			low = middle + 1;
		} else {
			high = middle;
		}
	}
	return low - 1;
}

function addSyntax(context, node, kind) {
	const { toOffset, syntaxHighlights } = context;
	if (node.endIndex <= node.startIndex) return;

	const from = toOffset(node.startIndex);
	const to   = toOffset(node.endIndex);
	if (from !== undefined && to !== undefined) syntaxHighlights.push({ from, to, kind });
}

function addStructureRange(context, node, kind, branches = []) {
	const { toOffset, structures } = context;
	const from = toOffset(node.startIndex), to = toOffset(node.endIndex);
	if (from === undefined || to === undefined || to <= from) return;

	structures.push({ kind, from, to, branches: branches.filter(Number.isInteger) });
}

function addVariableDeclaration(context, node) {
	const { toOffset, textOf, declarations } = context;
	const declarator  = node.parent;
	const declaration = declarator?.type === 'variable_declarator' ? declarator.parent : declarator;
	if (!['local_variable_declaration', 'field_declaration', 'enhanced_for_statement', 'resource'].includes(declaration?.type) ||
		declarator.childForFieldName('name')?.startIndex !== node.startIndex) {
		return;
	}
	const from = toOffset(node.startIndex), to = toOffset(node.endIndex);
	if (from === undefined || to === undefined || from >= to) return;

	const modifiers = declaration.namedChildren.find(child => child.type === 'modifiers');
	const isFinal   = modifiers && /\bfinal\b/.test(textOf(modifiers));
	const scope     = declaration.type === 'field_declaration' ? 'member' : 'lexical';
	declarations.push({
		kind      : 'variable',
		from,
		to,
		mutability: isFinal ? 'immutable' : 'mutable',
		scope,
	});
}

function visitJavaNode(context, node) {
	if (node.isError || node.isMissing) return;

	context.locals.enter(node);
	addArrayDimensions(context, node);
	addStructure(context, node);
	if (node.type.includes('comment')) {
		addSyntax(context, node, 'comment');
	} else if (LITERALS.has(node.type) || node.type.endsWith('_literal')) {
		addSyntax(context, node, 'literal');
	} else if (node.childCount === 0) {
		addLeafSyntax(context, node);
	} else {
		for (let i = 0; i < node.childCount; i++) {
			visitJavaNode(context, node.child(i));
		}
	}
	context.locals.leave(node);
}

function addArrayDimensions(context, node) {
	if (node.type === 'dimensions') {
		let owner = node.parent;
		if (owner?.type === 'variable_declarator') owner = owner.parent;
		if (owner && [
			'array_type',
			'field_declaration',
			'constant_declaration',
			'local_variable_declaration',
			'formal_parameter',
			'method_declaration',
			'enhanced_for_statement',
		].includes(owner.type)) {
			let type = owner.childForFieldName(owner.type === 'array_type' ? 'element' : 'type');
			if (type?.type === 'array_type') type = type.childForFieldName('element');
			const kind = type && ['integral_type', 'floating_point_type', 'boolean_type'].includes(type.type)
				? 'keyword' : 'type';
			for (const child of node.children) {
				if (child.type === '[' || child.type === ']') addSyntax(context, child, kind);
			}
		}
	}
}

function addStructure(context, node) {
	const { toOffset, sectionStarts } = context;
	if (HIGHLIGHTED_TYPE_DECLARATIONS.has(node.type)) {
		addStructureRange(context, node, 'class');
	} else if (FUNCTION_NODES.has(node.type)) {
		const start = toOffset(node.startIndex);
		if (start !== undefined) {
			sectionStarts.add(lineAt(context.lineStarts, start));
			addStructureRange(context, node, 'function');
		}
	} else if (node.type === 'if_statement') {
		const alternative = node.childForFieldName('alternative');
		const branchOffset = alternative ? toOffset(alternative.startIndex) : undefined;
		const branches = branchOffset === undefined ? [] : [branchOffset];
		addStructureRange(context, node, 'branch', branches);
	} else if (SWITCH_NODES.has(node.type)) {
		addStructureRange(context, node, 'branch2');
	} else if (LOOP_NODES.has(node.type)) {
		addStructureRange(context, node, 'loop');
	} else if (LOOP2_NODES.has(node.type)) {
		addStructureRange(context, node, 'loop2');
	} else if (node.type === 'try_statement' || node.type === 'try_with_resources_statement') {
		const branches = node.namedChildren
			.filter(child => child.type === 'catch_clause' || child.type === 'finally_clause')
			.map(child => toOffset(child.startIndex));
		addStructureRange(context, node, 'exception', branches);
	}
}

function addLeafSyntax(context, node) {
	const { textOf } = context;
	const text = textOf(node);
	if (KEYWORDS.has(text)) addSyntax(context, node, 'keyword');
	else if (isOperator(node, text)) {
		addSyntax(context, node, 'operator');
	}
	else if (node.type === 'type_identifier') {
		addSyntax(context, node, 'type');
		if (HIGHLIGHTED_TYPE_DECLARATIONS.has(node.parent?.type) && node.parent.childForFieldName('name')?.startIndex === node.startIndex) {
			addSyntax(context, node, 'class-definition');
		}
	}
	else if (node.type === 'identifier' || node.type === 'field_identifier') {
		addIdentifier(context, node);
	}
}

function addIdentifier(context, node) {
	const { locals, toOffset, references } = context;
	addVariableDeclaration(context, node);
	const local = locals.isReference(node);
	addSyntax(context, node, local ? 'local-reference' : identifierKind(node));
	if (HIGHLIGHTED_TYPE_DECLARATIONS.has(node.parent?.type) && node.parent.childForFieldName('name')?.startIndex === node.startIndex) {
		addSyntax(context, node, 'class-definition');
	}
	if (node.parent?.type === 'method_declaration' && isDefinition(node)) {
		addSyntax(context, node, 'function-definition');
	}
	const role = isDefinition(node) ? 'definition' : isVariableReference(node) ? 'reference' : null;
	if (role) {
		const from = toOffset(node.startIndex), to = toOffset(node.endIndex);
		if (from !== undefined && to !== undefined && from < to) {
			references.push({ from, to, role, scope: local ? 'local' : 'unknown' });
			addSyntax(context, node, role === 'definition' ? 'definition' : 'variable-reference');
		}
	}
}

function createJavaResult(context, sourceLength, success) {
	const { syntaxHighlights, sectionStarts, structures, declarations, references, lineStarts } = context;
	syntaxHighlights.sort((a, b) => a.from - b.from || a.to - b.to);
	const sortedSectionStarts = [...sectionStarts].sort((a, b) => a - b);
	const ranges = { structures, declarations, syntax: syntaxHighlights, references };
	return {
		success,
		syntaxHighlights,
		sectionStarts : sortedSectionStarts,
		commonAnalysis: buildCommonAnalysis(sourceLength, success, ranges, sortedSectionStarts, lineStarts),
	};
}

function isOperator(node, text) {
	if (!OPERATORS.has(text)) return false;
	const parent = node.parent?.type;
	if (['type_arguments', 'type_parameters', 'wildcard', 'scoped_type_identifier', 'scoped_identifier'].includes(parent)) {
		return false;
	}
	return text !== ':' || parent === 'ternary_expression';
}

function isDefinition(node) {
	const parent = node.parent;
	if (!parent) return false;
	if (parent.type === 'inferred_parameters') return true;
	if (parent.type === 'lambda_expression') {
		return parent.childForFieldName('parameters')?.startIndex === node.startIndex;
	}
	return DEFINITION_PARENTS.has(parent.type) &&
		parent.childForFieldName('name')?.startIndex === node.startIndex;
}

function identifierKind(node) {
	const parent = node.parent;
	if (!parent) return 'variable';
	const name = parent.childForFieldName('name');
	if (name?.startIndex === node.startIndex && DECLARATIONS.has(parent.type)) return 'type';
	if (name?.startIndex === node.startIndex && parent.type === 'method_declaration') return 'function';
	if (name?.startIndex === node.startIndex && parent.type === 'method_invocation') return 'function';
	return 'variable';
}

function createUtf8OffsetMap(source) {
	const offsets   = [];
	const encoder   = new TextEncoder();
	let byteOffset  = 0;
	let utf16Offset = 0;
	offsets[0]      = 0;

	for (const character of source) {
		byteOffset  += encoder.encode(character).length;
		utf16Offset += character.length;
		offsets[byteOffset] = utf16Offset;
	}
	return offsets;
}
