import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';
import { Language, Parser } from 'web-tree-sitter';
import { analyzeJava } from '../src/lang/java/analyzer.js';
import { diagnoseJava } from '../src/lang/java/diagnostics.js';

const source = await readFile(new URL('../src/_docs/main.js', import.meta.url), 'utf8');
const program = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
const declaration = program.body.find(node => node.type === 'VariableDeclaration' &&
	node.declarations.some(item => item.id.name === 'samples'));
const samples = Object.fromEntries(declaration.declarations.find(item => item.id.name === 'samples')
	.init.properties.map(property => [property.key.name, property.value.quasis[0].value.cooked]));

test('JavaScript example parses and includes field and function declarations', () => {
	const ast = parse(samples.javascript, { ecmaVersion: 'latest', sourceType: 'module' });
	assert.ok(ast.body.some(node => node.type === 'FunctionDeclaration'));
	assert.ok(ast.body.some(node => node.type === 'ClassDeclaration' &&
		node.body.body.some(item => item.type === 'PropertyDefinition')));
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
