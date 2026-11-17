// .build/extensions/whitespace/index.js
import { Decoration, EditorView as EditorView2, highlightWhitespace, MatchDecorator, ViewPlugin as ViewPlugin2 } from "@codemirror/view";

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

// .build/extensions/whitespace/style.css
var style_default = ".cm-editor.cm-opticm-whitespace .cm-highlightSpace { background-image: none; }\r\n.cm-editor.cm-opticm-whitespace .cm-activeLine .cm-opticm-space {\r\n	background-image: linear-gradient(var(--opticm-whitespace-active-color, var(--opticm-l-red-35, #f6b0c5)), var(--opticm-whitespace-active-color, var(--opticm-l-red-35, #f6b0c5)));\r\n	background-size: calc(100% - 2px) 2px;\r\n	background-position: center bottom;\r\n	background-repeat: no-repeat;\r\n}\r\n.cm-editor.cm-opticm-whitespace .cm-activeLine .cm-opticm-full-width-space {\r\n	background-image: linear-gradient(color-mix(in srgb, var(--opticm-whitespace-active-color, var(--opticm-l-red-35, #f6b0c5)) 80%, white), color-mix(in srgb, var(--opticm-whitespace-active-color, var(--opticm-l-red-35, #f6b0c5)) 80%, white));\r\n	background-size: calc(100% - 2px) 4px;\r\n}\r\n.cm-editor.cm-opticm-whitespace .cm-highlightTab {\r\n	position: relative;\r\n	background-image: none;\r\n}\r\n.cm-editor.cm-opticm-whitespace .cm-highlightTab::before,\r\n.cm-editor.cm-opticm-whitespace .cm-highlightTab::after {\r\n	position: absolute;\r\n	transform: scaleX(0.8);\r\n	transform-origin: left;\r\n	color: var(--opticm-whitespace-tab-color, var(--opticm-l-red-15, #fbdde6));\r\n	font-weight: normal;\r\n	text-shadow: 1px  0px 1px #fff,  1px  1px 1px #fff,\r\n				-1px  0px 1px #fff, -1px -1px 1px #fff,\r\n				 0px  1px 1px #fff,  1px -1px 1px #fff,\r\n				 0px -1px 1px #fff, -1px  1px 1px #fff;\r\n	pointer-events: none;\r\n	overflow: hidden;\r\n	white-space: nowrap;\r\n}\r\n.cm-editor.cm-opticm-whitespace .cm-highlightTab::before {\r\n	content: '-';\r\n	left: 5%;\r\n	right: 0;\r\n}\r\n.cm-editor.cm-opticm-whitespace .cm-highlightTab::after {\r\n	content: '>';\r\n	left: min(0.8ch, max(0px, calc(100% - 0.8ch)));\r\n	right: 0;\r\n}\r\n.cm-editor.cm-opticm-whitespace .cm-activeLine .cm-highlightTab::before,\r\n.cm-editor.cm-opticm-whitespace .cm-activeLine .cm-highlightTab::after {\r\n	color: var(--opticm-whitespace-active-color, var(--opticm-l-red-35, #f6b0c5));\r\n}\r\n";

// .build/extensions/whitespace/index.js
var spaceMarks = [
  Decoration.mark({ class: "cm-opticm-space cm-opticm-space-even" }),
  Decoration.mark({ class: "cm-opticm-space cm-opticm-space-odd" })
];
var fullWidthSpaceMarks = [
  Decoration.mark({ class: "cm-highlightSpace cm-opticm-space cm-opticm-full-width-space cm-opticm-space-even" }),
  Decoration.mark({ class: "cm-highlightSpace cm-opticm-space cm-opticm-full-width-space cm-opticm-space-odd" })
];
var spaces = new MatchDecorator({
  regexp: /[ \u3000]+/g,
  decorate(add, from, _to, match) {
    for (let i = 0; i < match[0].length; i++) {
      const marks = match[0][i] === " " ? spaceMarks : fullWidthSpaceMarks;
      add(from + i, from + i + 1, marks[i % 2]);
    }
  },
  boundary: /[^ \u3000]/
});
var highlightSpaces = ViewPlugin2.fromClass(class {
  constructor(view) {
    this.decorations = spaces.createDeco(view);
  }
  update(update) {
    this.decorations = spaces.updateDeco(update, this.decorations);
  }
}, { decorations: (plugin) => plugin.decorations });
function whitespaceHighlighting() {
  return [
    highlightWhitespace(),
    highlightSpaces,
    EditorView2.editorAttributes.of({ class: "cm-opticm-whitespace" }),
    extensionStyles(style_default)
  ];
}
export {
  whitespaceHighlighting
};
