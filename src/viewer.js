import { selectAll } from '@codemirror/commands';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { createAnalyzer } from './analyzer.js';
import { setCommonAnalysis } from './analysis/common-analysis.js';
import { createDisplayExtensions, setHighlightedLines } from './display-extensions.js';
import { refreshIndentRulers } from './extensions/indent-rulers/index.js';
import { refreshStructure } from './extensions/structure-view/index.js';
import { javaLanguage } from './lang/java/index.js';
import { javascriptLanguage } from './lang/js/index.js';
import { plainLanguage } from './lang/plain/index.js';

const LANGUAGES = { java: javaLanguage, javascript: javascriptLanguage };
const DEFAULT_SETTINGS = {
	syntaxHighlight     : true,
	semanticHighlight   : true,
	structureHighlight   : true,
	declarationHighlight: true,
	referenceHighlight  : true,
	lineNumbers         : 'absolute',
	lineNumberStart     : 1,
	rulers              : true,
	lineWrapping        : false,
};

function displayExtensions(codeLanguage, settings) {
	for (const [key, value] of Object.entries(settings)) {
		if (key === 'lineNumbers' && typeof value === 'boolean') continue;
		if (!Object.hasOwn(DEFAULT_SETTINGS, key) || typeof value !== typeof DEFAULT_SETTINGS[key]) {
			throw new TypeError(`Invalid viewer setting: ${key}`);
		}
	}
	const { lineNumbers, lineWrapping } = settings;
	return [
		createDisplayExtensions({
			...settings,
			lineNumbers: codeLanguage === null && lineNumbers === 'function' ? 'absolute' : lineNumbers,
		}),
		lineWrapping ? EditorView.lineWrapping : [],
	];
}

export async function createViewer(container, { value = '', codeLanguage = 'javascript', javaAnalysis, ...options } = {}) {
	if (!container || container.nodeType !== 1 || container.ownerDocument !== document) {
		throw new TypeError('A container in the current document is required');
	}
	if (container.childNodes.length) throw new Error('Container must be empty and unoccupied');
	if (codeLanguage !== null && !Object.hasOwn(LANGUAGES, codeLanguage)) {
		throw new TypeError('codeLanguage must be javascript, java, or null');
	}
	if (typeof value !== 'string') throw new TypeError('Viewer source must be a string');

	let settings = { ...DEFAULT_SETTINGS, ...options };
	const display = new Compartment();
	const extensions = displayExtensions(codeLanguage, settings);
	const root = document.createElement('div');
	root.className = 'opticm';
	container.append(root);
	let view;
	let analyzer;
	let destroyed = false;
	let revision  = 0;

	function assertAlive() {
		if (destroyed) throw new Error('Viewer destroyed');
	}

	async function analyze() {
		if (!analyzer) return;
		const current = ++revision;
		try {
			const snapshot = await analyzer.analyze(view.state.doc.toString());
			if (!destroyed && current === revision) {
				view.dispatch({ effects: setCommonAnalysis.of(snapshot) });
			}
		} catch (error) {
			if (!destroyed && current === revision) throw error;
		}
	}

	function destroy() {
		if (destroyed) return;
		destroyed = true;
		analyzer?.destroy();
		view?.destroy();
		root.remove();
	}

	try {
		const language = codeLanguage === null ? plainLanguage : LANGUAGES[codeLanguage];
		view = new EditorView({
			doc: value,
			parent: root,
			extensions: [
				EditorState.readOnly.of(true),
				EditorView.editable.of(false),
				EditorView.contentAttributes.of({ tabindex: '0', 'aria-readonly': 'true' }),
				EditorView.theme({ '&': { fontFamily: 'monospace', fontSize: '16px', lineHeight: '165%' } }),
				EditorState.tabSize.of(4),
				keymap.of([{ key: 'Mod-a', run: selectAll }]),
				language.extensions,
				display.of(extensions),
			],
		});
		if (codeLanguage !== null) {
			analyzer = await createAnalyzer({ ...(codeLanguage === 'java' ? javaAnalysis : {}), codeLanguage });
			await analyze();
		}
		return {
			getValue() {
				assertAlive();
				return view.state.doc.toString();
			},
			async setValue(text) {
				assertAlive();
				if (typeof text !== 'string') throw new TypeError('Viewer source must be a string');
				view.dispatch({
					changes  : { from: 0, to: view.state.doc.length, insert: text },
					selection: { anchor: 0 },
					userEvent: 'load',
				});
				await analyze();
			},
			setSettings(patch) {
				assertAlive();
				const next = { ...settings, ...patch };
				view.dispatch({ effects: display.reconfigure(displayExtensions(codeLanguage, next)) });
				settings = next;
			},
			setHighlightedLines(lines) {
				assertAlive();
				view.dispatch({ effects: setHighlightedLines.of(lines) });
			},
			refresh() {
				assertAlive();
				view.requestMeasure();
				refreshStructure(view);
				refreshIndentRulers(view);
			},
			destroy,
		};
	} catch (error) {
		destroy();
		throw error;
	}
}
