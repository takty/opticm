// .build/extensions/syntax-highlighting/index.js
import { Facet as Facet2, RangeSet, StateEffect as StateEffect2, StateField as StateField3 } from "@codemirror/state";
import { Decoration, EditorView as EditorView2, ViewPlugin as ViewPlugin2 } from "@codemirror/view";

// .build/analysis/lezer-analysis.js
import { Facet, StateField as StateField2 } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { highlightTree } from "@lezer/highlight";

// .build/analysis/common-analysis.js
import { StateEffect, StateField } from "@codemirror/state";
var structureKinds = /* @__PURE__ */ new Set(["function", "class", "conditional", "loop", "loop2"]);
var declarationMutabilities = /* @__PURE__ */ new Set(["mutable", "immutable", "unknown"]);
var declarationScopes = /* @__PURE__ */ new Set(["function", "lexical", "member", "parameter", "unknown"]);
var syntaxKinds = /* @__PURE__ */ new Set([
  "comment",
  "keyword",
  "operator",
  "type",
  "class-definition",
  "function",
  "function-definition",
  "field-definition",
  "property-definition",
  "destructuring-shorthand",
  "variable",
  "literal",
  "invalid",
  "definition",
  "property",
  "local-variable",
  "local-reference",
  "variable-reference"
]);
var referenceRoles = /* @__PURE__ */ new Set(["definition", "reference"]);
function referencesFromSyntax(syntax) {
  const references = /* @__PURE__ */ new Map();
  for (const { from, to, kind } of syntax) {
    const role = kind === "definition" ? "definition" : ["local-reference", "variable-reference"].includes(kind) ? "reference" : null;
    if (!role) continue;
    const key = `${role}:${from}:${to}`;
    const scope = kind === "local-reference" ? "local" : "unknown";
    const previous = references.get(key);
    if (!previous || scope === "local") references.set(key, { from, to, role, scope });
  }
  return [...references.values()];
}
function createCommonAnalysis(data) {
  if (!data || !Number.isInteger(data.version) || data.version < 0 || !Number.isInteger(data.sourceLength) || data.sourceLength < 0 || typeof data.complete !== "boolean") {
    throw new TypeError("Invalid common analysis metadata");
  }
  const structures = copyRanges(data.structures, data.sourceLength, "structure", (item) => {
    if (!structureKinds.has(item.kind)) {
      throw new TypeError("Invalid structure kind");
    }
    const branches = item.branches ?? [];
    if (!Array.isArray(branches) || branches.some((position) => !Number.isInteger(position) || position < item.from || position > item.to)) {
      throw new RangeError("Invalid structure branches");
    }
    return { kind: item.kind, branches: Object.freeze(branches.slice()) };
  });
  const declarations = copyRanges(data.declarations, data.sourceLength, "declaration", (item) => {
    if (item.kind !== "variable" || !declarationMutabilities.has(item.mutability) || !declarationScopes.has(item.scope)) {
      throw new TypeError("Invalid declaration classification");
    }
    return { kind: item.kind, mutability: item.mutability, scope: item.scope };
  });
  const syntax = copyRanges(data.syntax, data.sourceLength, "syntax", (item) => {
    if (!syntaxKinds.has(item.kind)) {
      throw new TypeError("Invalid syntax kind");
    }
    return { kind: item.kind };
  });
  const references = copyRanges(data.references, data.sourceLength, "reference", (item) => {
    if (!referenceRoles.has(item.role) || !["local", "unknown"].includes(item.scope)) {
      throw new TypeError("Invalid reference classification");
    }
    return { role: item.role, scope: item.scope };
  });
  const sections = copyPositions(data.sections, data.sourceLength);
  for (const ranges of [structures, declarations, syntax, references, sections]) {
    for (const range of ranges) {
      Object.freeze(range);
    }
    Object.freeze(ranges);
  }
  return Object.freeze({
    version: data.version,
    sourceLength: data.sourceLength,
    complete: data.complete,
    syntaxComplete: data.syntaxComplete !== false,
    stale: data.stale === true,
    structures,
    declarations,
    syntax,
    references,
    sections
  });
}
function copyRanges(items, sourceLength, label, copyClassification) {
  if (!Array.isArray(items)) {
    throw new TypeError(`Common analysis ${label}s must be an array`);
  }
  return items.map((item) => {
    if (!item || !Number.isInteger(item.from) || !Number.isInteger(item.to) || item.from < 0 || item.from >= item.to || item.to > sourceLength) {
      throw new RangeError(`Invalid common analysis ${label} range`);
    }
    return { from: item.from, to: item.to, ...copyClassification(item) };
  });
}
function copyPositions(items, sourceLength) {
  if (!Array.isArray(items)) {
    throw new TypeError("Common analysis sections must be an array");
  }
  let previous = -1;
  return items.map((item) => {
    if (!item || item.kind !== "function" || !Number.isInteger(item.from) || item.from < 0 || item.from >= sourceLength || item.from < previous) {
      throw new RangeError("Invalid common analysis section");
    }
    previous = item.from;
    return { kind: item.kind, from: item.from };
  });
}
var setCommonAnalysis = StateEffect.define();
var commonAnalysisState = StateField.define({
  create: () => null,
  update(value, transaction) {
    if (transaction.isUserEvent("load")) value = null;
    else if (transaction.docChanged && value) value = mapAnalysis(value, transaction);
    for (const effect of transaction.effects) {
      if (!effect.is(setCommonAnalysis)) continue;
      if (effect.value === null) {
        value = null;
        continue;
      }
      const next = createCommonAnalysis(effect.value);
      if (next.sourceLength !== transaction.newDoc.length) {
        throw new RangeError("Common analysis does not match the document length");
      }
      if (value && (next.version < value.version || value.stale && next.version <= value.version)) {
        continue;
      }
      value = value ? reuseStructureRanges(value, next) : next;
    }
    return value;
  }
});
function reuseStructureRanges(previous, next) {
  const sameRanges = (before, after, sameDetails) => before.length === after.length && before.every((item, i) => {
    const other = after[i];
    return item.from === other.from && item.to === other.to && item.kind === other.kind && sameDetails(item, other);
  });
  const structures = sameRanges(previous.structures, next.structures, (a, b) => a.branches.length === b.branches.length && a.branches.every((offset, i) => offset === b.branches[i])) ? previous.structures : next.structures;
  const declarations = sameRanges(previous.declarations, next.declarations, (a, b) => a.mutability === b.mutability && a.scope === b.scope) ? previous.declarations : next.declarations;
  if (structures === next.structures && declarations === next.declarations) return next;
  return Object.freeze({ ...next, structures, declarations });
}
function mapAnalysis(analysis, transaction) {
  const changes = [];
  transaction.changes.iterChangedRanges((from, to) => {
    changes.push({ from, to });
  });
  const mapRange = (range, retainOnEdit) => {
    const affected = changes.some(({ from: from2, to: to2 }) => retainOnEdit ? from2 <= range.from && to2 >= range.to : from2 === to2 ? from2 >= range.from && from2 <= range.to : from2 < range.to && to2 > range.from);
    if (affected) return null;
    const from = transaction.changes.mapPos(range.from, 1);
    const to = transaction.changes.mapPos(range.to, -1);
    return from < to ? { ...range, from, to } : null;
  };
  const mapRanges = (ranges, retainOnEdit = false) => ranges.map((range) => mapRange(range, retainOnEdit)).filter(Boolean);
  const structures = mapRanges(analysis.structures, true).map((item) => ({
    ...item,
    branches: item.branches.map((position) => transaction.changes.mapPos(position, 1)).filter((position) => position >= item.from && position <= item.to)
  }));
  const declarations = mapRanges(analysis.declarations, true);
  const syntax = mapRanges(analysis.syntax);
  const references = mapRanges(analysis.references);
  const sections = analysis.sections.filter((item) => !changes.some(({ from, to }) => from <= item.from && to > item.from)).map((item) => ({
    ...item,
    from: transaction.changes.mapPos(item.from, 1)
  })).filter((item) => item.from < transaction.newDoc.length);
  return createCommonAnalysis({
    ...analysis,
    sourceLength: transaction.newDoc.length,
    stale: true,
    structures,
    declarations,
    syntax,
    references,
    sections
  });
}

