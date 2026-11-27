/**
 * Verify that documentation samples parse and cover the supported display classifications.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';
import { Language, Parser } from 'web-tree-sitter';
import { EditorState } from '@codemirror/state';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { commonAnalysisState, setCommonAnalysis } from '../src/analysis/common-analysis.js';
import { lezerAnalysis, syntaxAnalysisState } from '../src/analysis/lezer-analysis.js';
import { analyzeJava } from '../src/lang/java/analyzer.js';
import { diagnoseJava } from '../src/lang/java/diagnostics.js';
import { lezerSyntax as javaSyntax } from '../src/lang/java/lezer-syntax.js';
import { lezerSyntax as javascriptSyntax } from '../src/lang/js/lezer-syntax.js';
import { analyze } from '../.build/lang/js/analyzer.js';

const source = await readFile(new URL('../src/_docs/main.js', import.meta.url), 'utf8');
const program = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
const declaration = program.body.find(node => node.type === 'VariableDeclaration' &&
	node.declarations.some(item => item.id.name === 'samples'));
const samples = Object.fromEntries(declaration.declarations.find(item => item.id.name === 'samples')
	.init.properties.map(property => [property.key.name, property.value.quasis[0].value.cooked]));

function assertHighlightCoverage(doc, language, classifier, analysis, { syntax, declarations }) {
	let state = EditorState.create({ doc, extensions: [language, commonAnalysisState, lezerAnalysis(classifier)] });
	state = state.update({ effects: setCommonAnalysis.of({ ...analysis, version: 1 }) }).state;
	const snapshot = state.field(commonAnalysisState);
	const displayed = state.field(syntaxAnalysisState).data;
	const displayedSyntax = new Set(displayed.syntax.map(item => item.kind));
	assert.deepEqual(new Set(snapshot.structures.map(item => item.kind)),
		new Set(['class', 'function', 'branch', 'branch2', 'loop', 'loop2', 'exception']));
	for (const kind of syntax) assert.ok(displayedSyntax.has(kind), `Missing sample syntax: ${kind}`);
	assert.deepEqual(new Set(snapshot.declarations.map(item =>
		item.scope === 'function' ? 'function-scoped' : item.mutability)), new Set(declarations));
	assert.ok(displayed.references.some(item => item.role === 'definition'));
	assert.deepEqual(new Set(displayed.references.filter(item => item.role === 'reference').map(item => item.scope)),
		new Set(['local', 'unknown']));
}

test('JavaScript example parses and includes field and function declarations', () => {
	const ast = parse(samples.javascript, { ecmaVersion: 'latest', sourceType: 'module' });
	assert.ok(ast.body.some(node => node.type === 'FunctionDeclaration'));
	assert.ok(ast.body.some(node => node.type === 'ClassDeclaration' &&
		node.body.body.some(item => item.type === 'PropertyDefinition')));
	const result = analyze(samples.javascript);
	assert.equal(result.success, true);
	assertHighlightCoverage(samples.javascript, javascript(), javascriptSyntax, result.commonAnalysis, {
		syntax: [
			'comment', 'keyword', 'literal', 'variable', 'property', 'class-definition',
			'function-definition', 'field-definition', 'property-definition',
		],
		declarations: ['function-scoped', 'mutable', 'immutable'],
	});
});

test('Java example parses and includes representative type declarations', async () => {
	await Parser.init();
	const parser = new Parser();
	parser.setLanguage(await Language.load(fileURLToPath(new URL('../node_modules/tree-sitter-java/tree-sitter-java.wasm', import.meta.url))));
	const tree = parser.parse(samples.java);
	try {
		const result = analyzeJava(samples.java, tree.rootNode);
		assert.equal(result.success, true);
		assert.deepEqual(result.syntaxHighlights.filter(item => item.kind === 'class-definition')
			.map(item => samples.java.slice(item.from, item.to)), ['Greeting', 'Mood', 'Person', 'Greeter']);
		assertHighlightCoverage(samples.java, java(), javaSyntax, result.commonAnalysis, {
			syntax: [
				'comment', 'keyword', 'operator', 'literal', 'type', 'function', 'variable',
				'class-definition', 'function-definition',
			],
			declarations: ['mutable', 'immutable'],
		});
	} finally {
		tree.delete();
		parser.delete();
	}
});

test('Java example localizes an unclosed prefix string and retains independent diagnostics', async () => {
	await Parser.init();
	const parser = new Parser();
	parser.setLanguage(await Language.load(fileURLToPath(new URL('../node_modules/tree-sitter-java/tree-sitter-java.wasm', import.meta.url))));
	const edited = samples.java.replace('"Hello"', '"Hello');
	const independentError = edited.replace('int remaining = 2;', 'int remaining = ;');
	const lines = edited.split('\n');
	const line = lines.findIndex(text => text.includes('prefix ='));
	const ch = lines[line].indexOf('"');
	try {
		for (const source of [edited, independentError]) {
			const tree = parser.parse(source);
			try {
				const [unclosed, ...other] = diagnoseJava(tree.rootNode, 'en', parser, source);
				assert.deepEqual(unclosed, {
					message: 'Expected a closing quote for this string.',
					severity: 'error',
					from: { line, ch },
					to: { line, ch: ch + 1 },
				});
				assert.deepEqual(other.map(item => item.from.line), source === edited ? [] :
					[lines.findIndex(text => text.includes('int remaining ='))]);
			} finally {
				tree.delete();
			}
		}
	} finally {
		parser.delete();
	}
});
