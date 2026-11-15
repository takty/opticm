import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';
import { lezerAnalysis, syntaxAnalysisState } from '../src/analysis/lezer-analysis.js';
import { lezerSyntax as javascriptSyntax } from '../src/lang/js/lezer-syntax.js';
import { lezerSyntax as javaSyntax } from '../src/lang/java/lezer-syntax.js';
import { commonAnalysisState, setCommonAnalysis } from '../src/analysis/common-analysis.js';
import { analyzeReferences } from '../src/lang/js/scope-analysis.js';
import { parse } from 'acorn';

function names(doc, language, classifier, kind = 'function-definition') {
	const state = EditorState.create({ doc, extensions: [language, lezerAnalysis(classifier)] });
	return state.field(syntaxAnalysisState).data.syntax
		.filter(range => range.kind === kind)
		.map(range => doc.slice(range.from, range.to));
}

test('JavaScript classifies function and method definitions without classifying calls', () => {
	const doc = 'function greet() {} class A { method() {} } greet(); obj.method(); const arrow = () => 1; arrow(); obj.field;';
	assert.deepEqual(names(doc, javascript(), javascriptSyntax), ['greet', 'method', 'arrow']);
});

test('class declarations are distinguished from class references', () => {
	const js = 'class Example {} new Example(); class Other extends Example {}';
	const javaDoc = 'class Example {} class Other extends Example { Example field; }';
	assert.deepEqual(names(js, javascript(), javascriptSyntax, 'class-definition'), ['Example', 'Other']);
	assert.deepEqual(names(javaDoc, java(), javaSyntax, 'class-definition'), ['Example', 'Other']);
});

test('Java interface, enum and record names are distinguished from type references', () => {
	const doc = 'interface Contract {} enum Kind { ONE } record Point(int x) {} class Use { Contract c; Kind k; Point p; }';
	assert.deepEqual(names(doc, java(), javaSyntax, 'class-definition'), ['Contract', 'Kind', 'Point', 'Use']);
});

test('JavaScript field declarations remain classified after worker analysis', () => {
	const doc = 'class Example { field = 1; static count = 0; #secret = 2; method() { return this.field; } }';
	let state = EditorState.create({ doc, extensions: [javascript(), lezerAnalysis(javascriptSyntax), commonAnalysisState] });
	const fieldNames = () => state.field(syntaxAnalysisState).data.syntax
		.filter(range => range.kind === 'field-definition').map(range => doc.slice(range.from, range.to));
	assert.deepEqual(fieldNames(), ['field', 'count', '#secret']);
	state = state.update({ effects: setCommonAnalysis.of({ version: 1, sourceLength: doc.length, complete: true,
		structures: [], declarations: [], syntax: [], references: analyzeReferences(parse(doc, { ecmaVersion: 'latest' })), sections: [] }) }).state;
	assert.deepEqual(fieldNames(), ['field', 'count', '#secret']);
});

test('Java classifies method definitions without classifying calls as definitions', () => {
	const doc = 'class A { void method() {} void run() { method(); obj.method(); var f = obj::method; } }';
	assert.deepEqual(names(doc, java(), javaSyntax), ['method', 'run']);
});
