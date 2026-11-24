# opticm

A standalone CodeMirror 6 editor component.
See [spec.md](./spec.md) for the agreed specification. This repository can be built and used independently.

## Example

Run these commands from the repository root:

```sh
yarn install
yarn dev
```

Open the URL printed at startup to try an English-language editor and its controls.
The buttons belong to the example application, not to the component.
`yarn build` generates `dist/` and `docs/`. Serve the entire `dist/` directory over HTTP or HTTPS to use the component without a consumer-side build.
Serve the modules and worker from the same origin as the consuming page.
Keep `dist/` in version control so Git dependencies receive the built component.
Rebuild it with `node build.mjs` before committing component changes. Package archives
include `dist/`, the package metadata, README, and the root license.
Load the CSS in the consuming page. If you configure a Content Security Policy, allow the modules, worker, fonts, and inline styles set by the libraries.

```html
<link rel="stylesheet" href="./dist/opticm.min.css">
<div id="editor" style="height: 480px"></div>
<script type="module">
import { createEditor } from './dist/opticm.min.js';
const editor = await createEditor(document.querySelector('#editor'), {
    value: 'function greet() { console.log("Hello"); }',
    language: 'en',
});
const unsubscribe = editor.on('change', event => {
    if (event.origin === 'edit') console.log('modified', event.version);
});
const snapshot = await editor.analyzeNow();
// snapshot.text and snapshot.structures always describe the same version.
console.log(snapshot.version, snapshot.complete, snapshot.structures);
// On cleanup: unsubscribe(); editor.destroy();
</script>
```

## Regression tests

Run `yarn test` for Node.js tests and `yarn test:browser` for the Chrome
regression suite. An alternative Chromium browser executable can be passed
to `node test/headless.mjs` after `yarn build`.
Run `yarn test:electron <path-to-electron>` or set `ELECTRON_PATH` to run
the same component regression page in an Electron renderer.

## Public API

| Entry point | Use |
| --- | --- |
| `opticm` | Standalone Editor and Viewer with bundled CodeMirror |
| `opticm/viewer` | Standalone read-only Viewer with bundled CodeMirror |
| `opticm/style.css` | Shared component stylesheet |
| `opticm/analyzer` | Worker-backed analyzer for JavaScript and Java |
| `opticm/analysis` | Shared analysis state and effects for external CodeMirror |
| `opticm/display` | Display extensions for external CodeMirror |

For direct browser imports, use `dist/opticm.min.js` or `dist/viewer.min.js`.
Serve the workers and WASM files from the same distribution directory.
The individual extension entry points are documented below.

### Analysis and display for an existing CodeMirror editor

Use the package entry points with a bundler and share the same CodeMirror
packages between your app and the Opticm extensions.

```js
import { createAnalyzer } from 'opticm/analyzer';
import { setCommonAnalysis } from 'opticm/analysis';
import { createDisplayExtensions } from 'opticm/display';

// Include this extension in your EditorState configuration.
const display = createDisplayExtensions({ lineNumbers: 'function', rulers: true });
const analyzer = await createAnalyzer({ codeLanguage: 'java' });

try {
    const documentAtRequest = view.state.doc;
    const snapshot = await analyzer.analyze(documentAtRequest.toString());
    if (view.state.doc === documentAtRequest) {
        view.dispatch({ effects: setCommonAnalysis.of(snapshot) });
    }
} finally {
    analyzer.destroy();
}
```

`createAnalyzer()` defaults to JavaScript and returns versioned common analysis
snapshots. For repeated analysis, reuse the analyzer, discard results for obsolete
documents, and destroy the analyzer when its owner is disposed.
`createDisplayExtensions()` enables syntax, semantic, structure, declaration,
and reference highlighting by default. Each can be toggled independently.
`lineNumbers` accepts `'off'` (default), `'absolute'`, or `'function'`.
Boolean values `false` and `true` select `'off'` and `'absolute'`, respectively.
`lineNumberStart` is a positive safe integer and defaults to `1`. It applies
to ordinary line numbers.

Import the `setHighlightedLines` state effect from `opticm/display` and
dispatch it with `view.dispatch({ effects: setHighlightedLines.of([0, 2]) })`
to highlight document lines in an external CodeMirror instance.

A host can provide `createWorker(defaultURL)`, returning a new module Worker for
each analyzer. The default Worker and WASM URLs are resolved relative to the
Opticm module so bundlers such as Vite can include those files in their output.
Java also accepts absolute `treeSitterWasmURL` and `javaWasmURL` values (strings
or URL objects). With a custom Worker factory, each omitted WASM URL resolves
beside the Worker module. Pass the same three options under `javaAnalysis`
when creating a Java editor with `createEditor()`.

