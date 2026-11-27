import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);

test('CodeMirror services share the editor state and view modules', () => {
	for (const service of [
		'@codemirror/autocomplete',
		'@codemirror/commands',
		'@codemirror/lang-java',
		'@codemirror/lang-javascript',
		'@codemirror/language',
		'@codemirror/lint',
		'@codemirror/search',
	]) {
		const serviceRequire = createRequire(require.resolve(service));
		for (const shared of ['@codemirror/state', '@codemirror/view']) {
			assert.equal(serviceRequire.resolve(shared), require.resolve(shared),
				`${service} must use the editor's ${shared} instance`);
		}
	}
});
