import { createEditor, createViewer } from '../dist/opticm.min.js';
import { createViewer as createStandaloneViewer } from '../dist/viewer.min.js';
const results = [];
const assert = (condition, message, details = '') => {
	if (!condition) {
		throw new Error(message + details);
	}
	results.push(message);
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const waitFor = async (predicate, message) => {
	for (let i = 0; i < 100; i++) {
		if (predicate()) return;
		await wait(20);
	}
	throw new Error(message);
};

async function checkResourceCleanup() {
	const nativeWorker = globalThis.Worker;
	const add = EventTarget.prototype.addEventListener;
	const remove = EventTarget.prototype.removeEventListener;
	const workers = new Map();
	const listeners = [];
	const host = document.createElement('div');
	host.className = 'host';
	document.body.append(host);

	globalThis.Worker = class extends nativeWorker {
		constructor(...args) {
			super(...args);
			workers.set(this, 0);
		}
		terminate() {
			workers.set(this, workers.get(this) + 1);
			super.terminate();
		}
	};
	const capture = options => typeof options === 'boolean' ? options : !!options?.capture;
	const matches = (entry, target, type, callback, options) =>
		entry.target === target && entry.type === type && entry.callback === callback && entry.capture === capture(options);
	EventTarget.prototype.addEventListener = function (type, callback, options) {
		add.call(this, type, callback, options);
		const signal = options?.signal;
		const trackedTarget = this === globalThis || this === document ||
			(this instanceof Element && host.contains(this) && (signal || this.classList.contains('cm-scroller')));
		if (trackedTarget && callback && !signal?.aborted && !options?.once &&
			!listeners.some(entry => matches(entry, this, type, callback, options))) {
			listeners.push({ target: this, type, callback, capture: capture(options), signal });
		}
	};
	EventTarget.prototype.removeEventListener = function (type, callback, options) {
		remove.call(this, type, callback, options);
		const index = listeners.findIndex(entry => matches(entry, this, type, callback, options));
		if (index !== -1) listeners.splice(index, 1);
	};
	const activeListeners = () => listeners.filter(entry => !entry.signal?.aborted);
	let instance;
	try {
		for (const [name, create, settings] of [
			['Editor', createEditor, { functionLineNumbers: true, functionScrollMarkers: true, easyLineSelection: true }],
			['Viewer', createViewer, {}],
			['standalone Viewer', createStandaloneViewer, {}],
		]) {
			for (const [codeLanguage, value] of [
				['javascript', 'function run() { return 1; }'],
				['java', 'class Example { void run() {} }'],
			]) {
				const previousWorkers = workers.size;
				instance = await create(host, { codeLanguage, value, ...settings });
				assert(workers.size === previousWorkers + 1 && activeListeners().length > 0,
					`${name} (${codeLanguage}) starts a Worker and registers tracked listeners`);
				const pending = name === 'Editor'
					? instance.analyzeNow().then(() => false, error => /destroyed/i.test(error.message))
					: instance.setValue(value + '\n').then(() => true);
				instance.destroy();
				instance.destroy();
				assert(await pending, `${name} (${codeLanguage}) settles analysis interrupted by destroy`);
				const remaining = activeListeners();
				assert(
					!host.childNodes.length && [...workers].every(([worker, terminations]) =>
						terminations === 1 && worker.onmessage === null && worker.onerror === null && worker.onmessageerror === null),
					`${name} (${codeLanguage}) removes its DOM and terminates its Worker exactly once with handlers detached`,
				);
				assert(!remaining.length, `${name} (${codeLanguage}) releases its tracked event listeners`,
					remaining.length ? `: ${remaining.map(entry => entry.type).join(', ')}` : '');
				instance = null;
				listeners.length = 0;
			}
		}
	} finally {
		instance?.destroy();
		globalThis.Worker = nativeWorker;
		EventTarget.prototype.addEventListener = add;
		EventTarget.prototype.removeEventListener = remove;
		host.remove();
	}
}

// Inspect rendered UI, without retrieving the underlying editor instance.
const searchLabel = (editor, host) => {
	editor.execute('find');
	const dialog = host.querySelector('.cm-search');
	const label = dialog.querySelector('input[name="search"]').getAttribute('aria-label');
	dialog.querySelector('button[name="close"]').click();
	return label;
};
const escape = host => host.querySelector('.cm-content').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
const mac = /Mac/.test(navigator.platform);
const mod = mac ? { metaKey: true } : { ctrlKey: true };
const press = (host, key, modifiers = {}) => host.querySelector('.cm-content').dispatchEvent(
	new KeyboardEvent('keydown', {
		key,
		keyCode   : key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0,
		bubbles   : true,
		cancelable: true,
		...modifiers,
	}),
);
let a, b;
try {
	a = await createEditor(document.querySelector('#a'), { value: 'function one() { return 1; }', language: 'ja', autoFormat: false });
	b = await createEditor(document.querySelector('#b'), { value: 'function two() { return 2; }', language: 'en', autoFormat: false });
	assert(!window.CodeMirror && !window.acorn && !window.JSHINT && !window.tern, 'no library globals');
	const firstAnalysis = a.getAnalysis();
	const secondAnalysis = b.getAnalysis();
	const analysisKeys = [
		'complete', 'declarations', 'references', 'sections', 'sourceLength', 'stale',
		'structures', 'syntax', 'syntaxComplete', 'text', 'version',
	].join(',');
	assert(
		firstAnalysis.text === 'function one() { return 1; }' && secondAnalysis.text === 'function two() { return 2; }' &&
			[firstAnalysis, secondAnalysis].every(snapshot => snapshot.structures.some(range => range.kind === 'function')),
		'independent analysis',
	);
	assert(Object.keys(firstAnalysis).sort().join(',') === analysisKeys, 'public JavaScript analysis uses the shared format');
	assert(getComputedStyle(document.querySelector('#host-page')).color === 'rgb(1, 2, 3)', 'host CSS unaffected');
	assert(!('getCodeMirror' in a), 'public API does not expose editor instance');
	for (const [codeLanguage, opening] of [['javascript', 'function f() {'], ['java', 'class Example {']]) {
		const host = document.createElement('div');
		document.body.append(host);
		const editor = await createEditor(host, { codeLanguage, autoFormat: false });
		try {
			for (const enabled of [true, false, true]) {
				assert(editor.getSettings().autoIndent === enabled, `${codeLanguage}: autoIndent is ${enabled}`);
				editor.loadDocument(`${opening}\n\t`);
				editor.moveTo({ line: 1, ch: 1 });
				assert(document.execCommand('insertText', false, '}'), `${codeLanguage}: accepts closing brace input`);
				await waitFor(() => editor.getValue().endsWith('}'), `${codeLanguage}: closing brace input reaches editor state`);
				const expected = `${opening}\n${enabled ? '' : '\t'}}`;
				const actual = editor.getValue();
				assert(
					actual === expected,
					`${codeLanguage}: closing brace indentation with autoIndent=${enabled}`,
					`. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
				);
				editor.setSettings({ autoIndent: !enabled });
			}
		} finally {
			editor.destroy();
			host.remove();
		}
	}
	const editorA = document.querySelector('#a .cm-editor');
	const editorB = document.querySelector('#b .cm-editor');
	const whitespaceLines = () => [...editorA.querySelectorAll('.cm-content .cm-line')];
	a.loadDocument('a  \u3000\u3000  b\n"\u3000\u3000" //\u3000');
	const spaceMarks = line => [...line.querySelectorAll('.cm-opticm-space')];
	const fullWidthMarks = line => spaceMarks(line).filter(mark => mark.textContent === '\u3000');
	const fullWidth = fullWidthMarks(whitespaceLines()[0]);
	const ordinary = spaceMarks(whitespaceLines()[0]).find(mark => mark.textContent === ' ');
	assert(
		fullWidth.map(mark => mark.textContent).join('') === '\u3000\u3000' &&
			getComputedStyle(fullWidth[0]).backgroundSize === 'calc(100% - 2px) 4px' &&
			getComputedStyle(ordinary).backgroundSize === 'calc(100% - 2px) 2px' &&
			fullWidth[0].getBoundingClientRect().width > ordinary.getBoundingClientRect().width,
		'ideographic spaces have a wider, 4px-thick underline while ordinary spaces remain 2px',
	);
	const gradientColor = mark => {
		const gradient = getComputedStyle(mark).backgroundImage;
		const color = gradient.match(/^linear-gradient\((.+), \1\)$/)?.[1];
		if (!color) throw new Error('Expected a solid-color underline: ' + gradient);
		const context = document.createElement('canvas').getContext('2d');
		context.fillStyle = color;
		context.fillRect(0, 0, 1, 1);
		return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
	};
	const hasLighterFullWidth = () => {
		const base = gradientColor(ordinary);
		const light = gradientColor(fullWidth[0]);
		return base.every((channel, i) => Math.abs(light[i] - (channel * 0.8 + 255 * 0.2)) <= 1);
	};
	assert(hasLighterFullWidth(), 'ideographic-space underline is lighter than the ordinary-space underline');
	editorA.style.setProperty('--opticm-whitespace-active-color', '#804020');
	assert(hasLighterFullWidth(), 'ideographic-space color follows the customized active color');
	editorA.style.removeProperty('--opticm-whitespace-active-color');
	const activeMarks = spaceMarks(whitespaceLines()[0]);
	assert(
		activeMarks.map(mark => mark.textContent).join('') === '  \u3000\u3000  ' &&
			activeMarks.length === 6 && activeMarks.every(mark => {
				const style = getComputedStyle(mark);
				const size = mark.textContent === '\u3000' ? 'calc(100% - 2px) 4px' : 'calc(100% - 2px) 2px';
				return style.backgroundSize === size && style.backgroundPosition === '50% 100%';
			}) && activeMarks.every((mark, i) => !i ||
				Math.abs(activeMarks[i - 1].getBoundingClientRect().right - mark.getBoundingClientRect().left) < 1),
		'adjacent ordinary and ideographic spaces have separate underlines with gaps',
	);
	a.replaceRange('\u3000', { line: 0, ch: 2 });
	assert(
		spaceMarks(whitespaceLines()[0]).map(mark => mark.textContent).join('|') === ' |\u3000| |\u3000|\u3000| | ',
		'editing inside a mixed run preserves one mark per space',
	);
	a.replaceRange('', { line: 0, ch: 2 }, { line: 0, ch: 3 });
	assert(
		spaceMarks(whitespaceLines()[0]).map(mark => mark.textContent).join('|') === ' | |\u3000|\u3000| | ',
		'deleting inside a mixed run preserves separate marks',
	);
	assert(
		fullWidthMarks(whitespaceLines()[1]).map(mark => mark.textContent).join('') === '\u3000\u3000\u3000' &&
			fullWidthMarks(whitespaceLines()[1]).every(mark => getComputedStyle(mark).backgroundImage === 'none'),
		'ideographic spaces in strings and comments are marked but hidden on inactive lines',
	);
	a.moveTo({ line: 1, ch: 0 }, { focus: false });
	assert(
		fullWidthMarks(whitespaceLines()[1]).every(mark =>
			getComputedStyle(mark).backgroundImage.includes('linear-gradient') &&
			getComputedStyle(mark).backgroundSize === 'calc(100% - 2px) 4px'),
		'ideographic spaces in strings and comments become visible on the active line',
	);
	a.replaceSelection('\u3000');
	assert(
		fullWidthMarks(whitespaceLines()[1]).map(mark => mark.textContent).join('').length === 4,
		'ideographic space decorations update after editing',
	);
	a.replaceRange('', { line: 1, ch: 0 }, { line: 1, ch: 1 });
	assert(
		fullWidthMarks(whitespaceLines()[1]).map(mark => mark.textContent).join('').length === 3,
		'ideographic space decorations update after deletion',
	);
	a.loadDocument('a \tb\nc \td');
	assert(
		getComputedStyle(whitespaceLines()[0].querySelector('.cm-opticm-space')).backgroundImage.includes('linear-gradient') &&
			getComputedStyle(whitespaceLines()[1].querySelector('.cm-opticm-space')).backgroundImage === 'none' &&
			getComputedStyle(whitespaceLines()[1].querySelector('.cm-highlightTab'), '::before').color === 'rgb(251, 221, 230)',
		'component preserves active-space and inactive-tab display',
	);
	a.loadDocument('    let sample = 1;');
	await waitFor(() => a.getAnalysis() !== null, 'declaration analysis is ready');
	const declarationAboveRuler = () => {
		const rulerOverlay = editorA.querySelector('.cm-ruler-overlay');
		const structureOverlay = editorA.querySelector('.cm-structure-overlay');
		const rule = rulerOverlay?.querySelector('.cm-opticm-rulers > span:nth-child(2)');
		const canvas = structureOverlay?.querySelector('canvas');
		if (!rule || !canvas?.width || !canvas.height ||
			getComputedStyle(rulerOverlay).zIndex !== getComputedStyle(structureOverlay).zIndex ||
			!(rulerOverlay.compareDocumentPosition(structureOverlay) & Node.DOCUMENT_POSITION_FOLLOWING)) return false;
		const ruleBox = rule.getBoundingClientRect(), canvasBox = canvas.getBoundingClientRect();
		const lineBox = whitespaceLines()[0].getBoundingClientRect();
		const x = Math.floor((ruleBox.left + 1 - canvasBox.left) * canvas.width / canvasBox.width);
		const y = Math.floor(((lineBox.top + lineBox.bottom) / 2 - canvasBox.top) * canvas.height / canvasBox.height);
		return x >= 0 && x < canvas.width && y >= 0 && y < canvas.height &&
			canvas.getContext('2d').getImageData(x, y, 1, 1).data[3] === 255;
	};
	await waitFor(declarationAboveRuler, 'declaration is painted above the overlapping ruler');
	assert(declarationAboveRuler(), 'declaration canvas is above an overlapping ruler');
	a.setSettings({ structureHighlight: false, declarationHighlight: false, referenceHighlight: false });
	assert(!editorA.querySelector('.cm-structure-overlay'), 'all structure features can be disabled');
	a.setSettings({ declarationHighlight: true });
	await waitFor(declarationAboveRuler, 'declaration remains above the ruler after structure is re-enabled');
	a.setSettings({ rulers: false });
	a.setSettings({ rulers: true });
	await waitFor(declarationAboveRuler, 'declaration remains above the ruler after rulers are re-enabled');
	assert(declarationAboveRuler(), 'overlay order survives re-enabling either extension');
	a.setSettings({ structureHighlight: true, declarationHighlight: true, referenceHighlight: true });
	a.loadDocument('function one() { return 1; }');
	await waitFor(() => a.getAnalysis() !== null, 'restored document analysis is ready');
	let displayAnalysisEvents = 0;
	const offDisplayAnalysis = a.on('analysis', () => displayAnalysisEvents++);
	a.setSettings({ structureHighlight: false, declarationHighlight: false, referenceHighlight: false });
	assert(!editorA.querySelector('.cm-structure-overlay'), 'disabling all three canvas features removes the structure view');
	a.setSettings({ referenceHighlight: true });
	assert(editorA.querySelector('.cm-structure-overlay'), 'reference highlighting can be enabled on its own');
	a.setSettings({ referenceHighlight: false });
	a.setSettings({ structureHighlight: true, declarationHighlight: false });
	assert(editorA.querySelector('.cm-structure-overlay'), 'structure highlighting can be enabled without declaration highlighting');
	a.setSettings({ structureHighlight: false, declarationHighlight: true });
	assert(editorA.querySelector('.cm-structure-overlay'), 'declaration highlighting can be enabled without structure highlighting');
	a.setSettings({ structureHighlight: true, declarationHighlight: true, referenceHighlight: true });
	a.setSettings({ syntaxHighlight: false, semanticHighlight: true });
	assert(editorA.classList.contains('cm-syntax-highlighting'), 'semantic highlighting can remain enabled without syntax coloring');
	a.setSettings({ syntaxHighlight: false, semanticHighlight: false });
	assert(!editorA.classList.contains('cm-syntax-highlighting'), 'disabling both syntax features removes their extension');
	a.setSettings({ syntaxHighlight: true, semanticHighlight: true, bracketMatching: false });
	assert(!editorA.classList.contains('cm-bracket-matching'), 'bracket matching can be disabled independently');
	a.setSettings({ bracketMatching: true });
	assert(editorA.classList.contains('cm-bracket-matching'), 'bracket matching can be re-enabled');
	await wait(650);
	assert(displayAnalysisEvents === 0, 'display setting changes do not schedule another parse');
	offDisplayAnalysis();
	for (const [text, count] of [['', 1], ['first\nsecond\n', 3]]) {
		a.loadDocument(text);
		assert(a.getLineCount() === count, 'line count includes empty and trailing lines: ' + count);
	}
	a.loadDocument('function one() { return 1; }');
	const clipboardEvents = [];
	const offCopy = a.on('copy', event => clipboardEvents.push(['copy', event.text]));
	const offCut = a.on('cut', event => clipboardEvents.push(['cut', event.text]));
	a.focus();
	press(editorA, 'a', mod);
	assert(a.getSelection() === a.getValue(), 'select-all shortcut selects the entire document');
	const selectedLineStyle = getComputedStyle(editorA.querySelector('.cm-line'));
	assert(
		editorA.classList.contains('cm-has-selection') && editorA.querySelector('.cm-activeLine') &&
			editorA.querySelector('.cm-activeLineGutter') && selectedLineStyle.boxShadow === 'none',
		'JavaScript selection hides the active-line frame while retaining standard active-line classes',
	);
	const activeLiteral = editorA.querySelector('.cm-activeLine .cm-syntax-literal');
	assert(
		activeLiteral && getComputedStyle(activeLiteral).textShadow === 'none',
		'JavaScript literals on the active line remain without a text shadow during selection',
	);
	const selectionBackgrounds = () => [...editorA.querySelectorAll('.cm-full-line-selectionLayer .cm-selectionBackground')];
	await waitFor(() => selectionBackgrounds().length, 'selection is rendered');
	const selectedLineBox = editorA.querySelector('.cm-line').getBoundingClientRect();
	const singleLineBox = selectionBackgrounds()[0].getBoundingClientRect();
	assert(
		Math.abs(singleLineBox.top - selectedLineBox.top) < 1 && Math.abs(singleLineBox.height - selectedLineBox.height) < 1,
		'single-line selection fills the entire visual line height',
	);
	const selectionColor = () => getComputedStyle(selectionBackgrounds()[0]).backgroundColor;
	try {
		await waitFor(() => editorA.classList.contains('cm-focused'), 'editor focus is reflected in the selection style');
	} catch (error) {
		const focus = {
			documentFocused: document.hasFocus(),
			contentFocused : document.activeElement === editorA.querySelector('.cm-content'),
			activeElement  : document.activeElement?.tagName,
			editorFocused  : a.hasFocus(),
		};
		throw new Error(`${error.message} (${JSON.stringify(focus)})`, { cause: error });
	}
	const focusedSelectionColor = selectionColor();
	a.blur();
	await waitFor(() => !editorA.classList.contains('cm-focused'), 'editor blur is reflected in the selection style');
	assert(selectionColor() === focusedSelectionColor, 'selection background color is the same with and without focus');
	a.focus();
	const selectionLayer = editorA.querySelector('.cm-full-line-selectionLayer');
	assert(
		Number(getComputedStyle(selectionLayer).zIndex) > Number(getComputedStyle(editorA.querySelector('.cm-structure-overlay')).zIndex),
		'selection highlight is painted above the structure canvas and editor background',
	);
	for (const type of ['copy', 'cut']) {
		editorA.querySelector('.cm-content').dispatchEvent(new ClipboardEvent(type, { bubbles: true, cancelable: true, clipboardData: new DataTransfer() }));
	}
	assert(clipboardEvents.length === 2 && clipboardEvents.every(([, text]) => text === 'function one() { return 1; }'), 'clipboard events expose selection before cutting');
	offCopy();
	offCut();
	a.loadDocument('one\ntwo\nthree');
	a.focus();
	press(editorA, 'a', mod);
	await waitFor(() => selectionBackgrounds().length >= 3, 'multiline selection is rendered');
	const lineHeight = editorA.querySelector('.cm-line').getBoundingClientRect().height;
	assert(
		selectionBackgrounds().every(background => Math.abs(background.getBoundingClientRect().height - lineHeight) < 1),
		'multiline selection uses the same full visual-line height for every band',
	);
	a.loadDocument('one\ntwo');
	const restoredLine = editorA.querySelector('.cm-activeLine');
	assert(
		!editorA.classList.contains('cm-has-selection') && restoredLine && editorA.querySelector('.cm-activeLineGutter') &&
			getComputedStyle(restoredLine).backgroundColor !== 'rgba(0, 0, 0, 0)' &&
			getComputedStyle(restoredLine).boxShadow !== 'none',
		'collapsing the selection restores active-line and gutter highlighting',
	);
	editorA.querySelector('.cm-content').dispatchEvent(new ClipboardEvent('cut', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() }));
	assert(a.getValue() === 'one\ntwo', 'cut without a selection leaves the current line intact');
	a.moveTo({ line: 0, ch: 1 });
	press(editorA, 'Tab');
	assert(a.getValue() === 'o\tne\ntwo', 'Tab inserts a tab at the caret');
	press(editorA, 'd', mod);
	assert(a.getValue() === 'two', 'legacy delete-line shortcut');
	press(editorA, 'z', mod);
	assert(a.getValue().endsWith('\ntwo'), 'keyboard undo restores the deleted line');
	press(editorA, mac ? 'y' : 'Z', { ...mod, shiftKey: !mac });
	assert(a.getValue() === 'two', 'legacy keyboard redo removes the line again');
	press(editorA, mac ? 'f' : 'F', { ...mod, altKey: mac, shiftKey: !mac });
	const replaceField = editorA.querySelector('.cm-search input[name="replace"]');
	assert(replaceField && document.activeElement === replaceField, 'legacy replace shortcut focuses the replacement field');
	editorA.querySelector('.cm-search button[name="close"]').click();
	a.loadDocument('function one() { return 1; }');
	b.focus();
	const focusEvents = [];
	const offFocus = a.on('focus', () => focusEvents.push('focus'));
	const offBlur = a.on('blur', () => focusEvents.push('blur'));
	a.focus();
	assert(a.hasFocus() && !b.hasFocus(), 'focus API targets one editor');
	a.blur();
	assert(!a.hasFocus() && focusEvents.join(',') === 'focus,blur', 'blur API and focus events');
	offFocus();
	offBlur();
	a.setSettings({ readOnly: true });
	a.focus();
	assert(a.hasFocus(), 'read-only editor can receive focus');
	a.setSettings({ disabled: true });
	assert(!a.hasFocus(), 'disabling editor removes input focus');
	b.focus();
	a.focus();
	a.blur();
	assert(!a.hasFocus() && b.hasFocus(), 'disabled focus and unrelated blur do not steal focus');
	a.setSettings({ readOnly: false, disabled: false });
	const clipboardCalls = [];
	const originalExecCommand = document.execCommand;
	try {
		document.execCommand = command => {
			clipboardCalls.push(command);
			assert(editorA.contains(document.activeElement), 'clipboard command focuses target editor: ' + command);
			return true;
		};
		for (const command of ['cut', 'copy', 'paste']) {
			b.focus();
			a.execute(command);
		}
		assert(clipboardCalls.join(',') === 'cut,copy,paste', 'clipboard commands delegate to document');
		clipboardCalls.length = 0;
		a.setSettings({ readOnly: true });
		for (const command of ['cut', 'copy', 'paste']) {
			a.execute(command);
		}
		assert(clipboardCalls.join(',') === 'copy', 'read-only allows copy only');
		clipboardCalls.length = 0;
		a.setSettings({ disabled: true });
		for (const command of ['cut', 'copy', 'paste']) {
			a.execute(command);
		}
		assert(clipboardCalls.length === 0, 'disabled blocks clipboard commands');
	} finally {
		document.execCommand = originalExecCommand;
		a.setSettings({ readOnly: false, disabled: false });
	}
	const cursorUrls = [];
	assert(a.getSettings().easyLineSelection === false, 'easy selection defaults to off');
	a.setSettings({ gutterLineSelection: true });
	assert(a.getSettings().easyLineSelection, 'legacy option enables easy selection');
	for (const lineSelection of [false, true]) {
		a.setEasyLineSelectionMode(lineSelection);
		const cursor = getComputedStyle(editorA.querySelector('.cm-lineNumbers .cm-gutterElement:not([style*="visibility: hidden"])')).cursor;
		const edgeCursor = getComputedStyle(editorA.querySelector('.cm-gutters'), '::after').cursor;
		const url = cursor.match(/url\("(data:image\/svg\+xml[^"\n]+)"\)/)?.[1];
		assert(url && cursor.endsWith('22 8, pointer'), 'embedded cursor and hotspot: ' + lineSelection);
		assert(edgeCursor === cursor, 'gutter edge matches line-number cursor: ' + lineSelection);
		const image = new Image();
		image.src = url;
		await image.decode();
		assert(image.naturalWidth === 32 && image.naturalHeight === 32, 'embedded cursor decodes: ' + lineSelection);
		cursorUrls.push(url);
	}
	assert(cursorUrls[0] !== cursorUrls[1], 'line selection changes embedded cursor');
	a.setLineSelectionMode(false);
	a.setSettings({ gutterLineSelection: false });
	assert(
		editorA.classList.contains('cm-gutter-line-selection') && !editorA.classList.contains('cm-easy-line-selection'),
		'legacy option turns off only easy selection',
	);
	const defaultEditorBackground = 'rgb(253, 253, 253)';
	assert(getComputedStyle(editorA).backgroundColor === defaultEditorBackground && getComputedStyle(editorA).color === 'rgb(17, 17, 0)', 'default editor background is neutral gray');
	const themeRoot = editorA.closest('.opticm');
	themeRoot.style.setProperty('--opticm-color-editor', '#123456');
	assert(getComputedStyle(editorA).backgroundColor === 'rgb(18, 52, 86)', 'theme custom properties update at runtime');
	assert(getComputedStyle(editorB).backgroundColor === defaultEditorBackground, 'theme custom properties isolated per editor');
	themeRoot.style.removeProperty('--opticm-color-editor');
	a.loadDocument('function first() {\n\tvar firstValue = 1; console.log(firstValue);\n}\nfunction second() {\n\tvar secondValue = 2;\n}');
	await a.analyzeNow();
	const local = editorA.querySelector('.cm-syntax-local-reference');
	assert(
		local?.textContent === 'firstValue' && getComputedStyle(local).color === 'rgb(83, 122, 31)',
		'local variable references retain the original green highlight',
	);
	assert(
		[...editorA.querySelectorAll('.cm-syntax-variable')].some(node =>
			node.textContent === 'console' && getComputedStyle(node).color === 'rgb(0, 83, 99)'),
		'global variable references retain the original turquoise highlight',
	);
	const jsReference = () => [...editorA.querySelectorAll('.cm-syntax-variable-reference')]
		.find(node => node.textContent === 'firstValue');
	const jsReferenceStyle = getComputedStyle(jsReference());
	const jsReferenceAppearance = {
		background: jsReferenceStyle.backgroundColor,
		shadow: jsReferenceStyle.boxShadow,
		radius: jsReferenceStyle.borderRadius,
	};
	assert(jsReferenceAppearance.shadow === 'none', 'JavaScript reference background is drawn on canvas');
	a.moveTo({ line: 1, ch: 0 }, { focus: false });
	assert(
		getComputedStyle(jsReference()).boxShadow === 'none',
		'JavaScript reference shadow is hidden on the active line',
	);
	a.moveTo({ line: 0, ch: 0 }, { focus: false });
	a.setSettings({ analysis: false });
	a.loadDocument('function f() { let item = 1; return item; }');
	assert(
		editorA.querySelector('.cm-syntax-local-reference')?.textContent === 'item',
		'JavaScript syntax highlighting remains immediate when background analysis is disabled',
	);
	a.replaceDocument('function f() { let other = 1; return item; }');
	assert(
		!editorA.querySelector('.cm-syntax-local-reference') &&
			[...editorA.querySelectorAll('.cm-syntax-variable')].some(node => node.textContent === 'item'),
		'JavaScript edits immediately update local reference classification',
	);
	a.setSettings({ analysis: true });
	a.loadDocument('function first() {\n\tvar firstValue = 1; console.log(firstValue);\n}\nfunction second() {\n\tvar secondValue = 2;\n}');
	await a.analyzeNow();
	const ruler = editorA.querySelector('.cm-opticm-rulers');
	assert(
		[...ruler.children].map(rule => rule.style.getPropertyValue('--ruler-column')).join(',') === '4,8,12' &&
			[...ruler.children].every(rule => getComputedStyle(rule).borderLeftStyle === 'dashed'),
		'three dashed rulers mark the original indentation columns',
	);
	themeRoot.style.setProperty('--opticm-indent-ruler-color', '#123456');
	assert(
		getComputedStyle(ruler.firstElementChild).borderLeftColor === 'rgb(18, 52, 86)' &&
			getComputedStyle(editorB.querySelector('.cm-opticm-rulers > span')).borderLeftColor !== 'rgb(18, 52, 86)',
		'component ruler styling can be customized independently',
	);
	themeRoot.style.removeProperty('--opticm-indent-ruler-color');
	a.setSettings({ rulers: false });
	assert(
		!editorA.querySelector('.cm-ruler-overlay') && editorB.querySelector('.cm-ruler-overlay'),
		'ruler setting disables guides only in the selected editor',
	);
	a.setSettings({ rulers: true });
	assert(
		editorA.querySelectorAll('.cm-opticm-rulers > span').length === 3,
		'ruler setting restores guides',
	);
	await new Promise(resolve => setTimeout(resolve, 120));
	const restoredRuler = editorA.querySelector('.cm-opticm-rulers');
	const firstLine = editorA.querySelector('.cm-content .cm-line');
	assert(
		Math.abs(restoredRuler.firstElementChild.getBoundingClientRect().left -
			(firstLine.getBoundingClientRect().left + parseFloat(getComputedStyle(firstLine).paddingLeft) +
			4 * parseFloat(restoredRuler.style.getPropertyValue('--ruler-character-width')))) < 1,
		'component ruler aligns with its padded text after re-enabling',
	);
	const oldRulerWidth = parseFloat(restoredRuler.style.getPropertyValue('--ruler-character-width'));
	const oldLineHeight = firstLine.getBoundingClientRect().height;
	a.setSettings({ fontSize: 24 });
	await waitFor(() => parseFloat(restoredRuler.style.getPropertyValue('--ruler-character-width')) > oldRulerWidth &&
		firstLine.getBoundingClientRect().height > oldLineHeight, 'font change updates ruler metrics without editing');
	const changedRulerWidth = parseFloat(restoredRuler.style.getPropertyValue('--ruler-character-width'));
	const textWidth = document.createRange();
	const textNode = [...firstLine.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.length >= 4);
	if (textNode) {
		textWidth.setStart(textNode, 0);
		textWidth.setEnd(textNode, 4);
		assert(
			Math.abs(textWidth.getBoundingClientRect().width / 4 - changedRulerWidth) < 1,
			'ruler uses the new character width after font size changes',
		);
	}
	a.setSettings({ fontSize: 16 });
	await waitFor(
		() => Math.abs(parseFloat(restoredRuler.style.getPropertyValue('--ruler-character-width')) - oldRulerWidth) < 0.1,
		'font size restoration updates ruler metrics without editing',
	);
	const gutterWidth = () => editorA.querySelector('.cm-gutters').getBoundingClientRect().width;
	const normalWidth = gutterWidth();
	const structureLayer = getComputedStyle(editorA.querySelector('.cm-structure-overlay'));
	const textLayer = getComputedStyle(editorA.querySelector('.cm-content'));
	assert(getComputedStyle(editorA.querySelector('.cm-scroller')).zIndex === 'auto' &&
		Number(textLayer.zIndex) > Number(structureLayer.zIndex), 'source text is painted above the structure canvas');
	themeRoot.style.setProperty('--opticm-structure-overlay-z-index', '-1');
	assert(
		getComputedStyle(editorA.querySelector('.cm-structure-overlay')).zIndex === '-1' &&
			getComputedStyle(editorB.querySelector('.cm-structure-overlay')).zIndex === '0',
		'structure layering can be customized independently in the component',
	);
	themeRoot.style.removeProperty('--opticm-structure-overlay-z-index');
	themeRoot.style.setProperty('--opticm-function-number-color', '#123456');
	themeRoot.style.setProperty('--opticm-function-lint-gutter-width', '30px');
	assert(
		getComputedStyle(editorA.querySelector('.cm-gutter-lint')).width === '30px',
		'function lint gutter width is customizable from the component container',
	);
	themeRoot.style.removeProperty('--opticm-function-lint-gutter-width');
	for (const functionLineNumbers of [true, false]) {
		a.setSettings({ functionLineNumbers });
		assert(gutterWidth() === normalWidth, 'gutter width is stable when switching line-number modes: ' + functionLineNumbers);
		const strip = getComputedStyle(editorA.querySelector('.cm-gutters'), '::after');
		assert(
			strip.backgroundImage.includes('repeating-linear-gradient') === functionLineNumbers,
			'only per-function mode displays the striped gutter edge: ' + functionLineNumbers,
		);
		if (functionLineNumbers) {
			assert(
				getComputedStyle(editorA.querySelectorAll('.cm-function-number')[1]).color === 'rgb(18, 52, 86)',
				'function number color is customizable in the component',
			);
		}
		await waitFor(() => editorA.querySelectorAll('.cm-lint-marker-warning').length === 2, 'function diagnostics did not render');
		for (const [index, marker] of [...editorA.querySelectorAll('.cm-lint-marker-warning')].entries()) {
			const line = [1, 4][index];
			const box = marker.getBoundingClientRect();
			assert(marker.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)), 'lint marker receives pointer over function region: ' + functionLineNumbers + ', line ' + line);
		}
		const originalFontSize = a.getSettings().fontSize;
		a.setSettings({ fontSize: 48 });
		const lintGutter = editorA.querySelector('.cm-gutter-lint');
		const marker = lintGutter.querySelector('.cm-lint-marker-warning');
		const gutterBox = lintGutter.getBoundingClientRect();
		const markerBox = marker.getBoundingClientRect();
		assert(
			markerBox.width >= 48 && markerBox.left >= gutterBox.left && markerBox.right <= gutterBox.right,
			'zoomed lint marker fits inside its gutter: ' + functionLineNumbers,
		);
		a.setSettings({ fontSize: originalFontSize });
		themeRoot.style.removeProperty('--opticm-function-number-color');
	}
	a.loadDocument('function longFunction() {\n' + '\n'.repeat(999) + '}');
	await a.analyzeNow();
	a.setSettings({ functionLineNumbers: true, functionScrollMarkers: false });
	const longWidth = gutterWidth();
	const scrollbarStyle = document.createElement('style');
	scrollbarStyle.textContent = '.cm-scroller::-webkit-scrollbar { width: 24px; }';
	document.head.append(scrollbarStyle);
	themeRoot.style.setProperty('--opticm-function-scroll-marker-track-width', '10px');
	a.setSettings({ functionLineNumbers: false, functionScrollMarkers: true });
	await waitFor(
		() => editorA.querySelectorAll('.cm-function-scroll-markers > span').length > 0,
		'function scroll markers did not render independently',
	);
	const scroller = editorA.querySelector('.cm-scroller');
	const markerBounds = editorA.querySelector('.cm-function-scroll-markers > span').getBoundingClientRect();
	const scrollerBounds = scroller.getBoundingClientRect();
	const borderRight = parseFloat(getComputedStyle(scroller).borderRightWidth);
	const scrollbarRight = scrollerBounds.right - borderRight;
	const scrollbarLeft = scrollerBounds.left + scroller.clientLeft + scroller.clientWidth;
	assert(scrollbarRight - scrollbarLeft >= 20, 'test scrollbar must be wider than the marker track');
	assert(
		Math.abs((markerBounds.left + markerBounds.right - scrollbarLeft - scrollbarRight) / 2) < 1,
		'function markers are horizontally centered in the scrollbar',
	);
	themeRoot.style.removeProperty('--opticm-function-scroll-marker-track-width');
	scrollbarStyle.remove();
	a.setSettings({ functionLineNumbers: true });
	assert(
		editorA.querySelectorAll('.cm-function-scroll-markers > span').length > 0,
		'enabling function line numbers does not control function scroll markers',
	);
	assert(longWidth > normalWidth && gutterWidth() === longWidth, 'both gutters reserve the same width for four-digit numbers');
	a.setSettings({ functionLineNumbers: false, functionScrollMarkers: false });
	assert(!editorA.querySelector('.cm-function-scroll-markers'), 'disabling function scroll markers removes their DOM');
	a.loadDocument('const broken = ;');
	await waitFor(() => editorA.querySelector('.cm-lint-marker-error'), 'syntax diagnostics did not render');
	const lintMarker = editorA.querySelector('.cm-lint-marker-error');
	lintMarker.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
	await waitFor(() => editorA.querySelector('.cm-tooltip-lint li'), 'gutter hover opens the diagnostic tooltip');
	const lintTooltip = editorA.querySelector('.cm-tooltip-lint');
	assert(lintTooltip.querySelectorAll('li').length > 1, 'tooltip includes every diagnostic on the line');
	window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 0 }));
	await waitFor(() => !lintTooltip.isConnected, 'lint tooltip removed when pointer leaves');
	a.loadDocument('function one() { return 1; }');
	assert(searchLabel(a, editorA).includes('検索'), 'Japanese search uses language resources');
	assert(searchLabel(b, editorB).includes('Find'), 'English search uses language resources');
	a.setSettings({ language: 'en' });
	assert(searchLabel(a, editorA).includes('Find'), 'language resources switch at runtime');
	a.setSettings({ language: 'ja' });
	assert(searchLabel(a, editorA).includes('検索') && searchLabel(b, editorB).includes('Find'), 'language resources remain independent');
	a.setSettings({ lineWrapping: true, fontSize: 22 });
	assert(editorA.querySelector('.cm-lineWrapping'), 'wrapping applies to the configured editor');
	assert(!b.getSettings().lineWrapping && !editorB.querySelector('.cm-lineWrapping') && b.getSettings().fontSize === 16, 'settings isolated');
	a.loadDocument('apple apple');
	a.execute('replace');
	const searchPanel = editorA.querySelector('.cm-search');
	const searchInput = searchPanel.querySelector('input[name="search"]');
	const replacement = searchPanel.querySelector('input[name="replace"]');
	assert(document.activeElement === replacement, 'replace focuses the replacement field');
	searchInput.value = 'apple';
	replacement.value = 'pear';
	replacement.dispatchEvent(new Event('change', { bubbles: true }));
	searchPanel.querySelector('button[name="replaceAll"]').click();
	assert(a.getValue() === 'pear pear', 'search panel can replace all matches');
	searchPanel.querySelector('button[name="close"]').click();
	let origin;
	a.on('change', event => origin = event.origin);
	a.loadDocument('const old = 1;');
	assert(origin === 'load' && !a.getState().canUndo, 'load resets history and reports origin');
	a.replaceDocument('const next = 2;');
	assert(origin === 'edit' && a.getState().canUndo, 'API edit is undoable');
	a.execute('undo');
	assert(a.getValue() === 'const old = 1;', 'undo restores source');
	a.execute('redo');
	assert(a.getValue() === 'const next = 2;', 'redo restores edit');
	const pending = a.analyzeNow();
	a.replaceDocument('function newest() {}');
	const older = await pending;
	assert(older.text === 'const next = 2;', 'analysis snapshot keeps matching source');
	assert(a.getAnalysis() === null, 'stale analysis not published');
	let published;
	const unsubscribeAnalysis = a.on('analysis', snapshot => {
		published = structuredClone(snapshot);
		snapshot.structures.length = 0;
	});
	const latest = await a.analyzeNow();
	unsubscribeAnalysis();
	assert(JSON.stringify(published) === JSON.stringify(latest), 'analysis event publishes the shared snapshot');
	latest.structures.length = 0;
	assert(a.getAnalysis().structures.some(range => range.kind === 'function'), 'analysis result detached from internal state');
	a.setSettings({ analysis: false, functionLineNumbers: true });
	assert(a.getAnalysis() === null && editorA.querySelector('.cm-lineNumbers .cm-gutterElement:not([style*="visibility: hidden"])')?.textContent === '1', 'analysis disabled restores ordinary line numbers');
	const once = await a.analyzeNow();
	assert(
		once.text === 'function newest() {}' && once.structures.some(range => range.kind === 'function') && a.getAnalysis() === null,
		'explicit analysis works without enabling automatic display',
	);
	a.setSettings({ readOnly: true, disabled: true });
	a.setSettings({ disabled: false });
	assert(a.getState().readOnly && !a.getState().disabled, 'disabled restores read-only');
	a.execute('undo');
	assert(a.getValue() === 'function newest() {}', 'read-only blocks editing commands');
	a.setSettings({ readOnly: false, analysis: true });
	a.setDefinitions([{ '!name': 'custom', customFunction: { '!type': 'fn(value: string)' } }]);
	a.loadDocument('customF');
	a.moveTo({ line: 0, ch: 7 });
	a.execute('complete');
	await wait(200);
	assert(document.querySelector('#a .cm-tooltip-autocomplete')?.textContent.includes('customFunction'), 'Tern completion uses additional definitions');
	assert(!document.querySelector('#b .cm-tooltip-autocomplete'), 'completion popup belongs to its editor');
	escape(editorA);
	a.loadDocument('customFunction(');
	a.moveTo({ line: 0, ch: 15 });
	await wait(200);
	const argHint = document.querySelector('.cm-tern-arguments');
	assert(argHint?.textContent.includes('value:') && argHint.textContent.includes('string'), 'Tern argument hints retain parameter types');
	a.loadDocument('const sampleNumber = 42;\nsampleN');
	a.moveTo({ line: 1, ch: 7 });
	a.execute('complete');
	await wait(200);
	assert(document.querySelector('#a .cm-tooltip-autocomplete li:has(.cm-tern-number)')?.textContent.includes('sampleNumber'), 'Tern infers number type for completion');
	escape(editorA);
	const id = a.highlightLine(0);
	assert(editorA.querySelector('.error-line'), 'external line highlighting');
	a.clearHighlight(id);
	assert(!editorA.querySelector('.error-line'), 'highlight clears');
	let selection;
	const offSelection = a.on('selection', event => { selection = event.ranges; });
	a.moveTo({ line: 0, ch: 3 }, { focus: false });
	assert(selection?.[0].head.line === 0 && selection[0].head.ch === 3, 'position navigation');
	offSelection();
	a.setSettings({ autoFormat: false });
	a.loadDocument('const x=1;');
	a.execute('format');
	assert(a.getValue().includes('x = 1'), 'manual format works while automatic format disabled');
	a.setSettings({ formatting: false });
	a.loadDocument('const x=1;');
	a.execute('format');
	assert(a.getValue() === 'const x=1;', 'formatting feature switch');
	a.setSettings({ formatting: true, autoFormat: true });
	a.loadDocument('const x=1;\n');
	a.moveTo({ line: 0, ch: 10 });
	assert(document.execCommand('insertText', false, ' '), 'native text insertion accepted');
	await waitFor(() => a.getValue().includes('; '), 'native input did not update document');
	a.moveTo({ line: 1, ch: 0 });
	assert(a.getValue().includes('x = 1'), 'automatic formatting on leaving edited line');
	const content = editorA.querySelector('.cm-content');
	content.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
	assert(editorA.classList.contains('ime'), 'composition activates the IME state');
	content.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
	assert(!editorA.classList.contains('ime'), 'composition end clears the IME state');
	document.querySelector('#a').style.height = '420px';
	await wait(100);
	assert(editorA.getBoundingClientRect().height === 420, 'container resize');
	a.destroy();
	a.destroy();
	for (const method of ['focus', 'blur', 'hasFocus', 'getLineCount']) {
		let rejected = false;
		try {
			a[method]();
		} catch (error) {
			rejected = error.message === 'Editor destroyed';
		}
		assert(rejected, method + ' rejects after destroy');
	}
	assert(document.querySelector('#a').childNodes.length === 0, 'destroy is idempotent and empties container');
	a = await createEditor(document.querySelector('#a'), { value: 'const recreated = true;' });
	assert(a.getValue().includes('recreated') && b.getValue().includes('two'), 'recreate without affecting sibling');
	assert(a.getSettings().language === 'en' && searchLabel(a, document.querySelector('#a')).includes('Find'), 'omitted UI language defaults to English');
	assert(a.getSettings().codeLanguage === 'javascript' && a.getAnalysis().complete, 'omitted code language retains JavaScript analysis');
	b.destroy();
	a.destroy();
	const NativeWorker = window.Worker;
	window.Worker = class {
		constructor() {
			setTimeout(() => this.onerror({ message: 'test worker failure' }), 0);
		}
		terminate() {}
	};
	try {
		let rejected = false;
		try {
			await createEditor(document.querySelector('#a'));
		} catch {
			rejected = true;
		}
		assert(rejected && document.querySelector('#a').childNodes.length === 0, 'initialization failure cleans up container');
	} finally {
		window.Worker = NativeWorker;
	}
	window.Worker = class { constructor() { throw new Error('Plain text must not create a worker'); } };
	try {
		a = await createEditor(document.querySelector('#a'), { codeLanguage: null, value: 'const broken = ;\nordinary text', functionLineNumbers: true });
		const plain = document.querySelector('#a');
		assert(a.getSettings().codeLanguage === null, 'explicit null selects plain text without a worker');
		await wait(600);
		assert([...plain.querySelectorAll('.cm-lineNumbers .cm-gutterElement:not([style*="visibility: hidden"])')].map(node => node.textContent).join(',') === '1,2' && !plain.querySelector('.cm-lint-marker'), 'plain text uses ordinary numbers without diagnostics');
		assert(a.getAnalysis() === null && await a.analyzeNow() === null, 'plain text has no analysis snapshot');
		a.loadDocument('(text)');
		a.moveTo({ line: 0, ch: 0 });
		assert(!plain.querySelector('.cm-matchingBracket'), 'plain text does not enable bracket matching');
		a.loadDocument('const broken = ;\nordinary text');
		a.focus();
		press(plain, 'a', mod);
		assert(
			plain.querySelector('.cm-editor').classList.contains('cm-has-selection') &&
				plain.querySelector('.cm-activeLine') && plain.querySelector('.cm-activeLineGutter') &&
				getComputedStyle(plain.querySelector('.cm-activeLine')).boxShadow === 'none',
			'plain-text selection hides the active-line frame while retaining standard active-line classes',
		);
		a.moveTo({ line: 0, ch: 0 });
		const original = a.getValue();
		for (const command of ['format', 'complete', 'toggleComment']) {
			a.execute(command);
		}
		a.setDefinitions([{ '!name': 'unused' }]);
		assert(a.getValue() === original && !document.querySelector('#a .cm-tooltip-autocomplete'), 'language-specific commands leave plain text unchanged');
		a.replaceRange('!', { line: 1, ch: 13 });
		a.execute('undo');
		assert(a.getValue() === original, 'plain text retains editing and undo');
		a.setSettings({ language: 'ja', analysis: true, completion: true, diagnostics: true });
		await wait(600);
		assert(searchLabel(a, plain).includes('検索') && a.getSettings().codeLanguage === null && !document.querySelector('#a .cm-lint-marker'), 'plain text locale switches independently without producing diagnostics');
		a.execute('find');
		assert(document.querySelector('#a .cm-search input'), 'plain text search remains available');
		let rejected = false;
		try {
			a.setSettings({ codeLanguage: 'javascript' });
		} catch {
			rejected = true;
		}
		assert(rejected && a.getSettings().codeLanguage === null, 'code language is selected at creation');
		a.destroy();
		for (const codeLanguage of ['python', false, 42]) {
			let invalid = false;
			try {
				await createEditor(document.querySelector('#a'), { codeLanguage });
			} catch (error) {
				invalid = error instanceof TypeError;
			}
			assert(invalid && !document.querySelector('#a').childNodes.length, 'unsupported code language rejected before mounting: ' + codeLanguage);
		}
	} finally {
		a?.destroy();
		window.Worker = NativeWorker;
	}
	const { runLanguageContractTests } = await import('./language-contract.js');
	await runLanguageContractTests(assert);
	const javaSource = '// 日本語 😀\nvoid main() {\n\tString message = "Hello";\n\tint count = 10;\n\tif (count > 0) {\n\t\tIO.println(count);\n\t}\n}\nvoid helper() {\n\tIO.println("helper");\n}';
	let javaEditor;
	try {
		javaEditor = await createEditor(document.querySelector('#b'), {
			codeLanguage       : 'java',
			value              : javaSource,
			analysisDelay      : 0,
			functionLineNumbers: true,
		});
		const javaRoot = document.querySelector('#b');
		const javaAnalysis = javaEditor.getAnalysis();
		assert(Object.keys(javaAnalysis).sort().join(',') === analysisKeys, 'public Java analysis uses the shared format');
		javaEditor.focus();
		press(javaRoot, 'a', mod);
		const javaSelection = javaEditor.getSelection();
		javaEditor.execute('format');
		javaEditor.execute('complete');
		assert(javaSelection === javaSource && javaEditor.getSelection() === javaSelection &&
			javaEditor.getValue() === javaSource, 'unavailable Java commands preserve the document and selection');
		const highlighted = (kind, text) => [...javaRoot.querySelectorAll('.cm-syntax-' + kind)]
			.find(node => node.textContent === text);
		assert(
			javaEditor.getSettings().codeLanguage === 'java' && javaAnalysis?.complete,
			'Java Tree-sitter worker analyzes Java 25 simple source files',
		);
		javaEditor.focus();
		press(javaRoot, 'a', mod);
		assert(
			javaRoot.querySelector('.cm-editor').classList.contains('cm-has-selection') &&
				javaRoot.querySelector('.cm-activeLine') && javaRoot.querySelector('.cm-activeLineGutter') &&
				getComputedStyle(javaRoot.querySelector('.cm-activeLine')).boxShadow === 'none',
			'Java selection hides the active-line frame while retaining standard active-line classes',
		);
		javaEditor.moveTo({ line: 0, ch: 0 });
		assert(
			!javaRoot.querySelector('.cm-editor').classList.contains('cm-has-selection') &&
				javaRoot.querySelector('.cm-activeLine') && javaRoot.querySelector('.cm-activeLineGutter'),
			'Java collapsed selection restores active-line and gutter highlighting',
		);
		assert(
			highlighted('keyword', 'void') && highlighted('function', 'main') &&
				highlighted('type', 'String') && highlighted('literal', '"Hello"') &&
				highlighted('variable', 'count'),
			'Java analysis results are passed to the syntax-highlighting extension',
		);
		assert(
			[...javaRoot.querySelectorAll('.cm-syntax-local-reference')].some(node =>
				node.textContent === 'count' && getComputedStyle(node).color === 'rgb(83, 122, 31)') &&
				javaRoot.querySelector('.cm-line:nth-child(4) .cm-syntax-definition')?.textContent === 'count',
			'Java variable declarations and local references use shared visual extensions',
		);
		const javaReference = () => [...javaRoot.querySelectorAll('.cm-syntax-variable-reference')]
			.find(node => node.textContent === 'count');
		const javaStyle = getComputedStyle(javaReference());
		assert(
			javaStyle.backgroundColor === jsReferenceAppearance.background &&
				javaStyle.boxShadow === jsReferenceAppearance.shadow &&
				javaStyle.borderRadius === jsReferenceAppearance.radius,
			'Java reference background, shadow and radius match JavaScript',
		);
		assert(
			!javaRoot.querySelector('.cm-line:nth-child(4) .cm-syntax-variable-reference'),
			'Java variable declarations are not decorated as references',
		);
		javaEditor.moveTo({ line: 4, ch: 0 }, { focus: false });
		assert(
			getComputedStyle(javaReference()).boxShadow === 'none' &&
				getComputedStyle(javaReference()).backgroundColor === 'rgba(0, 0, 0, 0)',
			'Java reference background and shadow are hidden on the active line',
		);
		const sectionMarkers = [...javaRoot.querySelectorAll('.cm-sectionNumbers .cm-function-number')]
			.map(element => element.textContent).join();
		const sectionOffsets = javaAnalysis.sections.map(section => section.from).join();
		assert(
			sectionOffsets === [javaSource.indexOf('void main'), javaSource.indexOf('void helper')].join() && sectionMarkers === '1,2',
			`Java methods drive per-function numbering: sections=${sectionOffsets}, markers=${sectionMarkers}`,
		);
		const countOffset = javaSource.indexOf('count');
		assert(
			countOffset >= 0 && javaAnalysis.syntax.some(token =>
				token.from === countOffset && token.to === countOffset + 'count'.length && token.kind === 'variable'),
			'Java syntax ranges map UTF-8 parser positions to UTF-16 editor offsets',
		);
		assert(
			!javaRoot.querySelector('.cm-lint-marker') && !javaRoot.querySelector('.cm-tooltip-autocomplete'),
			'Valid Java code has no diagnostics and Java does not open completion',
		);
		javaEditor.setSettings({ analysis: false });
		javaEditor.loadDocument('void main() {\n if (true) IO.println(1);\n int n = 1\n}');
		await waitFor(() => javaRoot.querySelector('.cm-lint-marker-error') &&
			javaRoot.querySelector('.cm-lint-marker-warning'), 'Java diagnostics render independently of structure analysis');
		assert(javaRoot.querySelector('.cm-lintRange-warning'), 'Java diagnostic underlines use the shared lint extension');
		javaRoot.querySelector('.cm-lint-marker-error').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
		await waitFor(() => javaRoot.querySelector('.cm-tooltip-lint li'), 'Java gutter hover opens the diagnostic tooltip');
		javaEditor.setSettings({ diagnostics: false });
		assert(!javaRoot.querySelector('.cm-lint-marker'), 'Disabling diagnostics clears Java gutter markers');
		javaEditor.setSettings({ analysis: true, diagnostics: true });
		const jsStyleSource = '//note\nfunction work(arg) {\n let item = 10;\n let flag = true; let notFlag = false;\n let empty = null;\n if (item > 0) { log(arg); }\n let str = "sample";\n}';
		const javaStyleSource = '//note\nvoid work(int arg) {\n int item = 10;\n boolean flag = true; boolean notFlag = false;\n Object empty = null;\n if (item > 0) { log(arg); }\n String str = "sample";\n}';
		a = await createEditor(document.querySelector('#a'), { value: jsStyleSource });
		javaEditor.loadDocument(javaStyleSource);
		await javaEditor.analyzeNow();
		const jsRoot = document.querySelector('#a');
		const syntaxToken = (root, kind, text) => [...root.querySelectorAll('.cm-syntax-' + kind)]
			.find(node => node.textContent === text);
		for (const operator of ['=', '>']) {
			const keywordStyle = getComputedStyle(syntaxToken(javaRoot, 'keyword', 'if'));
			const operatorStyle = getComputedStyle(syntaxToken(javaRoot, 'operator', operator));
			assert(
				operatorStyle.color === keywordStyle.color && operatorStyle.fontWeight === keywordStyle.fontWeight,
				`Java operator ${operator} matches keyword style`,
			);
		}
		for (const root of [jsRoot, javaRoot]) {
			const token = syntaxToken(root, 'function-definition', 'work');
			assert(token && getComputedStyle(token).color === 'rgb(17, 17, 0)' &&
				getComputedStyle(token).fontWeight === '700', 'function declaration uses bold editor text color');
			assert(!syntaxToken(root, 'function-definition', 'log'), 'function call is not styled as a declaration');
		}
		const javaCall = syntaxToken(javaRoot, 'function', 'log');
		assert(javaCall && getComputedStyle(javaCall).color === 'rgb(0, 83, 99)' &&
			getComputedStyle(javaCall).fontWeight === '400', 'Java method call keeps its original style');
		for (const [jsKind, javaKind, text] of [
			['comment', 'comment', '//note'],
			['keyword', 'keyword', 'if'],
			['keyword', 'operator', '='],
			['keyword', 'operator', '>'],
			['definition', 'definition', 'work'],
			['definition', 'definition', 'arg'],
			['definition', 'definition', 'item'],
			['literal', 'literal', '10'],
			['literal', 'literal', 'true'],
			['literal', 'literal', 'false'],
			['literal', 'literal', 'null'],
			['literal', 'literal', '"sample"'],
			['variable-reference', 'variable-reference', 'item'],
		]) {
			const jsToken = syntaxToken(jsRoot, jsKind, text);
			const javaToken = syntaxToken(javaRoot, javaKind, text);
			assert(jsToken && javaToken, `JavaScript and Java syntax tokens are present: ${text}`);
			const jsStyle = getComputedStyle(jsToken), style = getComputedStyle(javaToken);
			assert(
				jsStyle.fontWeight === (jsKind === 'variable-reference' ? '400' : '700') &&
					(jsStyle.textShadow !== 'none') === (jsKind === 'literal') &&
					jsStyle.boxShadow === 'none',
				`JavaScript retains expected syntax weight and shadows: ${text}`,
			);
			assert(
				style.fontWeight === jsStyle.fontWeight && style.textShadow === jsStyle.textShadow &&
					style.boxShadow === jsStyle.boxShadow,
				`Java syntax weight and shadows match JavaScript: ${text}`,
			);
		}
		for (const root of [jsRoot, javaRoot]) {
			root.style.setProperty('--opticm-syntax-literal-font-weight', '400');
			root.style.setProperty('--opticm-syntax-literal-text-shadow', 'rgb(1, 2, 3) 1px 2px 3px');
			const style = getComputedStyle(syntaxToken(root, 'literal', '10'));
			assert(
				style.fontWeight === '400' && style.textShadow.includes('rgb(1, 2, 3)'),
				'Literal weight and shadow accept CSS custom properties',
			);
			root.style.removeProperty('--opticm-syntax-literal-font-weight');
			root.style.removeProperty('--opticm-syntax-literal-text-shadow');
		}
		a.moveTo({ line: 2, ch: 0 }, { focus: false });
		javaEditor.moveTo({ line: 2, ch: 0 }, { focus: false });
		assert(
			getComputedStyle(syntaxToken(jsRoot, 'literal', '10')).textShadow === 'none' &&
				getComputedStyle(syntaxToken(javaRoot, 'literal', '10')).textShadow === 'none',
			'Both languages hide literal text shadow on the active line',
		);
		a.setSettings({ analysis: false });
		a.loadDocument('const options = { enabled: true, name: 1 };\nconst { enabled, name } = options;');
		const shorthandLine = () => jsRoot.querySelectorAll('.cm-content .cm-line')[1];
		const shorthandStyle = name => {
			const token = [...shorthandLine().querySelectorAll('.cm-syntax-property')].find(node => node.textContent === name);
			if (!token) return null;
			const style = getComputedStyle(token);
			return { color: style.color, fontWeight: style.fontWeight };
		};
		const beforeShorthand = ['enabled', 'name'].map(shorthandStyle);
		assert(
			beforeShorthand.every(style => style && style.fontWeight === '400'),
			'destructuring shorthand uses ordinary property styling before analysis',
		);
		a.setSettings({ analysis: true });
		await a.analyzeNow();
		assert(
			JSON.stringify(['enabled', 'name'].map(shorthandStyle)) === JSON.stringify(beforeShorthand) &&
				!shorthandLine().querySelector('.cm-syntax-definition'),
			'destructuring shorthand retains its property styling after analysis',
		);
		a.setSettings({ analysis: false });
		a.loadDocument('function run() {\n let local = 1;\n const object = { key: local, local };\n}');
		const objectLine = () => jsRoot.querySelectorAll('.cm-content .cm-line')[2];
		const objectToken = name => [...objectLine().querySelectorAll('span')]
			.filter(node => node.textContent === name && !node.children.length).at(-1);
		const isBoldBlack = node => node && getComputedStyle(node).fontWeight === '700' &&
			getComputedStyle(node).color === 'rgb(17, 17, 0)';
		assert(
			isBoldBlack(objectToken('key')) && isBoldBlack(objectToken('local')),
			'object property keys are bold black before worker analysis',
		);
		a.setSettings({ analysis: true });
		await a.analyzeNow();
		assert(
			isBoldBlack(objectToken('key')) && isBoldBlack(objectToken('local')),
			'object property keys remain bold black after worker analysis',
		);
		javaEditor.setSettings({ analysis: false });
		javaEditor.loadDocument('enum Kind { ONE, TWO }');
		const enumToken = () => [...javaRoot.querySelectorAll('.cm-content span')]
			.find(node => node.textContent === 'ONE' && !node.children.length);
		assert(isBoldBlack(enumToken()), 'enum constant is bold black before worker analysis');
		javaEditor.setSettings({ analysis: true });
		await javaEditor.analyzeNow();
		assert(isBoldBlack(enumToken()), 'enum constant remains bold black after worker analysis');
		javaEditor.setSettings({ analysis: false });
		javaEditor.loadDocument('class Example { void run(Object value) { if (value instanceof String text) use(text); } }');
		const patternDefinition = () => syntaxToken(javaRoot, 'definition', 'text');
		assert(isBoldBlack(patternDefinition()), 'instanceof pattern name is bold black before worker analysis');
		javaEditor.setSettings({ analysis: true });
		await javaEditor.analyzeNow();
		assert(isBoldBlack(patternDefinition()), 'instanceof pattern name remains bold black after worker analysis');
		for (const [editor, root, source, expectedColor] of [
			[a, jsRoot, 'function run() { let local = 1; return external + local; }', 'rgb(0, 83, 99)'],
			[javaEditor, javaRoot, 'class Example { void run() { int local = 1; use(external, local); } }', 'rgb(0, 83, 99)'],
		]) {
			editor.setSettings({ analysis: false });
			editor.loadDocument(source);
			const external = () => syntaxToken(root, 'variable', 'external');
			const localDefinition = () => syntaxToken(root, 'definition', 'local');
			assert(
				external() && getComputedStyle(external()).color === 'rgb(83, 122, 31)' &&
					localDefinition() && getComputedStyle(localDefinition()).color === 'rgb(17, 17, 0)',
				'pending ordinary variables are green without changing declarations',
			);
			editor.setSettings({ analysis: true });
			await editor.analyzeNow();
			assert(
				external() && getComputedStyle(external()).color === expectedColor &&
					getComputedStyle(localDefinition()).color === 'rgb(17, 17, 0)',
				'fresh analysis restores the ordinary variable color',
			);
		}
		for (const [editor, root, source] of [
			[a, jsRoot, 'function test() {\n const text = "}";\n // }\n if (true) {\n  const values = [text];\n  return text;\n }\n}'],
			[javaEditor, javaRoot, 'class Test {\n String text = "}";\n // }\n void run() {\n  String[] values;\n  use(text);\n }\n}'],
		]) {
			root.scrollIntoView({ block: 'center' });
			editor.setSettings({ analysis: false });
			const codeLanguage = editor.getSettings().codeLanguage;
			const checkDelimiter = async (input, expected, message) => {
				editor.loadDocument('');
				editor.focus();
				assert(document.execCommand('insertText', false, input), 'editor accepts delimiter input');
				await waitFor(() => editor.getValue() !== '', `${codeLanguage}: delimiter ${JSON.stringify(input)} did not reach editor state`);
				const actual = editor.getValue();
				assert(
					actual === expected,
					`${message}: ${codeLanguage} ${input}`,
					`. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
				);
			};
			for (const [input, expected] of [['(', '()'], ['[', '[]'], ["'", "''"], ['"', '""'], ['{', '{']]) {
				await checkDelimiter(input, expected, 'automatic delimiter insertion');
			}
			for (const [closeBrackets, closeBraces, input, expected] of [
				[true, true, '{', '{}'],
				[false, true, '{', '{'],
				[false, true, '(', '('],
				[false, false, '"', '"'],
				[true, false, '(', '()'],
			]) {
				editor.setSettings({ closeBrackets, closeBraces });
				await checkDelimiter(input, expected, `automatic closing with closeBrackets=${closeBrackets}, closeBraces=${closeBraces}`);
			}
			editor.loadDocument(source);
			editor.moveTo({ line: 0, ch: source.indexOf('{') });
			const lines = [...root.querySelectorAll('.cm-content .cm-line')];
			const matches = [...root.querySelectorAll('.cm-content .cm-matchingBracket')];
			assert(
				matches.length === 2 && matches[0].textContent === '{' && matches[1].textContent === '}' &&
					matches[0].closest('.cm-line') === lines[0] && matches[1].closest('.cm-line') === lines.at(-1),
				'bracket matching ignores braces in strings and comments even when analysis is disabled',
			);
			const overlay = root.querySelector('.cm-bracket-gutter-overlay');
			await waitFor(() => overlay.children.length === 1, 'bracket gutter overlay was not painted');
			const gutter = root.querySelector('.cm-gutters');
			const gutterBox = gutter.getBoundingClientRect();
			const overlayBox = overlay.getBoundingClientRect();
			const bracketBox = matches[1].getBoundingClientRect();
			const overlayMarkBox = overlay.firstElementChild.getBoundingClientRect();
			const hit = document.elementFromPoint(gutterBox.right - 2, bracketBox.top + bracketBox.height / 2);
			const hitTestable = bracketBox.top >= 0 && bracketBox.bottom <= innerHeight;
			assert(
				Math.abs(overlayBox.right - gutterBox.right) < 1 &&
					Math.abs(overlayBox.width - parseFloat(getComputedStyle(gutter, '::after').width)) < 1 &&
					Math.abs(overlayMarkBox.left - bracketBox.left) < 1 &&
					Math.abs(overlayMarkBox.top - bracketBox.top) < 1 &&
					getComputedStyle(overlay).pointerEvents === 'none' &&
					getComputedStyle(overlay.firstElementChild, '::before').borderRadius === '50%' &&
					(!hitTestable || hit?.closest('.cm-gutters') === gutter),
				'bracket circle overlaps only the gutter edge without intercepting gutter input',
			);
			const currentMark = getComputedStyle(matches[0], '::before');
			const otherMark = getComputedStyle(matches[1], '::before');
			assert(
				getComputedStyle(matches[0]).fontWeight === '700' &&
					getComputedStyle(matches[0]).backgroundColor === 'rgba(0, 0, 0, 0)' &&
					getComputedStyle(matches[1]).backgroundColor === 'rgba(0, 0, 0, 0)' &&
					currentMark.borderTopWidth === '0px' && currentMark.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
					otherMark.content !== 'none' && otherMark.borderTopWidth === '8px' && otherMark.borderRadius === '50%',
				'bracket matches use the CM5 active-line background and bold yellow circle',
			);
			const theme = root.querySelector('.opticm');
			const originalBorderColor = otherMark.borderTopColor;
			assert(
				getComputedStyle(overlay.firstElementChild, '::before').borderTopColor === originalBorderColor,
				'gutter overlay uses the same circle color',
			);
			theme.style.setProperty('--opticm-l-yellow', '#00ff00');
			assert(
				getComputedStyle(matches[1], '::before').borderTopColor !== originalBorderColor &&
					getComputedStyle(overlay.firstElementChild, '::before').borderTopColor ===
						getComputedStyle(matches[1], '::before').borderTopColor,
				'bracket circle uses the theme yellow color',
			);
			theme.style.removeProperty('--opticm-l-yellow');
			editor.loadDocument(source + '\n//' + 'x'.repeat(200));
			editor.moveTo({ line: 0, ch: source.indexOf('{') });
			await waitFor(() => overlay.children.length === 1, 'bracket gutter overlay did not update after editing');
			const scroller = root.querySelector('.cm-scroller');
			scroller.scrollLeft = 40;
			await waitFor(
				() => scroller.scrollLeft >= 40 && !overlay.children.length,
				'horizontally hidden bracket must not overlap the gutter',
			);
			editor.loadDocument(source);
			editor.moveTo({ line: 3, ch: source.split('\n')[3].indexOf('(') + 1 });
			assert(
				root.querySelectorAll('.cm-matchingBracket').length === 2,
				'parentheses also match while automatic analysis is disabled',
			);
			editor.moveTo({ line: 4, ch: source.split('\n')[4].indexOf('[') });
			assert(
				[...root.querySelectorAll('.cm-matchingBracket')].map(node => node.textContent).join('') === '[]',
				'square brackets match while automatic analysis is disabled',
			);
			editor.loadDocument('class Broken {');
			editor.focus();
			editor.moveTo({ line: 0, ch: 13 });
			const unmatched = root.querySelector('.cm-nonmatchingBracket');
			assert(
				unmatched && !root.querySelector('.cm-matchingBracket') &&
					getComputedStyle(unmatched).backgroundColor !== 'rgba(0, 0, 0, 0)',
				'unmatched brackets use the standard visible nonmatching style, not matching circles',
			);
			editor.loadDocument('[)');
			editor.moveTo({ line: 0, ch: 0 });
			assert(
				root.querySelector('.cm-nonmatchingBracket'),
				'mismatched bracket pairs are marked as nonmatching',
			);
			editor.setSettings({ analysis: true });
			editor.loadDocument(source.replace('// }', '// { }'));
			await editor.analyzeNow();
			editor.setSettings({ functionLineNumbers: true });
			editor.moveTo({ line: 0, ch: source.indexOf('{') });
			await waitFor(
				() => root.querySelector('.cm-sectionNumbers') && overlay.children.length === 1,
				'bracket gutter overlay must also work with per-function line numbers',
			);
			editor.moveTo({ line: 2, ch: 4 });
			assert(
				[...root.querySelectorAll('.cm-matchingBracket')].every(node =>
					getComputedStyle(node, '::before').content === 'none'),
				'brackets in comments do not receive yellow circles',
			);
			await waitFor(() => !overlay.children.length, 'comment brackets must not leave a gutter circle');
		}
		for (const [editor, root, source, editLine, retainedLine] of [
			[a, jsRoot, 'function one() {\n let a = 1;\n}\nfunction two() {\n let b = 2;\n}', 1, 3],
			[javaEditor, javaRoot, 'class Test {\n void one() {\n  int a = 1;\n }\n void two() {\n  int b = 2;\n }\n}', 2, 4],
		]) {
			editor.setSettings({ analysis: true, analysisDelay: 10000 });
			editor.loadDocument(source);
			await editor.analyzeNow();
			root.querySelector('.cm-scroller').scrollTop = 0;
			await wait(150);
			const alphaOnLine = lineNumber => {
				const canvas = root.querySelector('.code-structure-view');
				const line = root.querySelectorAll('.cm-content .cm-line')[lineNumber];
				if (!canvas?.width || !line) return 0;
				const scale = devicePixelRatio;
				const y = Math.max(0, Math.floor((line.getBoundingClientRect().top - canvas.getBoundingClientRect().top) * scale));
				const height = Math.min(canvas.height - y, Math.ceil(line.getBoundingClientRect().height * scale));
				if (height <= 0) return 0;
				const data = canvas.getContext('2d').getImageData(0, y, canvas.width, height).data;
				return data.reduce((sum, value, index) => sum + (index % 4 === 3 ? value : 0), 0);
			};
			await waitFor(() => alphaOnLine(retainedLine) > 0, 'unrelated structure was not initially painted');
			editor.replaceRange('0', { line: editLine, ch: source.split('\n')[editLine].indexOf('1') });
			await wait(150);
			assert(
				editor.getAnalysis() === null && alphaOnLine(retainedLine) > 0,
				'editing preserves unaffected structure until fresh analysis: ' + editor.getSettings().codeLanguage,
			);
			editor.loadDocument(source);
			await editor.analyzeNow();
			await wait(150);
			const headerLine = editor.getSettings().codeLanguage === 'java' ? 1 : 0;
			const beforeHeader = alphaOnLine(headerLine);
			const beforeFollowing = alphaOnLine(retainedLine);
			assert(beforeHeader > 0 && beforeFollowing > 0, 'structure is painted before entering a newline');
			editor.moveTo({ line: editLine, ch: source.split('\n')[editLine].length });
			press(root, 'Enter');
			await waitFor(
				() => editor.getValue().split('\n').length === source.split('\n').length + 1,
				'editor did not process newline input',
			);
			const headerFrames = [];
			for (let i = 0; i < 10; i++) {
				await new Promise(resolve => requestAnimationFrame(resolve));
				headerFrames.push(alphaOnLine(headerLine));
			}
			assert(
				editor.getAnalysis() === null && headerFrames.every(alpha => alpha >= beforeHeader * 0.9) &&
					alphaOnLine(retainedLine + 1) >= beforeFollowing * 0.9,
				'newline preserves enclosing and following structures: ' + editor.getSettings().codeLanguage,
			);
		}
		a.destroy();
		javaEditor.setSettings({ analysis: true, analysisDelay: 10000 });
		const javaEditingSource = 'class Example {\n void run(int arg) {\n  int count = 10;\n  if (count > 0) { use(arg, count); }\n  use(count);\n }\n}';
		javaEditor.loadDocument(javaEditingSource);
		await javaEditor.analyzeNow();
		const javaToken = (kind, text) => [...javaRoot.querySelectorAll('.cm-syntax-' + kind)]
			.find(node => node.textContent === text);
		const referenceColor = getComputedStyle(javaToken('local-reference', 'count')).color;
		javaEditor.moveTo({ line: 2, ch: '  int count = 10'.length });
		assert(document.execCommand('insertText', false, ' + 2'), 'Java accepts native text input');
		await waitFor(
			() => javaEditor.getValue().includes('10 + 2') && javaEditor.getAnalysis() === null,
			'Java did not process native text input',
		);
		assert(
			javaEditor.getAnalysis() === null && javaToken('keyword', 'class') &&
				javaToken('keyword', 'int') && javaToken('function', 'run') &&
				javaToken('local-reference', 'count') && javaToken('variable-reference', 'count') &&
				getComputedStyle(javaToken('local-reference', 'count')).color === referenceColor &&
				javaToken('operator', '+') && javaToken('literal', '2'),
			'Java retains existing syntax and local-reference colors and highlights typed tokens before analysis',
		);
		javaEditor.replaceRange('\n  boolean active = true;', { line: 2, ch: javaEditor.getValue().split('\n')[2].length });
		assert(
			javaToken('keyword', 'boolean') && javaToken('definition', 'active') &&
				javaToken('literal', 'true') && javaToken('local-reference', 'count'),
			'Java highlights newly inserted declarations while preserving shifted reference colors',
		);
		javaEditor.moveTo({ line: 4, ch: 2 });
		assert(
			document.execCommand('insertText', false, '/') && document.execCommand('insertText', false, '/'),
			'Java accepts line-comment input',
		);
		await waitFor(
			() => javaEditor.getValue().split('\n')[4].startsWith('  //if'),
			'Java did not process line-comment input',
		);
		const commentLine = javaRoot.querySelectorAll('.cm-content .cm-line')[4];
		assert(
			[...commentLine.querySelectorAll('.cm-syntax-comment')].map(node => node.textContent).join('') ===
				'//if (count > 0) { use(arg, count); }' &&
				!commentLine.querySelector('.cm-syntax-keyword, .cm-syntax-local-reference, .cm-syntax-variable-reference, .cm-syntax-literal') &&
				javaToken('keyword', 'boolean') &&
				javaRoot.querySelectorAll('.cm-content .cm-line')[5].querySelector('.cm-syntax-local-reference')?.textContent === 'count',
			'Java immediately recolors the whole new line comment without waiting for analysis',
		);
		javaEditor.replaceRange('', { line: 4, ch: 2 }, { line: 4, ch: 3 });
		assert(
			!commentLine.querySelector('.cm-syntax-comment') && javaToken('keyword', 'if') &&
				commentLine.querySelector('.cm-syntax-local-reference')?.textContent === 'count',
			'removing Java comment delimiters immediately restores code highlighting',
		);
		javaEditor.replaceRange('', { line: 4, ch: 2 }, { line: 4, ch: 3 });
		const edited = await javaEditor.analyzeNow();
		assert(
			edited.complete && javaToken('keyword', 'boolean') && javaToken('literal', 'true') &&
				javaToken('local-reference', 'count') &&
				getComputedStyle(javaToken('local-reference', 'count')).color === referenceColor,
			'fresh Java analysis replaces interim highlighting without changing established colors',
		);
		javaEditor.loadDocument('class Existing {\n void run() {\n  //if (true) { use(1); }\n }\n}');
		await javaEditor.analyzeNow();
		javaEditor.replaceRange('', { line: 2, ch: 2 }, { line: 2, ch: 4 });
		assert(
			!javaRoot.querySelector('.cm-syntax-comment') && javaToken('keyword', 'if') &&
				javaToken('literal', 'true') && javaToken('literal', '1'),
			'removing an analyzed Java comment immediately restores syntax coloring',
		);
		javaEditor.setSettings({ analysis: false });
		javaEditor.loadDocument('class Plain {\n int number = 42;\n boolean flag = false;\n Object value = null;\n}');
		assert(
			javaEditor.getAnalysis() === null && javaToken('keyword', 'class') &&
				javaToken('keyword', 'int') && javaToken('literal', '42') &&
				javaToken('literal', 'false') && javaToken('literal', 'null'),
			'Java syntax coloring remains available when automatic analysis is disabled',
		);
		javaEditor.setSettings({ analysis: true });
		javaEditor.loadDocument('class Broken {\n  int value = ;\n}');
		const broken = await javaEditor.analyzeNow();
		assert(
			broken && !broken.complete && javaRoot.querySelector('.cm-syntax-invalid') &&
				!javaRoot.querySelector('.cm-function-number'),
			'Java retains parser error ranges and clears stale method structure',
		);
		await waitFor(() => javaRoot.querySelector('.cm-lintRange-error') &&
			javaRoot.querySelector('.cm-lint-marker-error'), 'Java syntax errors use the diagnostic underline and gutter');
		assert(
			[...javaRoot.querySelectorAll('.cm-syntax-invalid')].every(node =>
				getComputedStyle(node).textDecorationLine === 'none'),
			'Java syntax highlighting does not draw a second underline',
		);
	} finally {
		javaEditor?.destroy();
	}
	for (const [codeLanguage, value] of [
		['javascript', 'function run() {\n\tconst count = 1;\n\treturn count;\n}'],
		['java', 'class Example {\n\tint run() {\n\t\tint count = 1;\n\t\treturn count;\n\t}\n}'],
	]) {
		const viewerHost = document.createElement('div');
		const editorHost = document.createElement('div');
		viewerHost.style.height = editorHost.style.height = '200px';
		document.body.append(viewerHost, editorHost);
		let viewer, editor;
		try {
			viewer = await createViewer(viewerHost, { codeLanguage, value, lineNumbers: 'function', lineNumberStart: 90 });
			editor = await createEditor(editorHost, { codeLanguage, value, functionLineNumbers: true, lineNumberStart: 90 });
			const tokenColors = host => [...host.querySelectorAll('.cm-syntax-keyword, .cm-syntax-local-reference')]
				.map(token => [token.textContent, getComputedStyle(token).color]);
			const viewerColors = tokenColors(viewerHost);
			assert(
				viewerColors.length && JSON.stringify(viewerColors) === JSON.stringify(tokenColors(editorHost)) &&
					viewerHost.querySelector('.code-structure-view') && viewerHost.querySelector('.cm-function-number'),
				`${codeLanguage}: viewer matches editor token colors and displays structure and function numbers`,
			);
			assert(
				[viewerHost, editorHost].every(host =>
					host.querySelector('.cm-sectionNumbers .cm-function-number')?.textContent === '1'),
				`${codeLanguage}: function numbers ignore the ordinary line-number start`,
			);
			const content = viewerHost.querySelector('.cm-content');
			content.focus();
			press(viewerHost, 'a', mod);
			assert(document.getSelection().toString() === value, `${codeLanguage}: viewer text can be selected for copying`);
			const copied = new DataTransfer();
			content.dispatchEvent(new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData: copied }));
			assert(copied.getData('text/plain') === value, `${codeLanguage}: viewer copies the selected source text`);
			const clipboard = new DataTransfer();
			clipboard.setData('text/plain', 'replacement');
			content.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: clipboard }));
			assert(!content.isContentEditable && !viewerHost.querySelector('.cm-cursorLayer, .cm-lint-marker, .cm-search') &&
				viewer.getValue() === value, `${codeLanguage}: viewer preserves source and has no editor-only UI`);
			await Promise.all([viewer.setValue(''), viewer.setValue(value.replaceAll('count', 'total'))]);
			assert(
				viewerHost.querySelector('.cm-syntax-local-reference')?.textContent === 'total',
				`${codeLanguage}: the latest viewer update wins`,
			);
			viewer.setSettings({ lineNumbers: 'off', rulers: false });
			viewer.refresh();
			assert(!viewerHost.querySelector('.cm-function-number, .cm-indent-rulers'), 'viewer display settings can be updated');
			const pending = viewer.setValue(value);
			viewer.destroy();
			await pending;
			assert(!viewerHost.childNodes.length, 'destroy removes the viewer during analysis');
		} finally {
			viewer?.destroy();
			editor?.destroy();
			viewerHost.remove();
			editorHost.remove();
		}
	}
	const excerptHost = document.createElement('div');
	const viewerHost = document.createElement('div');
	excerptHost.style.height = viewerHost.style.height = '200px';
	document.body.append(excerptHost, viewerHost);
	let excerptEditor, excerptViewer;
	try {
		const value = 'first\nsecond\nthird';
		excerptEditor = await createEditor(excerptHost, { codeLanguage: null, value, lineNumberStart: 98 });
		excerptViewer = await createViewer(viewerHost, { codeLanguage: null, value, lineNumberStart: 98 });
		const gutterNumbers = host => [...host.querySelectorAll('.cm-lineNumbers .cm-gutterElement:not(:first-child)')]
			.map(element => element.textContent).join(',');
		for (const [host, component] of [[excerptHost, excerptEditor], [viewerHost, excerptViewer]]) {
			assert(gutterNumbers(host) === '98,99,100', 'excerpt numbering starts at the configured value');
			component.setSettings({ lineNumbers: false });
			assert(!host.querySelector('.cm-lineNumbers'), 'the line-number gutter can be hidden');
			component.setSettings({ lineNumbers: true, lineNumberStart: 20 });
			assert(gutterNumbers(host) === '20,21,22', 'line numbers apply the latest settings');
			const highlighted = () => [...host.querySelectorAll('.cm-opticm-highlighted-line')].map(line => line.textContent).join(',');
			host.style.setProperty('--opticm-color-highlighted-line', 'rgb(10, 20, 30)');
			component.setHighlightedLines([2, 0, 2, 5]);
			assert(
				highlighted() === 'first,third' &&
					getComputedStyle(host.querySelector('.cm-opticm-highlighted-line')).backgroundColor === 'rgb(10, 20, 30)',
				'static highlights use unique document indices and the host color',
			);
			const replacement = 'one\ntwo\nthree\nfour\nfive\nsix';
			if (component === excerptEditor) {
				excerptEditor.replaceDocument(replacement);
			} else {
				await excerptViewer.setValue(replacement);
			}
			assert(highlighted() === 'one,three,six', 'static highlights are reapplied at the same indices after replacing source');
			component.setHighlightedLines([]);
			assert(highlighted() === '', 'an empty array clears static highlights');
		}
		excerptEditor.setHighlightedLines([0]);
		const marker = excerptEditor.highlightLine(0);
		assert(excerptHost.querySelector('.error-line.cm-opticm-highlighted-line'), 'error and static highlights coexist');
		excerptEditor.clearHighlight(marker);
		assert(
			excerptHost.querySelector('.cm-opticm-highlighted-line') && !excerptHost.querySelector('.error-line'),
			'clearing an error highlight preserves the static highlight',
		);
	} finally {
		excerptEditor?.destroy();
		excerptViewer?.destroy();
		excerptHost.remove();
		viewerHost.remove();
	}
	const jsHost = document.createElement('div');
	const javaHost = document.createElement('div');
	jsHost.className = javaHost.className = 'host';
	document.body.append(jsHost, javaHost);
	let jsViewer, javaViewer;
	try {
		const creations = await Promise.allSettled([
			createStandaloneViewer(jsHost, { value: 'function first() {\n  return 1;\n}', lineNumberStart: 21 })
				.then(viewer => { jsViewer = viewer; }),
			createStandaloneViewer(javaHost, { codeLanguage: 'java', value: 'class Example {\n  void run() {}\n}', lineNumbers: 'function' })
				.then(viewer => { javaViewer = viewer; }),
		]);
		for (const creation of creations) {
			if (creation.status === 'rejected') throw creation.reason;
		}
		jsViewer.setHighlightedLines([1]);
		assert(
			jsHost.querySelector('.cm-opticm-highlighted-line')?.textContent.trim() === 'return 1;' &&
				jsHost.querySelector('.cm-syntax-keyword')?.textContent === 'function' &&
				!javaHost.querySelector('.cm-opticm-highlighted-line') &&
				javaHost.querySelector('.cm-syntax-keyword')?.textContent === 'class' &&
				javaHost.querySelector('.cm-function-number'),
			'standalone JavaScript and Java viewers keep their display settings and analysis separate',
		);
		const pending = jsViewer.setValue('function next() {}');
		jsViewer.destroy();
		await Promise.all([pending, javaViewer.setValue('class Revised {\n  void updated() {}\n}')]);
		assert(
			!jsHost.childNodes.length && javaViewer.getValue().includes('Revised') &&
				javaHost.querySelector('.cm-function-number'),
			'destroying a viewer during analysis does not interrupt another viewer',
		);
	} finally {
		jsViewer?.destroy();
		javaViewer?.destroy();
		jsHost.remove();
		javaHost.remove();
	}
	await checkResourceCleanup();
	window.testResult = { passed: true, results };
} catch (error) {
	window.testResult = { passed: false, results, error: error.stack };
	try {
		a?.destroy();
		b?.destroy();
	} catch {
	
		}
}
document.querySelector('#results').textContent = JSON.stringify(window.testResult, null, 2);