// .build/analysis/lezer-analysis.js
var syntaxClassifier = Facet.define({ combine: (values) => values[0] });
var SEMANTIC_KINDS = /* @__PURE__ */ new Set(["definition", "local-reference", "variable-reference"]);
function readLezer(state, tree, classifier) {
  const ranges = [];
  const add = (from, to, kind) => {
    if (from < to) ranges.push({ from, to, kind });
  };
  highlightTree(tree, classifier.style, (from, to, classes) => {
    for (const kind of new Set(classes.split(" "))) {
      classifier.classify(tree, kind, from, to, add);
    }
  });
  classifier.collectInterimReferences?.(tree, state, add);
  classifier.collectSyntax?.(tree, state, add);
  return {
    syntax: ranges.filter((range) => !SEMANTIC_KINDS.has(range.kind)),
    references: referencesFromSyntax(ranges)
  };
}
function reconcile(interim, parsedTo, analysis) {
  if (!analysis) return interim;
  if (!analysis.stale) {
    return {
      syntax: analysis.syntaxComplete === false ? [...interim.syntax, ...analysis.syntax] : analysis.syntax.length ? analysis.syntax : interim.syntax,
      references: analysis.references
    };
  }
  const retainedReferences = new Map(analysis.references.map((reference) => [
    referenceKey(reference),
    reference
  ]));
  return {
    syntax: [
      ...interim.syntax,
      ...analysis.syntax.flatMap((range) => {
        if (range.from >= parsedTo) {
          return [range];
        }
        if (range.kind === "comment" && range.to > parsedTo) {
          return [{ ...range, from: parsedTo }];
        }
        return [];
      })
    ],
    references: [
      ...interim.references.map((reference) => {
        const retained = retainedReferences.get(referenceKey(reference));
        return interim.classifiesLocalReferences ? reference : retained ?? reference;
      }),
      ...analysis.references.filter((reference) => reference.from >= parsedTo)
    ]
  };
}
function referenceKey({ from, to, role }) {
  return `${from}:${to}:${role}`;
}
function updateSyntax(state, previous) {
  const classifier = state.facet(syntaxClassifier);
  const tree = syntaxTree(state);
  const analysis = state.field(commonAnalysisState, false);
  const interim = previous?.tree === tree && previous.doc === state.doc && previous.classifier === classifier ? previous.interim : { ...readLezer(state, tree, classifier), classifiesLocalReferences: !!classifier.collectInterimReferences };
  if (previous?.interim === interim && previous.analysis === analysis) {
    return previous;
  }
  return {
    doc: state.doc,
    tree,
    classifier,
    interim,
    analysis,
    data: reconcile(interim, tree.length, analysis)
  };
}
var syntaxAnalysisState = StateField2.define({
  create: (state) => updateSyntax(state, null),
  update: (previous, transaction) => updateSyntax(transaction.state, previous)
});

