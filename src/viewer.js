import { selectAll } from '@codemirror/commands';
import { Compartment, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { createAnalyzer } from './analyzer.js';
import { setCommonAnalysis } from './analysis/common-analysis.js';
import { createColorScheme, validateColorScheme } from './color-scheme.js';
import { createDisplayExtensions, setHighlightedLines } from './display-extensions.js';
import { refreshIndentRulers } from './extensions/indent-rulers/index.js';
import { refreshStructure } from './extensions/structure-view/index.js';
import { javaDisplayExtensions } from './lang/java/display.js';
import { javascriptDisplayExtensions } from './lang/js/display.js';

const LANGUAGES = {
	java      : javaDisplayExtensions,
	javascript: javascriptDisplayExtensions
};
const DEFAULT_SETTINGS = {
	colorScheme         : 'light',
	syntaxHighlight     : true,
	semanticHighlight   : true,
	structureHighlight  : true,
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
	const { colorScheme, lineNumbers, lineWrapping, ...displaySettings } = settings;
	validateColorScheme(colorScheme);
	return [
		createDisplayExtensions({
			...displaySettings,
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
	const display    = new Compartment();
	const extensions = displayExtensions(codeLanguage, settings);
	const root       = document.createElement('div');
	root.className = 'opticm';
	const colorScheme = createColorScheme(root);
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
		colorScheme.destroy();
		analyzer?.destroy();
		view?.destroy();
		root.remove();
	}

	try {
		const languageExtensions = codeLanguage === null ? [] : LANGUAGES[codeLanguage];
		view = new EditorView({
			doc: value,
			parent: root,
			extensions: [
				colorScheme.extension,
				EditorState.readOnly.of(true),
				EditorView.editable.of(false),
				EditorView.contentAttributes.of({ tabindex: '0', 'aria-readonly': 'true' }),
				EditorView.theme({ '&': { fontFamily: 'monospace', fontSize: '16px', lineHeight: '165%' } }),
				EditorState.tabSize.of(4),
				keymap.of([{ key: 'Mod-a', run: selectAll }]),
				languageExtensions,
				display.of(extensions),
			],
		});
		colorScheme.set(view, settings.colorScheme);
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
				colorScheme.set(view, next.colorScheme);
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
