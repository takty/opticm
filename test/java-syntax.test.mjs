import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Language, Parser } from 'web-tree-sitter';
import { EditorState } from '@codemirror/state';
import { java } from '@codemirror/lang-java';
import { commonAnalysisState, createCommonAnalysis, setCommonAnalysis } from '../src/analysis/common-analysis.js';
import { lezerAnalysis, syntaxAnalysisState } from '../src/analysis/lezer-analysis.js';
import { analyzeJava } from '../src/lang/java/analyzer.js';
import { diagnoseJava } from '../src/lang/java/diagnostics.js';
import { lezerSyntax } from '../src/lang/java/lezer-syntax.js';

await Parser.init();
const parser = new Parser();
parser.setLanguage(await Language.load(fileURLToPath(new URL('../node_modules/tree-sitter-java/tree-sitter-java.wasm', import.meta.url))));

test('Java diagnostics report missing and unexpected syntax at UTF-16 positions', () => {
	const source = 'void main() { String greeting = "\u{1F600}"; int n = ; int m = 1 }';
	const tree = parser.parse(source);
	try {
		const diagnostics = diagnoseJava(tree.rootNode, 'en');
		const unexpected = diagnostics.find(item => item.message === 'Unexpected syntax.');
		assert.equal(unexpected?.severity, 'error');
		assert.equal(unexpected.from.ch, source.indexOf('= ;'));
		const missing = diagnostics.find(item => item.message === 'Expected ";".');
		assert.equal(missing?.severity, 'error');
		assert.deepEqual(missing.from, { line: 0, ch: source.indexOf('1 }') + 1 });
		assert.deepEqual(missing.to, missing.from);
		assert.notEqual(diagnoseJava(tree.rootNode, 'ja')[0].message, diagnostics[0].message);
	} finally {
		tree.delete();
	}
});

test('Java worker distinguishes method definitions from calls', () => {
	const source = 'class A { void method() {} void run() { method(); obj.method(); var f = obj::method; } }';
	const tree = parser.parse(source);
	try {
		const names = analyzeJava(source, tree.rootNode).syntaxHighlights
			.filter(item => item.kind === 'function-definition').map(item => source.slice(item.from, item.to));
		assert.deepEqual(names, ['method', 'run']);
	} finally {
		tree.delete();
	}
});

test('Java array type brackets follow their element type before and after worker analysis', () => {
	const source = '// 😀\nclass A { int[][] numbers; String[] names; int extra[]; boolean[] flags; ' +
		'java.util.List<String[]>[] lists; String result()[] { return names; } ' +
		'void run(int arg[], String[] args) { for (double item[] : items) {} ' +
		'int[] values = new int[2][]; int n = values[0]; } } ' +
		'interface I { int constant[] = {}; } record R(String items[]) {}';
	const tree = parser.parse(source);
	try {
		const result = analyzeJava(source, tree.rootNode);
		assert.equal(result.success, true);
		let state = EditorState.create({ doc: source, extensions: [java(), commonAnalysisState, lezerAnalysis(lezerSyntax)] });
		const assertBrackets = ranges => {
			for (const [fragment, kind] of [
				['int[][]', 'keyword'], ['String[] names', 'type'], ['int extra[]', 'keyword'],
				['String result()[]', 'type'], ['int arg[]', 'keyword'], ['String[] args', 'type'],
				['boolean[] flags', 'keyword'], ['java.util.List<String[]>[] lists', 'type'],
				['double item[]', 'keyword'], ['int[] values', 'keyword'], ['int constant[]', 'keyword'],
				['String items[]', 'type'],
			]) {
				const start = source.indexOf(fragment);
				assert.notEqual(start, -1);
				for (let i = 0; i < fragment.length; i++) {
					if (fragment[i] !== '[' && fragment[i] !== ']') continue;
					assert.ok(ranges.some(item => item.from === start + i && item.to === start + i + 1 && item.kind === kind),
						`${fragment}: ${fragment[i]} must use ${kind}`);
				}
			}
			for (const fragment of ['new int[2][]', 'values[0]']) {
				const start = source.indexOf(fragment);
				assert.ok(!ranges.some(item => item.from >= start && item.to <= start + fragment.length &&
					['[', ']'].includes(source.slice(item.from, item.to))), `${fragment} is not a type declaration`);
			}
		};
		assertBrackets(state.field(syntaxAnalysisState).data.syntax);
		state = state.update({ effects: setCommonAnalysis.of({ ...result.commonAnalysis, version: 1 }) }).state;
		assertBrackets(state.field(syntaxAnalysisState).data.syntax);
	} finally {
		tree.delete();
	}
});