### Read-only code viewer

Load `opticm.min.css` and call `createViewer()` in the same way as
`createEditor()`. The viewer supports native text selection and copying.

```js
import { createViewer } from 'opticm/viewer';
import 'opticm/style.css';

const viewer = await createViewer(document.querySelector('#example'), {
    codeLanguage: 'java',
    value: 'class Example {}',
    lineNumbers: 'function',
});

await viewer.setValue('class Example { void run() {} }');
viewer.setSettings({ rulers: false, lineNumbers: 'absolute', lineNumberStart: 20 });
viewer.setHighlightedLines([0]);
// On cleanup: viewer.destroy();
```

Use an empty, sized container. `codeLanguage` is fixed at creation and accepts
`javascript` (default), `java`, or `null` for plain text. Java accepts the same
`javaAnalysis` options as the standalone editor. The five highlighting
settings, `rulers`, `lineWrapping`, and `colorScheme` can be changed with `setSettings()`.
Line numbers default to `absolute`; use `function` for per-function numbers
or `off` to hide them. Function numbering falls back to ordinary numbering in
plain text.

### Color scheme

Both `createEditor()` and `createViewer()` accept `colorScheme`. The default
is `'light'`. Choose `'dark'` for a fixed dark appearance or `'auto'` to
follow changes to the browser's `prefers-color-scheme` preference.
When the preference is unavailable, `'auto'` uses light.

Call `setSettings({ colorScheme: 'dark' })` to update an existing instance
while keeping its document, selection, and scroll position. The editor's
`getSettings()` returns the configured value, including `'auto'`.
Each instance has its own setting. The host application can provide a
theme selector and persist the user's choice.

`setHighlightedLines(lines)` replaces the highlighted lines. Pass zero-based
document line indices, or an empty array to clear them. Duplicate indices are
merged. Indices beyond the end of the document are skipped and will be
highlighted if those lines exist after a source update. Displayed line numbers
have no effect on these indices. Set `--opticm-color-highlighted-line` on the
host to override the background. The default follows the inherited
`color-scheme`.

`getValue()` returns the displayed text. `setValue(text)` displays the new
text immediately and resolves after analysis. `refresh()` requests a layout
measurement, for example after revealing a hidden container. `destroy()`
removes the viewer and terminates its analysis worker.

Mount each Viewer in its own container. Display settings, line highlights,
and analysis requests are scoped to the instance. Call `destroy()` when
removing a Viewer, including when a source update is still in progress.

### Standalone editor

Provide an empty container element in the current document.
Mounting a second editor in the same container is an error.
Initialization failures reject the promise and clean up resources and DOM elements created during initialization.

| API | Description |
| --- | --- |
| `await createEditor(container, options)` | Returns after matching configured web fonts and the worker are ready and initial analysis has completed, if enabled |
| `getValue()` | Returns the document text |
| `loadDocument(text)` | Sets the text and resets history, cursor, analysis, and highlights |
| `replaceDocument(text)` | Replaces the entire document as an undoable edit |
| `replaceRange(text, from, to = from)` | Replaces a range as an undoable edit |
| `getSelection()` / `replaceSelection(text)` | Gets selected text or replaces it as an undoable edit |
| `setEasyLineSelectionMode(enabled)` | Sets the active easy selection mode when the feature is enabled; pass `false` to exit before menu actions |
| `getSettings()` / `setSettings(patch)` | Gets settings or applies a partial update |
| `getState()` | Returns `version`, `readOnly`, `disabled`, `canUndo`, and `canRedo` |
| `execute(command)` | Executes one of the commands listed below |
| `setDefinitions(definitions)` | Replaces additional Tern definitions while retaining standard definitions; an empty array removes the additions |
| `getAnalysis()` | Returns the analyzed snapshot for the current version, or `null` |
| `await analyzeNow()` | Analyzes the text and version captured at the time of the call |
| `on(type, listener)` | Subscribes to an event and returns an unsubscribe function |
| `moveTo({line, ch}, {focus = true})` | Moves the cursor, scrolls into view, and optionally focuses the editor |
| `focus()` / `blur()` | Focuses or blurs the editor input; `focus()` does nothing when disabled and is allowed when read-only |
| `hasFocus()` | Returns whether the editor input has focus (not search fields or other component controls) |
| `getLineCount()` | Returns the number of document lines, including one line for an empty document |
| `highlightLine(line)` | Highlights a line and returns an ID for clearing it |
| `clearHighlight(id)` | Clears the specified highlight |
| `setHighlightedLines(lines)` | Replaces persistent line highlights using the same indices as the viewer API. Existing error highlights take precedence on overlapping lines |
| `getFunctionLineNumber(line)` | Returns `[functionNumber, lineWithinFunction]`, or `[0, line + 1]` when analysis is unavailable |
| `refresh()` | Redraws the editor, for example after revealing a hidden container |
| `destroy()` | Releases resources and removes the DOM; safe to call repeatedly |

