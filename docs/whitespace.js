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
var style_default = ".cm-editor.cm-croq-whitespace .cm-highlightSpace { background-image: none; }\n.cm-editor.cm-croq-whitespace .cm-activeLine .cm-croq-space {\n	background-image: linear-gradient(var(--croq-whitespace-active-color, var(--croq-mirror-l-red-35, #f6b0c5)), var(--croq-whitespace-active-color, var(--croq-mirror-l-red-35, #f6b0c5)));\n	background-size: calc(100% - 2px) 2px;\n	background-position: center bottom;\n	background-repeat: no-repeat;\n}\n.cm-editor.cm-croq-whitespace .cm-activeLine .cm-croq-full-width-space {\n	background-image: linear-gradient(color-mix(in srgb, var(--croq-whitespace-active-color, var(--croq-mirror-l-red-35, #f6b0c5)) 80%, white), color-mix(in srgb, var(--croq-whitespace-active-color, var(--croq-mirror-l-red-35, #f6b0c5)) 80%, white));\n	background-size: calc(100% - 2px) 4px;\n}\n.cm-editor.cm-croq-whitespace .cm-highlightTab {\n	position: relative;\n	background-image: none;\n}\n.cm-editor.cm-croq-whitespace .cm-highlightTab::before,\n.cm-editor.cm-croq-whitespace .cm-highlightTab::after {\n	position: absolute;\n	transform: scaleX(0.8);\n	transform-origin: left;\n	color: var(--croq-whitespace-tab-color, var(--croq-mirror-l-red-15, #fbdde6));\n	font-weight: normal;\n	text-shadow: #fff 0 0 2px, #fff 0 0 6px;\n	pointer-events: none;\n	overflow: hidden;\n	white-space: nowrap;\n}\n.cm-editor.cm-croq-whitespace .cm-highlightTab::before {\n	content: '-';\n	left: 5%;\n	right: 0;\n}\n.cm-editor.cm-croq-whitespace .cm-highlightTab::after {\n	content: '>';\n	left: min(0.8ch, max(0px, calc(100% - 0.8ch)));\n	right: 0;\n}\n.cm-editor.cm-croq-whitespace .cm-activeLine .cm-highlightTab::before,\n.cm-editor.cm-croq-whitespace .cm-activeLine .cm-highlightTab::after {\n	color: var(--croq-whitespace-active-color, var(--croq-mirror-l-red-35, #f6b0c5));\n}\n";

// .build/extensions/whitespace/index.js
var spaceMarks = [
  Decoration.mark({ class: "cm-croq-space cm-croq-space-even" }),
  Decoration.mark({ class: "cm-croq-space cm-croq-space-odd" })
];
var fullWidthSpaceMarks = [
  Decoration.mark({ class: "cm-highlightSpace cm-croq-space cm-croq-full-width-space cm-croq-space-even" }),
  Decoration.mark({ class: "cm-highlightSpace cm-croq-space cm-croq-full-width-space cm-croq-space-odd" })
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
    EditorView2.editorAttributes.of({ class: "cm-croq-whitespace" }),
    extensionStyles(style_default)
  ];
}
export {
  whitespaceHighlighting
};