test('Java while and do-while statements use purple loop2 structures', () => {
	const source = 'class Example { void run() { for (;;) {} while (ready) { tick(); } do { tick(); } while (ready); } }';
	const tree = parser.parse(source);
	try {
		const result = analyzeJava(source, tree.rootNode);
		const loops = createCommonAnalysis({ ...result.commonAnalysis, version: 1 }).structures
			.filter(item => item.kind === 'loop' || item.kind === 'loop2');
		assert.deepEqual(loops.map(item => [item.kind, source.slice(item.from, item.to)]), [
			['loop', 'for (;;) {}'],
			['loop2', 'while (ready) { tick(); }'],
			['loop2', 'do { tick(); } while (ready);'],
		]);
		assert.ok(result.decorations.some(item => item.kind === 'range' &&
			item.fill === 'var(--opticm-l-purple, #9a74a3)' && item.opacity === 0.20));
	} finally {
		tree.delete();
	}
});

test('Java worker distinguishes class declarations from class references', () => {
	const source = 'class Example {} class Other extends Example { Example field; }';
	const tree = parser.parse(source);
	try {
		const names = analyzeJava(source, tree.rootNode).syntaxHighlights
			.filter(item => item.kind === 'class-definition').map(item => source.slice(item.from, item.to));
		assert.deepEqual(names, ['Example', 'Other']);
	} finally {
		tree.delete();
	}
});

test('Java worker marks interface, enum and record names but not type references', () => {
	const source = 'interface Contract {} enum Kind { ONE } record Point(int x) {} class Use { Contract c; Kind k; Point p; }';
	const tree = parser.parse(source);
	try {
		const names = analyzeJava(source, tree.rootNode).syntaxHighlights
			.filter(item => item.kind === 'class-definition').map(item => source.slice(item.from, item.to));
		assert.deepEqual(names, ['Contract', 'Kind', 'Point', 'Use']);
	} finally {
		tree.delete();
	}
});

test('Java enum constants are definitions in worker analysis', () => {
	const source = 'enum Kind { ONE, TWO } class Example { Kind value = Kind.ONE; }';
	const tree = parser.parse(source);
	try {
		const definitions = analyzeJava(source, tree.rootNode).commonAnalysis.references
			.filter(item => item.role === 'definition').map(item => source.slice(item.from, item.to));
		assert.deepEqual(definitions, ['ONE', 'TWO', 'value']);
	} finally {
		tree.delete();
	}
});

test('Java instanceof pattern name is a definition, not a reference', () => {
	const source = 'class Example { void run(Object value) { if (value instanceof String text) use(text); boolean test = value instanceof String; } }';
	const tree = parser.parse(source);
	try {
		const result = analyzeJava(source, tree.rootNode);
		const from = source.indexOf('text)');
		assert.ok(result.commonAnalysis.references.some(item => item.from === from && item.to === from + 4 && item.role === 'definition'));
		assert.ok(result.syntaxHighlights.some(item => item.from === from && item.to === from + 4 && item.kind === 'definition'));
		assert.ok(!result.commonAnalysis.references.some(item => item.from === from && item.role === 'reference'));
		const operand = source.indexOf('value instanceof');
		assert.ok(result.commonAnalysis.references.some(item => item.from === operand && item.role === 'reference'));
	} finally {
		tree.delete();
	}
});

