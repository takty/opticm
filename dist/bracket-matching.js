// .build/extensions/bracket-matching/index.js
import { bracketMatching } from "@codemirror/language";
import { EditorView as EditorView2, ViewPlugin as ViewPlugin2 } from "@codemirror/view";

// .build/extensions/styles.js
import { EditorView, ViewPlugin } from "@codemirror/view";

// .build/styles/variables.css
var variables_default = `/**\r
 * CSS custom properties\r
 *\r
 * @author Takuto Yanagida\r
 * @version 2026-11-21\r
 */\r
\r
/* Standalone extensions inherit palette defaults and any overrides from their host page. */\r
:where(.opticm, :root:has(.cm-editor[data-opticm-extension-defaults]), :host) {\r
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
	--opticm-l-beige      : #7c6a5a;\r
	--opticm-l-lightgray  : #fafafa;\r
	--opticm-l-gray       : #ececec;\r
	--opticm-l-darkgray   : #898989;\r
}\r
\r
:where(.opticm) {\r
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
	--opticm-default-selection-background        : color-mix(in srgb, var(--opticm-l-aqua-60) 50%, transparent);\r
	--opticm-default-active-line-background      : transparent;\r
	--opticm-default-focused-line-background     : rgb(255 255 255 / 65%);\r
	--opticm-default-focused-line-shadow         : 0 0 4px rgb(0 0 0 / 15%), 0 2px 4px rgb(0 0 0 / 10%);\r
	--opticm-default-error-line-background       : rgb(255 0 43 / 20%);\r
	--opticm-default-cursor-color                : color-mix(in srgb, var(--opticm-l-beige) 60%, transparent);\r
	--opticm-default-cursor-bottom-color         : color-mix(in srgb, var(--opticm-l-beige) 35%, transparent);\r
	--opticm-default-ime-cursor-background       : color-mix(in srgb, var(--opticm-l-beige) 5%, transparent);\r
	--opticm-default-gutter-color                : var(--opticm-l-darkgray);\r
	--opticm-default-active-gutter-background    : transparent;\r
	--opticm-default-syntax-invalid-border-color : var(--opticm-l-red);\r
	--opticm-default-selection-match-background  : transparent;\r
	--opticm-default-selection-match-border-color: color-mix(in srgb, var(--opticm-l-aqua) 75%, transparent);\r
	--opticm-default-popup-shadow                : 0 0 2px rgb(0 0 0 / 15%), 0 2px 4px rgb(0 0 0 / 25%);\r
\r
	--opticm-default-bracket-matching-background : transparent;\r
	--opticm-default-bracket-matching-color      : inherit;\r
	--opticm-default-bracket-matching-font-weight: bold;\r
	--opticm-default-bracket-ring-radius         : 50%;\r
	--opticm-default-bracket-ring-width          : 0.5em;\r
	--opticm-default-bracket-ring-color          : color-mix(in srgb, var(--opticm-l-yellow) 65%, transparent);\r
	--opticm-default-bracket-active-radius       : 0.25em;\r
	--opticm-default-bracket-active-border       : none;\r
	--opticm-default-bracket-active-background   : color-mix(in srgb, var(--opticm-l-yellow) 65%, transparent);\r
\r
	--opticm-default-function-gutter-edge-width      : 0.5ch;\r
	--opticm-default-function-gutter-edge-color      : color-mix(in srgb, var(--opticm-l-purple) 25%, transparent);\r
	--opticm-default-function-gutter-edge-hover-color: color-mix(in srgb, var(--opticm-l-purple) 45%, transparent);\r
	--opticm-default-gutter-number-hover-background  : color-mix(in srgb, var(--opticm-l-purple) 25%, transparent);\r
	--opticm-default-function-stripe-width           : 8px;\r
	--opticm-default-function-stripe-color           : color-mix(in srgb, var(--opticm-l-purple) 15%, transparent);\r
	--opticm-default-function-gutter-edge-pattern    : repeating-linear-gradient(\r
		135deg, transparent, transparent var(--opticm-function-stripe-width, var(--opticm-default-function-stripe-width)),\r
		var(--opticm-function-stripe-color, var(--opticm-default-function-stripe-color)) var(--opticm-function-stripe-width, var(--opticm-default-function-stripe-width)),\r
		var(--opticm-function-stripe-color, var(--opticm-default-function-stripe-color)) calc(2 * var(--opticm-function-stripe-width, var(--opticm-default-function-stripe-width)))\r
	);\r
	--opticm-default-function-number-font-variant : tabular-nums;\r
	--opticm-default-function-number-color        : var(--opticm-l-orange);\r
	--opticm-default-function-line-color          : inherit;\r
	--opticm-default-function-line-align          : right;\r
	--opticm-default-function-background          : var(--opticm-l-lightgray);\r
	--opticm-default-function-alternate-background: var(--opticm-l-gray);\r
	--opticm-default-function-active-number-color : inherit;\r
\r
	--opticm-default-function-scroll-marker-radius: 50%;\r
	--opticm-default-function-scroll-marker-color : hsl(40 100% 50% / 75%);\r
\r
	--opticm-default-structure-class-fill                       : rgb(from var(--opticm-l-red) r g b / 0.08);\r
	--opticm-default-structure-function-fill                    : hsla(40, 100%, 50%, 0.15);\r
	--opticm-default-structure-conditional-fill                 : hsla(150, 100%, 35%, 0.15);\r
	--opticm-default-structure-loop-fill                        : hsla(190, 90%, 50%, 0.15);\r
	--opticm-default-structure-loop2-fill                       : rgb(from var(--opticm-l-purple) r g b / 0.15);\r
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
	--opticm-default-indent-ruler-color: color-mix(in srgb, var(--opticm-l-red) 15%, transparent);\r
\r
	--opticm-default-color-highlighted-line: light-dark(rgb(255 200 0 / 20%), rgb(255 218 102 / 24%));\r
\r
	--opticm-default-syntax-comment-color                  : var(--opticm-l-darkgray);\r
	--opticm-default-syntax-comment-font-weight            : bold;\r
	--opticm-default-syntax-keyword-color                  : var(--opticm-l-beige);\r
	--opticm-default-syntax-keyword-font-weight            : bold;\r
	--opticm-default-syntax-type-color                     : var(--opticm-l-blue);\r
	--opticm-default-syntax-function-color                 : var(--opticm-l-turquoise);\r
	--opticm-default-syntax-function-definition-color      : var(--opticm-color-text);\r
	--opticm-default-syntax-function-definition-font-weight: bold;\r
	--opticm-default-syntax-definition-color               : var(--opticm-color-text);\r
	--opticm-default-syntax-definition-font-weight         : bold;\r
	--opticm-default-syntax-property-color                 : var(--opticm-l-blue);\r
	--opticm-default-syntax-variable-color                 : var(--opticm-l-turquoise);\r
	--opticm-default-syntax-literal-color                  : var(--opticm-l-orange);\r
	--opticm-default-syntax-literal-font-weight            : bold;\r
	--opticm-default-syntax-literal-text-shadow            : var(--opticm-l-yellow) 0 0 0.1em;\r
	--opticm-default-syntax-invalid-decoration             : underline wavy var(--opticm-l-red);\r
	--opticm-default-syntax-local-variable-color           : hsl(86 60% 30%);\r
	--opticm-default-syntax-active-literal-text-shadow     : none;\r
\r
	--opticm-default-whitespace-active-color              : var(--opticm-l-red-35);\r
	--opticm-default-whitespace-background-image          : none;\r
	--opticm-default-whitespace-mix-color                 : white;\r
	--opticm-default-whitespace-space-background-size     : calc(100% - 2px) 2px;\r
	--opticm-default-whitespace-background-position       : center bottom;\r
	--opticm-default-whitespace-background-repeat         : no-repeat;\r
	--opticm-default-whitespace-full-width-background-size: calc(100% - 2px) 4px;\r
	--opticm-default-whitespace-tab-color                 : var(--opticm-l-red-15);\r
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
		--opticm-default-selection-background: rgb(from var(--opticm-l-aqua-60)\r
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
	--opticm-l-beige     : #dfbda7;\r
	--opticm-l-lightgray : #25262a;\r
	--opticm-l-gray      : #303136;\r
	--opticm-l-darkgray  : #a5a8af;\r
}\r
\r
:where(.opticm[data-opticm-color-scheme="dark"] > .cm-editor) {\r
	--opticm-default-selection-layer-blend-mode  : normal;\r
	--opticm-default-selection-background        : rgb(91 156 230 / 34%);\r
	--opticm-default-focused-line-background     : rgb(255 255 255 / 7%);\r
	--opticm-default-focused-line-shadow         : none;\r
	--opticm-default-error-line-background       : rgb(255 92 124 / 22%);\r
	--opticm-default-ime-cursor-background       : rgb(255 255 255 / 12%);\r
	--opticm-default-bracket-ring-color          : rgb(229 199 107 / 48%);\r
	--opticm-default-bracket-active-background   : rgb(229 199 107 / 24%);\r
	--opticm-default-function-scroll-marker-color: rgb(239 187 118 / 80%);\r
	--opticm-default-indent-ruler-color          : rgb(255 121 149 / 34%);\r
	--opticm-default-color-highlighted-line      : rgb(255 218 102 / 24%);\r
\r
	--opticm-default-structure-class-fill                  : rgb(from var(--opticm-l-red) r g b / 0.14);\r
	--opticm-default-structure-function-fill               : rgb(239 187 118 / 16%);\r
	--opticm-default-structure-conditional-fill            : rgb(96 201 143 / 18%);\r
	--opticm-default-structure-loop-fill                   : rgb(103 188 226 / 20%);\r
	--opticm-default-structure-declaration-function-fill   : #34363c;\r
	--opticm-default-structure-declaration-function-stroke : #858a94;\r
	--opticm-default-structure-declaration-immutable-fill  : #38304e;\r
	--opticm-default-structure-declaration-immutable-stroke: #a897e2;\r
	--opticm-default-structure-declaration-mutable-fill    : #263c4c;\r
	--opticm-default-structure-declaration-mutable-stroke  : #76b9e6;\r
	--opticm-default-structure-reference-fill              : rgb(44 48 61 / 96%);\r
	--opticm-default-structure-reference-stroke            : rgb(169 191 255 / 55%);\r
\r
	--opticm-default-syntax-literal-text-shadow : none;\r
	--opticm-default-syntax-local-variable-color: #b5d58b;\r
	--opticm-default-whitespace-mix-color       : var(--opticm-color-editor);\r
	--opticm-default-whitespace-tab-text-shadow : none;\r
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

// .build/extensions/bracket-matching/style.css
var style_default = ".cm-editor.cm-bracket-matching {\r\n	:is(.cm-matchingBracket, .cm-bracket-gutter-mark) {\r\n		position : relative;\r\n		isolation: isolate;\r\n\r\n		background : var(--opticm-bracket-matching-background, var(--opticm-default-bracket-matching-background));\r\n		color      : var(--opticm-bracket-matching-color, var(--opticm-default-bracket-matching-color));\r\n		font-weight: var(--opticm-bracket-matching-font-weight, var(--opticm-default-bracket-matching-font-weight));\r\n	}\r\n\r\n	.cm-bracket-gutter-overlay {\r\n		position: absolute;\r\n		z-index : 5;\r\n		overflow: hidden;\r\n\r\n		pointer-events: none;\r\n	}\r\n\r\n	.cm-bracket-gutter-mark {\r\n		position: absolute;\r\n	}\r\n\r\n	:is(.cm-matchingBracket, .cm-bracket-gutter-mark)::before {\r\n		content : '';\r\n		position: absolute;\r\n		z-index : -1;\r\n		inset   : -0.45em -0.75em;\r\n\r\n		border-radius: var(--opticm-bracket-ring-radius, var(--opticm-default-bracket-ring-radius));\r\n		border       : var(--opticm-bracket-ring-width, var(--opticm-default-bracket-ring-width)) solid var(--opticm-bracket-ring-color, var(--opticm-default-bracket-ring-color));\r\n	}\r\n\r\n	.cm-activeLine .cm-matchingBracket::before {\r\n		inset: 0 0.05em;\r\n\r\n		border-radius   : var(--opticm-bracket-active-radius, var(--opticm-default-bracket-active-radius));\r\n		border          : var(--opticm-bracket-active-border, var(--opticm-default-bracket-active-border));\r\n		background-color: var(--opticm-bracket-active-background, var(--opticm-default-bracket-active-background));\r\n	}\r\n\r\n	:is(\r\n		.cm-syntax-comment .cm-matchingBracket,\r\n		.cm-matchingBracket.cm-syntax-comment,\r\n		.cm-matchingBracket:has(.cm-syntax-comment)\r\n	)::before {\r\n		content: none;\r\n	}\r\n}\r\n";

// .build/extensions/bracket-matching/index.js
var bracketGutterOverlay = ViewPlugin2.fromClass(class {
  constructor(view) {
    this.view = view;
    this.overlay = view.dom.ownerDocument.createElement("div");
    this.overlay.className = "cm-bracket-gutter-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    view.dom.append(this.overlay);
    this.measure = { key: this, read: (view2) => this.read(view2), write: (data) => this.write(data) };
    this.onScroll = () => this.refresh();
    view.scrollDOM.addEventListener("scroll", this.onScroll, { passive: true });
    this.refresh();
  }
  update() {
    this.refresh();
  }
  refresh() {
    this.view.requestMeasure(this.measure);
  }
  read(view) {
    const gutter = view.dom.querySelector(".cm-gutters");
    if (!gutter) return null;
    const window = view.dom.ownerDocument.defaultView;
    const editor = view.dom.getBoundingClientRect();
    const frame = view.scrollDOM.getBoundingClientRect();
    const gutterBox = gutter.getBoundingClientRect();
    const left = gutterBox.left;
    const marks = [];
    for (const bracket of view.contentDOM.querySelectorAll(".cm-matchingBracket")) {
      if (bracket.closest(".cm-activeLine, .cm-syntax-comment") || bracket.querySelector(".cm-syntax-comment")) {
        continue;
      }
      const box = bracket.getBoundingClientRect();
      const fontSize = window.getComputedStyle(bracket).fontSize;
      if (box.left < gutterBox.right || box.left - 0.75 * parseFloat(fontSize) >= gutterBox.right) {
        continue;
      }
      marks.push({ left: box.left - left, top: box.top - frame.top, width: box.width, height: box.height, fontSize });
    }
    return {
      left: left - editor.left,
      top: frame.top - editor.top,
      width: gutterBox.width,
      height: view.scrollDOM.clientHeight,
      marks
    };
  }
  write(data) {
    if (!data) {
      this.overlay.replaceChildren();
      return;
    }
    Object.assign(
      this.overlay.style,
      {
        left: data.left + "px",
        top: data.top + "px",
        width: data.width + "px",
        height: data.height + "px"
      }
    );
    const marks = data.marks.map((mark) => {
      const e = this.overlay.ownerDocument.createElement("span");
      e.className = "cm-bracket-gutter-mark";
      Object.assign(
        e.style,
        {
          left: mark.left + "px",
          top: mark.top + "px",
          width: mark.width + "px",
          height: mark.height + "px",
          fontSize: mark.fontSize
        }
      );
      return e;
    });
    this.overlay.replaceChildren(...marks);
  }
  destroy() {
    this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
    this.overlay.remove();
  }
});
var bracketMatchingExtension = [
  bracketMatching(),
  bracketGutterOverlay,
  EditorView2.editorAttributes.of({ class: "cm-bracket-matching" }),
  extensionStyles(style_default)
];
export {
  bracketMatchingExtension
};
