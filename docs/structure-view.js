// .build/extensions/structure-view/index.js
import { Facet, StateEffect, StateField, countColumn } from "@codemirror/state";
import { EditorView as EditorView2, ViewPlugin as ViewPlugin2 } from "@codemirror/view";
import { commonAnalysisState } from "opticm/analysis";

// .build/extensions/styles.js
import { EditorView, ViewPlugin } from "@codemirror/view";

// .build/styles/variables.css
var variables_default = `/**\r
 * CSS custom properties\r
 *\r
 * @author Takuto Yanagida\r
 * @version 2026-11-23\r
 */\r
\r
/* Standalone extensions inherit palette defaults and any overrides from their host page. */\r
:where(.opticm, :root:has(.cm-editor[data-opticm-extension-defaults]), :host) {\r
	--opticm-l-red        : oklch(75% 0.25 12);\r
	--opticm-l-orange     : oklch(75% 0.25 73);\r
	--opticm-l-yellow     : oklch(75% 0.25 99);\r
	--opticm-l-yellowgreen: oklch(75% 0.25 130);\r
	--opticm-l-green      : oklch(75% 0.25 155);\r
	--opticm-l-palegreen  : oklch(75% 0.25 166);\r
	--opticm-l-turquoise  : oklch(75% 0.15 217);\r
	--opticm-l-cyan       : oklch(75% 0.25 237);\r
	--opticm-l-blue       : oklch(70% 0.25 269);\r
	--opticm-l-purple     : oklch(70% 0.25 320);\r
	--opticm-l-brown      : oklch(70% 0.05 64);\r
\r
	--opticm-color-editor: #fff;\r
	--opticm-color-text  : #111;\r
	--opticm-color-window: #fff;\r
}\r
\r
:where(.opticm) {\r
	--opticm-font-ui     : "Lucida Grande", "Hiragino Sans", "Yu Gothic UI", "Meiryo UI", sans-serif;\r
	--opticm-font-console: 'Hiragino Sans', "Yu Gothic UI", "Meiryo UI", monospace;\r
	--opticm-font-size   : 14px;\r
\r
	--opticm-editor-post-edit-cursor: none;\r
}\r
\r
:where(.opticm .cm-editor, .cm-editor[data-opticm-extension-defaults]) {\r
	--opticm-default-selection-layer-blend-mode: multiply;\r
	--opticm-default-selection-background      : oklch(from var(--opticm-l-cyan) l c h / 0.1);\r
	--opticm-default-active-line-background    : oklch(from var(--opticm-color-editor) l c h / 0.65);\r
	--opticm-default-focused-line-background   : oklch(from var(--opticm-color-editor) l c h / 0.65);\r
	--opticm-default-focused-line-shadow       : 0 0 4px oklch(from var(--opticm-color-text) l c h / 0.15), 0 2px 4px oklch(from var(--opticm-color-text) l c h / 0.1);\r
	--opticm-default-error-line-background     : oklch(from var(--opticm-l-red) l c h / 0.2);\r
\r
	--opticm-default-cursor-color         : oklch(from var(--opticm-l-brown) l c h / 0.60);\r
	--opticm-default-cursor-bottom-color  : oklch(from var(--opticm-l-brown) l c h / 0.35);\r
	--opticm-default-ime-cursor-background: oklch(from var(--opticm-l-brown) l c h / 0.05);\r
\r
	--opticm-default-gutter-color                  : oklch(from var(--opticm-color-text) l c h / 0.65);\r
	--opticm-default-gutter-number-hover-background: oklch(from var(--opticm-l-cyan) l c h / 0.1);\r
\r
	--opticm-default-selection-match-border-color  : var(--opticm-l-cyan);\r
	--opticm-default-popup-shadow                  : 0 0 2px oklch(from var(--opticm-color-text) l c h / 0.15), 0 2px 4px oklch(from var(--opticm-color-text) l c h / 0.25);\r
\r
	--opticm-default-bracket-matching-background: transparent;\r
	--opticm-default-bracket-matching-color     : inherit;\r
	--opticm-default-bracket-matching-weight    : bold;\r
	--opticm-default-bracket-ring-radius        : 50%;\r
	--opticm-default-bracket-ring-width         : 0.5em;\r
	--opticm-default-bracket-active-radius      : 0.25em;\r
	--opticm-default-bracket-active-border      : none;\r
	--opticm-default-bracket-ring-color         : oklch(from var(--opticm-l-yellow) 90% c h / 0.65);\r
	--opticm-default-bracket-active-background  : oklch(from var(--opticm-l-yellow) 90% c h / 0.65);\r
\r
	--opticm-default-function-gutter-edge-width      : 0.5ch;\r
	--opticm-default-function-gutter-edge-color      : oklch(from var(--opticm-l-purple) 80% 0.1 h / 0.8);\r
	--opticm-default-function-gutter-edge-hover-color: oklch(from var(--opticm-l-purple) 80% 0.1 h / 0.95);\r
	--opticm-default-function-stripe-width           : 0.5ch;\r
	--opticm-default-function-stripe-color           : oklch(from var(--opticm-l-purple) 99% 0.1 h / 0.5);\r
	--opticm-default-function-gutter-edge-pattern    : repeating-linear-gradient(\r
		135deg, transparent, transparent var(--opticm-function-stripe-width, var(--opticm-default-function-stripe-width)),\r
		var(--opticm-function-stripe-color, var(--opticm-default-function-stripe-color)) var(--opticm-function-stripe-width, var(--opticm-default-function-stripe-width)),\r
		var(--opticm-function-stripe-color, var(--opticm-default-function-stripe-color)) calc(2 * var(--opticm-function-stripe-width, var(--opticm-default-function-stripe-width)))\r
	);\r
	--opticm-default-function-line-color          : inherit;\r
	--opticm-default-function-line-align          : right;\r
	--opticm-default-function-number-font-variant : tabular-nums;\r
	--opticm-default-function-number-color        : oklch(from var(--opticm-l-orange) 60% c h);\r
	--opticm-default-function-active-number-color : oklch(from var(--opticm-l-orange) 60% c h);\r
	--opticm-default-function-background          : oklch(from var(--opticm-color-editor) 98% c h);\r
	--opticm-default-function-alternate-background: oklch(from var(--opticm-color-text) l c h / 0.05);\r
\r
	--opticm-default-function-scroll-marker-radius: 50%;\r
	--opticm-default-function-scroll-marker-color : oklch(from var(--opticm-l-orange) l c h / 0.75);\r
\r
	--opticm-default-color-highlighted-line-start: oklch(from var(--opticm-l-yellow) l c h / 0.035);\r
	--opticm-default-color-highlighted-line-end  : oklch(from var(--opticm-l-yellow) l c h / 0.075);\r
\r
	--opticm-default-indent-ruler-width: 2px;\r
	--opticm-default-indent-ruler-style: dashed;\r
	--opticm-default-indent-ruler-color: oklch(from var(--opticm-l-red) l c h / 0.15);\r
\r
	--opticm-default-whitespace-background-position       : center bottom;\r
	--opticm-default-whitespace-space-background-size     : calc(100% - 2px) 2px;\r
	--opticm-default-whitespace-full-width-background-size: calc(100% - 2px) 4px;\r
	--opticm-default-whitespace-active-color              : oklch(from var(--opticm-l-red) l c h / 0.35);\r
	--opticm-default-whitespace-full-width-active-color   : oklch(from var(--opticm-l-red) l c h / 0.25);\r
	--opticm-default-whitespace-tab-color                 : oklch(from var(--opticm-l-red) l c h / 0.15);\r
	--opticm-default-whitespace-tab-weight                : bold;\r
	--opticm-default-whitespace-tab-shadow                : 1px 0px 1px var(--opticm-color-editor), 1px  1px 1px var(--opticm-color-editor), -1px  0px 1px var(--opticm-color-editor), -1px -1px 1px var(--opticm-color-editor),\r
															0px 1px 1px var(--opticm-color-editor), 1px -1px 1px var(--opticm-color-editor),  0px -1px 1px var(--opticm-color-editor), -1px  1px 1px var(--opticm-color-editor);\r
\r
	--opticm-default-syntax-comment-color : oklch(from var(--opticm-color-text) l c h / 0.5);\r
	--opticm-default-syntax-keyword-color : oklch(from var(--opticm-l-brown) 55% c h);\r
	--opticm-default-syntax-comment-weight: bold;\r
	--opticm-default-syntax-keyword-weight: bold;\r
\r
	--opticm-default-syntax-variable-color      : var(--opticm-color-text);\r
	--opticm-default-syntax-function-color      : var(--opticm-color-text);  /* Since Acorn cannot distinguish, it must be the same as the above.*/\r
	--opticm-default-syntax-type-color          : oklch(from var(--opticm-l-red) 60% c h);\r
	--opticm-default-syntax-property-color      : oklch(from var(--opticm-l-turquoise) 60% c h);\r
	--opticm-default-syntax-local-variable-color: oklch(from var(--opticm-l-yellowgreen) 60% c h);\r
\r
	--opticm-default-syntax-literal-color     : oklch(from var(--opticm-l-orange) 65% c h / 0.8);\r
	--opticm-default-syntax-literal-weight    : bold;\r
\r
	--opticm-default-syntax-definition-color          : oklch(from var(--opticm-color-text) l c h / 0.75);\r
	--opticm-default-syntax-function-definition-color : oklch(from var(--opticm-color-text) l c h / 0.75);\r
	--opticm-default-syntax-field-definition-color    : oklch(from var(--opticm-color-text) l c h / 0.75);\r
	--opticm-default-syntax-class-definition-color    : oklch(from var(--opticm-color-text) l c h / 0.75);\r
	--opticm-default-syntax-definition-weight         : bold;\r
	--opticm-default-syntax-function-definition-weight: bold;\r
	--opticm-default-syntax-field-definition-weight   : bold;\r
	--opticm-default-syntax-class-definition-weight   : bold;\r
\r
	--opticm-default-structure-class-fill      : oklch(from var(--opticm-l-red) l c h / 0.10);\r
	--opticm-default-structure-function-fill   : oklch(from var(--opticm-l-orange) l c h / 0.15);\r
	--opticm-default-structure-conditional-fill: oklch(from var(--opticm-l-green) l c h / 0.15);\r
	--opticm-default-structure-loop-fill       : oklch(from var(--opticm-l-cyan) l c h / 0.15);\r
	--opticm-default-structure-loop2-fill      : oklch(from var(--opticm-l-purple) l c h / 0.15);\r
	--opticm-default-structure-range-padding   : 3;\r
	--opticm-default-structure-spine-inset     : 4;\r
	--opticm-default-structure-fade-length     : 16;\r
\r
	--opticm-default-structure-token-height-scale: 1.9;\r
	--opticm-default-structure-token-radius-scale: 0.2;\r
\r
	--opticm-default-structure-reference-fill           : oklch(from var(--opticm-color-editor) l c h / 0.95);\r
	--opticm-default-structure-reference-stroke         : oklch(from var(--opticm-color-text) l c h / 0.2);\r
	--opticm-default-structure-reference-shadow-blur    : 4;\r
	--opticm-default-structure-reference-shadow-offset-y: 1;\r
\r
	--opticm-default-structure-declaration-var-fill        : oklch(from var(--opticm-color-text) 98% c h);\r
	--opticm-default-structure-declaration-var-stroke      : oklch(from var(--opticm-color-text) 80% c h);\r
	--opticm-default-structure-declaration-mutable-fill    : oklch(from var(--opticm-l-cyan)     99% 0.015 h);\r
	--opticm-default-structure-declaration-mutable-stroke  : oklch(from var(--opticm-l-cyan)     80% 0.25 h);\r
	--opticm-default-structure-declaration-immutable-fill  : oklch(from var(--opticm-l-blue)     99% 0.015 h);\r
	--opticm-default-structure-declaration-immutable-stroke: oklch(from var(--opticm-l-blue)     80% 0.25 h);\r
	--opticm-default-structure-declaration-padding-left    : 2;\r
	--opticm-default-structure-declaration-padding-right   : 1;\r
	--opticm-default-structure-declaration-border-width    : 0.5;\r
	--opticm-default-structure-declaration-side-width-scale: 0.25;\r
}\r
\r
:where(.opticm[data-opticm-color-scheme="light"]) {\r
	color-scheme: light;\r
}\r
\r
:where(.opticm[data-opticm-color-scheme="dark"]) {\r
	color-scheme: dark;\r
\r
	--opticm-l-red        : oklch(75% 0.15 12);\r
	--opticm-l-orange     : oklch(75% 0.15 73);\r
	--opticm-l-yellow     : oklch(75% 0.15 99);\r
	--opticm-l-yellowgreen: oklch(75% 0.15 130);\r
	--opticm-l-green      : oklch(75% 0.15 155);\r
	--opticm-l-palegreen  : oklch(75% 0.15 166);\r
	--opticm-l-turquoise  : oklch(75% 0.10 217);\r
	--opticm-l-cyan       : oklch(75% 0.15 237);\r
	--opticm-l-blue       : oklch(70% 0.15 269);\r
	--opticm-l-purple     : oklch(70% 0.15 320);\r
	--opticm-l-brown      : oklch(70% 0.05 64);\r
\r
	--opticm-color-editor: #111;\r
	--opticm-color-text  : #eee;\r
	--opticm-color-window: #111;\r
}\r
\r
:where(.opticm[data-opticm-color-scheme="dark"] > .cm-editor) {\r
	--opticm-default-selection-layer-blend-mode: normal;\r
	--opticm-default-selection-background      : oklch(from var(--opticm-l-cyan) l c h / 0.35);\r
	--opticm-default-active-line-background    : oklch(from var(--opticm-color-editor) l c h / 0.65);\r
	--opticm-default-focused-line-background   : oklch(from var(--opticm-color-editor) l c h / 0.65);\r
	--opticm-default-focused-line-shadow       : none;\r
	--opticm-default-error-line-background     : oklch(from var(--opticm-l-red) l c h / 0.2);\r
\r
	--opticm-default-gutter-color                  : oklch(from var(--opticm-color-text) l c h / 0.65);\r
	--opticm-default-gutter-number-hover-background: oklch(from var(--opticm-l-cyan) l c h / 0.2);\r
\r
	--opticm-default-bracket-ring-color         : oklch(from var(--opticm-l-yellow) 90% c h / 0.45);\r
	--opticm-default-bracket-active-background  : oklch(from var(--opticm-l-yellow) 90% c h / 0.45);\r
\r
	--opticm-default-function-number-color        : oklch(from var(--opticm-l-orange) 95% c h);\r
	--opticm-default-function-active-number-color : oklch(from var(--opticm-l-orange) 95% c h);\r
	--opticm-default-function-background          : oklch(from var(--opticm-color-editor) 15% c h);\r
	--opticm-default-function-alternate-background: oklch(from var(--opticm-color-text) l c h / 0.15);\r
\r
	--opticm-default-color-highlighted-line-start: oklch(from var(--opticm-l-yellow) l c h / 0.07);\r
	--opticm-default-color-highlighted-line-end  : oklch(from var(--opticm-l-yellow) l c h / 0.15);\r
\r
	--opticm-default-indent-ruler-color: oklch(from var(--opticm-l-red) l c h / 0.15);\r
\r
	--opticm-default-whitespace-active-color           : oklch(from var(--opticm-l-red) 90% c h / 0.35);\r
	--opticm-default-whitespace-full-width-active-color: oklch(from var(--opticm-l-red) 90% c h / 0.25);\r
	--opticm-default-whitespace-tab-color              : oklch(from var(--opticm-l-red) 90% c h / 0.15);\r
	--opticm-default-whitespace-tab-shadow             : none;\r
\r
	--opticm-default-syntax-comment-color: oklch(from var(--opticm-color-text) l c h / 0.5);\r
	--opticm-default-syntax-keyword-color: oklch(from var(--opticm-l-brown) 70% c h);\r
\r
	--opticm-default-syntax-variable-color      : var(--opticm-color-text);\r
	--opticm-default-syntax-function-color      : var(--opticm-color-text);  /* Since Acorn cannot distinguish, it must be the same as the above.*/\r
	--opticm-default-syntax-type-color          : oklch(from var(--opticm-l-red) 80% c h);\r
	--opticm-default-syntax-property-color      : oklch(from var(--opticm-l-turquoise) 80% c h);\r
	--opticm-default-syntax-local-variable-color: oklch(from var(--opticm-l-yellowgreen) 80% c h);\r
\r
	--opticm-default-syntax-literal-color: oklch(from var(--opticm-l-orange) l c h / 0.9);\r
\r
	--opticm-default-syntax-definition-color          : oklch(from var(--opticm-color-text) l c h / 0.85);\r
	--opticm-default-syntax-function-definition-color : oklch(from var(--opticm-color-text) l c h / 0.85);\r
	--opticm-default-syntax-field-definition-color    : oklch(from var(--opticm-color-text) l c h / 0.85);\r
	--opticm-default-syntax-class-definition-color    : oklch(from var(--opticm-color-text) l c h / 0.85);\r
\r
	--opticm-default-structure-class-fill      : oklch(from var(--opticm-l-red) l c h / 0.20);\r
	--opticm-default-structure-function-fill   : oklch(from var(--opticm-l-orange) l c h / 0.25);\r
	--opticm-default-structure-conditional-fill: oklch(from var(--opticm-l-green) l c h / 0.25);\r
	--opticm-default-structure-loop-fill       : oklch(from var(--opticm-l-cyan) l c h / 0.25);\r
	--opticm-default-structure-loop2-fill      : oklch(from var(--opticm-l-purple) l c h / 0.25);\r
\r
	--opticm-default-structure-reference-fill           : oklch(from var(--opticm-color-editor) l c h / 0.95);\r
	--opticm-default-structure-reference-stroke         : oklch(from var(--opticm-color-text) l c h / 0.5);\r
	--opticm-default-structure-reference-shadow-offset-y: 0;\r
\r
	--opticm-default-structure-declaration-var-fill        : oklch(from var(--opticm-color-text) 45% c h);\r
	--opticm-default-structure-declaration-var-stroke      : oklch(from var(--opticm-color-text) 60% c h);\r
	--opticm-default-structure-declaration-mutable-fill    : oklch(from var(--opticm-l-cyan) 40% 0.025 h);\r
	--opticm-default-structure-declaration-mutable-stroke  : oklch(from var(--opticm-l-cyan) 60% 0.25 h);\r
	--opticm-default-structure-declaration-immutable-fill  : oklch(from var(--opticm-l-blue) 40% 0.025 h);\r
	--opticm-default-structure-declaration-immutable-stroke: oklch(from var(--opticm-l-blue) 60% 0.25 h);\r
}\r
`;

