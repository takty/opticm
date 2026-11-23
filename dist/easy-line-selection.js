// .build/extensions/gutter-line-selection/index.js
import { EditorSelection, RangeSet, StateEffect, StateField } from "@codemirror/state";
import { EditorView as EditorView2, GutterMarker, ViewPlugin as ViewPlugin2, gutterLineClass } from "@codemirror/view";

// .build/extensions/gutter-line-selection/cursor-right.svg
var cursor_right_default = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiDQoJIHdpZHRoPSIzMnB4IiBoZWlnaHQ9IjMycHgiIHZpZXdCb3g9IjAgMCAzMiAzMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMzIgMzI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxwb2x5Z29uIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW1pdGVybGltaXQ9IjEwIiBwb2ludHM9IjIyLDggMjEsMjMuMiAxOS42LDIzLjYgMTcuNCwyMC4zIDE0LjcsMjUuNiAxMiwyNC4yIDE0LjcsMTguOSAxMC43LDE5LjEgMTAuMywxNy43Ii8+DQo8L3N2Zz4NCg==";

// .build/extensions/gutter-line-selection/cursor-line.svg
var cursor_line_default = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiDQoJIHdpZHRoPSIzMnB4IiBoZWlnaHQ9IjMycHgiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZW5hYmxlLWJhY2tncm91bmQ9Im5ldyAwIDAgMzIgMzIiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHJlY3QgeD0iNSIgeT0iNyIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHdpZHRoPSIxMiIgaGVpZ2h0PSIzIi8+DQo8cmVjdCB4PSI1IiB5PSIxMyIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHdpZHRoPSIxMiIgaGVpZ2h0PSIzIi8+DQo8cG9seWdvbiBmaWxsPSIjZmZmIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgcG9pbnRzPSIyMiw4IDIxLDIzLjIgMTkuNiwyMy42IDE3LjQsMjAuMyAxNC43LDI1LjYgMTIsMjQuMiANCgkxNC43LDE4LjkgMTAuNywxOS4xIDEwLjMsMTcuNyAiLz4NCjwvc3ZnPg0K";

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
	--opticm-default-syntax-variable-color      : oklch(from var(--opticm-l-green) 10% c h);\r
	--opticm-default-syntax-function-color      : oklch(from var(--opticm-l-green) 10% c h);\r
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
	--opticm-default-structure-reference-fill           : var(--opticm-color-editor);\r
	--opticm-default-structure-reference-stroke         : oklch(from var(--opticm-color-text) l c h / 0.2);\r
	--opticm-default-structure-reference-shadow-blur    : 4;\r
	--opticm-default-structure-reference-shadow-offset-y: 1;\r
\r
	--opticm-default-structure-declaration-var-fill        : oklch(from var(--opticm-color-text) l c h / 0.05);\r
	--opticm-default-structure-declaration-var-stroke      : oklch(from var(--opticm-color-text) l c h / 0.15);\r
	--opticm-default-structure-declaration-mutable-fill    : oklch(from var(--opticm-l-cyan) 90% c h / 0.15);\r
	--opticm-default-structure-declaration-mutable-stroke  : oklch(from var(--opticm-l-cyan) 60% c h / 0.5);\r
	--opticm-default-structure-declaration-immutable-fill  : oklch(from var(--opticm-l-blue) 90% c h / 0.15);\r
	--opticm-default-structure-declaration-immutable-stroke: oklch(from var(--opticm-l-blue) 60% c h / 0.5);\r
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
	--opticm-default-syntax-variable-color      : oklch(from var(--opticm-l-green) 90% 0.01 h);\r
	--opticm-default-syntax-function-color      : oklch(from var(--opticm-l-green) 90% 0.01 h);\r
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
	--opticm-default-structure-reference-fill  : var(--opticm-color-editor);\r
	--opticm-default-structure-reference-stroke: oklch(from var(--opticm-color-text) l c h / 0.5);\r
