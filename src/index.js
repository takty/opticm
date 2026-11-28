/**
 * Expose the editor API and coordinate its lifecycle, settings, events, and analysis.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { createCommonAnalysis, setCommonAnalysis } from './analysis/common-analysis.js';
import { createColorScheme, validateColorScheme } from './color-scheme.js';
import { Editor, offsetAt, positionAt } from './editor-view.js';
import { validateLineNumberStart } from './extensions/function-line-numbers/index.js';
import { javascriptLanguage } from './lang/js/index.js';
import { javaLanguage } from './lang/java/index.js';
import { plainLanguage } from './lang/plain/index.js';
import english from './res/lang.en.json';
import japanese from './res/lang.ja.json';

export { createViewer } from './viewer.js';

// Default settings ------------------------------------------------------------

const mounted = new WeakSet();

const LANGUAGES        = { en: english, ja: japanese };
const DEFAULT_SETTINGS = {
	language            : 'en',
	codeLanguage        : 'javascript',
	colorScheme         : 'light',
	fontFamily          : 'menlo, ui-monospace, monospace',
	fontSize            : 16,
	lineHeight          : 165,
	lineWrapping        : false,
	structureHighlight  : true,
	declarationHighlight: true,
	referenceHighlight  : true,
	syntaxHighlight     : true,
	semanticHighlight   : true,
	lineNumbers         : true,
	lineNumberStart     : 1,
	functionLineNumbers : false,
	functionScrollMarkers: false,
	bracketMatching     : true,
	closeBrackets       : true,
	closeBraces         : false,
	easyLineSelection   : false,
	rulers              : true,
	autoIndent          : true,
	autoFormat          : true,
	formatting          : true,
	completion          : true,
	diagnostics         : true,
	analysis            : true,
	analysisDelay       : 600,
	readOnly            : false,
	disabled            : false,
};

function validate(options) {
	for (const [key, value] of Object.entries(options)) {
		if (key === 'gutterLineSelection') {
			if (typeof value !== 'boolean') {
				throw new TypeError(`Invalid setting: ${key}`);
			}
			continue;
		}
		if (!(key in DEFAULT_SETTINGS)) {
			throw new TypeError(`Unknown setting: ${key}`);
		}
		if (key === 'codeLanguage') {
			if (value !== null && !['javascript', 'java'].includes(value)) {
				throw new TypeError('codeLanguage must be javascript, java, or null');
			}
			continue;
		}
		if (typeof value !== typeof DEFAULT_SETTINGS[key]) {
			throw new TypeError(`Invalid setting: ${key}`);
		}
		if (typeof value === 'number' && !Number.isFinite(value)) {
			throw new TypeError(`Invalid number: ${key}`);
		}
	}
	if (options.language !== undefined && !['ja', 'en'].includes(options.language)) {
		throw new TypeError('language must be ja or en');
	}
	if (options.analysisDelay < 0 || options.lineHeight <= 0) {
		throw new RangeError('Invalid delay or line height');
	}
	if (options.fontSize !== undefined && (options.fontSize < 10 || options.fontSize > 64)) {
		throw new RangeError('fontSize must be between 10 and 64');
	}
	if (Object.hasOwn(options, 'lineNumberStart')) validateLineNumberStart(options.lineNumberStart);
	if (Object.hasOwn(options, 'colorScheme')) validateColorScheme(options.colorScheme);
}

function normalizeSettings({ gutterLineSelection, ...options }) {
	if (gutterLineSelection !== undefined && !Object.hasOwn(options, 'easyLineSelection')) {
		options.easyLineSelection = gutterLineSelection;
	}
	return options;
}

// Editor lifecycle ------------------------------------------------------------

/** Creates an editor in an empty, sized container. See README.md for the API contract. */
export async function createEditor(container, { value = '', definitions = [], javaAnalysis, ...options } = {}) {
	validateContainer(container);
	validate(options);
	const initialDefinitions = structuredClone(definitions);
	if (!Array.isArray(initialDefinitions)) {
		throw new TypeError('definitions must be an array');
	}
	const context = createEditorContext(container, options);
	try {
		await initializeEditor(context, initialDefinitions, javaAnalysis, value);
		return context.api;
	} catch (error) {
		disposeEditor(context);
		throw error;
	}
}

function validateContainer(container) {
	if (!container || container.nodeType !== 1 || container.ownerDocument !== document) {
		throw new TypeError('A container in the current document is required');
	}
	if (mounted.has(container) || container.childNodes.length) {
		throw new Error('Container must be empty and unoccupied');
	}
}

// Editor initialization -------------------------------------------------------

