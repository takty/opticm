// .build/display-extensions.js
import { commonAnalysisState } from "opticm/analysis";
import { absoluteLineNumbers, functionLineNumbers } from "opticm/function-line-numbers";
import { indentRulers } from "opticm/indent-rulers";
import { syntaxHighlightingExtension, syntaxHighlightingOptions } from "opticm/syntax-highlighting";
import { structureView, structureViewOptions } from "opticm/structure";
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
  rulers = false
} = {}) {
  if (!["off", "absolute", "function"].includes(lineNumbers)) {
    throw new TypeError("lineNumbers must be off, absolute or function");
  }
  const numbers = lineNumbers === "function" ? functionLineNumbers : absoluteLineNumbers;
  return [
    commonAnalysisState,
    createStructureExtensions({ structureHighlight, declarationHighlight, referenceHighlight }),
    createSyntaxExtensions({ syntaxHighlight, semanticHighlight }),
    lineNumbers === "off" ? [] : numbers,
    rulers ? indentRulers : []
  ];
}
export {
  createDisplayExtensions,
  createStructureExtensions,
  createSyntaxExtensions
};
