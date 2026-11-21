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
	--opticm-l-lightgray  : #fafafa;\r
	--opticm-l-gray       : #ececec;\r
	--opticm-l-darkgray   : #898989;\r
\r
	--opticm-color-editor: #fff;\r
	--opticm-color-text  : #111;\r
	--opticm-color-window: #fff;\r
\r
	--opticm-font-ui     : "Lucida Grande", "Hiragino Sans", "Yu Gothic UI", "Meiryo UI", sans-serif;\r
	--opticm-font-console: 'Hiragino Sans', "Yu Gothic UI", "Meiryo UI", monospace;\r
	--opticm-font-size   : 14px;\r
\r
	--opticm-editor-post-edit-cursor: none;\r
}\r
\r
:where(.opticm .cm-editor, .cm-editor[data-opticm-extension-defaults]) {\r
	--opticm-default-selection-layer-blend-mode  : multiply;\r
	--opticm-default-selection-background        : color-mix(in srgb, var(--opticm-l-aqua-60, #a0d1ef) 50%, transparent);\r
	--opticm-default-active-line-background      : transparent;\r
	--opticm-default-focused-line-background     : rgb(255 255 255 / 65%);\r
	--opticm-default-focused-line-shadow         : 0 0 4px rgb(0 0 0 / 15%), 0 2px 4px rgb(0 0 0 / 10%);\r
	--opticm-default-error-line-background       : rgb(255 0 43 / 20%);\r
	--opticm-default-cursor-color                : color-mix(in srgb, var(--opticm-l-brown, #4e4138) 60%, transparent);\r
	--opticm-default-cursor-bottom-color         : color-mix(in srgb, var(--opticm-l-brown, #4e4138) 35%, transparent);\r
	--opticm-default-ime-cursor-background       : color-mix(in srgb, var(--opticm-l-brown, #4e4138) 5%, transparent);\r
	--opticm-default-gutter-color                : var(--opticm-l-darkgray, #898989);\r
	--opticm-default-active-gutter-background    : transparent;\r
	--opticm-default-syntax-invalid-border-color : var(--opticm-l-red, #e61e58);\r
	--opticm-default-selection-match-background  : transparent;\r
	--opticm-default-selection-match-border-color: color-mix(in srgb, var(--opticm-l-aqua, #60b3e5) 75%, transparent);\r
	--opticm-default-popup-shadow                : 0 0 2px rgb(0 0 0 / 15%), 0 2px 4px rgb(0 0 0 / 25%);\r
\r
	--opticm-default-bracket-matching-background : transparent;\r
	--opticm-default-bracket-matching-color      : inherit;\r
	--opticm-default-bracket-matching-font-weight: bold;\r
	--opticm-default-bracket-ring-radius         : 50%;\r
	--opticm-default-bracket-ring-width          : 0.5em;\r
	--opticm-default-bracket-ring-color          : color-mix(in srgb, var(--opticm-l-yellow, #fdde00) 65%, transparent);\r
	--opticm-default-bracket-active-radius       : 0.25em;\r
	--opticm-default-bracket-active-border       : none;\r
	--opticm-default-bracket-active-background   : color-mix(in srgb, var(--opticm-l-yellow, #fdde00) 65%, transparent);\r
\r
	--opticm-default-function-gutter-edge-width      : 0.5ch;\r
	--opticm-default-function-gutter-edge-color      : color-mix(in srgb, var(--opticm-l-purple, #9a74a3) 25%, transparent);\r
	--opticm-default-function-gutter-edge-hover-color: color-mix(in srgb, var(--opticm-l-purple, #9a74a3) 45%, transparent);\r
	--opticm-default-gutter-number-hover-background  : color-mix(in srgb, var(--opticm-l-purple, #9a74a3) 25%, transparent);\r
	--opticm-default-function-stripe-width           : 8px;\r
	--opticm-default-function-stripe-color           : color-mix(in srgb, var(--opticm-l-purple, #9a74a3) 15%, transparent);\r
	--opticm-default-function-gutter-edge-pattern    : repeating-linear-gradient(\r
		135deg, transparent, transparent var(--opticm-function-stripe-width, var(--opticm-default-function-stripe-width)),\r
		var(--opticm-function-stripe-color, var(--opticm-default-function-stripe-color)) var(--opticm-function-stripe-width, var(--opticm-default-function-stripe-width)),\r
		var(--opticm-function-stripe-color, var(--opticm-default-function-stripe-color)) calc(2 * var(--opticm-function-stripe-width, var(--opticm-default-function-stripe-width)))\r
	);\r
	--opticm-default-function-number-font-variant : tabular-nums;\r
	--opticm-default-function-number-color        : var(--opticm-l-brown, #4e4138);\r
	--opticm-default-function-line-color          : inherit;\r
	--opticm-default-function-line-align          : right;\r
	--opticm-default-function-background          : var(--opticm-l-lightgray, #fafafa);\r
	--opticm-default-function-alternate-background: var(--opticm-l-gray, #ececec);\r
	--opticm-default-function-active-number-color : inherit;\r
\r
	--opticm-default-function-scroll-marker-radius: 50%;\r
	--opticm-default-function-scroll-marker-color : hsl(40 100% 50% / 75%);\r
\r
	--opticm-default-structure-class-fill                       : var(--opticm-l-red, #e61e58);\r
	--opticm-default-structure-class-opacity                    : 0.08;\r
	--opticm-default-structure-function-fill                    : hsla(40, 100%, 50%, 0.15);\r
	--opticm-default-structure-conditional-fill                 : hsla(150, 100%, 35%, 0.15);\r
	--opticm-default-structure-loop-fill                        : hsla(190, 90%, 50%, 0.20);\r
	--opticm-default-structure-loop2-fill                       : var(--opticm-l-purple, #9a74a3);\r
	--opticm-default-structure-loop2-opacity                    : 0.20;\r
	--opticm-default-structure-declaration-function-fill        : hsla(0, 0%, 97%, 1);\r
	--opticm-default-structure-declaration-function-stroke      : hsla(0, 0%, 69%, 0.75);\r
	--opticm-default-structure-declaration-immutable-fill       : hsla(240, 75%, 97%, 1);\r
	--opticm-default-structure-declaration-immutable-stroke     : hsla(240, 75%, 65%, 0.75);\r
	--opticm-default-structure-declaration-mutable-fill         : hsla(205, 100%, 97%, 1);\r
	--opticm-default-structure-declaration-mutable-stroke       : hsla(205, 100%, 52%, 0.75);\r
	--opticm-default-structure-reference-fill                   : rgba(253, 253, 253, 0.95);\r
	--opticm-default-structure-reference-stroke                 : rgba(46, 68, 154, 0.30);\r
	--opticm-default-structure-range-padding                    : 3;\r
	--opticm-default-structure-spine-inset                      : 4;\r
	--opticm-default-structure-fade-length                      : 16;\r
	--opticm-default-structure-reference-shadow-blur            : 6;\r
	--opticm-default-structure-reference-shadow-offset-y        : 1;\r
	--opticm-default-structure-token-height-scale               : 1.9;\r
	--opticm-default-structure-token-radius-scale               : 0.2;\r
	--opticm-default-structure-declaration-inset                : 2;\r
	--opticm-default-structure-declaration-width-padding        : 4;\r
	--opticm-default-structure-declaration-border-width         : 0.5;\r
	--opticm-default-structure-declaration-side-rule-width-scale: 0.35;\r
	--opticm-default-structure-declaration-side-rule-offset     : 0.5;\r
\r
	--opticm-default-indent-ruler-width: 2px;\r
	--opticm-default-indent-ruler-style: dashed;\r
	--opticm-default-indent-ruler-color: color-mix(in srgb, var(--opticm-l-red, #e61e58) 15%, transparent);\r
\r
	--opticm-default-color-highlighted-line: light-dark(rgb(255 200 0 / 20%), rgb(255 218 102 / 24%));\r
\r
	--opticm-default-syntax-comment-color                  : var(--opticm-l-darkgray, #898989);\r
	--opticm-default-syntax-comment-font-weight            : bold;\r
	--opticm-default-syntax-keyword-color                  : var(--opticm-l-bodybrown);\r
	--opticm-default-syntax-keyword-font-weight            : bold;\r
	--opticm-default-syntax-type-color                     : var(--opticm-l-blue, #2e449a);\r
	--opticm-default-syntax-function-color                 : var(--opticm-l-turquoise, #005363);\r
	--opticm-default-syntax-function-definition-color      : var(--opticm-color-text, #111);\r
	--opticm-default-syntax-function-definition-font-weight: bold;\r
	--opticm-default-syntax-definition-color               : var(--opticm-color-text, #111);\r
	--opticm-default-syntax-definition-font-weight         : bold;\r
	--opticm-default-syntax-property-color                 : var(--opticm-l-blue, #2e449a);\r
	--opticm-default-syntax-variable-color                 : var(--opticm-l-turquoise, #005363);\r
	--opticm-default-syntax-literal-color                  : var(--opticm-l-orange, #f5a200);\r
	--opticm-default-syntax-literal-font-weight            : bold;\r
	--opticm-default-syntax-literal-text-shadow            : var(--opticm-l-yellow, #fdde00) 0 0 0.1em;\r
	--opticm-default-syntax-invalid-decoration             : underline wavy var(--opticm-l-red, #e61e58);\r
	--opticm-default-syntax-local-variable-color           : hsl(86 60% 30%);\r
	--opticm-default-syntax-active-literal-text-shadow     : none;\r
\r
	--opticm-default-whitespace-active-color              : var(--opticm-l-red-35, #f6b0c5);\r
	--opticm-default-whitespace-background-image          : none;\r
	--opticm-default-whitespace-mix-color                 : white;\r
	--opticm-default-whitespace-space-background-size     : calc(100% - 2px) 2px;\r
	--opticm-default-whitespace-background-position       : center bottom;\r
	--opticm-default-whitespace-background-repeat         : no-repeat;\r
	--opticm-default-whitespace-full-width-background-size: calc(100% - 2px) 4px;\r
	--opticm-default-whitespace-tab-color                 : var(--opticm-l-red-15, #fbdde6);\r
	--opticm-default-whitespace-tab-font-weight           : normal;\r
	--opticm-default-whitespace-tab-text-shadow           : 1px 0px 1px #fff, 1px 1px 1px #fff,\r
															-1px 0px 1px #fff, -1px -1px 1px #fff,\r
															0px 1px 1px #fff, 1px -1px 1px #fff,\r
															0px -1px 1px #fff, -1px 1px 1px #fff;\r
}\r
\r
@supports (color: rgb(from white r g b)) {\r
	:where(.opticm .cm-editor, .cm-editor[data-opticm-extension-defaults]) {\r
		/* Preserve the selected color when multiplying over the previous default gray. */\r
		--opticm-default-selection-background: rgb(from var(--opticm-l-aqua-60, #a0d1ef)\r
			calc((r + 253 - 252.76) * 255 / 252.76)\r
			calc((g + 253 - 252.76) * 255 / 252.76)\r
			calc((b + 249 - 252.76) * 255 / 252.76) / 50%);\r
	}\r
}\r
\r
:where(.opticm[data-opticm-color-scheme="light"]) {\r
	color-scheme: light;\r
}\r
\r
:where(.opticm[data-opticm-color-scheme="dark"]) {\r
	color-scheme: dark;\r
\r
	--opticm-color-editor: #202124;\r
	--opticm-color-text  : #e8eaed;\r
	--opticm-color-window: #292b30;\r
\r
	--opticm-l-red       : #ff7995;\r
	--opticm-l-red-35    : #cf8598;\r
	--opticm-l-red-15    : #896270;\r
	--opticm-l-orange    : #efbb76;\r
	--opticm-l-yellow    : #e5c76b;\r
	--opticm-l-turquoise : #80d8cb;\r
	--opticm-l-aqua      : #81c7f2;\r
	--opticm-l-blue      : #a9bfff;\r
	--opticm-l-purple    : #c0a1da;\r
	--opticm-l-brown     : #d7c5b9;\r
	--opticm-l-bodybrown : #dfbda7;\r
	--opticm-l-lightgray : #25262a;\r
	--opticm-l-gray      : #303136;\r
	--opticm-l-darkgray  : #a5a8af;\r
}\r
\r
:where(.opticm[data-opticm-color-scheme="dark"] > .cm-editor) {\r
	--opticm-default-selection-layer-blend-mode: normal;\r
	--opticm-default-selection-background     : rgb(91 156 230 / 34%);\r
	--opticm-default-focused-line-background  : rgb(255 255 255 / 7%);\r
	--opticm-default-focused-line-shadow      : none;\r
	--opticm-default-error-line-background    : rgb(255 92 124 / 22%);\r
	--opticm-default-ime-cursor-background    : rgb(255 255 255 / 12%);\r
	--opticm-default-bracket-ring-color       : rgb(229 199 107 / 48%);\r
	--opticm-default-bracket-active-background : rgb(229 199 107 / 24%);\r
	--opticm-default-function-scroll-marker-color: rgb(239 187 118 / 80%);\r
	--opticm-default-indent-ruler-color          : rgb(255 121 149 / 34%);\r
	--opticm-default-color-highlighted-line     : rgb(255 218 102 / 24%);\r
\r
	--opticm-default-structure-class-opacity                : 0.14;\r
	--opticm-default-structure-function-fill                : rgb(239 187 118 / 16%);\r
	--opticm-default-structure-conditional-fill             : rgb(96 201 143 / 18%);\r
	--opticm-default-structure-loop-fill                    : rgb(103 188 226 / 20%);\r
	--opticm-default-structure-declaration-function-fill    : #34363c;\r
	--opticm-default-structure-declaration-function-stroke  : #858a94;\r
	--opticm-default-structure-declaration-immutable-fill   : #38304e;\r
	--opticm-default-structure-declaration-immutable-stroke : #a897e2;\r
	--opticm-default-structure-declaration-mutable-fill     : #263c4c;\r
	--opticm-default-structure-declaration-mutable-stroke   : #76b9e6;\r
	--opticm-default-structure-reference-fill               : rgb(44 48 61 / 96%);\r
	--opticm-default-structure-reference-stroke             : rgb(169 191 255 / 55%);\r
\r
	--opticm-default-syntax-literal-text-shadow   : none;\r
	--opticm-default-syntax-local-variable-color : #b5d58b;\r
	--opticm-default-whitespace-mix-color        : var(--opticm-color-editor);\r
	--opticm-default-whitespace-tab-text-shadow  : none;\r
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
      declarationInset: appearance.number("--opticm-structure-declaration-inset"),
      declarationWidthPadding: appearance.number("--opticm-structure-declaration-width-padding"),
      declarationBorderWidth: appearance.number("--opticm-structure-declaration-border-width"),
      declarationSideRuleWidthScale: appearance.number("--opticm-structure-declaration-side-rule-width-scale"),
      declarationSideRuleOffset: appearance.number("--opticm-structure-declaration-side-rule-offset")
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
    class: [appearance.color("--opticm-structure-class-fill"), appearance.number("--opticm-structure-class-opacity")],
    function: [appearance.color("--opticm-structure-function-fill")],
    conditional: [appearance.color("--opticm-structure-conditional-fill")],
    loop: [appearance.color("--opticm-structure-loop-fill")],
    loop2: [appearance.color("--opticm-structure-loop2-fill"), appearance.number("--opticm-structure-loop2-opacity")]
  };
  const position = (offset) => {
    const line = doc.lineAt(offset);
    return { line: line.number - 1, ch: offset - line.from };
  };
  const decorations = [];
  if (options.structures) {
    for (const it of analysis.structures) {
      const [fill2, opacity] = colors[it.kind];
      decorations.push({
        kind: "range",
        from: position(it.from),
        to: position(it.to),
        fill: fill2,
        ...opacity === void 0 ? {} : { opacity },
        spineChars: 3,
        branchChars: 4,
        branches: it.branches.map(position)
      });
    }
  }
  if (options.declarations) {
    for (const it of analysis.declarations) {
      const colors2 = it.scope === "function" ? [
        appearance.color("--opticm-structure-declaration-function-fill"),
        appearance.color("--opticm-structure-declaration-function-stroke")
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
    ctx.globalAlpha = it.opacity ?? 1;
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
        ctx.moveTo(x - ctx.lineWidth / 2, y - drawStyle.declarationSideRuleOffset);
        ctx.lineTo(x - ctx.lineWidth / 2, y + h + drawStyle.declarationSideRuleOffset);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
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
