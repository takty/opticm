// .build/display-extensions.js
import { commonAnalysisState } from "opticm/analysis";
import { createLineNumberExtensions } from "opticm/function-line-numbers";
import { indentRulers } from "opticm/indent-rulers";
import { syntaxHighlightingExtension, syntaxHighlightingOptions } from "opticm/syntax-highlighting";
import { structureView, structureViewOptions } from "opticm/structure";

// .build/extensions/static-line-highlighting/index.js
import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView as EditorView2 } from "@codemirror/view";

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

// .build/extensions/static-line-highlighting/style.css
var style_default = ".cm-editor .cm-content .cm-line.cm-opticm-highlighted-line:not(.error-line) {\n	background-color: var(--opticm-color-highlighted-line, light-dark(rgb(255 200 0 / 20%), rgb(255 218 102 / 24%)));\n}\n";

// .build/extensions/static-line-highlighting/index.js
var setHighlightedLines = StateEffect.define();
var lineHighlight = Decoration.line({ class: "cm-opticm-highlighted-line" });
var highlightedLines = StateField.define({
  create: () => ({ lines: [], decorations: Decoration.none }),
  update(value, transaction) {
    let lines = value.lines;
    for (const effect of transaction.effects) {
      if (!effect.is(setHighlightedLines)) continue;
      if (!Array.isArray(effect.value)) {
        throw new TypeError("Highlighted lines must be an array");
      }
      lines = [...new Set(effect.value)];
      if (lines.some((line) => !Number.isSafeInteger(line) || line < 0)) {
        throw new RangeError("Highlighted lines must be zero-based line indices");
      }
      lines.sort((a, b) => a - b);
    }
    if (lines === value.lines && (!lines.length || !transaction.docChanged)) return value;
    const doc = transaction.newDoc;
    const ranges = [];
    for (const line of lines) {
      if (line >= doc.lines) break;
      ranges.push(lineHighlight.range(doc.line(line + 1).from));
    }
    return { lines, decorations: Decoration.set(ranges) };
  },
  provide: (field) => EditorView2.decorations.from(field, (value) => value.decorations)
});
var staticLineHighlighting = [highlightedLines, extensionStyles(style_default)];

// .build/display-extensions.js
function createSyntaxExtensions({ syntaxHighlight, semanticHighlight }) {
  if (!syntaxHighlight && !semanticHighlight) return [];
  return [
    syntaxHighlightingExtension,
    syntaxHighlightingOptions({ syntax: syntaxHighlight, semantic: semanticHighlight })
  ];
}
function createStructureExtensions({ structureHighlight, declarationHighlight, referenceHighlight }) {
  if (!structureHighlight && !declarationHighlight && !referenceHighlight) return [];
  return [
    structureView,
    structureViewOptions({
      structures: structureHighlight,
      declarations: declarationHighlight,
      references: referenceHighlight
    })
  ];
}
function createDisplayExtensions({
  syntaxHighlight = true,
  semanticHighlight = true,
  structureHighlight = true,
  declarationHighlight = true,
  referenceHighlight = true,
  lineNumbers = "off",
  lineNumberStart = 1,
  rulers = false
} = {}) {
  return [
    commonAnalysisState,
    createStructureExtensions({ structureHighlight, declarationHighlight, referenceHighlight }),
    createSyntaxExtensions({ syntaxHighlight, semanticHighlight }),
    createLineNumberExtensions(lineNumbers, lineNumberStart),
    staticLineHighlighting,
    rulers ? indentRulers : []
  ];
}
export {
  createDisplayExtensions,
  createStructureExtensions,
  createSyntaxExtensions,
  setHighlightedLines
};
