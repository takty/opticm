import { Language, Parser } from 'web-tree-sitter';
import { analyzeJava } from './analyzer.js';
import { diagnoseJava } from './diagnostics.js';

self.onmessage = async ({ data: { type, treeSitterWasmURL, javaWasmURL } }) => {
	if (type !== 'initialize') return;
	self.onmessage = null;
	try {
		await Parser.init({
			locateFile: () => treeSitterWasmURL ?? new URL('./web-tree-sitter.wasm', import.meta.url).href,
		});
		const parser = new Parser();
		parser.setLanguage(await Language.load(javaWasmURL ?? new URL('./tree-sitter-java.wasm', import.meta.url).href));
		self.onmessage = ({ data: { id, version, text, diagnosticLocale } }) => {
			let tree;
			try {
				tree = parser.parse(text);
				const result = diagnosticLocale === undefined
					? { version, text, ...analyzeJava(text, tree.rootNode) }
					: diagnoseJava(tree.rootNode, diagnosticLocale, parser, text);
				self.postMessage({ id, result });
			} catch (error) {
				self.postMessage({ id, error: String(error.message || error) });
			} finally {
				tree?.delete();
			}
		};
		self.postMessage({ ready: true });
	} catch (error) {
		self.postMessage({ error: String(error.message || error) });
	}
};