Commands: `undo`, `redo`, `cut`, `copy`, `paste`, `selectAll`, `toggleComment`, `format`, `find`, `findNext`, `replace`, `complete`.
Clipboard commands focus the target editor and call `document.execCommand`, retaining the original editor's behavior. Availability depends on the browser or Electron environment. Read-only editors allow `copy` but block `cut` and `paste`; disabled editors block all three.
`format` formats the current line or selected lines; it is not a dedicated whole-document formatting command.

Position APIs use **zero-based lines and UTF-16 columns** as `{line, ch}`. Replacement ranges exclude their end position.
`highlightLine` also uses zero-based line numbers. Document changes clear highlights automatically.
Host document APIs remain available when the editor is read-only or disabled; these settings restrict user interaction.

Editing commands invoked through `execute` do not run in read-only mode. When disabled, all commands and `moveTo` do nothing.
The current-line and gutter highlights are hidden while any selection range is
nonempty and return when all ranges are collapsed to cursors.
Operations after destruction throw errors.

### Settings

Initialization also accepts `value` and `definitions`.
Use `setDefinitions` to change additional definitions after initialization.

| Setting | Default | Description |
| --- | --- | --- |
| `language` | `'en'` | UI and diagnostic locale: `'ja'` or `'en'` |
| `codeLanguage` | `'javascript'` | Source language: `'javascript'`, `'java'`, or `null` for plain text; selected at creation |
| `fontFamily` | `monospace` | CSS font-family value; custom fonts must be provided by the host application |
| `fontSize` | `16` | 10-64 px |
| `lineHeight` | `165` | Positive percentage |
| `lineWrapping` | `false` | Line wrapping |
| `colorScheme` | `'light'` | Light (`'light'`), dark (`'dark'`), or browser preference (`'auto'`) |
| `structureHighlight` | `true` | Canvas highlighting for functions, classes, branches, and loops |
| `declarationHighlight` | `true` | Canvas highlighting for variable declarations |
| `referenceHighlight` | `true` | Canvas highlighting for variable references |
| `syntaxHighlight` | `true` | Syntax coloring for comments, keywords, literals, and related tokens |
| `semanticHighlight` | `true` | Semantic highlighting for definitions and variable references |
| `lineNumbers` | `true` | Shows or hides the line number gutter |
| `lineNumberStart` | `1` | Positive safe integer used as the first ordinary line number |
| `functionLineNumbers` | `false` | Per-function line numbers; ordinary line numbers when analysis is disabled |
| `functionScrollMarkers` | `false` | Independent function-position markers near the scrollbar |
| `bracketMatching` | `true` | CodeMirror matching-bracket highlighting and gutter indicators |
| `closeBrackets` | `true` | Automatically close brackets and quotes in JavaScript and Java |
| `closeBraces` | `false` | Include curly braces when `closeBrackets` is enabled |
| `easyLineSelection` | `false` | Extend whole-line selection with consecutive gutter clicks |
| `rulers` | `true` | Indentation guides |
| `autoIndent` | `true` | Correct indentation during formatting and when typing language-specific triggers such as `}` in JavaScript or Java |
| `autoFormat` | `true` | Automatic formatting when editing and leaving a line |
| `formatting` | `true` | Enables formatting; false also disables explicit formatting |
| `completion` | `true` | Completion and argument hints |
| `diagnostics` | `true` | Static diagnostics |
| `analysis` | `true` | Automatic parsing and shared analysis data; disabling it hides analysis-based displays |
| `analysisDelay` | `600` | Automatic analysis delay in milliseconds, zero or greater |
| `readOnly` | `false` | Prevents editing while allowing selection, copying, and search |
| `disabled` | `false` | Stops user interaction; preserves the read-only setting when re-enabled |

Unknown setting names, invalid types, and out-of-range values throw errors. Settings are not persisted.
`codeLanguage` is independent of the UI locale. Omitting it retains JavaScript;
explicit `null` selects plain text without language-specific extensions.
Changing `codeLanguage` through `setSettings` throws; recreate the editor to change it.
Display settings can be changed independently at runtime and do not trigger a new
parse. The `analysis` setting controls worker parsing and shared data, while each
display setting controls only its corresponding presentation; synchronous
CodeMirror syntax sources may continue to provide interim coloring. Function
markers are independent of function line numbers.
Earlier versions enabled function-position markers together with
`functionLineNumbers: true`. To keep both displays after upgrading, set
`functionLineNumbers: true` and `functionScrollMarkers: true`.

