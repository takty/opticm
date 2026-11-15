// .build/extensions/function-scroll-markers/index.js
import { EditorView as EditorView2, ViewPlugin as ViewPlugin2 } from "@codemirror/view";
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

// .build/extensions/function-scroll-markers/style.css
var style_default = ".cm-editor.cm-function-scroll-markers .cm-function-scroll-markers {\r\n	position: var(--opticm-function-scroll-track-position, absolute);\r\n	--opticm-function-scroll-track-width: var(--opticm-function-scroll-marker-track-width, var(--opticm-function-scrollbar-width, 10px));\r\n	right: var(--opticm-function-scroll-track-right, calc(var(--opticm-function-scrollbar-center-inset, 5px) - var(--opticm-function-scroll-track-width) / 2));\r\n	width: var(--opticm-function-scroll-track-width);\r\n	pointer-events: var(--opticm-function-scroll-track-pointer-events, none);\r\n	z-index: var(--opticm-function-scroll-marker-z-index, 3);\r\n}\r\n\r\n.cm-editor.cm-function-scroll-markers .cm-function-scroll-markers > span {\r\n	position: var(--opticm-function-scroll-marker-position, absolute);\r\n	inset-inline: var(--opticm-function-scroll-marker-inset, 2px);\r\n	aspect-ratio: var(--opticm-function-scroll-marker-aspect-ratio, 1);\r\n	border-radius: var(--opticm-function-scroll-marker-radius, 50%);\r\n	background: var(--opticm-function-scroll-marker-color, hsl(40 100% 50% / 75%));\r\n}\r\n";

// .build/extensions/function-scroll-markers/index.js
function sectionStarts(state) {
  const analysis = state.field(commonAnalysisState, false);
  return analysis?.sections.map((section) => state.doc.lineAt(section.from).number - 1) ?? [];
}
var scrollMarkers = ViewPlugin2.fromClass(class {
  constructor(view) {
    this.view = view;
    this.dom = view.dom.ownerDocument.createElement("div");
    this.dom.className = "cm-function-scroll-markers";
    this.dom.setAttribute("aria-hidden", "true");
    view.dom.append(this.dom);
    this.measure = {
      key: this,
      read: (view2) => {
        const root = view2.dom.getBoundingClientRect();
        const scroller = view2.scrollDOM;
        const frame = scroller.getBoundingClientRect();
        const style = scroller.ownerDocument.defaultView.getComputedStyle(scroller);
        const borderLeft = parseFloat(style.borderLeftWidth);
        const borderRight = parseFloat(style.borderRightWidth);
        const scrollbarWidth = Math.max(0, scroller.offsetWidth - scroller.clientWidth - Math.round(borderLeft + borderRight));
        const trackWidth = scrollbarWidth || 10;
        const scrollbarOnLeft = scroller.clientLeft > Math.round(borderLeft);
        const edge = scrollbarOnLeft ? frame.left + borderLeft : frame.right - borderRight;
        const center = edge + (scrollbarOnLeft ? trackWidth : -trackWidth) / 2;
        const centerInset = root.left + view2.dom.clientLeft + view2.dom.clientWidth - center;
        const height = scroller.clientHeight;
        const markers = scroller.scrollHeight > height ? sectionStarts(view2.state).map((line) => {
          const block = view2.lineBlockAt(view2.state.doc.line(line + 1).from);
          return (block.top + view2.defaultLineHeight / 2) / Math.max(view2.contentHeight, 1) * 100;
        }) : [];
        return { top: frame.top - root.top, height, centerInset, trackWidth, markers };
      },
      write: (data) => {
        this.dom.style.top = data.top + "px";
        this.dom.style.height = data.height + "px";
        this.dom.style.setProperty("--opticm-function-scrollbar-center-inset", `${data.centerInset}px`);
        this.dom.style.setProperty("--opticm-function-scrollbar-width", `${data.trackWidth}px`);
        this.dom.replaceChildren(...data.markers.map((position) => {
          const marker = this.dom.ownerDocument.createElement("span");
          marker.style.top = position + "%";
          return marker;
        }));
      }
    };
    this.onScroll = () => this.refresh();
    view.scrollDOM.addEventListener("scroll", this.onScroll, { passive: true });
    this.refresh();
  }
  update(update) {
    if (update.docChanged || update.geometryChanged || update.viewportChanged || update.startState.field(commonAnalysisState, false) !== update.state.field(commonAnalysisState, false)) {
      this.refresh();
    }
  }
  refresh() {
    this.view.requestMeasure(this.measure);
  }
  destroy() {
    this.view.scrollDOM.removeEventListener("scroll", this.onScroll);
    this.dom.remove();
  }
});
var functionScrollMarkers = [
  scrollMarkers,
  EditorView2.editorAttributes.of({ class: "cm-function-scroll-markers" }),
  extensionStyles(style_default)
];
function refreshFunctionScrollMarkers(view) {
  view.plugin(scrollMarkers)?.refresh();
}
export {
  functionScrollMarkers,
  refreshFunctionScrollMarkers
};
