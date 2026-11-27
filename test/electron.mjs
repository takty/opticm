/**
 * Launch and monitor the Electron integration test process.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { serveBrowserFixtures } from './browser-fixtures.mjs';

const executable = process.argv[2] || process.env.ELECTRON_PATH;
if (!executable) throw new Error('Pass the Electron executable path or set ELECTRON_PATH');

const { port, close } = await serveBrowserFixtures();
let profile;
try {
	profile = await mkdtemp(join(tmpdir(), 'opticm-electron-'));
	const entry = fileURLToPath(new URL('./electron-main.cjs', import.meta.url));
	const logPath = join(profile, 'electron.log');
	const env = {
		...process.env,
		ELECTRON_ENABLE_LOGGING: '1',
		ELECTRON_LOG_FILE: logPath,
		OPTICM_ELECTRON_URL: `http://127.0.0.1:${port}/test/browser.html?manual=1`,
		OPTICM_ELECTRON_PROFILE: profile,
	};
	delete env.ELECTRON_RUN_AS_NODE;
	const stagePath = join(profile, 'stage.txt');
	let lastStage = 'starting Electron';
	console.log(`Electron: ${lastStage}`);
	const progress = setInterval(() => {
		try {
			const stage = readFileSync(stagePath, 'utf8');
			if (!stage || stage === lastStage) return;
			lastStage = stage;
			console.log(`Electron: ${stage}`);
		} catch (error) {
			if (error.code !== 'ENOENT') console.error(error.message);
		}
	}, 1000);
	try {
		await promisify(execFile)(
			executable,
			[`--user-data-dir=${profile}`, entry],
			{ timeout: 60_000, windowsHide: true, env },
		);
	} catch (error) {
		const stage = await readFile(stagePath, 'utf8').catch(() => 'main script did not report startup');
		const log = await readFile(logPath, 'utf8').catch(() => '');
		const reason = error.killed ? 'timed out' : `exited or failed to launch (${error.code ?? error.signal})`;
		const details = [error.stderr, log].filter(item => item?.trim()).join('\n');
		throw new Error(`Electron ${reason}. Last stage: ${stage}.${details ? '\n' + details : ''}`);
	} finally {
		clearInterval(progress);
	}
	const output = await readFile(join(profile, 'result.json'), 'utf8').catch(error => {
		if (error.code !== 'ENOENT') throw error;
		throw new Error('Electron exited without writing a regression test result');
	});
	const result = JSON.parse(output);
	console.log(JSON.stringify(result, null, 2));
	if (!result.passed) process.exitCode = 1;
} finally {
	try {
		await close();
	} finally {
		if (profile) await rm(profile, { recursive: true, force: true });
	}
}
