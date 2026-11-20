// .build/extensions/gutter-line-selection/index.js
import { EditorSelection, StateEffect, StateField } from "@codemirror/state";
import { EditorView as EditorView2, ViewPlugin as ViewPlugin2 } from "@codemirror/view";

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
 * @version 2026-10-24\r
 */\r
\r
:where(.opticm) {\r
	--opticm-l-red        : #e61e58;\r
	--opticm-l-red-35     : #f6b0c5;\r
	--opticm-l-red-15     : #fbdde6;\r
	--opticm-l-orange     : #f5a200;\r
	--opticm-l-yellow     : #fdde00;\r
	--opticm-l-yellowgreen: #7eba2e;\r
	--opticm-l-palegreen  : #4db28d;\r
	--opticm-l-turquoise  : #005363;\r
	--opticm-l-cyan       : #009ddf;\r
	--opticm-l-aqua       : #60b3e5;\r
	--opticm-l-aqua-60    : #a0d1ef;\r
	--opticm-l-blue       : #2e449a;\r
	--opticm-l-purple     : #9a74a3;\r
	--opticm-l-brown      : #4e4138;\r
	--opticm-l-bodybrown  : #7c6a5a;\r
	--opticm-l-lightgray  : #e8e8e8;\r
	--opticm-l-gray       : #b5b5b6;\r
	--opticm-l-darkgray   : #898989;\r
\r
	--opticm-color-editor: rgb(252.76 252.76 252.76);\r
	--opticm-color-text  : #110;\r
	--opticm-color-window: #f8f8f8;\r
\r
	--opticm-font-ui     : "Lucida Grande", "Hiragino Sans", "Yu Gothic UI", "Meiryo UI", sans-serif;\r
	--opticm-font-console: 'Hiragino Sans', "Yu Gothic UI", "Meiryo UI", monospace;\r
	--opticm-font-size   : 14px;\r
\r
}\r
\r
:where(.opticm .cm-editor, .cm-editor[data-opticm-extension-defaults]) {\r
	--opticm-default-selection-layer-blend-mode: multiply;\r
\r
	--opticm-default-bracket-matching-background: transparent;\r
	--opticm-default-bracket-matching-color: inherit;\r
	--opticm-default-bracket-matching-font-weight: bold;\r
	--opticm-default-bracket-ring-radius: 50%;\r
	--opticm-default-bracket-ring-width: 0.5em;\r
	--opticm-default-bracket-ring-color: color-mix(in srgb, var(--opticm-l-yellow, #fdde00) 65%, transparent);\r
	--opticm-default-bracket-active-radius: 0.25em;\r
	--opticm-default-bracket-active-border: none;\r
	--opticm-default-bracket-active-background: color-mix(in srgb, var(--opticm-l-yellow, #fdde00) 65%, transparent);\r
\r
	--opticm-default-function-gutter-edge-width: 0.5em;\r
	--opticm-default-function-gutter-edge-color: color-mix(in srgb, var(--opticm-l-purple, #9a74a3) 25%, transparent);\r
	--opticm-default-function-gutter-edge-hover-color: color-mix(in srgb, var(--opticm-l-purple, #9a74a3) 45%, transparent);\r
	--opticm-default-gutter-number-hover-background: color-mix(in srgb, var(--opticm-l-purple, #9a74a3) 25%, transparent);\r
	--opticm-default-function-stripe-width: 8px;\r
	--opticm-default-function-stripe-color: color-mix(in srgb, var(--opticm-l-purple, #9a74a3) 15%, transparent);\r
	--opticm-default-function-gutter-edge-pattern: repeating-linear-gradient(\r
		135deg, transparent, transparent var(--opticm-function-stripe-width, var(--opticm-default-function-stripe-width)),\r
		var(--opticm-function-stripe-color, var(--opticm-default-function-stripe-color)) var(--opticm-function-stripe-width, var(--opticm-default-function-stripe-width)),\r
		var(--opticm-function-stripe-color, var(--opticm-default-function-stripe-color)) calc(2 * var(--opticm-function-stripe-width, var(--opticm-default-function-stripe-width)))\r
	);\r
	--opticm-default-function-number-font-variant: tabular-nums;\r
	--opticm-default-function-number-color: var(--opticm-l-brown, #4e4138);\r
	--opticm-default-function-line-color: inherit;\r
	--opticm-default-function-line-align: right;\r
	--opticm-default-function-alternate-background: color-mix(in srgb, var(--opticm-l-lightgray, #e8e8e8) 75%, transparent);\r
	--opticm-default-function-active-number-color: inherit;\r
\r
	--opticm-default-function-scroll-marker-radius: 50%;\r
	--opticm-default-function-scroll-marker-color: hsl(40 100% 50% / 75%);\r
\r
	--opticm-default-indent-ruler-width: 2px;\r
	--opticm-default-indent-ruler-style: dashed;\r
	--opticm-default-indent-ruler-color: color-mix(in srgb, var(--opticm-l-red, #e61e58) 15%, transparent);\r
\r
	--opticm-default-color-highlighted-line: light-dark(rgb(255 200 0 / 20%), rgb(255 218 102 / 24%));\r
\r
	--opticm-default-syntax-comment-color: var(--opticm-l-gray, #777);\r
	--opticm-default-syntax-comment-font-weight: bold;\r
	--opticm-default-syntax-keyword-color: var(--opticm-l-bodybrown, #7c6a5a);\r
	--opticm-default-syntax-keyword-font-weight: bold;\r
	--opticm-default-syntax-type-color: var(--opticm-l-blue, #2e449a);\r
	--opticm-default-syntax-function-color: var(--opticm-l-turquoise, #005363);\r
	--opticm-default-syntax-function-definition-color: var(--opticm-color-text, #110);\r
	--opticm-default-syntax-function-definition-font-weight: bold;\r
	--opticm-default-syntax-definition-color: var(--opticm-color-text, #110);\r
	--opticm-default-syntax-definition-inherit-color: inherit;\r
	--opticm-default-syntax-definition-font-weight: bold;\r
	--opticm-default-syntax-property-color: var(--opticm-l-blue, #2e449a);\r
	--opticm-default-syntax-variable-color: inherit;\r
	--opticm-default-syntax-literal-color: var(--opticm-l-orange, #f5a200);\r
	--opticm-default-syntax-literal-font-weight: bold;\r
	--opticm-default-syntax-literal-text-shadow: var(--opticm-l-yellow, #fdde00) 0 0 0.1em;\r
	--opticm-default-syntax-invalid-decoration: underline wavy var(--opticm-l-red, #e61e58);\r
	--opticm-default-syntax-local-variable-color: hsl(86 60% 30%);\r
	--opticm-default-syntax-active-literal-text-shadow: none;\r
\r
	--opticm-default-whitespace-active-color: var(--opticm-l-red-35, #f6b0c5);\r
	--opticm-default-whitespace-background-image: none;\r
	--opticm-default-whitespace-space-background-size: calc(100% - 2px) 2px;\r
	--opticm-default-whitespace-background-position: center bottom;\r
	--opticm-default-whitespace-background-repeat: no-repeat;\r
	--opticm-default-whitespace-full-width-background-size: calc(100% - 2px) 4px;\r
	--opticm-default-whitespace-tab-color: var(--opticm-l-red-15, #fbdde6);\r
	--opticm-default-whitespace-tab-font-weight: normal;\r
	--opticm-default-whitespace-tab-text-shadow: 1px 0px 1px #fff, 1px 1px 1px #fff,\r
		-1px 0px 1px #fff, -1px -1px 1px #fff,\r
		0px 1px 1px #fff, 1px -1px 1px #fff,\r
		0px -1px 1px #fff, -1px 1px 1px #fff;\r
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
var style_default = '.cm-editor.cm-gutter-line-selection :is(.cm-lineNumbers, .cm-sectionNumbers),\r\n.cm-editor.cm-gutter-line-selection .cm-gutters::after {\r\n	cursor: var(--opticm-gutter-cursor, url("./cursor-right.svg") 22 8, pointer);\r\n}\r\n\r\n.cm-editor.cm-gutter-line-selection.line-selection-mode :is(.cm-lineNumbers, .cm-sectionNumbers),\r\n.cm-editor.cm-gutter-line-selection.line-selection-mode .cm-gutters::after {\r\n	cursor: var(--opticm-gutter-line-selection-cursor, url("./cursor-line.svg") 22 8, pointer);\r\n}\r\n';

// .build/extensions/gutter-line-selection/index.js
var setEasyLineSelectionMode = StateEffect.define();
var setLineSelectionMode = setEasyLineSelectionMode;
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
    listen(view.dom.ownerDocument.defaultView, "mouseup", (event) => this.mouseUp(event));
    listen(view.dom.ownerDocument.defaultView, "blur", () => this.setMode(false));
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
    if (event.target.closest(".cm-lint-marker")) return;
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
    if (this.down === null || event.buttons !== 1) return;
    const line = this.lineAt(event);
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