function createEditorContext(container, options) {
	mounted.add(container);
	const root = document.createElement('div');
	root.className = 'opticm';
	container.append(root);
	const language = options.codeLanguage === null ? plainLanguage : options.codeLanguage === 'java' ? javaLanguage : javascriptLanguage;
	const context = {
		container,
		root,
		language,
		settings    : { ...DEFAULT_SETTINGS, ...normalizeSettings(options) },
		colorScheme : createColorScheme(root),
		destroyed   : false,
		version     : 0,
		analysis    : null,
		loading     : false,
		programmatic: false,
		composing   : false,
		listeners   : new Map(),
		abort       : new AbortController(),
		markerId    : 0,
	};
	context.diagnosticSource = text => language.diagnostics(text, context.settings.language, undefined, context.client);
	return context;
}

async function initializeEditor(context, definitions, javaAnalysis, value) {
	context.client = context.language.createAnalysisClient(javaAnalysis);
	await context.client.ready;
	if (document.fonts) await loadEditorFont(context);
	context.view = new Editor({
		language    : context.language,
		colorScheme : context.colorScheme.extension,
		phrases     : LANGUAGES[context.settings.language].editorPhrase,
		allowChanges: () => context.loading || context.programmatic || (!context.settings.readOnly && !context.settings.disabled),
		onUpdate    : handleUpdate.bind(null, context),
		onFontSizeChange(delta) {
			context.api.setSettings({ fontSize: Math.min(64, Math.max(10, context.settings.fontSize + delta)) });
		},
		onLineHeightChange(delta) {
			context.api.setSettings({ lineHeight: Math.min(195, Math.max(135, context.settings.lineHeight + delta)) });
		},
	}, context.root);
	context.cm = context.view.view;
	context.colorScheme.set(context.cm, context.settings.colorScheme);
	context.view.setDefinitions(definitions);
	registerEditorEvents(context);
	context.api = createEditorAPI(context);
	applySettings(context);
	context.api.loadDocument(value);
	if (context.settings.analysis) await context.api.analyzeNow();
}

async function loadEditorFont(context) {
	// Resolve inherited CSS variables before requesting the configured font.
	const probe = document.createElement('span');
	probe.className = 'cm-editor';
	probe.style.fontFamily = context.settings.fontFamily;
	context.root.append(probe);
	const fontFamily = getComputedStyle(probe).fontFamily;
	probe.remove();
	await document.fonts.load(`${context.settings.fontSize}px ${fontFamily}`);
}

function registerEditorEvents(context) {
	for (const type of ['focus', 'blur']) {
		context.cm.contentDOM.addEventListener(type, () => emit(context, type, {}), { signal: context.abort.signal });
	}
	for (const type of ['copy', 'cut']) {
		context.cm.contentDOM.addEventListener(type, () => emit(context, type, { text: selectionText(context) }), { signal: context.abort.signal, capture: true });
	}
	context.root.addEventListener('compositionstart', () => {
		context.composing = true;
		setFormatState(context);
		clearTimeout(context.timer);
		context.view.closeCompletion();
		context.view.composing = true;
		context.cm.dom.classList.add('ime');
	}, { signal: context.abort.signal });
	context.root.addEventListener('compositionend', () => {
		context.composing = false;
		setFormatState(context);
		context.view.composing = false;
		context.cm.dom.classList.remove('ime');
		scheduleAnalysis(context);
	}, { signal: context.abort.signal });
	context.observer = new ResizeObserver(() => {
		if (!context.destroyed) context.view.refresh();
	});
	context.observer.observe(context.container);
}

// Shared editor state --------------------------------------------------------

function assertAlive(context) {
	if (context.destroyed) {
		throw new Error('Editor destroyed');
	}
}

function emit(context, type, data) {
	for (const listener of context.listeners.get(type) || []) {
		try {
			listener(structuredClone(data));
		} catch (error) {
			console.error('opticm event listener failed', error);
		}
	}
}

function disposeEditor(context) {
	if (context.destroyed) return;

	context.destroyed = true;
	clearTimeout(context.timer);
	context.abort.abort();
	context.observer?.disconnect();
	context.colorScheme.destroy();
	context.client?.destroy();
	context.view?.destroy();
	context.listeners.clear();
	context.root.remove();
	mounted.delete(context.container);
}

function setFormatState(context) {
	context.view.autoFormat = context.settings.autoFormat && context.settings.formatting && !context.loading && !context.programmatic && !context.composing;
}

function applySettings(context) {
	setFormatState(context);
	if (context.settings.disabled) context.cm.contentDOM.blur();
	context.root.inert = context.settings.disabled;
	context.root.setAttribute('aria-disabled', String(context.settings.disabled));
	context.view.setOptions(context.settings, LANGUAGES[context.settings.language].editorPhrase, context.settings.diagnostics ? context.diagnosticSource : null);
}

