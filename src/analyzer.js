/**
 * Create language analysis workers and expose standalone analysis sessions.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

import { AnalysisClient } from './analysis-client.js';
import { createCommonAnalysis } from './analysis/common-analysis.js';

export function createAnalysisClient(codeLanguage, { createWorker, treeSitterWasmURL, javaWasmURL } = {}) {
	if (codeLanguage !== 'java' && codeLanguage !== 'javascript') {
		throw new TypeError('codeLanguage must be java or javascript');
	}
	const java = codeLanguage === 'java';
	const url = java
		? new URL('./analysis-worker-java.min.js', import.meta.url)
		: new URL('./analysis-worker.min.js', import.meta.url);
	let runtime = treeSitterWasmURL === undefined ? undefined : new URL(treeSitterWasmURL).href;
	let grammar = javaWasmURL === undefined ? undefined : new URL(javaWasmURL).href;
	if (java && createWorker === undefined) {
		// Resolve the default assets from the host module so bundlers can emit them.
		runtime ??= new URL('./web-tree-sitter.wasm', import.meta.url).href;
		grammar ??= new URL('./tree-sitter-java.wasm', import.meta.url).href;
	}
	const worker = createWorker === undefined ? new Worker(url, { type: 'module' }) : createWorker(url);
	const client = new AnalysisClient(worker);
	if (java) {
		try {
			worker.postMessage({ type: 'initialize', treeSitterWasmURL: runtime, javaWasmURL: grammar });
		} catch (error) {
			client.fail(error);
		}
	}
	return client;
}

export async function createAnalyzer({ codeLanguage = 'javascript', ...options } = {}) {
	const client = createAnalysisClient(codeLanguage, options);
	await client.ready;
	let nextVersion = 0;
	return {
		async analyze(text) {
			if (typeof text !== 'string') throw new TypeError('Analysis source must be a string');
			const version = nextVersion++;
			const result = await client.request(text, version);
			return createCommonAnalysis({ ...result.commonAnalysis, version: result.version });
		},
		destroy() {
			client.destroy();
		},
	};
}