\r
	--opticm-default-structure-declaration-var-fill        : oklch(from var(--opticm-color-text) l c h / 0.15);\r
	--opticm-default-structure-declaration-var-stroke      : oklch(from var(--opticm-color-text) l c h / 0.25);\r
	--opticm-default-structure-declaration-mutable-fill    : oklch(from var(--opticm-l-cyan) 90% c h / 0.25);\r
	--opticm-default-structure-declaration-mutable-stroke  : oklch(from var(--opticm-l-cyan) 60% c h / 0.6);\r
	--opticm-default-structure-declaration-immutable-fill  : oklch(from var(--opticm-l-blue) 90% c h / 0.25);\r
	--opticm-default-structure-declaration-immutable-stroke: oklch(from var(--opticm-l-blue) 60% c h / 0.6);\r
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

// .build/extensions/gutter-line-selection/style.css
var style_default = '.cm-editor.cm-gutter-line-selection {\r\n	:is(.cm-lineNumbers, .cm-sectionNumbers, .cm-gutter-lint),\r\n	.cm-gutters::after {\r\n		cursor: var(--opticm-gutter-cursor, url("./cursor-right.svg") 22 8, pointer);\r\n	}\r\n\r\n	&.line-selection-mode :is(.cm-lineNumbers, .cm-sectionNumbers, .cm-gutter-lint),\r\n	&.line-selection-mode .cm-gutters::after {\r\n		cursor: var(--opticm-gutter-line-selection-cursor, url("./cursor-line.svg") 22 8, pointer);\r\n	}\r\n\r\n	.cm-gutters :is(.cm-lineNumbers, .cm-sectionNumbers, .cm-gutter-lint) .cm-gutterElement.cm-opticm-gutter-line-hover {\r\n		background: var(--opticm-gutter-number-hover-background, var(--opticm-default-gutter-number-hover-background));\r\n	}\r\n}\r\n';