function scheduleAnalysis(context) {
	clearTimeout(context.timer);
	if (!context.settings.analysis || context.composing || context.destroyed) return;

	context.timer = setTimeout(() => {
		requestAnalysis(context).catch(error => {
			if (!context.destroyed) {
				emit(context, 'error', { message: error.message });
			}
		});
	}, context.settings.analysisDelay);
}

async function requestAnalysis(context) {
	assertAlive(context);
	const result = await context.client.request(context.cm.state.doc.toString(), context.version);
	if (result === null) return null;

	const common   = createCommonAnalysis({ ...result.commonAnalysis, version: result.version });
	const snapshot = { ...common, text: result.text };

	if (!context.destroyed && result.version === context.version && context.settings.analysis) {
		context.cm.dispatch({ effects: setCommonAnalysis.of(common) });
		context.analysis = snapshot;
		emit(context, 'analysis', snapshot);
	}
	return structuredClone(snapshot);
}

function handleUpdate(context, before, transactions) {
	const transaction = transactions.at(-1);
	if (!transaction) return;

	const changed = transaction.docChanged || transaction.isUserEvent('load');
	const { doc, selection } = transaction.state;

	if (changed) {
		context.version++;
		context.analysis = null;
		scheduleAnalysis(context);
		if (!context.loading) {
			emit(context, 'change', { origin: 'edit', source: changeSource(transaction), version: context.version, text: doc.toString() });
		}
	}
	if (changed && !context.loading) {
		emit(context, 'state', getEditorState(context));
	}
	if (changed || !selection.eq(before.selection)) {
		emit(context, 'selection', {
			ranges: selection.ranges.map(({ anchor, head }) => ({
				anchor: positionAt(doc, anchor),
				head  : positionAt(doc, head),
			})),
		});
	}
}

function selectionText(context) {
	const { doc, selection } = context.cm.state;
	return selection.ranges.map(({ from, to }) => doc.sliceString(from, to)).join('\n');
}

function edit(context, fn) {
	assertAlive(context);
	context.programmatic = true;
	setFormatState(context);
	try {
		fn();
	} finally {
		context.programmatic = false;
		setFormatState(context);
	}
}

function getEditorState(context) {
	return {
		version : context.version,
		readOnly: context.settings.readOnly,
		disabled: context.settings.disabled,
		canUndo : context.view.historySize().undo > 0,
		canRedo : context.view.historySize().redo > 0,
	};
}

// Public API assembly --------------------------------------------------------

function createEditorAPI(context) {
	return {
		...createDocumentAPI(context),
		...createSelectionAPI(context),
		...createSettingsAPI(context),
		...createAnalysisAPI(context),
		...createEventAPI(context),
		...createCommandAPI(context),
		...createHighlightAPI(context),
		refresh() {
			assertAlive(context);
			context.view.refresh();
		},
		destroy: disposeEditor.bind(null, context),
	};
}

function createDocumentAPI(context) {
	return {
		getValue() {
			assertAlive(context);
			return context.cm.state.doc.toString();
		},
		getLineCount() {
			assertAlive(context);
			return context.cm.state.doc.lines;
		},
		loadDocument(text) {
			assertAlive(context);
			context.loading = true;
			setFormatState(context);
			try {
				context.view.loadDocument(String(text));
			} finally {
				context.loading = false;
				setFormatState(context);
			}
			emit(context, 'change', { origin: 'load', version: context.version, text: context.cm.state.doc.toString() });
			emit(context, 'state', getEditorState(context));
			scheduleAnalysis(context);
		},
		replaceDocument(text) {
			edit(context, () => context.cm.dispatch({ changes: { from: 0, to: context.cm.state.doc.length, insert: String(text) }, userEvent: 'api' }));
		},
		replaceRange(text, from, to = from) {
			edit(context, () => {
				const start = offsetAt(context.cm.state.doc, from), end = offsetAt(context.cm.state.doc, to);
				context.cm.dispatch({ changes: { from: Math.min(start, end), to: Math.max(start, end), insert: String(text) }, userEvent: 'api' });
			});
		},
	};
}

function createSelectionAPI(context) {
	return {
		getSelection() {
			assertAlive(context);
			return selectionText(context);
		},
		setEasyLineSelectionMode(enabled) {
			assertAlive(context);
			context.view.setEasyLineSelectionMode(enabled);
		},
		setLineSelectionMode(enabled) {
			context.api.setEasyLineSelectionMode(enabled);
		},
		replaceSelection(text) {
			edit(context, () => {
				const { state } = context.cm;
				const insert = state.toText(String(text));
				context.cm.dispatch(state.changeByRange(range => ({
					changes: { from: range.from, to: range.to, insert },
					range: EditorSelection.range(range.from, range.from + insert.length),
				})), { userEvent: 'api' });
			});
		},
	};
}

