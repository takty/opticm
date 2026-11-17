import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { preview } from 'vite';

export async function serveBrowserFixtures() {
	const root = fileURLToPath(new URL('../', import.meta.url));
	const here = resolve(root, 'test');
	const fixtures = await mkdtemp(resolve(tmpdir(), 'opticm-browser-'));
	try {
		await mkdir(resolve(fixtures, 'test'));
		await Promise.all([
			build({
				entryPoints: [resolve(here, 'language-contract.js')],
				outfile    : resolve(fixtures, 'test/language-contract.js'),
				bundle     : true,
				loader     : { '.svg': 'base64', '.css': 'text' },
				format     : 'esm',
				platform   : 'browser',
			}),
			cp(resolve(root, 'dist'), resolve(fixtures, 'dist'), { recursive: true }),
			cp(resolve(root, 'docs'), resolve(fixtures, 'docs'), { recursive: true }),
			cp(resolve(root, 'dist/analysis-worker-java.min.js'), resolve(fixtures, 'test/analysis-worker-java.min.js')),
			...['browser.html', 'browser.js'].map(file => cp(resolve(here, file), resolve(fixtures, 'test', file))),
		]);
		const server = await preview({
			configFile: false,
			root,
			publicDir: false,
			appType: 'mpa',
			build: { outDir: fixtures },
			preview: { host: '127.0.0.1', port: 0, open: false },
		});
		return {
			port: server.httpServer.address().port,
			async close() {
				try {
					await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
				} finally {
					await rm(fixtures, { recursive: true, force: true });
				}
			},
		};
	} catch (error) {
		await rm(fixtures, { recursive: true, force: true });
		throw error;
	}
}
