// .build/extensions/whitespace/index.js
import { EditorView as EditorView2, highlightWhitespace } from "@codemirror/view";

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
var style_default = ".cm-editor.cm-croq-whitespace .cm-highlightSpace { background-image: none; }\n.cm-editor.cm-croq-whitespace .cm-activeLine .cm-highlightSpace {\n	background-image: linear-gradient(var(--croq-whitespace-active-color, var(--croq-mirror-l-red-35, #f6b0c5)), var(--croq-whitespace-active-color, var(--croq-mirror-l-red-35, #f6b0c5)));\n	background-size: 100% 1px;\n	background-position: left bottom;\n	background-repeat: no-repeat;\n}\n.cm-editor.cm-croq-whitespace .cm-highlightTab {\n	position: relative;\n	background-image: none;\n}\n.cm-editor.cm-croq-whitespace .cm-highlightTab::before,\n.cm-editor.cm-croq-whitespace .cm-highlightTab::after {\n	position: absolute;\n	transform: scaleX(0.8);\n	transform-origin: left;\n	color: var(--croq-whitespace-tab-color, var(--croq-mirror-l-red-15, #fbdde6));\n	font-weight: normal;\n	text-shadow: #fff 0 0 4px;\n	pointer-events: none;\n	overflow: hidden;\n	white-space: nowrap;\n}\n.cm-editor.cm-croq-whitespace .cm-highlightTab::before {\n	content: '-';\n	left: 5%;\n	right: 0;\n}\n.cm-editor.cm-croq-whitespace .cm-highlightTab::after {\n	content: '>';\n	left: min(0.8ch, max(0px, calc(100% - 0.8ch)));\n	right: 0;\n}\n.cm-editor.cm-croq-whitespace .cm-activeLine .cm-highlightTab::before,\n.cm-editor.cm-croq-whitespace .cm-activeLine .cm-highlightTab::after {\n	color: var(--croq-whitespace-active-color, var(--croq-mirror-l-red-35, #f6b0c5));\n	text-shadow: none;\n}\n";

// .build/extensions/whitespace/index.js
function whitespaceHighlighting() {
  return [
    highlightWhitespace(),
    EditorView2.editorAttributes.of({ class: "cm-croq-whitespace" }),
    extensionStyles(style_default)
  ];
}
export {
  whitespaceHighlighting
};
