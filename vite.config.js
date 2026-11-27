/**
 * Configure the documentation demo build and development server.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

import { defineConfig } from 'vite';

export default defineConfig({
	root : 'src/_docs',
	base : './',
	publicDir: '../../dist',
	build: {
		target     : 'esnext',
		outDir     : '../../docs',
		emptyOutDir: true,
	},
});