```js
const editor = await createEditor(container, { codeLanguage: null });
// Plain text, English UI. Add language: 'ja' for a Japanese UI.
```

Java uses `web-tree-sitter` and the `tree-sitter-java` grammar in a browser
worker. The CodeMirror Java parser is also used for immediate bracket matching.
It supplies provisional syntax coloring during edits; existing Tree-sitter
highlights are mapped across edits until fresh analysis replaces them.
Its initial implementation provides syntax highlighting, including
Java 25 simple source files, structural highlighting for methods and common
control-flow blocks, variable declarations, local variable references, and
per-method/lambda line numbers. Local reference detection uses lexical scopes;
it does not resolve other classes' fields or full Java type information.
Java diagnostics report Tree-sitter syntax errors, missing tokens, and warnings
for unbraced `if`, `else`, and loop bodies. They use the same lint gutter and
tooltips as JavaScript diagnostics. Java completion and formatting are not
implemented yet.

With `closeBrackets` enabled, JavaScript and Java automatically close parentheses,
square brackets, and single and double quotes. JavaScript also closes backticks.
Enable `closeBraces` to include curly braces in both modes. Both settings can be
changed at runtime with `setSettings()`.

Plain text retains editing, undo/redo, search, and ordinary line numbers. It does
not create an analysis worker or completion engine. Diagnostics, formatting,
completion, structural decorations, function numbering and scroll markers have no effect,
even if their settings are true. Settings retain the requested values.
`getAnalysis()` and `await analyzeNow()` return `null`; no analysis events are
emitted. `setDefinitions()` accepts but does not use definitions in plain text.
Automatic bracket insertion and matching are disabled in this mode.
Internally, `src/lang/plain/index.js` implements the complete language interface
with inert methods, so the core follows the same call paths as JavaScript.
Analysis scheduling and diagnostic callbacks still run, returning no results;
no analysis worker or Tern server is created.

Custom automatic formatting is suspended during IME composition. Native IME interaction requires separate verification.
Trigger completion explicitly with Ctrl-Tab, Ctrl-\\, or `execute('complete')`.

### Events

| Event | Data |
| --- | --- |
| `change` | `{origin: 'load' or 'edit', version, text, source?}` |
| `state` | Same as `getState()` |
| `settings` | Settings snapshot |
| `selection` | `{ranges: [{anchor, head}, ...]}` |
| `analysis` | Analysis result described below |
| `focus`, `blur` | Empty object |
| `copy`, `cut` | `{text}`: selection at the time of the clipboard event, before cut processing; empty when nothing is selected. This notification does not confirm an OS clipboard write. |
| `error` | `{message}`, for example when automatic analysis fails |

Event data and analysis results are copied. Changes made by subscribers do not affect internal state.
Explicit analysis failures reject the returned promise.

### Analysis results

`getAnalysis()`, `analyzeNow()`, and the `analysis` event use the same
language-independent snapshot for JavaScript and Java. The snapshot has the
same fields as `createAnalyzer().analyze()`, plus the analyzed source in
`text`.

```js
{
  version, text, sourceLength, complete, syntaxComplete, stale,
  structures, declarations, syntax, references, sections,
}
```

Positions are zero-based UTF-16 offsets into `text`. Ranges use `from`
(inclusive) and `to` (exclusive). Each section has a `kind` and a `from`
offset. `complete` indicates that parsing completed without a syntax error.
An incomplete parse can still yield usable ranges. `syntaxComplete` indicates
whether the snapshot contains a full syntax highlighting pass. JavaScript
parsing uses script mode.

Use `complete` in place of the former `success` flag, `structures` for
structural ranges, `syntax` for syntax highlights, and `sections` for section
starts. Applications that need exported symbol names should extract them
from the source using their own language-specific rules.

Immediately after editing, `getAnalysis()` returns `null`. Worker replies for older versions are not applied to the display or published as updates.
`analyzeNow()` returns the version captured at the time of the call, so its text and results remain consistent even if editing continues while it is pending.
When exporting, use the returned `text` rather than calling `getValue()` again after analysis.
Explicit `analyzeNow()` requests work even when automatic analysis is disabled, but their results are not applied to the display, stored snapshot, or update events.

### Structure display extension

The structure canvas is also available independently as a CodeMirror 6 extension.
The `opticm/structure` entry point imports CodeMirror packages as external
dependencies, so use a bundler or an import map resolving the same CodeMirror
packages as the host editor. It neither parses the document nor performs analysis.

