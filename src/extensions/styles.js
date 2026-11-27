/**
 * Install extension styles and manage shared CSS variable defaults.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

import { EditorView, ViewPlugin } from '@codemirror/view';
import variables from '../styles/variables.css';

function variablesStyle(view) {
	let style = [...view.dom.children].find(child => child.matches('style[data-opticm-variables]'));
	if (!style) {
		style = view.dom.ownerDocument.createElement('style');
		style.dataset.opticmVariables = '';
		style.dataset.opticmReferences = '0';
		style.nonce = view.state.facet(EditorView.cspNonce);
		style.textContent = variables;
		view.dom.append(style);
	}
	if (!view.dom.closest('.opticm')) view.dom.dataset.opticmExtensionDefaults = '';
	style.dataset.opticmReferences = String(Number(style.dataset.opticmReferences) + 1);
	return style;
}

function releaseVariablesStyle(view, style, standalone) {
	const references = Number(style.dataset.opticmReferences) - 1;
	if (references > 0) {
		style.dataset.opticmReferences = String(references);
	} else {
		style.remove();
		if (standalone) delete view.dom.dataset.opticmExtensionDefaults;
	}
}

export function extensionStyles(css) {
	return ViewPlugin.fromClass(class {
		constructor(view) {
			this.view = view;
			this.standalone = !view.dom.closest('.opticm');
			this.variables = variablesStyle(view);
			this.style = view.dom.ownerDocument.createElement('style');
			this.style.nonce = view.state.facet(EditorView.cspNonce);
			this.style.textContent = css;
			view.dom.append(this.style);
		}

		update(update) {
			if (update.startState.facet(EditorView.cspNonce) !== update.state.facet(EditorView.cspNonce)) {
				const nonce = update.state.facet(EditorView.cspNonce);
				this.variables.nonce = nonce;
				this.style.nonce = nonce;
			}
		}

		destroy() {
			this.style.remove();
			releaseVariablesStyle(this.view, this.variables, this.standalone);
		}
	});
}
