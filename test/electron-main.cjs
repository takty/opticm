/**
 * Run browser contract tests in Electron and record progress and results.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

const { writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { app, BrowserWindow } = require('electron');
const { setTimeout: delay } = require('node:timers/promises');

const { OPTICM_ELECTRON_URL: url, OPTICM_ELECTRON_PROFILE: profile } = process.env;
const stagePath = join(profile, 'stage.txt');
const resultPath = join(profile, 'result.json');
const stage = message => writeFileSync(stagePath, message);

async function run() {
	stage('main script loaded');
	app.setPath('userData', profile);
	app.disableHardwareAcceleration();
	await app.whenReady();
	stage('Electron ready');
	const window = new BrowserWindow({
		width: 1280,
		height: 900,
		webPreferences: { backgroundThrottling: false },
	});
	stage('renderer window created');
	await window.loadURL(url);
	stage('test page loaded');
	// Keep page focus independent of the foreground window on the desktop.
	window.focus();
	window.webContents.focus();
	const debuggerSession = window.webContents.debugger;
	stage('attaching renderer debugger');
	debuggerSession.attach('1.3');
	stage('enabling renderer focus emulation');
	await debuggerSession.sendCommand('Emulation.setFocusEmulationEnabled', { enabled: true });
	stage('running renderer regressions');
	await window.webContents.executeJavaScript(`void import(new URL('./browser.js', location.href).href).catch(error => {
		window.testResult = { passed: false, results: [], error: error.stack || String(error) };
	});`);
	const deadline = Date.now() + 45_000;
	let result;
	while (!result && Date.now() < deadline) {
		result = await window.webContents.executeJavaScript('window.testResult ?? null');
		if (!result) await delay(100);
	}
	if (!result) throw new Error('Renderer regression tests timed out');
	return result;
}

run().catch(error => ({ passed: false, error: error.stack })).then(result => {
	const output = { ...result, electron: process.versions.electron, chrome: process.versions.chrome };
	writeFileSync(resultPath, JSON.stringify(output));
	app.exit(0);
});