```js
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { structureView, setStructure } from 'opticm/structure';

const view = new EditorView({
    state: EditorState.create({ doc: 'if (x) {\n  work();\n}', extensions: [structureView] }),
    parent: document.querySelector('#editor'),
});
view.dispatch({ effects: setStructure.of([{
    kind: 'range', from: { line: 0, ch: 0 }, to: { line: 2, ch: 1 },
    fill: 'hsla(150, 100%, 35%, 0.15)', spineChars: 3, branchChars: 4, branches: [],
}]) });
```

Positions are zero-based `{line, ch}` with UTF-16 columns and exclusive ends.
Range spines retain their existing measured width and span the full range height.
The top, bottom and branch strokes exclude the spine and fade to transparency
without changing color at their right ends; the top and bottom strokes keep a
total width of 16 character cells, including the spine.
Supply ranges as above or tokens as `{kind: 'token', appearance: 'declaration', from, to, fill, stroke}`. Use `appearance: 'reference'` for reference-style tokens.
Colors can use `var(--property, fallback)` and are resolved against the editor
when the canvas is repainted. An optional `opacity` sets the canvas alpha
(default `1`). JavaScript and Java class ranges use `--opticm-l-red` at
8% opacity and are drawn underneath their method decorations.
The caller supplies current data in drawing order and is responsible for rejecting
stale asynchronous analysis results. Treat the supplied array and its contents
as immutable after dispatch. Document changes or a `load` user event
clear the display by default; dispatch `setStructure.of([])` to clear it explicitly.
Standalone users can opt into `retainStructureOnEdit` (also exported by the
extension): it discards items spanning edited lines and maps other items to their
new positions.
Ordinary newline insertions and automatic
indentation preserve enclosing and shifted structures; splitting an identifier,
a line comment, or a restricted statement is treated more conservatively.
Edits to delimiters or comments also discard later items because their
interpretation may change.
The component uses versioned common analysis. It maps surviving structure and
declaration ranges to their new positions until fresh analysis arrives. The
canvas is repainted when the measured drawing changes. A `load` always clears retained data. The
extension owns and removes its canvas when the editor or extension is destroyed.

### Function line-number extension

`opticm/function-line-numbers` provides a standalone CodeMirror extension.
Like the structure extension, it imports the host's CodeMirror packages as
external dependencies and does not parse the document.

```js
import { functionLineNumbers, setSectionStarts, getSectionLineNumber } from 'opticm/function-line-numbers';

// Include functionLineNumbers in the editor's extensions, then supply section starts.
view.dispatch({ effects: setSectionStarts.of([0, 12]) });
console.log(getSectionLineNumber(view.state, 13)); // [2, 2]
```

Section starts are ordered zero-based document lines; the example requires at
least 14 lines. The result is `[sectionNumber, lineWithinSection]`, with section
number zero before the first start. Document edits or a `load` user event clear
the manually supplied starts; dispatch an empty array to clear them explicitly.
Removing the extension removes its gutter.

### Function scroll-marker extension

`opticm/function-scroll-markers` renders function start positions beside
the scrollbar without adding a gutter or depending on the function-number
extension. In the component, `functionScrollMarkers` controls it independently
of `functionLineNumbers`. It reads shared analysis sections. Standalone users
can include the shared state and publish data with:

```js
import { commonAnalysisState, setCommonAnalysis } from 'opticm/analysis';
import { functionScrollMarkers } from 'opticm/function-scroll-markers';

// Include both in the editor extensions; publish validated common analysis
// with setCommonAnalysis.of(data) when the document's current analysis arrives.
```

### Whitespace highlighting extension

`opticm/whitespace` displays tabs as arrows and both ordinary and ideographic
spaces (U+3000) as underlines on active lines, including inside strings and
comments. It includes CodeMirror's `highlightWhitespace()` but does not
install `highlightActiveLine()`; include the latter separately to mark active
lines. Each space has a separate underline with a gap between adjacent spaces:
2px thick for ordinary spaces and 4px for ideographic spaces, with the latter
lightened by mixing the active color with 20% white. Without an active line,
spaces are hidden and tabs use the inactive color. Tab arrows have a white
text-shadow halo on active and inactive lines to remain visible over structure
highlights.

```js
import { highlightActiveLine } from '@codemirror/view';
import { whitespaceHighlighting } from 'opticm/whitespace';

const extensions = [highlightActiveLine(), whitespaceHighlighting()];
```