test('Java diagnostics warn for unbraced control bodies and allow else-if chains', () => {
	const source = 'void main() { if (ready) start(); else if (done) { stop(); } else reset();\n' +
		'for (int i = 0; i < 1; i++) tick(); for (var x : xs) tick(x); while (ready); do tick(); while (ready); }';
	const tree = parser.parse(source);
	try {
		const diagnostics = diagnoseJava(tree.rootNode, 'en');
		const lines = source.split('\n');
		assert.ok(diagnostics.every(item => item.severity === 'warning'));
		assert.deepEqual(diagnostics.map(({ from, to }) => lines[from.line].slice(from.ch, to.ch)),
			['start();', 'reset();', 'tick();', 'tick(x);', ';', 'tick();']);
	} finally {
		tree.delete();
	}
});

test('Java highlights lexical variable references without confusing declarations or member names', () => {
	const source = [
		'// 日本語 😀',
		'class Example {',
		'  int field;',
		'  void run(int arg, String... args) {',
		'    final int value = arg;',
		'    use(value, arg, args);',
		'    this.value = value;',
		'    { int nested = value; use(nested); }',
		'    use(nested);',
		'    for (int i = 0; i < 2; i++) use(i);',
		'    use(i);',
		'    for (String item : item) use(item);',
		'    use(item);',
		'    list.forEach(v -> use(v));',
		'    use(v);',
		'    int[] numbers = new int[value];',
		'    boolean valid = args instanceof Object;',
		'    Runnable action = args::toString;',
		'    try (var resource = acquire()) { use(resource); } catch (Exception ex) { use(ex); use(resource); }',
		'    use(ex);',
		'  }',
		'}',
	].join('\n');
	const tree = parser.parse(source);
	try {
		const result = analyzeJava(source, tree.rootNode);
		assert.equal(result.success, true);
		const common = createCommonAnalysis({ ...result.commonAnalysis, version: 7 });
		assert.equal(common.version, 7);
		assert.equal(common.sourceLength, source.length);
		assert.ok(common.structures.some(item => item.kind === 'loop'));
		assert.ok(common.declarations.some(item =>
			item.from === source.indexOf('value = arg') && item.mutability === 'immutable'));
		assert.ok(common.sections.some(item => item.from === source.indexOf('  void run')));
		const localOffsets = new Set(result.syntaxHighlights
			.filter(item => item.kind === 'local-reference').map(item => item.from));
		const offset = (fragment, name) => source.indexOf(fragment) + fragment.indexOf(name);
		for (const [fragment, name] of [
			['value = arg', 'arg'], ['use(value, arg, args)', 'value'], ['use(value, arg, args)', 'arg'],
			['arg, args)', 'args'],
			['this.value = value', '= value'], ['nested = value', 'value'], ['use(nested); }', 'nested'],
			['i < 2', 'i'], ['i++', 'i'], ['use(i);', 'i'], ['use(item);', 'item'],
			['use(v));', 'v'], ['int[value]', 'value'], ['args instanceof', 'args'],
			['args::toString', 'args'], ['use(resource); }', 'resource'], ['use(ex); use', 'ex'],
		]) {
			const index = offset(fragment, name) + (name === '= value' ? 2 : 0);
			assert.ok(localOffsets.has(index), `expected local reference at ${fragment}: ${name}`);
		}
		for (const [fragment, name] of [
			['int value = arg', 'value'], ['this.value = value', 'value'],
			['    use(nested);', 'nested'], ['    use(i);', 'i'],
			[': item)', 'item'], ['    use(item);', 'item'], ['    use(v);', 'v'],
		]) {
			assert.ok(!localOffsets.has(offset(fragment, name)), `unexpected local reference at ${fragment}: ${name}`);
		}
		assert.ok(!localOffsets.has(offset('use(ex); use(resource);', 'resource')));
		assert.ok(!localOffsets.has(offset('    use(ex);', 'ex')));
		const referenceOffsets = new Set(result.syntaxHighlights
			.filter(item => item.kind === 'variable-reference').map(item => item.from));
		assert.ok(referenceOffsets.has(offset('use(value, arg, args)', 'value')));
		assert.ok(referenceOffsets.has(offset('    use(nested);', 'nested')));
		assert.ok(!referenceOffsets.has(offset('int value = arg', 'value')));
		assert.ok(!referenceOffsets.has(offset('this.value = value', 'value')));
		assert.ok(!referenceOffsets.has(offset('use(value, arg, args)', 'use')));
		assert.ok(!referenceOffsets.has(offset('args::toString', 'toString')));
		const tokens = result.decorations.filter(item => item.kind === 'token');
		assert.equal(tokens.length, 9);
		assert.ok(tokens.some(item => item.from.line === 4 && item.stroke === 'hsla(240, 75%, 65%, 0.75)'));
	} finally {
		tree.delete();
	}
});

