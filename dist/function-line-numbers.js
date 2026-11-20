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
	--opticm-editor-post-edit-cursor: none;\r
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
	--opticm-default-structure-class-fill: var(--opticm-l-red, #e61e58);\r
	--opticm-default-structure-class-opacity: 0.08;\r
	--opticm-default-structure-function-fill: hsla(40, 100%, 50%, 0.15);\r
	--opticm-default-structure-conditional-fill: hsla(150, 100%, 35%, 0.15);\r
	--opticm-default-structure-loop-fill: hsla(190, 90%, 50%, 0.20);\r
	--opticm-default-structure-loop2-fill: var(--opticm-l-purple, #9a74a3);\r
	--opticm-default-structure-loop2-opacity: 0.20;\r
	--opticm-default-structure-declaration-function-fill: hsla(0, 0%, 97%, 1);\r
	--opticm-default-structure-declaration-function-stroke: hsla(0, 0%, 69%, 0.75);\r
	--opticm-default-structure-declaration-immutable-fill: hsla(240, 75%, 97%, 1);\r
	--opticm-default-structure-declaration-immutable-stroke: hsla(240, 75%, 65%, 0.75);\r
	--opticm-default-structure-declaration-mutable-fill: hsla(205, 100%, 97%, 1);\r
	--opticm-default-structure-declaration-mutable-stroke: hsla(205, 100%, 52%, 0.75);\r
	--opticm-default-structure-reference-fill: rgba(253, 253, 253, 0.95);\r
	--opticm-default-structure-reference-stroke: rgba(46, 68, 154, 0.30);\r
	--opticm-default-structure-range-padding: 3;\r
	--opticm-default-structure-spine-inset: 4;\r
	--opticm-default-structure-fade-length: 16;\r
	--opticm-default-structure-reference-shadow-blur: 6;\r
	--opticm-default-structure-reference-shadow-offset-y: 1;\r
	--opticm-default-structure-token-height-scale: 1.9;\r
	--opticm-default-structure-token-radius-scale: 0.2;\r
	--opticm-default-structure-declaration-inset: 2;\r
	--opticm-default-structure-declaration-width-padding: 4;\r
	--opticm-default-structure-declaration-border-width: 0.5;\r
	--opticm-default-structure-declaration-side-rule-width-scale: 0.35;\r
	--opticm-default-structure-declaration-side-rule-offset: 0.5;\r
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

// .build/extensions/function-line-numbers/style.css
var style_default = ".cm-editor.cm-function-line-numbers.cm-section-mode .cm-gutters::after {\r\n	content: '';\r\n	width: var(--opticm-function-gutter-edge-width, var(--opticm-default-function-gutter-edge-width));\r\n	background-color: var(--opticm-function-gutter-edge-color, var(--opticm-default-function-gutter-edge-color));\r\n	background-image: var(--opticm-function-gutter-edge-pattern, var(--opticm-default-function-gutter-edge-pattern));\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers.cm-section-mode .cm-gutters:hover::after {\r\n	background-color: var(--opticm-function-gutter-edge-hover-color, var(--opticm-default-function-gutter-edge-hover-color));\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers .cm-sectionNumbers {\r\n	overflow: visible;\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers .cm-sectionNumbers .cm-gutterElement {\r\n	position: relative;\r\n	min-width: 33px;\r\n	padding: 0;\r\n	font-variant-numeric: var(--opticm-function-number-font-variant, var(--opticm-default-function-number-font-variant));\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers :is(.cm-function-number, .cm-opticm-line-number) {\r\n	display: block;\r\n	padding: 0 7px 0 4px;\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers .cm-function-number {\r\n	color: var(--opticm-function-number-color, var(--opticm-default-function-number-color));\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers .cm-opticm-line-number {\r\n	color: var(--opticm-function-line-color, var(--opticm-default-function-line-color));\r\n	text-align: var(--opticm-function-line-align, var(--opticm-default-function-line-align));\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers .cm-sectionNumbers .cm-gutterElement:has(> .cm-function-even)::before {\r\n	content: '';\r\n	position: absolute;\r\n	inset: 0 0 0 calc(-1 * var(--opticm-lint-gutter-width, 0px));\r\n	z-index: -1;\r\n	pointer-events: none;\r\n	background: var(--opticm-function-alternate-background, var(--opticm-default-function-alternate-background));\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers .cm-activeLineGutter .cm-function-number {\r\n	color: var(--opticm-function-active-number-color, var(--opticm-default-function-active-number-color));\r\n}\r\n";

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