Customize the colors with `--opticm-whitespace-active-color` (active tabs and
space underlines) and `--opticm-whitespace-tab-color` (inactive tabs). If unset,
they fall back to the component's pink color variables and then to `#f6b0c5`
and `#fbdde6`. Do not install `highlightWhitespace()` separately.
Removing the extension removes its marks and stylesheet.

### Full-line-height selection extension

`opticm/full-line-selection` provides CodeMirror's custom cursor and
selection drawing while normalizing each selection background to the full
visual-line height. CodeMirror continues to determine the selection's
horizontal rectangles; this extension only adjusts their vertical bounds.

```js
import { fullLineSelection } from 'opticm/full-line-selection';

const view = new EditorView({
    parent: document.querySelector('#editor'),
    extensions: [fullLineSelection()],
});
```

Pass the ordinary `drawSelection` options to `fullLineSelection(options)` when
needed. Do not install `drawSelection()` separately. Removing the extension
restores the browser's native selection and removes its stylesheet.

### Easy line-selection extension

The component always supports whole-line selection by clicking, Shift-clicking,
or dragging in the gutter. Enable `easyLineSelection` to select a range with
two ordinary clicks. The first click sets the anchor, and later clicks extend
the selection from that line.

Standalone editors can use `opticm/easy-line-selection` with a line-number
gutter. It exports `easyLineSelection` and `standardGutterLineSelection` for
editors that only need the standard gestures.

```js
import { lineNumbers } from '@codemirror/view';
import { easyLineSelection, setEasyLineSelectionMode } from 'opticm/easy-line-selection';

// Include lineNumbers() and easyLineSelection in the editor's extensions.
view.dispatch({ effects: setEasyLineSelectionMode.of(false) });
```

The extension ignores lint markers and allows selection in read-only editors.
Setting `EditorView.editable` to false disables gutter interaction. Removing
the extension removes its event listeners and cursor styling.

The legacy `gutterLineSelection` setting remains an alias for
`easyLineSelection`. If both are supplied in a settings update, the new name
takes precedence. The old `setLineSelectionMode()` method, extension exports,
and `opticm/gutter-line-selection` import continue to work.

### Syntax highlighting extension

`opticm/syntax-highlighting` accepts syntax ranges produced by an external
parser. Ranges use zero-based UTF-16 document offsets and a semantic `kind`;
the extension does not parse the document. By default, document edits clear
supplied ranges.

```js
import { syntaxHighlightingExtension, setSyntaxHighlights } from 'opticm/syntax-highlighting';

// Include syntaxHighlightingExtension in the editor's extensions.
view.dispatch({ effects: setSyntaxHighlights.of([
    { from: 0, to: 4, kind: 'keyword' },
    { from: 5, to: 11, kind: 'type' },
]) });
```

Supported kinds are `comment`, `keyword`, `operator`, `type`, `class-definition`, `function`, `function-definition`, `variable`,
`literal`, `invalid`, `definition`, `field-definition`, `property-definition`, `property`, `local-variable`,
`local-reference`, and `variable-reference`. The editor component synchronously
reads the CodeMirror Lezer tree in both languages and reconciles its ranges with
worker results. New Lezer tokens update the parsed region during edits, including
when a comment delimiter is added or removed. Document loads clear retained
ranges. With automatic analysis disabled, the Lezer syntax tree still provides
immediate highlighting. In Java, array type brackets use the same color as
their element type; brackets in array accesses and creation expressions are
not affected.

Standalone consumers can also use `syntaxHighlightingSource(analyze, needsRefresh)`
with a synchronous callback that receives an `EditorState`. The optional
`needsRefresh` callback receives a `ViewUpdate`. With `retainOnEdit: true`, the
extension maps previously supplied ranges across edits. A `reconcileComments`
callback may return the parsed region's end to resolve overlaps between
retained code and fresh comments.

Removing the highlighting extension removes the source's decorations. Local
reference color can be customized with `--opticm-syntax-local-variable-color`.
Variable-reference backgrounds are drawn by the structure view. Class, interface, enum, record, function and method declarations use the
editor text color and bold weight; `--opticm-syntax-function-definition-color` and
`--opticm-syntax-function-definition-weight` customize them. Comments, keywords/operators, definitions,
and literals are bold by default. Literals also have a text shadow, hidden on the
active line. Font weights and literal shadows can be customized with
`--opticm-syntax-comment-weight`, `--opticm-syntax-keyword-weight`,
`--opticm-syntax-definition-weight`, `--opticm-syntax-literal-weight`, and
`--opticm-syntax-literal-shadow`.

The component's `syntaxHighlight` and `semanticHighlight` settings independently
toggle token coloring and definition/reference decoration.
While worker analysis is pending or disabled, ordinary variable references use
the local-reference color. Fresh analysis restores their classified colors.

