// .build/extensions/function-line-numbers/index.js
import { StateEffect, StateField } from "@codemirror/state";
import { EditorView as EditorView2, GutterMarker, gutter } from "@codemirror/view";
import { commonAnalysisState } from "opticm/analysis";

// .build/extensions/styles.js
import { EditorView, ViewPlugin } from "@codemirror/view";
function extensionStyles(css) {
  return ViewPlugin.fromClass(class {
    constructor(view) {
      this.style = view.dom.ownerDocument.createElement("style");
      this.style.nonce = view.state.facet(EditorView.cspNonce);
      this.style.textContent = css;
      view.dom.append(this.style);
    }
    update(update) {
      if (update.startState.facet(EditorView.cspNonce) !== update.state.facet(EditorView.cspNonce)) {
        this.style.nonce = update.state.facet(EditorView.cspNonce);
      }
    }
    destroy() {
      this.style.remove();
    }
  });
}

// .build/extensions/function-line-numbers/style.css
var style_default = ".cm-editor.cm-function-line-numbers.cm-section-mode .cm-gutters::after {\r\n	content: var(--opticm-function-gutter-edge-content, '');\r\n	width: var(--opticm-function-gutter-edge-width, 0.5em);\r\n	background-color: var(--opticm-function-gutter-edge-color, color-mix(in srgb, var(--opticm-l-purple, #9a74a3) 25%, transparent));\r\n	background-image: var(--opticm-function-gutter-edge-pattern, repeating-linear-gradient(\r\n		135deg, transparent, transparent var(--opticm-function-stripe-width, 8px),\r\n		var(--opticm-function-stripe-color, color-mix(in srgb, var(--opticm-l-purple, #9a74a3) 15%, transparent)) var(--opticm-function-stripe-width, 8px),\r\n		var(--opticm-function-stripe-color, color-mix(in srgb, var(--opticm-l-purple, #9a74a3) 15%, transparent)) calc(2 * var(--opticm-function-stripe-width, 8px))\r\n	));\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers.cm-section-mode .cm-gutters:hover::after {\r\n	background-color: var(--opticm-function-gutter-edge-hover-color, color-mix(in srgb, var(--opticm-l-purple, #9a74a3) 45%, transparent));\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers .cm-sectionNumbers {\r\n	overflow: var(--opticm-function-gutter-overflow, visible);\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers .cm-sectionNumbers .cm-gutterElement {\r\n	position: var(--opticm-function-gutter-item-position, relative);\r\n	min-width: var(--opticm-function-gutter-min-width, 33px);\r\n	padding: var(--opticm-function-gutter-item-padding, 0);\r\n	font-variant-numeric: var(--opticm-function-number-font-variant, tabular-nums);\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers :is(.cm-function-number, .cm-opticm-line-number) {\r\n	display: var(--opticm-function-number-display, block);\r\n	padding: var(--opticm-function-number-padding, 0 7px 0 4px);\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers .cm-function-number {\r\n	color: var(--opticm-function-number-color, var(--opticm-l-brown, #4e4138));\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers .cm-opticm-line-number {\r\n	color: var(--opticm-function-line-color, inherit);\r\n	text-align: var(--opticm-function-line-align, right);\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers .cm-sectionNumbers .cm-gutterElement:has(> .cm-function-even)::before {\r\n	content: var(--opticm-function-alternate-content, '');\r\n	position: var(--opticm-function-alternate-position, absolute);\r\n	inset: var(--opticm-function-alternate-inset, 0 0 0 calc(-1 * var(--opticm-lint-gutter-width, 0px)));\r\n	z-index: var(--opticm-function-alternate-z-index, -1);\r\n	pointer-events: var(--opticm-function-alternate-pointer-events, none);\r\n	background: var(--opticm-function-alternate-background, color-mix(in srgb, var(--opticm-l-lightgray, #e8e8e8) 75%, transparent));\r\n}\r\n\r\n.cm-editor.cm-function-line-numbers .cm-activeLineGutter .cm-function-number {\r\n	color: var(--opticm-function-active-number-color, inherit);\r\n}\r\n";

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