// .build/extensions/styles.js
function variablesStyle(view) {
  let style = [...view.dom.children].find((child) => child.matches("style[data-opticm-variables]"));
  if (!style) {
    style = view.dom.ownerDocument.createElement("style");
    style.dataset.opticmVariables = "";
    style.dataset.opticmReferences = "0";
    style.nonce = view.state.facet(EditorView.cspNonce);
    style.textContent = variables_default;
    view.dom.append(style);
  }
  if (!view.dom.closest(".opticm")) view.dom.dataset.opticmExtensionDefaults = "";
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
function extensionStyles(css) {
  return ViewPlugin.fromClass(class {
    constructor(view) {
      this.view = view;
      this.standalone = !view.dom.closest(".opticm");
      this.variables = variablesStyle(view);
      this.style = view.dom.ownerDocument.createElement("style");
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

// .build/extensions/structure-view/style.css
var style_default = ".cm-editor.cm-structure-view {\r\n	.cm-scroller {\r\n		z-index: auto;\r\n	}\r\n\r\n	.cm-content {\r\n		z-index: 1;\r\n	}\r\n\r\n	.cm-structure-overlay {\r\n		position: absolute;\r\n		z-index : 0;\r\n		overflow: hidden;\r\n\r\n		pointer-events: none;\r\n	}\r\n\r\n	.code-structure-view {\r\n		display: block;\r\n		width  : 100%;\r\n		height : 100%;\r\n	}\r\n}\r\n";

// .build/extensions/structure-view/index.js
var setStructure = StateEffect.define();
var retainOnEditFacet = Facet.define({ combine: (values) => values.some(Boolean) });
var displayOptions = Facet.define({ combine: (values) => values.at(-1) ?? { structures: true, declarations: true, references: true } });
var retainStructureOnEdit = retainOnEditFacet.of(true);
function structureViewOptions(options) {
  if (!options || typeof options.structures !== "boolean" || typeof options.declarations !== "boolean" || typeof options.references !== "boolean") {
    throw new TypeError("Structure view options must specify structures, declarations and references");
  }
  return displayOptions.of(options);
}
function mapUnchangedStructure(items, transaction) {
  const oldDoc = transaction.startState.doc, newDoc = transaction.newDoc;
  const affected = [];
  let unsafeFrom = Infinity;
  transaction.changes.iterChanges((from, to, newFrom, newTo) => {
    const first = oldDoc.lineAt(from).number - 1, last = oldDoc.lineAt(to).number - 1;
    const removed = oldDoc.sliceString(from, to), inserted = newDoc.sliceString(newFrom, newTo);
    const changed = removed + inserted;
    const oldContext = oldDoc.sliceString(Math.max(0, from - 1), Math.min(oldDoc.length, to + 1));
    const newContext = newDoc.sliceString(Math.max(0, newFrom - 1), Math.min(newDoc.length, newTo + 1));
    const line = oldDoc.lineAt(from);
    const prefix = line.text.slice(0, from - line.from), suffix = line.text.slice(from - line.from);
    const newlineInsertion = from === to && /^[ \t\n]*\n[ \t\n]*$/.test(inserted) && !(/\/\/|\b(?:return|throw|break|continue|yield)\s*$/.test(prefix) && suffix.trim()) && !(/[\w$]$/.test(prefix) && /^[\w$]/.test(suffix));
    const indentation = transaction.isUserEvent("format") && /^[ \t]*$/.test(changed) && /^[ \t]*$/.test(line.text.slice(0, to - line.from));
    const layoutOnly = newlineInsertion || indentation;
    affected.push({ first, last, from, to, layoutOnly });
    if (!layoutOnly && /[()[\]{}/*'"`\\\n;:,?]/.test(changed) || /\/\/|\/\*|\*\//.test(oldContext + "\n" + newContext)) {
      unsafeFrom = Math.min(unsafeFrom, first);
    }
    if (!layoutOnly && /\b(?:else|catch|finally|while)\b/.test(line.text + "\n" + newDoc.lineAt(newFrom).text)) {
      let preceding = first;
      while (preceding > 0 && !oldDoc.line(preceding).text.trim()) {
        preceding--;
      }
      unsafeFrom = Math.min(unsafeFrom, Math.max(0, preceding - 1));
    }
  });
  const offset = (position) => {
    const line = oldDoc.line(Math.max(1, Math.min(oldDoc.lines, position.line + 1)));
    return line.from + Math.max(0, Math.min(line.length, position.ch ?? 0));
  };
  const mapPosition = (position, assoc) => {
    const mapped = transaction.changes.mapPos(offset(position), assoc);
    const line = newDoc.lineAt(mapped);
    return { line: line.number - 1, ch: mapped - line.from };
  };
  return items.filter((item) => item.to.line < unsafeFrom && !affected.some(({ first, last, from, to, layoutOnly }) => {
    if (!layoutOnly) {
      return item.from.line <= last && item.to.line >= first;
    }
    if (item.kind !== "token") {
      return false;
    }
    const start = offset(item.from);
    const end = offset(item.to);
    return from < end && to > start || from === to && from > start && from < end;
  })).map((item) => ({
    ...item,
    from: mapPosition(item.from, 1),
    to: mapPosition(item.to, -1),
    ...item.kind === "range" ? { branches: item.branches.map((branch) => mapPosition(branch, 1)) } : {}
  }));
}
var structureField = StateField.define({
  create: () => [],
  update(value, transaction) {
    if (transaction.isUserEvent("load")) {
      value = [];
    } else if (transaction.docChanged) {
      value = transaction.state.facet(retainOnEditFacet) ? mapUnchangedStructure(value, transaction) : [];
    }
    for (const effect of transaction.effects) {
      if (effect.is(setStructure)) {
        value = effect.value;
      }
    }
    return value;
  }
});
var structurePlugin = ViewPlugin2.fromClass(class {
  constructor(view) {
    this.view = view;
    const document = view.dom.ownerDocument;
    this.overlay = document.createElement("div");
    this.overlay.className = "cm-structure-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    this.canvas = document.createElement("canvas");
    this.canvas.className = "code-structure-view";
    this.overlay.append(this.canvas);
    view.dom.append(this.overlay);
    this.measure = {
      key: this,
      read: (view2) => this.read(view2),
      write: (data) => this.write(data)
    };
    this.onScroll = () => this.refresh();
    view.scrollDOM.addEventListener("scroll", this.onScroll, { passive: true });
    this.refresh();
  }
  update(update) {
    const before = update.startState.field(commonAnalysisState, false);
    const after = update.state.field(commonAnalysisState, false);
    const options = update.state.facet(displayOptions);
    if (update.docChanged || update.geometryChanged || update.viewportChanged || Boolean(before) !== Boolean(after) || options.structures && before?.structures !== after?.structures || options.declarations && before?.declarations !== after?.declarations || options.references && before?.references !== after?.references || !after && update.startState.field(structureField) !== update.state.field(structureField) || update.startState.facet(displayOptions) !== options) {
      this.refresh();
    }
  }
  refresh() {
    this.view.requestMeasure(this.measure);
  }
  read(view) {
    const root = view.dom.getBoundingClientRect();
    const scroller = view.scrollDOM;
    const frame = scroller.getBoundingClientRect();
    const content = view.contentDOM.getBoundingClientRect();
    const window = view.dom.ownerDocument.defaultView;
    const styles = window.getComputedStyle(view.dom);
    const resolveColor = (value) => {
      const match = /^var\(\s*(--[\w-]+)\s*,\s*(.+)\)$/.exec(value);
      return match ? styles.getPropertyValue(match[1]).trim() || match[2] : value;
    };
    const readValue = (name) => styles.getPropertyValue(name).trim() || styles.getPropertyValue(name.replace("--opticm-", "--opticm-default-")).trim();
    const readNumber = (name) => {
      const value = readValue(name);
      const number = Number(value);
      if (!value || !Number.isFinite(number)) {
        throw new TypeError(`CSS custom property ${name} must be a finite number`);
      }
      return number;
    };
    const appearance = {
      color: (name) => resolveColor(readValue(name)),
      number: readNumber
    };
    const drawStyle = {
      rangePadding: appearance.number("--opticm-structure-range-padding"),
      spineInset: appearance.number("--opticm-structure-spine-inset"),
      fadeLength: appearance.number("--opticm-structure-fade-length"),
      referenceShadowBlur: appearance.number("--opticm-structure-reference-shadow-blur"),
      referenceShadowOffsetY: appearance.number("--opticm-structure-reference-shadow-offset-y"),
      tokenHeightScale: appearance.number("--opticm-structure-token-height-scale"),
      tokenRadiusScale: appearance.number("--opticm-structure-token-radius-scale"),
      declarationInset: appearance.number("--opticm-structure-declaration-padding-left"),
      declarationWidthPadding: appearance.number("--opticm-structure-declaration-padding-right"),
      declarationBorderWidth: appearance.number("--opticm-structure-declaration-border-width"),
      declarationSideRuleWidthScale: appearance.number("--opticm-structure-declaration-side-width-scale")
    };
    const line = view.contentDOM.querySelector(".cm-line");
    const lineStart = line ? line.getBoundingClientRect().left + parseFloat(window.getComputedStyle(line).paddingLeft) : content.left;
    const left = Math.max(frame.left, content.left);
    const width = Math.max(0, frame.left + scroller.clientWidth - left);
    const height = scroller.clientHeight;
    const { doc, tabSize } = view.state;
    const coords = (pos, side = 1) => {
      const line2 = doc.line(Math.max(1, Math.min(doc.lines, pos.line + 1)));
      const offset = line2.from + Math.max(0, Math.min(line2.length, pos.ch ?? 0));
      const measured = view.coordsAtPos(offset, side);
      const block = view.lineBlockAt(offset);
      const lineTop = view.documentTop + block.top - frame.top;
      if (measured) {
        const glyphTop = (measured.top + measured.bottom - view.defaultLineHeight) / 2 - frame.top;
        const row = Math.max(0, Math.round((glyphTop - lineTop) / view.defaultLineHeight));
        return {
          x: measured.left - left,
          y: lineTop + row * view.defaultLineHeight
        };
      }
      const columns = countColumn(doc.sliceString(block.from, offset), tabSize);
      return {
        x: lineStart - left + columns * view.defaultCharacterWidth,
        y: lineTop
      };
    };
    const analysis = view.state.field(commonAnalysisState, false);
    const options = view.state.facet(displayOptions);
    const source = analysis ? commonDecorations(analysis, doc, options, appearance) : view.state.field(structureField);
    const decorations = source.map((item) => {
      const start = coords(item.from);
      const end = coords(item.to, -1);
      const fill2 = resolveColor(item.fill);
      if (item.kind === "token") {
        return { ...item, fill: fill2, stroke: resolveColor(item.stroke), start, end };
      }
      return {
        ...item,
        fill: fill2,
        start,
        end,
        spine: coords({ ...item.from, ch: item.from.ch + item.spineChars + 1 }, -1).x - start.x - item.spineChars,
        branchWidth: coords({ ...item.from, ch: item.from.ch + item.branchChars + 1 }, -1).x - start.x - item.branchChars,
        branchRows: item.branches.map((branch) => coords(branch).y)
      };
    });
    return {
      left: left - root.left,
      top: frame.top - root.top,
      width,
      height,
      charWidth: view.defaultCharacterWidth,
      lineHeight: view.defaultLineHeight,
      drawStyle,
      decorations
    };
  }
  write(data) {
    Object.assign(
      this.overlay.style,
      {
        left: data.left + "px",
        top: data.top + "px",
        width: data.width + "px",
        height: data.height + "px"
      }
    );
    const scale = this.canvas.ownerDocument.defaultView.devicePixelRatio;
    const { width, height, charWidth, lineHeight, drawStyle, decorations } = data;
    const drawing = JSON.stringify([
      scale,
      width,
      height,
      charWidth,
      lineHeight,
      drawStyle,
      decorations.map((item) => item.kind === "range" ? [
        item.kind,
        item.fill,
        item.opacity,
        item.start,
        item.end.y,
        item.spine,
        item.from.line === item.to.line,
        item.branchWidth,
        item.branchRows
      ] : [
        item.kind,
        item.appearance,
        item.fill,
        item.stroke,
        item.start,
        item.end
      ])
    ]);
    if (drawing === this.lastDrawing) return;
    drawStructure(this.canvas, data, scale);
    this.lastDrawing = drawing;
  }
  destroy() {
    this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
    this.overlay.remove();
  }
});
var structureView = [
  structureField,
  structurePlugin,
  EditorView2.editorAttributes.of({ class: "cm-structure-view" }),
  extensionStyles(style_default)
];
function commonDecorations(analysis, doc, options, appearance) {
  const colors = {
    class: appearance.color("--opticm-structure-class-fill"),
    function: appearance.color("--opticm-structure-function-fill"),
    conditional: appearance.color("--opticm-structure-conditional-fill"),
    loop: appearance.color("--opticm-structure-loop-fill"),
    loop2: appearance.color("--opticm-structure-loop2-fill")
  };
  const position = (offset) => {
    const line = doc.lineAt(offset);
    return { line: line.number - 1, ch: offset - line.from };
  };
  const decorations = [];
  if (options.structures) {
    for (const it of analysis.structures) {
      decorations.push({
        kind: "range",
        from: position(it.from),
        to: position(it.to),
        fill: colors[it.kind],
        spineChars: 3,
        branchChars: 4,
        branches: it.branches.map(position)
      });
    }
  }
  if (options.declarations) {
    for (const it of analysis.declarations) {
      const colors2 = it.scope === "function" ? [
        appearance.color("--opticm-structure-declaration-var-fill"),
        appearance.color("--opticm-structure-declaration-var-stroke")
      ] : it.mutability === "immutable" ? [
        appearance.color("--opticm-structure-declaration-immutable-fill"),
        appearance.color("--opticm-structure-declaration-immutable-stroke")
      ] : [
        appearance.color("--opticm-structure-declaration-mutable-fill"),
        appearance.color("--opticm-structure-declaration-mutable-stroke")
      ];
      decorations.push({
        kind: "token",
        appearance: "declaration",
        from: position(it.from),
        to: position(it.to),
        fill: colors2[0],
        stroke: colors2[1]
      });
    }
  }
  if (options.references) {
    for (const it of analysis.references) {
      if (it.role !== "reference") continue;
      decorations.push({
        kind: "token",
        appearance: "reference",
        from: position(it.from),
        to: position(it.to),
        fill: appearance.color("--opticm-structure-reference-fill"),
        stroke: appearance.color("--opticm-structure-reference-stroke")
      });
    }
  }
  return decorations;
}
function refreshStructure(view) {
  view.plugin(structurePlugin)?.refresh();
}
function drawStructure(canvas, { width, height, charWidth, lineHeight, drawStyle, decorations }, scale) {
  const pixelsWide = Math.round(width * scale), pixelsHigh = Math.round(height * scale);
  if (canvas.width !== pixelsWide) canvas.width = pixelsWide;
  if (canvas.height !== pixelsHigh) canvas.height = pixelsHigh;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, width, height);
  if (!width || !height) return;
  const padding = Math.min(drawStyle.rangePadding, lineHeight / 4);
  const band = lineHeight - padding * 2;
  let colorContext;
  const transparentColor = (color) => {
    if (!colorContext) {
      const colorCanvas = canvas.ownerDocument.createElement("canvas");
      colorCanvas.width = colorCanvas.height = 1;
      colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
    }
    colorContext.clearRect(0, 0, 1, 1);
    colorContext.fillStyle = color;
    colorContext.fillRect(0, 0, 1, 1);
    const [red, green, blue] = colorContext.getImageData(0, 0, 1, 1).data;
    return `rgba(${red}, ${green}, ${blue}, 0)`;
  };
  for (const it of decorations) {
    const { start, end } = it;
    ctx.fillStyle = it.fill;
    if (it.kind === "range") {
      const left = start.x + drawStyle.spineInset;
      const spine = Math.max(1, it.spine - drawStyle.spineInset);
      const top = start.y + padding;
      const bottom = end.y + padding;
      fill(ctx, left, top, spine, bottom - top + band, [band / 2, 0, 0, band / 2]);
      const capWidth = Math.max(0, charWidth * drawStyle.fadeLength - spine);
      const fadeColor = transparentColor(it.fill);
      const fillHorizontal = (x, y, width2, radii) => {
        if (width2 <= 0) return;
        const gradient = ctx.createLinearGradient(x, y, x + width2, y);
        gradient.addColorStop(0, it.fill);
        gradient.addColorStop(1, fadeColor);
        ctx.fillStyle = gradient;
        fill(ctx, x, y, width2, band, radii);
        ctx.fillStyle = it.fill;
      };
      fillHorizontal(left + spine, top, capWidth, [0, 0, 0, 0]);
      if (it.from.line !== it.to.line) {
        fillHorizontal(left + spine, bottom, capWidth, [0, 0, 0, 0]);
      }
      for (const row of it.branchRows) {
        fillHorizontal(
          left + spine,
          row + padding,
          Math.max(1, it.branchWidth - drawStyle.spineInset),
          [0, band / 2, band / 2, 0]
        );
      }
    } else if (it.appearance === "reference") {
      const x = start.x, h = charWidth * drawStyle.tokenHeightScale;
      const y = start.y + (lineHeight - h) / 2;
      ctx.save();
      ctx.shadowColor = it.stroke;
      ctx.shadowBlur = drawStyle.referenceShadowBlur;
      ctx.shadowOffsetY = drawStyle.referenceShadowOffsetY;
      fill(ctx, x, y, end.x - x, h, [0, lineHeight * drawStyle.tokenRadiusScale, lineHeight * drawStyle.tokenRadiusScale, 0]);
      ctx.restore();
    } else if (it.appearance === "declaration") {
      const x = start.x - drawStyle.declarationInset;
      const tokenHeight = charWidth * drawStyle.tokenHeightScale;
      const y = start.y + (lineHeight - tokenHeight) / 2;
      const h = end.y - start.y + tokenHeight;
      const radius = lineHeight * drawStyle.tokenRadiusScale;
      if (fill(ctx, x, y, end.x - x + drawStyle.declarationWidthPadding, h, [0, radius, radius, 0])) {
        ctx.strokeStyle = it.stroke;
        ctx.lineWidth = drawStyle.declarationBorderWidth;
        ctx.stroke();
        ctx.lineWidth = charWidth * drawStyle.declarationSideRuleWidthScale;
        ctx.beginPath();
        ctx.moveTo(x - ctx.lineWidth / 2, y - 0.5);
        ctx.lineTo(x - ctx.lineWidth / 2, y + h + 0.5);
        ctx.stroke();
      }
    }
  }
}
function fill(ctx, x, y, width, height, radii) {
  if (width <= 0 || height <= 0) return false;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radii);
  ctx.fill();
  return true;
}
export {
  refreshStructure,
  retainStructureOnEdit,
  setStructure,
  structureView,
  structureViewOptions
};
