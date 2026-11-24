// .build/extensions/function-line-numbers/index.js
import { StateEffect, StateField } from "@codemirror/state";
import { EditorView as EditorView2, GutterMarker, gutter } from "@codemirror/view";
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
	--opticm-default-syntax-invalid-border-color   : var(--opticm-l-red);\r
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
	--opticm-default-function-gutter-edge-color      : oklch(from var(--opticm-l-purple) 60% c h / 0.15);\r
	--opticm-default-function-gutter-edge-hover-color: oklch(from var(--opticm-l-purple) 60% c h / 0.25);\r
	--opticm-default-function-stripe-width           : 0.5ch;\r
	--opticm-default-function-stripe-color           : oklch(from var(--opticm-l-purple) 60% c h / 0.15);\r
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
	--opticm-default-function-background          : oklch(from var(--opticm-color-text) l c h / 0.025);\r
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
	--opticm-default-syntax-keyword-color : oklch(from var(--opticm-l-brown) 60% c h);\r
	--opticm-default-syntax-comment-weight: bold;\r
	--opticm-default-syntax-keyword-weight: bold;\r
\r
	--opticm-default-syntax-variable-color      : var(--opticm-color-text);\r
	--opticm-default-syntax-function-color      : var(--opticm-color-text);  /* Since Acorn cannot distinguish, it must be the same as the above.*/\r
	--opticm-default-syntax-type-color          : oklch(from var(--opticm-l-red) 60% c h);\r
	--opticm-default-syntax-property-color      : oklch(from var(--opticm-l-turquoise) 60% c h);\r
	--opticm-default-syntax-local-variable-color: oklch(from var(--opticm-l-yellowgreen) 60% c h);\r
\r
	--opticm-default-syntax-literal-color     : oklch(from var(--opticm-l-orange) l c h / 0.8);\r
	--opticm-default-syntax-literal-weight    : bold;\r
	--opticm-default-syntax-invalid-decoration: underline wavy var(--opticm-l-red);\r
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
	--opticm-default-structure-declaration-mutable-fill    : oklch(from var(--opticm-l-cyan)     98% 0.025 h);\r
	--opticm-default-structure-declaration-mutable-stroke  : oklch(from var(--opticm-l-cyan)     80% 0.25 h);\r
	--opticm-default-structure-declaration-immutable-fill  : oklch(from var(--opticm-l-blue)     98% 0.025 h);\r
	--opticm-default-structure-declaration-immutable-stroke: oklch(from var(--opticm-l-blue)     80% 0.25 h);\r
	--opticm-default-structure-declaration-padding-left    : 1;\r
	--opticm-default-structure-declaration-padding-right   : 1;\r
	--opticm-default-structure-declaration-border-width    : 0.5;\r
	--opticm-default-structure-declaration-side-width-scale: 0.35;\r
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
	--opticm-default-function-background          : oklch(from var(--opticm-color-text) l c h / 0.075);\r
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
	--opticm-default-syntax-keyword-color: oklch(from var(--opticm-l-brown) 80% c h);\r
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

// .build/extensions/function-line-numbers/style.css
var style_default = ".cm-editor.cm-function-line-numbers {\r\n	&.cm-section-mode {\r\n		.cm-gutters::after {\r\n			content: '';\r\n			width  : var(--opticm-function-gutter-edge-width, var(--opticm-default-function-gutter-edge-width));\r\n\r\n			background-color: var(--opticm-function-gutter-edge-color, var(--opticm-default-function-gutter-edge-color));\r\n			background-image: var(--opticm-function-gutter-edge-pattern, var(--opticm-default-function-gutter-edge-pattern));\r\n		}\r\n\r\n		.cm-gutters:hover::after {\r\n			background-color: var(--opticm-function-gutter-edge-hover-color, var(--opticm-default-function-gutter-edge-hover-color));\r\n		}\r\n	}\r\n\r\n	.cm-sectionNumbers {\r\n		overflow: visible;\r\n	}\r\n\r\n	.cm-sectionNumbers .cm-gutterElement {\r\n		position : relative;\r\n		min-width: 33px;\r\n		padding  : 0;\r\n\r\n		font-variant-numeric: var(--opticm-function-number-font-variant, var(--opticm-default-function-number-font-variant));\r\n	}\r\n\r\n	:is(.cm-function-number, .cm-opticm-line-number) {\r\n		display: block;\r\n		padding: 0 7px 0 4px;\r\n	}\r\n\r\n	.cm-function-number {\r\n		color: var(--opticm-function-number-color, var(--opticm-default-function-number-color));\r\n	}\r\n\r\n	.cm-opticm-line-number {\r\n		color     : var(--opticm-function-line-color, var(--opticm-default-function-line-color));\r\n		text-align: var(--opticm-function-line-align, var(--opticm-default-function-line-align));\r\n	}\r\n\r\n	.cm-sectionNumbers .cm-gutterElement:has(> .cm-function-even)::before {\r\n		content : '';\r\n		position: absolute;\r\n		inset   : 0 0 0 calc(-1 * var(--opticm-lint-gutter-width, 0px));\r\n		z-index : -1;\r\n\r\n		pointer-events: none;\r\n		background    : var(--opticm-function-alternate-background, var(--opticm-default-function-alternate-background));\r\n	}\r\n\r\n	.cm-activeLineGutter .cm-function-number {\r\n		color: var(--opticm-function-active-number-color, var(--opticm-default-function-active-number-color));\r\n	}\r\n}\r\n";