### Bracket matching extension

`opticm/bracket-matching` combines CodeMirror's `bracketMatching()` with
the component's gutter indicators for matching brackets. The `bracketMatching`
setting toggles both together; it does not scan the whole document for unmatched
brackets.

### Indentation ruler extension

`opticm/indent-rulers` provides standalone guides at character columns 4,
8, and 12. Include `indentRulers` in the editor's extensions; removing it
removes the guides and their stylesheet. The guides follow scrolling, editor
geometry and font metrics, and are clipped to the visible area and an overlay
up to 64 character widths wide. As with the component, columns use the editor's default
character width and are intended for monospaced fonts. With default layering,
the structure canvas is drawn above the guides, including after either extension
is re-enabled.

```js
import { indentRulers } from 'opticm/indent-rulers';
```

Individual guide columns can be changed through CSS, for example:

```css
#editor .cm-opticm-rulers > span:nth-child(1) { --opticm-indent-ruler-column: 2; }
```

### Extension styling

Each extension keeps its CSS in its own source directory. The build embeds it
in the extension's JavaScript; installing or removing the extension installs
or removes its scoped stylesheet automatically. `EditorView.cspNonce` is used
for the stylesheet when provided. Set custom properties on an editor or an
ancestor to change its appearance without affecting other editors:

```css
#editor {
    --opticm-function-number-color: #284f9e;
    --opticm-function-scroll-marker-color: #284f9e;
    --opticm-gutter-cursor: crosshair;
}
```

| Extension | Visual custom properties |
| --- | --- |
| Structure | — |
| Editor interaction | `--opticm-editor-post-edit-cursor` |
| Editor colors | `--opticm-selection-background`, `--opticm-active-line-background`, `--opticm-focused-line-background`, `--opticm-focused-line-shadow`, `--opticm-error-line-background` |
| Cursor and gutter colors | `--opticm-cursor-color`, `--opticm-cursor-bottom-color`, `--opticm-ime-cursor-background`, `--opticm-function-background`, `--opticm-gutter-color`, `--opticm-active-gutter-background` |
| Search, syntax and popup colors | `--opticm-selection-match-background`, `--opticm-selection-match-border-color`, `--opticm-popup-shadow` |
| Function numbers | `--opticm-function-number-color`, `--opticm-function-active-number-color`, `--opticm-function-line-color`, `--opticm-function-number-font-variant`, `--opticm-function-line-align` |
| Function gutter edge | `--opticm-function-gutter-edge-width`, `--opticm-function-gutter-edge-color`, `--opticm-function-gutter-edge-hover-color`, `--opticm-function-gutter-edge-pattern`, `--opticm-function-stripe-width`, `--opticm-function-stripe-color` |
| Function highlighting | `--opticm-function-alternate-background` |
| Function scroll markers | `--opticm-function-scroll-marker-radius`, `--opticm-function-scroll-marker-color` |
| Gutter selection | `--opticm-gutter-cursor`, `--opticm-gutter-line-selection-cursor` (complete CSS `cursor` values) |
| Syntax highlighting | `--opticm-syntax-comment-color`, `--opticm-syntax-comment-weight`, `--opticm-syntax-keyword-color`, `--opticm-syntax-keyword-weight`, `--opticm-syntax-type-color`, `--opticm-syntax-function-color`, `--opticm-syntax-definition-color`, `--opticm-syntax-definition-weight`, `--opticm-syntax-property-color`, `--opticm-syntax-variable-color`, `--opticm-syntax-local-variable-color`, `--opticm-syntax-literal-color`, `--opticm-syntax-literal-weight`, `--opticm-syntax-literal-shadow` |
| Indentation rulers | `--opticm-indent-ruler-width`, `--opticm-indent-ruler-style`, `--opticm-indent-ruler-color` |

Extension style defaults are centralized in `src/styles/variables.css`; each
extension keeps its selectors in its own `style.css`. Standalone extensions
install the shared defaults on their CodeMirror editor, so they do not depend
on the Opticm component stylesheet. Defaults use `--opticm-default-*` names;
the corresponding `--opticm-*` properties take precedence and can be set on
the editor or an ancestor. Only visual defaults are centralized.
Required layering, positioning, clipping and pointer handling stay fixed in
each extension because they are part of its behavior. The ruler column
(`--opticm-indent-ruler-column`) and lint gutter sizing
(`--opticm-function-lint-gutter-width` in the component, or
`--opticm-lint-gutter-width` for standalone extensions) remain separate
functional geometry settings.
Structure canvas colors and drawing proportions are centralized in
`src/styles/variables.css` and read by the JavaScript renderer. For example,
`--opticm-structure-class-fill` overrides
`--opticm-default-structure-class-fill` on the next canvas repaint. Supplied
structure data can still provide custom fill and stroke colors. Positions
calculated by extensions are runtime measurements and remain inline styles.

