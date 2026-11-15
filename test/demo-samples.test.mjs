import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';
import { Language, Parser } from 'web-tree-sitter';
import { analyzeJava } from '../src/lang/java/analyzer.js';

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
