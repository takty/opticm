import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveBrowserFixtures } from './browser-fixtures.mjs';

function classPainted() {
	const canvas = document.querySelector('.code-structure-view');
	if (!canvas?.width || !canvas?.height) return false;
	const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
	const alpha = Math.round(0.08 * 255);
	for (let i = 0; i < pixels.length; i += 4) {
		if (pixels[i] >= 220 && pixels[i + 1] < 45 && pixels[i + 2] >= 70 &&
			pixels[i + 2] <= 100 && Math.abs(pixels[i + 3] - alpha) <= 1) return true;
	}
	return false;
}

const here = dirname(fileURLToPath(import.meta.url));
const browser = process.argv[2] || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const name = browser.toLowerCase().includes('msedge') ? 'edge' : 'chrome';
const profile = resolve(here, '.profiles', name);
await mkdir(profile, { recursive: true });
const { port, close } = await serveBrowserFixtures();
const child = spawn(browser, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
let socket;
try {
	const endpoint = await new Promise((resolve, reject) => {
		let log = '';
		const timeout = setTimeout(() => reject(new Error('Browser startup timed out: ' + log)), 15000);
		child.on('error', reject);
		child.stderr.on('data', chunk => {
			log += chunk;
			const match = log.match(/DevTools listening on (ws:\/\/[^\s]+)/);
			if (match) {
				clearTimeout(timeout);
				resolve(match[1]);
			}
		});
	});
	socket = new WebSocket(endpoint);
	await new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error('DevTools connection timed out')), 10000);
		socket.onopen = () => {
			clearTimeout(timeout);
			resolve();
		};
		socket.onerror = () => {
			clearTimeout(timeout);
			reject(new Error('DevTools connection failed'));
		};
	});
	let id = 0;
	const pending = new Map();
	socket.onmessage = ({ data }) => {
		const result = JSON.parse(data);
		const p = pending.get(result.id);
		if (p) {
			pending.delete(result.id);
			clearTimeout(p.timeout);
			result.error ? p.reject(result.error) : p.resolve(result.result);
		}
	};
	const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
		const n = ++id;
		const timeout = setTimeout(() => {
			pending.delete(n);
			reject(new Error(`DevTools command timed out: ${method}`));
		}, 30000);
		pending.set(n, { resolve, reject, timeout });
		socket.send(JSON.stringify({ id: n, method, params, sessionId }));
	});
	const { targetId: fontTarget } = await send('Target.createTarget', { url: 'about:blank' });
	const { sessionId: fontSession } = await send('Target.attachToTarget', { targetId: fontTarget, flatten: true });
	await send('Page.enable', {}, fontSession);
	await send('Network.enable', {}, fontSession);
	await send('Network.setCacheDisabled', { cacheDisabled: true }, fontSession);
	await send('Emulation.setDeviceMetricsOverride', { width: 640, height: 450, deviceScaleFactor: 2, mobile: false }, fontSession);
	await send('Page.addScriptToEvaluateOnNewDocument', {
		source: `{
			const loadFont = document.fonts.load.bind(document.fonts);
			document.fonts.load = (...args) => new Promise((resolve, reject) => {
				window.fontLoadPending = true;
				window.fontLoadArgs = args;
				window.releaseFontLoad = () => {
					window.fontLoadPending = false;
					loadFont(...args).then(resolve, reject);
				};
			});
		}`,
	}, fontSession);
	await send('Page.navigate', { url: `http://127.0.0.1:${port}/docs/` }, fontSession);
	let fontPending = false;
	for (let i = 0; i < 100 && !fontPending; i++) {
		const result = await send('Runtime.evaluate', { expression: '!!window.fontLoadPending', returnByValue: true }, fontSession);
		fontPending = result.result?.value;
		if (!fontPending) await new Promise(resolve => setTimeout(resolve, 100));
	}
	if (!fontPending) throw new Error('Demo font load was not observed');
	const beforeFont = await send('Runtime.evaluate', {
		expression: '({ editor: !!document.querySelector(".cm-editor"), status: document.querySelector("#status")?.textContent })',
		returnByValue: true,
	}, fontSession);
	if (beforeFont.result.value.editor || beforeFont.result.value.status !== 'Loading...') {
		throw new Error('Demo must wait for its font before creating the editor: ' + JSON.stringify(beforeFont));
	}
	await send('Runtime.evaluate', { expression: 'window.releaseFontLoad()' }, fontSession);
	let fontReady = false;
	for (let i = 0; i < 100; i++) {
		const status = await send('Runtime.evaluate', {
			expression   : 'document.querySelector("#status")?.textContent',
			returnByValue: true,
		}, fontSession);
		if (status.result?.value?.startsWith('Ready.')) {
			fontReady = true;
			break;
		}
		await new Promise(resolve => setTimeout(resolve, 100));
	}
	if (!fontReady) throw new Error('Demo did not initialize after its font loaded');
	const fontMetrics = await send('Runtime.evaluate', {
		expression: `(async () => {
			const editor = document.querySelector('.cm-editor');
			editor.scrollIntoView();
			await new Promise(resolve => setTimeout(resolve, 300));
			const content = editor.querySelector('.cm-content');
			const line = content.querySelector('.cm-line');
			const rulers = editor.querySelector('.cm-opticm-rulers');
			const context = document.createElement('canvas').getContext('2d');
			context.font = getComputedStyle(content).font;
			return {
				fonts: document.fonts.status,
				width: parseFloat(rulers.style.getPropertyValue('--ruler-character-width')),
				actual: context.measureText('mmmmmmmmmmmm').width / 12,
				start: line.getBoundingClientRect().left + parseFloat(getComputedStyle(line).paddingLeft),
				ruler: rulers.firstElementChild.getBoundingClientRect().left,
			};
		})()`,
		awaitPromise: true,
		returnByValue: true,
	}, fontSession);
	const metrics = fontMetrics.result?.value;
	if (!metrics || metrics.fonts !== 'loaded' || Math.abs(metrics.width - metrics.actual) > 0.25 ||
		Math.abs(metrics.ruler - metrics.start - 4 * metrics.actual) > 1) {
		throw new Error('Demo ruler is misaligned after a delayed font load: ' + JSON.stringify(fontMetrics));
	}
	const customStart = await send('Runtime.evaluate', {
		expression: `(() => {
			const host = document.createElement('div');
			host.id = 'custom-font-host';
			host.style.cssText = 'height: 200px; width: 400px; --test-font: "Test Font", monospace';
			document.body.append(host);
			host.scrollIntoView();
			window.customFontResult = { ready: false, error: null };
			import(new URL('opticm.min.js', document.baseURI).href).then(({ createEditor }) =>
				createEditor(host, { codeLanguage: null, fontFamily: 'var(--test-font)', fontSize: 18, value: 'sample text' })
			).then(editor => {
				window.customFontEditor = editor;
				window.customFontResult.ready = true;
			}, error => { window.customFontResult.error = String(error); });
		})()`,
		returnByValue: true,
	}, fontSession);
	if (customStart.exceptionDetails) throw new Error('Custom font test setup failed: ' + JSON.stringify(customStart));
	fontPending = false;
	for (let i = 0; i < 100 && !fontPending; i++) {
		const result = await send('Runtime.evaluate', { expression: '!!window.fontLoadPending', returnByValue: true }, fontSession);
		fontPending = result.result?.value;
		if (!fontPending) await new Promise(resolve => setTimeout(resolve, 100));
	}
	if (!fontPending) throw new Error('Configured custom font load was not observed');
	const beforeCustom = await send('Runtime.evaluate', {
		expression: '({ editor: !!document.querySelector("#custom-font-host .cm-editor"), font: window.fontLoadArgs?.[0], ...window.customFontResult })',
		returnByValue: true,
	}, fontSession);
	if (beforeCustom.result.value.editor || beforeCustom.result.value.ready || beforeCustom.result.value.error ||
		!beforeCustom.result.value.font?.includes('Test Font')) {
		throw new Error('Editor must wait for the configured custom font: ' + JSON.stringify(beforeCustom));
	}
	await send('Runtime.evaluate', { expression: 'window.releaseFontLoad()' }, fontSession);
	let customResult;
	for (let i = 0; i < 100; i++) {
		const result = await send('Runtime.evaluate', {
			expression   : 'window.customFontResult',
			returnByValue: true,
		}, fontSession);
		customResult = result.result?.value;
		if (customResult?.ready || customResult?.error) break;
		await new Promise(resolve => setTimeout(resolve, 100));
	}
	if (!customResult?.ready || customResult.error) {
		throw new Error('Editor failed to initialize after the custom font loaded: ' + JSON.stringify(customResult));
	}
	const customMetrics = await send('Runtime.evaluate', {
		expression: `(async () => {
			await new Promise(resolve => setTimeout(resolve, 300));
			const host = document.querySelector('#custom-font-host');
			const content = host.querySelector('.cm-content');
			const ruler = host.querySelector('.cm-opticm-rulers');
			const context = document.createElement('canvas').getContext('2d');
			context.font = getComputedStyle(content).font;
			const result = {
				width: parseFloat(ruler.style.getPropertyValue('--ruler-character-width')),
				actual: context.measureText('mmmmmmmmmmmm').width / 12,
			};
			window.customFontEditor.destroy();
			return result;
		})()`,
		awaitPromise: true,
		returnByValue: true,
	}, fontSession);
	const custom = customMetrics.result?.value;
	if (!custom || Math.abs(custom.width - custom.actual) > 0.25) {
		throw new Error('Custom-font ruler is misaligned: ' + JSON.stringify(customMetrics));
	}
	await send('Target.closeTarget', { targetId: fontTarget });
	console.log('Demo and custom-font editors wait for their fonts and align rulers.');
	const { targetId } = await send('Target.createTarget', { url: `http://127.0.0.1:${port}/test/browser.html` });
	const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
	let result;
	for (let i = 0; i < 100; i++) {
		const value = await send('Runtime.evaluate', { expression: 'window.testResult', returnByValue: true }, sessionId);
		result = value.result?.value;
		if (result) break;
		await new Promise(resolve => setTimeout(resolve, 200));
	}
	if (!result) {
		const debug = await send('Runtime.evaluate', { expression: 'document.body.innerText', returnByValue: true }, sessionId);
		throw new Error('Browser tests timed out: ' + JSON.stringify(debug));
	}
	result.browser = await send('Browser.getVersion');
	await writeFile(resolve(here, `${name}-result.json`), JSON.stringify(result, null, 2) + '\n');
	console.log(JSON.stringify(result, null, 2));
	if (!result.passed) process.exitCode = 1;
	if (result.passed) {
		await send('Page.enable', {}, sessionId);
		await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
		await send('Page.navigate', { url: `http://127.0.0.1:${port}/docs/` }, sessionId);
		let ready = false;
		for (let i = 0; i < 50; i++) {
			const status = await send('Runtime.evaluate', { expression: 'document.querySelector("#status")?.textContent', returnByValue: true }, sessionId);
			if (status.result?.value?.startsWith('Ready.')) {
				ready = true;
				break;
			}
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		if (!ready) {
			throw new Error('Built docs failed to initialize editors');
		}
		const docs = await send('Runtime.evaluate', {
			expression: `(async () => {
				const assert = (condition, message) => {
					if (!condition) {
						throw new Error(message);
					}
				};
				assert(document.querySelectorAll('.cm-editor').length === 1, 'One editor must mount');
				await document.querySelector('#analysis').onclick();
				const analysis = JSON.parse(document.querySelector('#status').textContent);
				assert(analysis.complete && analysis.structures.filter(range => range.kind === 'class').length === 1,
					'Worker must analyze sample class');
				const classPainted = ${classPainted.toString()};
				for (let i = 0; i < 100 && !classPainted(); i++) await new Promise(resolve => setTimeout(resolve, 20));
				assert(classPainted(), 'JavaScript sample class must be painted in translucent theme red');
				const extensions = [
					[['structureHighlight', 'declarationHighlight', 'referenceHighlight'], '.code-structure-view'],
					[['syntaxHighlight', 'semanticHighlight'], '.cm-editor.cm-syntax-highlighting'],
					[['functionLineNumbers'], '.cm-editor.cm-function-line-numbers'],
					[['functionScrollMarkers'], '.cm-editor.cm-function-scroll-markers'],
					[['bracketMatching'], '.cm-editor.cm-bracket-matching'],
					[['easyLineSelection'], '.cm-editor.cm-easy-line-selection'],
					[['rulers'], '.cm-editor.cm-indent-rulers'],
				];
				const toggle = name => document.getElementById('extensions').querySelector('input[name="' + name + '"]');
				for (const [names, selector] of extensions) {
					const controls = names.map(toggle);
					const initial = controls.map(input => input.checked);
					for (const input of controls) if (input.checked) input.click();
					assert(!document.querySelector(selector), names.join(', ') + ' must turn off');
					for (const input of controls) input.click();
					assert(document.querySelector(selector), names.join(', ') + ' must turn on');
					controls.forEach((input, index) => { if (input.checked !== initial[index]) input.click(); });
				}
				toggle('easyLineSelection').click();
				document.querySelector('#readonly').click();
				assert(JSON.parse(document.querySelector('#status').textContent).readOnly, 'Read-only control must work');
				await document.querySelector('#paste').onclick();
				assert(document.querySelector('#status').textContent.startsWith('Paste is disabled'), 'Paste must report read-only state');
				await document.querySelector('#recreate').onclick();
				assert(document.querySelectorAll('.cm-editor').length === 1, 'Editor must recreate');
				assert(document.querySelector('.cm-editor.cm-easy-line-selection'), 'Recreate must retain extension settings');
				toggle('easyLineSelection').click();
				assert(document.querySelector('.cm-editor.cm-gutter-line-selection'), 'Standard gutter selection remains enabled');
				assert(getComputedStyle(document.querySelector('.cm-editor')).fontFamily.startsWith('ui-monospace'), 'Example editor uses the default font');
				return true;
			})()`,
			awaitPromise: true,
			returnByValue: true,
		}, sessionId);
		if (docs.exceptionDetails || docs.result?.value !== true) {
			throw new Error('Built docs check failed: ' + JSON.stringify(docs));
		}
		console.log('Built docs passed: one editor, worker, read-only, recreate, default font, subdirectory URLs.');
		const pastePoint = await send('Runtime.evaluate', {
			expression: `(() => { const button = document.querySelector('#paste'); button.scrollIntoView(); const box = button.getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`,
			returnByValue: true,
		}, sessionId);
		await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...pastePoint.result.value }, sessionId);
		await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...pastePoint.result.value }, sessionId);
		await new Promise(resolve => setTimeout(resolve, 150));
		const pasteStatus = await send('Runtime.evaluate', {
			expression   : `document.querySelector('#status').textContent`,
			returnByValue: true,
		}, sessionId);
		if (!/^(Editor text changed after Paste\.|No text change detected\.|Paste failed:)/.test(pasteStatus.result?.value)) {
			throw new Error('Paste demo did not report its result: ' + JSON.stringify(pasteStatus.result?.value));
		}
		console.log('Built docs Paste button: ' + pasteStatus.result.value);
		const markerPoint = await send('Runtime.evaluate', {
			expression   : `(async () => {
				const content = document.querySelector('.cm-content');
				content.focus();
				document.execCommand('selectAll');
				document.execCommand('insertText', false, 'function first() {\\n\\tvar value = 1;\\n}');
				await document.querySelector('#analysis').onclick();
				let marker;
				for (let i = 0; i < 100 && !marker; i++) {
					marker = document.querySelector('.cm-gutter-lint .cm-lint-marker-warning');
					if (!marker) await new Promise(resolve => setTimeout(resolve, 20));
				}
				if (!marker) {
					throw new Error('The sample diagnostic must render');
				}
				const box = marker.getBoundingClientRect();
				return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
			})()`,
			awaitPromise : true,
			returnByValue: true,
		}, sessionId);
		if (markerPoint.exceptionDetails) {
			throw new Error('Sample lint marker failed: ' + JSON.stringify(markerPoint));
		}
		await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...markerPoint.result.value }, sessionId);
		await new Promise(resolve => setTimeout(resolve, 450));
		const hover = await send('Runtime.evaluate', {
			expression   : `!!document.querySelector('.cm-tooltip-lint')?.textContent.trim()`,
			returnByValue: true,
		}, sessionId);
		if (!hover.result?.value) {
			throw new Error('Sample lint tooltip did not appear on mouse hover');
		}
		console.log('Built docs passed: native mouse hover opens lint tooltip in function line-number mode.');
		const languageSwitch = await send('Runtime.evaluate', {
			expression: `(async () => {
				const assert = (condition, message) => {
					if (!condition) {
						throw new Error(message);
					}
				};
				document.querySelector('#code-language input[value="java"]').click();
				for (let i = 0; i < 100 && !document.querySelector('#status').textContent.includes('Switched to java'); i++)
					await new Promise(resolve => setTimeout(resolve, 20));
				const structureIsPainted = () => {
					const canvas = document.querySelector('.code-structure-view');
					if (!canvas?.width || !canvas?.height) return false;
					const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
					return pixels.some((value, index) => index % 4 === 3 && value > 0);
				};
				const classPainted = ${classPainted.toString()};
				for (let i = 0; i < 100 && !classPainted(); i++)
					await new Promise(resolve => setTimeout(resolve, 20));
				const count = [...document.querySelectorAll('.cm-content .cm-syntax-variable-reference')]
					.find(node => node.textContent === 'count');
				const switchedToJava = document.querySelector('#status').textContent === 'Switched to java.';
				await document.querySelector('#analysis').onclick();
				const javaAnalysis = JSON.parse(document.querySelector('#status').textContent);
				assert(switchedToJava &&
					[...document.querySelectorAll('.cm-syntax-keyword')].some(node => node.textContent === 'class') &&
					document.querySelectorAll('.cm-sectionNumbers .cm-function-number').length >= 2 &&
					structureIsPainted() && classPainted() && count &&
					javaAnalysis.complete && !Object.hasOwn(javaAnalysis, 'decorations'),
					'Built docs Java renders syntax, structure, per-method line numbers, and reference highlighting');
				document.querySelector('#code-language input[value="javascript"]').click();
				for (let i = 0; i < 100 && !document.querySelector('#status').textContent.includes('Switched to javascript'); i++)
					await new Promise(resolve => setTimeout(resolve, 20));
				assert(document.querySelector('#status').textContent === 'Switched to javascript.' &&
					document.querySelector('.cm-editor').classList.contains('cm-javascript') &&
					document.querySelector('.cm-syntax-keyword')?.textContent === 'function',
					'Built docs switches back to JavaScript');
				return true;
			})()`,
			awaitPromise: true,
			returnByValue: true,
		}, sessionId);
		if (languageSwitch.exceptionDetails || languageSwitch.result?.value !== true) {
			throw new Error('Built docs language switch failed: ' + JSON.stringify(languageSwitch));
		}
		console.log('Built docs passed: switch source language between JavaScript and Java.');
		if (process.argv.includes('--screenshot')) {
			const capture = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
			await writeFile(resolve(here, `${name}-example.png`), Buffer.from(capture.data, 'base64'));
		}
	}
	await send('Browser.close');
} finally {
	socket?.close();
	child.kill();
	await close();
}