// .build/extensions/gutter-line-selection/index.js
var setEasyLineSelectionMode = StateEffect.define();
var setLineSelectionMode = setEasyLineSelectionMode;
var setHoveredGutterLine = StateEffect.define();
var gutterHoverMarker = new class extends GutterMarker {
  elementClass = "cm-opticm-gutter-line-hover";
}();
var hoveredGutterLine = StateField.define({
  create: () => null,
  update(line, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setHoveredGutterLine)) return effect.value;
    }
    return transaction.docChanged ? null : line;
  },
  provide: (field) => gutterLineClass.compute([field, "doc"], (state) => {
    const line = state.field(field);
    return line === null ? RangeSet.empty : RangeSet.of(gutterHoverMarker.range(state.doc.line(line).from));
  })
});
var lineSelectionMode = StateField.define({
  create: () => false,
  update(value, transaction) {
    if (transaction.docChanged || transaction.isUserEvent("load") || transaction.selection && transaction.state.selection.main.empty) {
      value = false;
    }
    for (const effect of transaction.effects) {
      if (effect.is(setEasyLineSelectionMode)) {
        value = !!effect.value;
      }
    }
    return value;
  },
  provide: (field) => EditorView2.editorAttributes.from(field, (enabled) => enabled ? { class: "line-selection-mode" } : {})
});
var gutterSelection = ViewPlugin2.fromClass(class {
  constructor(view) {
    this.view = view;
    this.anchor = null;
    this.down = null;
    this.dragged = false;
    this.abort = new AbortController();
    const listen = (target, type, listener) => target.addEventListener(type, listener, { signal: this.abort.signal });
    listen(view.dom, "mousedown", (event) => this.mouseDown(event));
    listen(view.dom, "mousemove", (event) => this.mouseMove(event));
    listen(view.dom, "mouseleave", () => this.setHoveredGutterLine(null));
    listen(view.dom.ownerDocument.defaultView, "mouseup", (event) => this.mouseUp(event));
    listen(view.dom.ownerDocument.defaultView, "blur", () => this.setMode(false));
  }
  setHoveredGutterLine(line) {
    if (line !== this.view.state.field(hoveredGutterLine)) {
      this.view.dispatch({ effects: setHoveredGutterLine.of(line) });
    }
  }
  lineAt(event) {
    const { view } = this;
    const position = view.posAtCoords({
      x: view.contentDOM.getBoundingClientRect().left + 2,
      y: event.clientY
    }, false);
    return position === null ? null : view.state.doc.lineAt(position).number;
  }
  select(line) {
    const { view, anchor } = this;
    const { doc } = view.state;
    const from = doc.line(Math.min(anchor, doc.lines));
    const to = doc.line(line);
    const tail = (row) => Math.min(doc.length, row.to + 1);
    view.dispatch({
      selection: anchor <= line ? EditorSelection.single(from.from, tail(to)) : EditorSelection.single(tail(from), to.from),
      userEvent: "select.pointer"
    });
  }
  setMode(enabled) {
    if (this.view.state.field(lineSelectionMode, false) !== void 0) {
      this.view.dispatch({ effects: setEasyLineSelectionMode.of(enabled) });
    }
  }
  update(update) {
    if (update.docChanged || update.transactions.some((transaction) => transaction.isUserEvent("load"))) {
      this.anchor = null;
      this.down = null;
    } else if (update.selectionSet && update.state.selection.main.empty) {
      this.anchor = null;
    }
  }
  mouseDown(event) {
    const { view } = this;
    if (event.button !== 0 || !view.state.facet(EditorView2.editable) || !event.target.closest(".cm-gutters")) {
      return;
    }
    const line = this.lineAt(event);
    if (line === null) return;
    event.preventDefault();
    this.down = line;
    this.dragged = false;
    if (event.shiftKey) {
      this.anchor ??= view.state.doc.lineAt(view.state.selection.main.head).number;
      this.setMode(false);
    } else if (!view.state.field(lineSelectionMode, false) || this.anchor === null) {
      this.anchor = line;
    }
    this.select(line);
    view.focus();
  }
  mouseMove(event) {
    const overGutter = event.target.closest(".cm-gutter-lint, .cm-lineNumbers, .cm-sectionNumbers");
    const line = overGutter || this.down !== null && event.buttons === 1 ? this.lineAt(event) : null;
    this.setHoveredGutterLine(overGutter ? line : null);
    if (this.down === null || event.buttons !== 1) return;
    if (line !== null) {
      if (!this.dragged && line !== this.down) {
        this.dragged = true;
        if (!event.shiftKey) this.anchor = this.down;
        this.setMode(false);
      }
      this.select(line);
    }
  }
  mouseUp(event) {
    if (this.down !== null && !this.dragged && !event.shiftKey && !this.view.state.field(lineSelectionMode, false) && event.target.closest?.(".cm-gutters") && this.lineAt(event) === this.down) {
      this.setMode(true);
      this.anchor = this.down;
    }
    this.down = null;
  }
  destroy() {
    this.abort.abort();
  }
});
var standardGutterLineSelection = [
  hoveredGutterLine,
  gutterSelection,
  EditorView2.editorAttributes.of({ class: "cm-gutter-line-selection" }),
  extensionStyles(style_default.replace("./cursor-right.svg", `data:image/svg+xml;base64,${cursor_right_default}`).replace("./cursor-line.svg", `data:image/svg+xml;base64,${cursor_line_default}`))
];
var easyLineSelection = [
  standardGutterLineSelection,
  lineSelectionMode,
  EditorView2.editorAttributes.of({ class: "cm-easy-line-selection" })
];
var gutterLineSelection = easyLineSelection;
export {
  easyLineSelection,
  gutterLineSelection,
  setEasyLineSelectionMode,
  setLineSelectionMode,
  standardGutterLineSelection
};