## Sources and build

`src/index.js` is the component's public API entry point. Common implementation modules (`editor-view.js` and `analysis-client.js`) live directly in `src/`. `src/analysis/` defines and manages shared parser data. `src/extensions/` contains the structure view, syntax highlighting, function line numbers, function scroll markers, bracket matching, whitespace highlighting, full-line-height selection, gutter line selection, and indentation rulers. `src/lang/js/` and `src/lang/java/` contain language-specific analyzers and Lezer classifiers, and `src/lang/language-interface.md` describes the internal language contract. `src/styles/` contains the theme, and `dist/` the distribution. External library wrappers are generated in `.build/lib/` during the build.
`build.mjs` wraps dependency browser builds in ES modules without adding globals to window.
It organizes library preparation, JavaScript bundling, styles, and licenses into separate steps, using `tasks.mjs` for package resolution and file copying/writing.
`src/styles/index.css` imports `variables.css`, which scopes component tokens
to the Opticm root and extension defaults to the editor. Extension styles also
include those defaults when used independently. The build bundles the component
styles into the distributed stylesheet. CodeMirror 6 installs its base styles
when an editor is mounted.
It uses esbuild to bundle and minify JavaScript and minify CSS. Intermediate modules are generated in `.build/`, outside the distribution.
Each component build replaces `dist/` to remove obsolete output files.

The distribution contains:

- `opticm.min.js`: the editor and its dependencies
- `analysis-worker.min.js`: the analysis worker and its parser dependencies
- `analysis-worker-java.min.js`, `web-tree-sitter.wasm`, `tree-sitter-java.wasm`: the Java parser worker and WebAssembly runtimes
- `opticm.min.css`: the combined, scoped editor styles
- `analysis.js`, `structure-view.js`, `syntax-highlighting.js`, `function-line-numbers.js`, `function-scroll-markers.js`, `bracket-matching.js`, `whitespace.js`, `full-line-selection.js`, `easy-line-selection.js`, `gutter-line-selection.js` (compatibility entry), `indent-rulers.js`: standalone extensions with external CodeMirror dependencies
- JavaScript source maps for debugging; these are not required at runtime
- `licenses/`: third-party licenses

Keep the worker beside the main JavaScript file when deploying. Cursor SVGs remain editable in `src/extensions/gutter-line-selection/` and are embedded as data URLs in the extension's JavaScript; no separate cursor files are distributed.
No font files or `@font-face` declarations are bundled. The host application can load its own fonts and select them using `fontFamily`; search input fonts can be set with `--opticm-font-console` on `.opticm`.
English and Japanese JSHint implementations are retained as separate functions. CodeMirror styles and the theme are scoped to the component root.
Editor UI text is maintained separately in `src/res/lang.en.json` and `src/res/lang.ja.json`.
Default JSHint and formatting options are stored as data in `src/res/defaults.json`.
The build bundles these resources into the main JavaScript file, so no additional runtime requests or distribution files are required.
Diagnostic messages remain supplied by the English and Japanese JSHint dependencies.
CodeMirror extensions render completion, argument hints, and diagnostic popups within the component.

```sh
yarn build         # Build the component and example
yarn docs          # Rebuild the component and example
yarn preview       # Preview the generated docs
yarn test          # Run analysis tests
yarn test:browser  # Build and test the component and example in Chrome
```

Example sources live in `src/_docs/`, and generated files in `docs/`.
The example uses Klales for base styling, with local CSS for its layout.
Vite copies `dist/` into `docs/` as public assets. Serve `docs/` alone to include the worker, fonts, and licenses.
The example loads the distributed modules unchanged. Relative URLs support deployment under a subdirectory.
Run `node build.mjs` to build only the component.
The built package has no runtime dependency on a separate application repository.

The original source license is in `LICENSE`, and bundled library licenses are in `dist/licenses/`.
Fonts and cursors were inherited from the original repository; asset-specific rights still require verification before third-party distribution.

## Verification scope

`test/browser.html` contains browser contract tests. Results are recorded in `test/chrome-result.json` and `test/edge-result.json`.
Headless tests use Chrome by default. Pass an Edge or other Chromium-based browser executable as the first argument to use it instead.
Firefox and Safari support is a requirement, but has not been verified in this environment.
Native Japanese IME input, the OS clipboard, mouse-based line selection, screen readers, and precise visual equivalence with the original editor remain unverified.
