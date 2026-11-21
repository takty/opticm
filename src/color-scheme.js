import { Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { refreshStructure } from './extensions/structure-view/index.js';

const DARK_THEME = EditorView.theme({}, { dark: true });

export function validateColorScheme(value) {
	if (!['auto', 'light', 'dark'].includes(value)) {
		throw new TypeError('colorScheme must be auto, light, or dark');
	}
}

export function createColorScheme(root) {
	const theme = new Compartment();
	let preference;
	let view;
	let mode;

	function apply() {
		const scheme = (mode === 'auto' ? preference?.matches : mode === 'dark') ? 'dark' : 'light';
		if (root.dataset.opticmColorScheme === scheme) return;
		root.dataset.opticmColorScheme = scheme;
		view.dispatch({ effects: theme.reconfigure(scheme === 'dark' ? DARK_THEME : []) });
		refreshStructure(view);
	}

	function stopWatching() {
		preference?.removeEventListener('change', apply);
		preference = undefined;
	}

	return {
		extension: theme.of([]),
		set(editorView, nextMode) {
			if (mode === nextMode) return;
			view = editorView;
			mode = nextMode;
			stopWatching();
			if (mode === 'auto') {
				preference = root.ownerDocument.defaultView?.matchMedia?.('(prefers-color-scheme: dark)');
				preference?.addEventListener('change', apply);
			}
			apply();
		},
		destroy: stopWatching,
	};
}
