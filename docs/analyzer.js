// .build/analysis-client.js
var AnalysisClient = class {
  constructor(worker) {
    this.worker = worker;
    this.pending = /* @__PURE__ */ new Map();
    this.nextId = 0;
    this.failure = null;
    this.ready = new Promise((resolve, reject) => {
      this.rejectReady = reject;
      this.timeout = setTimeout(() => this.fail(new Error("Analysis worker initialization timed out")), 15e3);
      worker.onmessage = ({ data }) => {
        if (data.ready) {
          clearTimeout(this.timeout);
          resolve();
          return;
        }
        if (data.error && data.id === void 0) {
          this.fail(new Error(data.error));
          return;
        }
        const pending = this.pending.get(data.id);
        if (!pending) return;
        this.pending.delete(data.id);
        if (data.error) {
          pending.reject(new Error(data.error));
        } else {
          pending.resolve(data.result);
        }
      };
      worker.onerror = (event) => this.fail(new Error(event.message || "Analysis worker failed"));
      worker.onmessageerror = () => this.fail(new Error("Invalid analysis worker message"));
    });
  }
  request(text, version, diagnosticLocale) {
    if (this.failure) return Promise.reject(this.failure);
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      try {
        this.worker.postMessage({ id, text, version, diagnosticLocale });
      } catch (error) {
        this.pending.delete(id);
        reject(error);
      }
    });
  }
  fail(error) {
    if (this.failure) return;
    this.failure = error;
    clearTimeout(this.timeout);
    this.rejectReady(error);
    for (const p of this.pending.values()) {
      p.reject(error);
    }
    this.pending.clear();
    this.worker.terminate();
  }
  destroy() {
    this.fail(new Error("Editor destroyed"));
  }
};

// .build/analyzer.js
import { createCommonAnalysis } from "opticm/analysis";
function createAnalysisClient(codeLanguage, { createWorker, treeSitterWasmURL, javaWasmURL } = {}) {
  if (codeLanguage !== "java" && codeLanguage !== "javascript") {
    throw new TypeError("codeLanguage must be java or javascript");
  }
  const java = codeLanguage === "java";
  const url = java ? new URL("./analysis-worker-java.min.js", import.meta.url) : new URL("./analysis-worker.min.js", import.meta.url);
  let runtime = treeSitterWasmURL === void 0 ? void 0 : new URL(treeSitterWasmURL).href;
  let grammar = javaWasmURL === void 0 ? void 0 : new URL(javaWasmURL).href;
  if (java && createWorker === void 0) {
    runtime ??= new URL("./web-tree-sitter.wasm", import.meta.url).href;
    grammar ??= new URL("./tree-sitter-java.wasm", import.meta.url).href;
  }
  const worker = createWorker === void 0 ? new Worker(url, { type: "module" }) : createWorker(url);
  const client = new AnalysisClient(worker);
  if (java) {
    try {
      worker.postMessage({ type: "initialize", treeSitterWasmURL: runtime, javaWasmURL: grammar });
    } catch (error) {
      client.fail(error);
    }
  }
  return client;
}
async function createAnalyzer({ codeLanguage = "javascript", ...options } = {}) {
  const client = createAnalysisClient(codeLanguage, options);
  await client.ready;
  let nextVersion = 0;
  return {
    async analyze(text) {
      if (typeof text !== "string") throw new TypeError("Analysis source must be a string");
      const version = nextVersion++;
      const result = await client.request(text, version);
      return createCommonAnalysis({ ...result.commonAnalysis, version: result.version });
    },
    destroy() {
      client.destroy();
    }
  };
}
export {
  createAnalysisClient,
  createAnalyzer
};