// .build/extensions/syntax-highlighting/index.js
import { commonAnalysisState as commonAnalysisState2 } from "opticm/analysis";

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

// .build/extensions/syntax-highlighting/style.css
var style_default = ".cm-editor.cm-syntax-highlighting {\n	.cm-syntax-comment {\n		color      : var(--opticm-syntax-comment-color, var(--opticm-default-syntax-comment-color));\n		font-weight: var(--opticm-syntax-comment-weight, var(--opticm-default-syntax-comment-weight));\n	}\n\n	:is(.cm-syntax-keyword, .cm-syntax-operator) {\n		color      : var(--opticm-syntax-keyword-color, var(--opticm-default-syntax-keyword-color));\n		font-weight: var(--opticm-syntax-keyword-weight, var(--opticm-default-syntax-keyword-weight));\n	}\n\n	.cm-syntax-type {\n		color: var(--opticm-syntax-type-color, var(--opticm-default-syntax-type-color));\n	}\n\n	.cm-syntax-function {\n		color: var(--opticm-syntax-function-color, var(--opticm-default-syntax-function-color));\n	}\n\n	.cm-syntax-property {\n		color: var(--opticm-syntax-property-color, var(--opticm-default-syntax-property-color));\n	}\n\n	.cm-syntax-variable {\n		color: var(--opticm-syntax-variable-color, var(--opticm-default-syntax-variable-color));\n	}\n\n	:is(.cm-syntax-local-variable, .cm-syntax-local-reference, .cm-syntax-local-reference .cm-syntax-variable) {\n		color: var(--opticm-syntax-local-variable-color, var(--opticm-default-syntax-local-variable-color));\n	}\n\n	.cm-syntax-literal {\n		color      : var(--opticm-syntax-literal-color, var(--opticm-default-syntax-literal-color));\n		font-weight: var(--opticm-syntax-literal-weight, var(--opticm-default-syntax-literal-weight));\n	}\n\n	.cm-syntax-invalid {\n		text-decoration: var(--opticm-syntax-invalid-decoration, var(--opticm-default-syntax-invalid-decoration));\n	}\n\n	:is(.cm-syntax-definition, .cm-syntax-definition *) {\n		color      : var(--opticm-syntax-definition-color, var(--opticm-default-syntax-definition-color));\n		font-weight: var(--opticm-syntax-definition-weight, var(--opticm-default-syntax-definition-weight));\n	}\n\n	:is(.cm-syntax-function-definition, .cm-syntax-function-definition *) {\n		color      : var(--opticm-syntax-function-definition-color, var(--opticm-default-syntax-function-definition-color));\n		font-weight: var(--opticm-syntax-function-definition-weight, var(--opticm-default-syntax-function-definition-weight));\n	}\n\n	:is(.cm-syntax-field-definition, .cm-syntax-field-definition *, .cm-syntax-property-definition, .cm-syntax-property-definition *) {\n		color      : var(--opticm-syntax-field-definition-color, var(--opticm-default-syntax-field-definition-color));\n		font-weight: var(--opticm-syntax-field-definition-weight, var(--opticm-default-syntax-field-definition-weight));\n	}\n\n	:is(.cm-syntax-class-definition, .cm-syntax-class-definition *) {\n		color      : var(--opticm-syntax-class-definition-color, var(--opticm-default-syntax-class-definition-color));\n		font-weight: var(--opticm-syntax-class-definition-weight, var(--opticm-default-syntax-class-definition-weight));\n	}\n\n	.opticm & :where(.cm-syntax-invalid) {\n		text-decoration: var(--opticm-syntax-invalid-decoration, none);\n		border-bottom  : 0.15em solid var(--opticm-syntax-invalid-border-color, var(--opticm-default-syntax-invalid-border-color));\n	}\n\n	/* Let an overlapping lint error provide the underline. */\n	:is(\n		.cm-syntax-invalid.cm-lintRange-error,\n		.cm-lintRange-error .cm-syntax-invalid,\n		.cm-syntax-invalid:has(.cm-lintRange-error)\n	) {\n		text-decoration: none;\n		border-bottom  : 0;\n	}\n}\n";