function createSettingsAPI(context) {
	return {
		getState() {
			assertAlive(context);
			return getEditorState(context);
		},
		getSettings() {
			assertAlive(context);
			return { ...context.settings, gutterLineSelection: context.settings.easyLineSelection };
		},
		setSettings(patch) {
			assertAlive(context);
			validate(patch);
			if ('codeLanguage' in patch && patch.codeLanguage !== context.settings.codeLanguage) {
				throw new TypeError('codeLanguage can only be selected when creating an editor');
			}
			const wasAnalyzing = context.settings.analysis;
			const delayChanged = Object.hasOwn(patch, 'analysisDelay') && patch.analysisDelay !== context.settings.analysisDelay;
			context.settings = { ...context.settings, ...normalizeSettings(patch) };
			context.colorScheme.set(context.cm, context.settings.colorScheme);
			if (!context.settings.analysis) {
				clearTimeout(context.timer);
				context.analysis = null;
				context.cm.dispatch({ effects: setCommonAnalysis.of(null) });
			}
			applySettings(context);
			if (context.settings.analysis && (!wasAnalyzing || delayChanged)) scheduleAnalysis(context);
			emit(context, 'settings', context.api.getSettings());
			emit(context, 'state', getEditorState(context));
		},
		setDefinitions(defs) {
			assertAlive(context);
			if (!Array.isArray(defs)) {
				throw new TypeError('definitions must be an array');
			}
			context.view.setDefinitions(structuredClone(defs));
		},
	};
}

function createAnalysisAPI(context) {
	return {
		getAnalysis() {
			assertAlive(context);
			return structuredClone(context.analysis);
		},
		analyzeNow() {
			clearTimeout(context.timer);
			return requestAnalysis(context);
		},
	};
}

function createEventAPI(context) {
	return {
		on(type, listener) {
			assertAlive(context);
			if (typeof listener !== 'function') {
				throw new TypeError('listener must be a function');
			}
			if (!context.listeners.has(type)) context.listeners.set(type, new Set());
			context.listeners.get(type).add(listener);
			return () => context.listeners.get(type)?.delete(listener);
		},
	};
}

function createCommandAPI(context) {
	return {
		execute(command) {
			assertAlive(context);
			const commands = ['undo', 'redo', 'cut', 'copy', 'paste', 'selectAll', 'toggleComment', 'format', 'find', 'findNext', 'replace', 'complete'];
			if (!commands.includes(command)) {
				throw new TypeError(`Unknown command: ${command}`);
			}
			if (context.settings.disabled) return;

			if (context.settings.readOnly && ['undo', 'redo', 'cut', 'paste', 'toggleComment', 'format', 'replace', 'complete'].includes(command)) {
				return;
			}
			if (['cut', 'copy', 'paste'].includes(command)) {
				context.cm.focus();
				document.execCommand(command);
				return;
			}
			if (command === 'format' && !context.settings.formatting) return;

			context.view[command]();
		},
		focus() {
			assertAlive(context);
			if (!context.settings.disabled) context.cm.focus();
		},
		blur() {
			assertAlive(context);
			context.cm.contentDOM.blur();
		},
		hasFocus() {
			assertAlive(context);
			return context.cm.hasFocus;
		},
		moveTo(position, { focus = true } = {}) {
			assertAlive(context);
			if (context.settings.disabled) return;

			const anchor = offsetAt(context.cm.state.doc, position);
			context.cm.dispatch({ selection: { anchor }, effects: EditorView.scrollIntoView(anchor, { yMargin: 32 }) });
			if (focus) {
				context.cm.focus();
			}
		},
	};
}

function createHighlightAPI(context) {
	return {
		highlightLine(line) {
			assertAlive(context);
			if (!Number.isInteger(line) || line < 0 || line >= context.cm.state.doc.lines) {
				throw new RangeError('Invalid line');
			}
			const id = ++context.markerId;
			context.view.highlightLine(id, line);
			return id;
		},
		clearHighlight(id) {
			assertAlive(context);
			context.view.clearHighlight(id);
		},
		setHighlightedLines(lines) {
			assertAlive(context);
			context.view.setHighlightedLines(lines);
		},
		getFunctionLineNumber(line) {
			assertAlive(context);
			if (!Number.isInteger(line) || line < 0 || line >= context.cm.state.doc.lines) {
				throw new RangeError('Invalid line');
			}
			return context.view.getSectionLineNumber(line);
		},
	};
}

function changeSource(transaction) {
	for (const event of ['api', 'undo', 'redo']) {
		if (transaction.isUserEvent(event)) return event;
	}
	if (transaction.isUserEvent('format')) return 'format';
	if (transaction.isUserEvent('input.paste')) return 'paste';
	if (transaction.isUserEvent('delete.cut')) return 'cut';
	if (transaction.isUserEvent('input.complete')) return 'complete';
	if (transaction.isUserEvent('input')) return '+input';
	if (transaction.isUserEvent('delete')) return '+delete';
}