// .build/extensions/function-line-numbers/index.js
var setSectionStarts = StateEffect.define();
var sectionNumberState = StateField.define({
  create: () => [],
  update(value, transaction) {
    if (transaction.docChanged || transaction.isUserEvent("load")) value = [];
    for (const effect of transaction.effects) {
      if (!effect.is(setSectionStarts)) continue;
      const starts = effect.value;
      if (!Array.isArray(starts)) {
        throw new TypeError("Section starts must be an array");
      }
      for (let index = 0; index < starts.length; index++) {
        const line = starts[index];
        if (!Number.isInteger(line) || line < 0 || line >= transaction.state.doc.lines || index > 0 && line < starts[index - 1]) {
          throw new RangeError("Section starts must be ordered zero-based document lines");
        }
      }
      value = starts.slice();
    }
    return value;
  }
});
function getSectionLineNumber(state, line) {
  if (!Number.isInteger(line) || line < 0 || line >= state.doc.lines) {
    throw new RangeError("Invalid line");
  }
  const starts = sectionStarts(state);
  let low = 0, high = starts.length;
  while (low < high) {
    const middle = low + high >>> 1;
    if (starts[middle] <= line) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }
  return [low, line - (starts[low - 1] ?? 0) + 1];
}
function sectionStarts(state) {
  const analysis = state.field(commonAnalysisState, false);
  return analysis ? analysis.sections.map((section) => state.doc.lineAt(section.from).number - 1) : state.field(sectionNumberState, false) ?? [];
}
var LineNumber = class extends GutterMarker {
  constructor(section, line) {
    super();
    this.section = section;
    this.line = line;
  }
  eq(other) {
    return this.section === other.section && this.line === other.line;
  }
  toDOM(view) {
    const e = view.dom.ownerDocument.createElement("span");
    const st = this.section > 0 && this.line === 1;
    e.className = st ? "cm-function-number" : "cm-opticm-line-number";
    e.classList.toggle("cm-function-even", this.section % 2 !== 0);
    e.textContent = st ? this.section : this.line;
    return e;
  }
};
function validateLineNumberStart(start) {
  if (!Number.isSafeInteger(start) || start < 1) {
    throw new RangeError("lineNumberStart must be a positive safe integer");
  }
}
function absoluteNumber(start, line) {
  const offset = line - 1;
  const number = start + offset;
  return Number.isSafeInteger(number) ? number : BigInt(start) + BigInt(offset);
}
function numberGutter(sectionMode, start = 1) {
  const spacerNumber = (doc) => "9".repeat(String(absoluteNumber(start, doc.lines)).length);
  return gutter({
    class: sectionMode ? "cm-sectionNumbers" : "cm-lineNumbers",
    lineMarker(view, block) {
      const line = view.state.doc.lineAt(block.from).number;
      return sectionMode ? new LineNumber(...getSectionLineNumber(view.state, line - 1)) : new LineNumber(0, absoluteNumber(start, line));
    },
    lineMarkerChange: (update) => sectionMode && (update.startState.field(commonAnalysisState, false) !== update.state.field(commonAnalysisState, false) || update.startState.field(sectionNumberState) !== update.state.field(sectionNumberState)),
    initialSpacer: (view) => new LineNumber(0, spacerNumber(view.state.doc)),
    updateSpacer(spacer, { state }) {
      const number = spacerNumber(state.doc);
      return spacer.line === number ? spacer : new LineNumber(0, number);
    }
  });
}
var absoluteLineNumbers = numberGutter(false);
var functionLineNumbers = [
  sectionNumberState,
  numberGutter(true),
  EditorView2.editorAttributes.of({ class: "cm-section-mode cm-function-line-numbers" }),
  extensionStyles(style_default)
];
function createLineNumberExtensions(mode, start) {
  validateLineNumberStart(start);
  switch (mode) {
    case false:
    case "off":
      return [];
    case true:
    case "absolute":
      return start === 1 ? absoluteLineNumbers : numberGutter(false, start);
    case "function":
      return functionLineNumbers;
    default:
      throw new TypeError("lineNumbers must be a boolean, off, absolute or function");
  }
}
export {
  absoluteLineNumbers,
  createLineNumberExtensions,
  functionLineNumbers,
  getSectionLineNumber,
  sectionNumberState,
  setSectionStarts,
  validateLineNumberStart
};
