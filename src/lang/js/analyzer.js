/**
 * Analyze JavaScript with strict or tolerant parsing and collect display ranges.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

import { acorn } from '../../lib/parser.js';
import { buildCommonAnalysis } from './common-analysis.js';
import { analyzeReferences } from './scope-analysis.js';

export function analyze(code) {
	function walk(node, visitors, base, state, override) {
		if (!base) {
			base = acorn.walk.base;
		}
		(function c(node, st, override) {
			const type  = override || node.type;
			const found = visitors[type];
			if (found) {
				found(node, st);
			}
			base[type](node, st, c);
		})(node, state, override);
		return visitors;
	}
	const PARSE_OPTION = { locations: true, ecmaVersion: 'latest' };

	let ast;
	let ok = true;
	try {
		ast = acorn.parse(code, PARSE_OPTION);
	} catch (error) {
		if (!(error instanceof SyntaxError)) {
			throw error;
		}
		ast = acorn.loose.parse(code, PARSE_OPTION);
		ok  = false;
	}
	return walk(ast, createVisitor()).get(code, ast, ok);
}

// -----------------------------------------------------------------------------

const FUNCTION_EXPRESSION       = 'FunctionExpression';
const ARROW_FUNCTION_EXPRESSION = 'ArrowFunctionExpression';
const CLASS_EXPRESSION          = 'ClassExpression';
const MEMBER_EXPRESSION         = 'MemberExpression';
const IF_STATEMENT              = 'IfStatement';
const IDENTIFIER                = 'Identifier';

function createVisitor() {
	const context = {
		fnLocs             : [],
		classLocs          : [],
		ifLocs             : [],
		switchLocs         : [],
		tryNodes           : [],
		forLocs            : [],
		whileLocs          : [],
		fnNames            : [],
		ifNodes            : [],
		varLocs            : [],
		letLocs            : [],
		constLocs          : [],
		bindingLocs        : { var: [], let: [], const: [] },
		propertyDefinitions: [],
		shorthandProperties: [],
	};
	return {
		...createDeclarationVisitors(context),
		...createFunctionVisitors(context),
		...createControlVisitors(context),
		get: (source, ast, success) => createJavaScriptResult(context, source, ast, success),
	};
}

function collectBindings(context, node, target) {
	if (!node) return;

	const { shorthandProperties } = context;
	switch (node.type) {
		case 'Identifier':
			if (node.name !== '✖' && node.start < node.end) {
				target.push([node, node]);
			}
			break;
		case 'AssignmentPattern':
			collectBindings(context, node.left, target);
			break;
		case 'RestElement':
			collectBindings(context, node.argument, target);
			break;
		case 'ArrayPattern':
			for (const e of node.elements) {
				collectBindings(context, e, target);
			}
			break;
		case 'ObjectPattern':
			for (const property of node.properties) {
				if (property.type === 'Property' && property.shorthand && property.key.type === 'Identifier' && property.key.name !== '✖') {
					shorthandProperties.push({ from: property.key.start, to: property.key.end, kind: 'destructuring-shorthand' });
				}
				collectBindings(context, property.value ?? property.argument, target);
			}
			break;
	}
}

function createDeclarationVisitors(context) {
	const { fnNames, classLocs, propertyDefinitions } = context;
	return {
		ObjectExpression: node => {
			for (const property of node.properties) {
				if (property.type === 'Property' && !property.computed && property.key.type === 'Identifier' && property.key.name !== '✖') {
					propertyDefinitions.push({ from: property.key.start, to: property.key.end, kind: 'property-definition' });
				}
			}
		},
		ClassDeclaration: node => {
			fnNames.push(node.id?.name);
			classLocs.push([node, node]);
		},
		ClassExpression: node => {
			classLocs.push([node, node]);
		},
		VariableDeclaration: node => collectVariableDeclaration(context, node),	// const f = function () {...};
	};
}

function collectVariableDeclaration(context, node) {
	const { bindingLocs, varLocs, letLocs, constLocs } = context;

	for (const d of node.declarations) {
		collectBindings(context, d.id, bindingLocs[node.kind]);
		collectFunctionBinding(context, node, d);
	}
	switch (node.kind) {
		case 'var':
			for (const d of node.declarations) {
				varLocs.push([d.id, d.id]);
			}
			break;
		case 'let':
			for (const d of node.declarations) {
				letLocs.push([d.id, d.id]);
			}
			break;
		case 'const':
			for (const d of node.declarations) {
				constLocs.push([d.id, d.id]);
			}
			break;
	}
}

function collectFunctionBinding(context, node, d) {
	const { fnLocs, fnNames } = context;
	if (d.init !== null && (d.init.type === FUNCTION_EXPRESSION || d.init.type === ARROW_FUNCTION_EXPRESSION)) {
		if (node.loc.start.line === d.loc.start.line) {
			fnLocs.push([node, d]);  // for considering the column of 'const'
		} else {
			fnLocs.push([d, d]);
		}
	}
	if (d.init !== null && (d.init.type === FUNCTION_EXPRESSION || d.init.type === ARROW_FUNCTION_EXPRESSION || d.init.type === CLASS_EXPRESSION)) {
		fnNames.push(d.id?.name);
	}
}

function createFunctionVisitors(context) {
	const { fnLocs, fnNames } = context;
	return {
		FunctionDeclaration: node => {  // function f () {...}
			fnLocs.push([node, node]);
			fnNames.push(node.id?.name);
		},
		AssignmentExpression: node => {  // f = function () {...};
			const left = node.left, right = node.right;
			if ((left.type === IDENTIFIER || left.type === MEMBER_EXPRESSION) && (right.type === FUNCTION_EXPRESSION || right.type === ARROW_FUNCTION_EXPRESSION)) {
				fnLocs.push([node, node]);
			}
			if (left.type === IDENTIFIER && (right.type === FUNCTION_EXPRESSION || right.type === ARROW_FUNCTION_EXPRESSION || right.type === CLASS_EXPRESSION)) {
				fnNames.push(left.name);
			}
		},
		MethodDefinition: node => {
			fnLocs.push([node, node]);
		},
	};
}

function createControlVisitors(context) {
	const { ifNodes, ifLocs, switchLocs, tryNodes, forLocs, whileLocs } = context;
	return {
		IfStatement: node => {
			if (ifNodes[node.start] === true) return;

			const p = [node, node];
			let n = node;
			while (true) {
				if (n.alternate) {
					p.push(n.alternate);
				}
				if (n.alternate && n.alternate.type === IF_STATEMENT) {
					n = n.alternate;
					p[1] = n;
					ifNodes[n.start] = true;
				} else {
					break;
				}
			}
			ifLocs.push(p);
		},
		SwitchStatement: node => {
			switchLocs.push([node, node]);
		},
		TryStatement: node => {
			tryNodes.push(node);
		},
		ForStatement: node => {
			forLocs.push([node, node]);
		},
		WhileStatement: node => {
			whileLocs.push([node, node]);
		},
		DoWhileStatement: node => {
			whileLocs.push([node, node]);
		},
	};
}

function createJavaScriptResult(context, source, ast, success) {
	const { fnLocs, classLocs, ifLocs, switchLocs, tryNodes, forLocs, whileLocs, fnNames,
		varLocs, letLocs, constLocs, bindingLocs, propertyDefinitions, shorthandProperties } = context;
	const fnStarts = collectFunctionStarts(fnLocs);
	const ranges = {
		fnLocs,
		classLocs,
		ifLocs,
		switchLocs,
		forLocs,
		whileLocs,
		varLocs,
		letLocs,
		constLocs
	};
	const legacy = mapNodeRanges(ranges, node => node.loc.start, node => node.loc.end);
	const offsets = mapNodeRanges(ranges, node => node.start, node => node.end);
	offsets.tryLocs = collectTryRanges(source, tryNodes);
	offsets.propertyDefinitions = propertyDefinitions;
	offsets.shorthandProperties = shorthandProperties;
	for (const kind of ['var', 'let', 'const']) {
		offsets[`${kind}Locs`] = bindingLocs[kind].map(([from, to]) => [from.start, to.end]);
	}
	const result = {
		...legacy,
		fnStarts,
		fnNames: fnNames.filter(Boolean),
		success
	};
	return {
		...result,
		commonAnalysis: buildCommonAnalysis(result, source, offsets, analyzeReferences(ast))
	};
}

function collectFunctionStarts(fnLocs) {
	const fnStarts = [];
	let lastEnd = -1;
	for (const [bgn, end] of fnLocs) {
		if (lastEnd < end.loc.end.line - 1) {
			fnStarts.push(bgn.loc.start.line - 1);
			lastEnd = end.loc.end.line - 1;
		}
	}
	return fnStarts;
}

function mapNodeRanges(ranges, start, end) {
	return Object.fromEntries(Object.entries(ranges).map(([kind, entries]) => [
		kind,
		entries.map(([from, to, ...branches]) => [start(from), end(to), ...branches.map(start)]),
	]));
}

function collectTryRanges(source, tryNodes) {
	return tryNodes.map(node => {
		const range = [node.start, node.end];
		if (node.handler) range.push(node.handler.start);
		if (node.finalizer) {
			// Acorn gives the finalizer block's opening brace, not the keyword.
			const start = (node.handler ?? node.block).end;
			const gap = source.slice(start, node.finalizer.start);
			const clause = /^(?:\s|\/\/[^\r\n\u2028\u2029]*|\/\*[\s\S]*?\*\/)*finally\b/.exec(gap);
			if (clause) range.push(start + clause[0].lastIndexOf('finally'));
		}
		return range;
	});
}