test('Java classifies definitions, literals and operators separately from references and type punctuation', () => {
	const source = 'class Demo<T> { void run(String arg) { int count = 10; boolean flag = true; Object other = null; if (count > 0) { use(arg); } } }';
	const tree = parser.parse(source);
	try {
		const result = analyzeJava(source, tree.rootNode);
		assert.equal(result.success, true);
		const kinds = (text, start = 0) => {
			const from = source.indexOf(text, start);
			assert.notEqual(from, -1);
			return result.syntaxHighlights.filter(item => item.from === from && item.to === from + text.length)
				.map(item => item.kind);
		};
		for (const text of ['run', 'arg', 'count', 'flag', 'other']) {
			assert.ok(kinds(text).includes('definition'), `${text} must be a definition`);
		}
		assert.ok(!kinds('count', source.indexOf('if')).includes('definition'));
		assert.ok(!kinds('use').includes('definition'));
		for (const text of ['true', 'null', '10']) {
			assert.ok(kinds(text).includes('literal'), `${text} must be a literal`);
		}
		assert.ok(kinds('0', source.indexOf('if')).includes('literal'));
		assert.ok(kinds('>').includes('operator') === false);
		assert.ok(kinds('>', source.indexOf('if')).includes('operator'));
		assert.ok(kinds('=').includes('operator'));
	} finally {
		tree.delete();
	}
});

test('Java emits matching structure ranges for classes, interfaces, records, and enums', () => {
	const source = 'class Outer {\n  void run() {\n    class Inner {}\n  }\n}\n' +
		'interface Contract {}\nrecord Point(int x) {}\nenum Mode { ON }\n';
	const tree = parser.parse(source);
	try {
		const result = analyzeJava(source, tree.rootNode);
		assert.equal(result.success, true);
		const types = result.decorations.filter(item => item.fill === 'var(--opticm-l-red, #e61e58)');
		assert.deepEqual(types.map(item => [item.from.line, item.from.ch, item.to.line, item.to.ch, item.opacity]), [
			[0, 0, 4, 1, 0.08],
			[2, 4, 2, 18, 0.08],
			[5, 0, 5, 21, 0.08],
			[6, 0, 6, 22, 0.08],
			[7, 0, 7, 16, 0.08],
		]);
		assert.equal(result.commonAnalysis.structures.filter(item => item.kind === 'class').length, types.length);
		assert.deepEqual(result.sectionStarts, [1]);
		assert.ok(result.decorations.indexOf(types[0]) < result.decorations.findIndex(item =>
			item.fill === 'hsla(40, 100%, 50%, 0.15)'));
	} finally {
		tree.delete();
	}
});

test('Java analysis retains bounded partial data for incomplete source', () => {
	const source = 'class Incomplete { void run( { int value = }';
	const tree = parser.parse(source);
	try {
		const result = analyzeJava(source, tree.rootNode);
		const common = createCommonAnalysis({ ...result.commonAnalysis, version: 8 });
		assert.equal(common.complete, false);
		assert.equal(common.sourceLength, source.length);
		assert.ok(common.syntax.every(item => item.from >= 0 && item.to <= source.length));
		assert.ok(common.structures.every(item => item.from >= 0 && item.to <= source.length));
	} finally {
		tree.delete();
	}
});