// .build/extensions/syntax-highlighting/index.js
var syntaxKinds2 = /* @__PURE__ */ new Set([
  "comment",
  "keyword",
  "operator",
  "type",
  "class-definition",
  "function",
  "function-definition",
  "variable",
  "literal",
  "invalid",
  "property"
]);
var semanticKinds = /* @__PURE__ */ new Set([
  "definition",
  "field-definition",
  "property-definition",
  "local-variable",
  "local-reference",
  "variable-reference"
]);
var allKinds = /* @__PURE__ */ new Set([
  "comment",
  "keyword",
  "operator",
  "type",
  "class-definition",
  "function",
  "function-definition",
  "variable",
  "literal",
  "invalid",
  "definition",
  "field-definition",
  "property-definition",
  "property",
  "local-variable",
  "local-reference",
  "variable-reference"
]);
var setSyntaxHighlights = StateEffect2.define();
var sourceFacet = Facet2.define({ combine: (sources) => sources.at(-1) ?? null });
var displayOptions = Facet2.define({ combine: (values) => values.at(-1) ?? { syntax: true, semantic: true } });
function syntaxHighlightingOptions(options) {
  if (!options || typeof options.syntax !== "boolean" || typeof options.semantic !== "boolean") {
    throw new TypeError("Syntax highlighting options must specify syntax and semantic");
  }
  return displayOptions.of(options);
}
function activeRanges(ranges, options) {
  return ranges.filter(({ kind }) => options.syntax && syntaxKinds2.has(kind) || options.semantic && semanticKinds.has(kind));
}
function commonRanges(analysis, options) {
  const ranges = analysis.syntax.filter(({ kind }) => kind === "local-variable" || kind === "field-definition" || kind === "property-definition");
  const shorthand = new Set(analysis.syntax.filter(({ kind }) => kind === "destructuring-shorthand").map(({ from, to }) => `${from}:${to}`));
  if (options.syntax) {
    ranges.push(...analysis.syntax.filter(({ kind }) => syntaxKinds2.has(kind)));
  }
  if (options.semantic) {
    for (const { from, to, role, scope } of analysis.references) {
      if (role === "definition") {
        if (!shorthand.has(`${from}:${to}`)) ranges.push({ from, to, kind: "definition" });
      } else {
        ranges.push({ from, to, kind: "variable-reference" });
        if (scope === "local") {
          ranges.push({ from, to, kind: "local-reference" });
        }
      }
    }
  }
  return activeRanges(ranges, options);
}
function decorationsFor(ranges, doc, options) {
  return Decoration.set(activeRanges(ranges, options).map(({ from, to, kind }) => {
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || from >= to || to > doc.length || !allKinds.has(kind)) {
      throw new RangeError("Invalid syntax highlight range");
    }
    return Decoration.mark({ class: `cm-syntax-${kind}` }).range(from, to);
  }), true);
}
var syntaxHighlights = StateField3.define({
  create: () => ({ decorations: Decoration.none, current: false, explicit: false, ranges: [] }),
  update(value, transaction) {
    if (transaction.isUserEvent("load")) {
      value = { decorations: Decoration.none, current: false, explicit: false, ranges: [] };
    } else if (transaction.docChanged) {
      const retain = transaction.state.facet(sourceFacet)?.retainOnEdit;
      value = {
        decorations: retain ? value.decorations.map(transaction.changes) : Decoration.none,
        current: false,
        explicit: false,
        ranges: retain ? value.ranges.map((range) => ({
          ...range,
          from: transaction.changes.mapPos(range.from, 1),
          to: transaction.changes.mapPos(range.to, -1)
        })).filter((range) => range.from < range.to) : []
      };
    }
    const sharedSyntax = transaction.state.field(syntaxAnalysisState, false);
    const common = sharedSyntax ? null : transaction.state.field(commonAnalysisState2, false);
    const commonChanged = !sharedSyntax && transaction.startState.field(commonAnalysisState2, false) !== common;
    const options = transaction.state.facet(displayOptions);
    if (commonChanged) {
      const ranges = common ? commonRanges(common, options) : [];
      value = {
        decorations: decorationsFor(ranges, transaction.newDoc, options),
        current: !!common && !common.stale,
        explicit: false,
        ranges
      };
    } else if (transaction.startState.facet(displayOptions) !== options) {
      const ranges = common && !value.explicit ? commonRanges(common, options) : value.ranges;
      value = {
        decorations: decorationsFor(ranges, transaction.newDoc, options),
        current: value.explicit ? value.current : value.current && !!common && !common.stale,
        explicit: value.explicit,
        ranges
      };
    }
    for (const effect of transaction.effects) {
      if (!effect.is(setSyntaxHighlights)) continue;
      const ranges = effect.value;
      value = {
        decorations: decorationsFor(ranges, transaction.newDoc, options),
        current: ranges.length > 0,
        explicit: true,
        ranges: ranges.slice()
      };
    }
    return value;
  }
});
function syntaxHighlightingSource(analyze, needsRefresh = () => false, { retainOnEdit = false, reconcileComments = null } = {}) {
  return sourceFacet.of({ analyze, needsRefresh, retainOnEdit, reconcileComments });
}
function reconcileRetainedComments(decorations, ranges, doc, parsedTo) {
  if (!Number.isInteger(parsedTo) || parsedTo < 0 || parsedTo > doc.length) {
    throw new RangeError("Invalid parsed syntax extent");
  }
  const comments = [];
  for (const range of ranges.filter((range2) => range2.kind === "comment" && range2.from < parsedTo).sort((a, b) => a.from - b.from)) {
    const previous = comments.at(-1), to = Math.min(range.to, parsedTo);
    if (previous && range.from <= previous.to) {
      previous.to = Math.max(previous.to, to);
    } else {
      comments.push({ from: range.from, to });
    }
  }
  const retained = [];
  decorations.between(0, doc.length, (from, to, decoration) => {
    let low = 0, high = comments.length;
    while (low < high) {
      const middle = low + high >>> 1;
      if (comments[middle].to <= from) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    if (decoration.spec.class === "cm-syntax-comment") {
      for (let i = low; i < comments.length && comments[i].from < to; i++) {
        const comment = comments[i];
        const start = Math.max(from, comment.from), end = Math.min(to, comment.to, parsedTo);
        if (start < end) {
          retained.push(decoration.range(start, end));
        }
      }
      if (to > parsedTo) {
        retained.push(decoration.range(Math.max(from, parsedTo), to));
      }
    } else {
      let start = from;
      for (let i = low; i < comments.length && comments[i].from < to; i++) {
        const comment = comments[i];
        if (comment.to <= start) continue;
        if (comment.from > start) {
          retained.push(decoration.range(start, comment.from));
        }
        start = Math.max(start, comment.to);
        if (start >= to) break;
      }
      if (start < to) {
        retained.push(decoration.range(start, to));
      }
    }
  });
  return Decoration.set(retained, true);
}
function sourceDecorations(state, source) {
  const supplied = state.field(syntaxHighlights);
  const common = state.field(commonAnalysisState2, false);
  const options = state.facet(displayOptions);
  if (supplied.explicit) return supplied.decorations;
  const sharedSyntax = state.field(syntaxAnalysisState, false);
  if (sharedSyntax) {
    return decorationsFor(commonRanges(sharedSyntax.data, options), state.doc, options);
  }
  if (common && !common.stale) {
    return supplied.current ? supplied.decorations : decorationsFor(commonRanges(common, options), state.doc, options);
  }
  if (!source || source.retainOnEdit && supplied.current) {
    return supplied.decorations;
  }
  const ranges = source.analyze(state);
  if (!source.retainOnEdit) {
    return decorationsFor(ranges, state.doc, options);
  }
  const retained = source.reconcileComments ? reconcileRetainedComments(supplied.decorations, activeRanges(ranges, options), state.doc, source.reconcileComments(state)) : supplied.decorations;
  const uncovered = [];
  for (const range of activeRanges(ranges, options)) {
    let from = range.from;
    retained.between(range.from, range.to, (start, end) => {
      if (start > from) {
        uncovered.push({ ...range, from, to: Math.min(start, range.to) });
      }
      from = Math.max(from, end);
    });
    if (from < range.to) {
      uncovered.push({ ...range, from, to: range.to });
    }
  }
  return RangeSet.join([retained, decorationsFor(uncovered, state.doc, options)]);
}
var sourceHighlights = ViewPlugin2.fromClass(class {
  constructor(view) {
    const source = view.state.facet(sourceFacet);
    this.decorations = sourceDecorations(view.state, source);
  }
  update(update) {
    const source = update.state.facet(sourceFacet);
    if (source !== update.startState.facet(sourceFacet) || update.docChanged || source?.needsRefresh(update) || update.startState.field(syntaxHighlights) !== update.state.field(syntaxHighlights) || update.startState.field(syntaxAnalysisState, false) !== update.state.field(syntaxAnalysisState, false)) {
      this.decorations = sourceDecorations(update.state, source);
    }
  }
}, { decorations: (plugin) => plugin.decorations });
var syntaxHighlightingExtension = [
  syntaxHighlights,
  sourceHighlights,
  EditorView2.editorAttributes.of({ class: "cm-syntax-highlighting" }),
  extensionStyles(style_default)
];
export {
  setSyntaxHighlights,
  syntaxHighlightingExtension,
  syntaxHighlightingOptions,
  syntaxHighlightingSource
};
