/**
 * Initialize the documentation demo, sample programs, and editor controls.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

import 'klales/klales.min.css';

// Load the distributed modules unchanged, including the analysis worker.
const { createEditor } = await import(/* @vite-ignore */ new URL('opticm.min.js', document.baseURI).href);
const status = document.querySelector('#status');
const selectedLanguage = () => document.querySelector('input[name="language"]:checked').value;
const selectedCodeLanguage = () => document.querySelector('input[name="code-language"]:checked').value;
const selectedColorScheme = () => document.querySelector('input[name="color-scheme"]:checked').value;
const extensionControls = document.querySelector('#extensions');
const highlightForm = document.querySelector('#static-line-highlighting');
const highlightInput = document.querySelector('#highlight-lines');
const extensionSettings = () => Object.fromEntries(
	Array.from(extensionControls.querySelectorAll('input[type="checkbox"]'), input => [input.name, input.checked]),
);
const samples = {
	javascript: `// A greeter with two moods and a fallback for invalid input.
function showMessage(message) {
	console.log(message);
}

class Greeter {
	prefix = "Hello";
	static count = 0;

	greet(name, mood) {
		try {
			if (name === null || name === "") {
				name = "guest";
			} else if (!isName(name)) {
				throw new Error("Names must start with a capital letter.");
			}
			const message = makeGreeting(this.prefix, name, mood);
			let remaining = 2;
			while (remaining > 0) {
				showMessage(message);
				remaining--;
			}
		} catch (error) {
			showMessage(error.message);
		} finally {
			Greeter.count++;
		}
	}
}

const makeGreeting = function (prefix, name, mood) {
	switch (mood) {
		case "happy":
			return prefix + ", " + name + "!";
		default:
			return prefix + ", " + name;
	}
};

const options = { enabled: true, name: "Opticm" };
const { enabled, name } = options;
const { name: displayName } = options;
const isName = value => /^[A-Z]/.test(value);

function runDemo() {
	// The attempt counter uses function-scoped var for comparison with let and const.
	var attempts = 0;
	const greeter = new Greeter();
	const names = [name, "invalid", null];
	if (enabled) {
		showMessage("Testing " + displayName);
		for (let index = 0; index < names.length; index++) {
			greeter.greet(names[index], index === 0 ? "happy" : "quiet");
			attempts++;
		}
	} else {
		showMessage("Greetings are disabled.");
	}
	do {
		showMessage("Countdown: " + attempts);
		attempts--;
	} while (attempts > 0);
}

runDemo();`,
	java: `import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;

// A greeter with two moods and a fallback for invalid input.
interface Greeting {
	void greet(String name, Mood mood);
}

enum Mood { HAPPY, QUIET }
record Person(String name, int age) {}

class Greeter implements Greeting {
	private final String prefix = "Hello";
	private static int count = 0;

	@Override
	public void greet(String name, Mood mood) {
		count++;
		char punctuation = switch (mood) {
			case HAPPY -> '!';
			case QUIET -> '.';
		};
		String message = prefix + ", " + name + punctuation;
		int remaining = 2;
		while (remaining > 0) {
			if (name != null && !name.isEmpty()) {
				showMessage(message);
			} else {
				showMessage("Hello, guest");
			}
			remaining--;
		}
	}

	static void showMessage(String message) {
		System.out.println(message);
	}

	static String readName(String input) throws IOException {
		try (BufferedReader reader = new BufferedReader(new StringReader(input))) {
			String name;
			do {
				name = reader.readLine();
			} while (name != null && name.isBlank());
			return name;
		}
	}

	public static void main(String[] args) {
		try {
			final Person person = new Person(readName("Opticm"), 20);
			final Greeting greeter = new Greeter();
			Mood[] moods = Mood.values();
			for (Mood mood : moods) {
				greeter.greet(person.name(), mood);
			}
			for (int index = 0; index < args.length; index++) {
				switch (args[index]) {
					case "--quiet":
						greeter.greet(person.name(), Mood.QUIET);
						break;
					default:
						greeter.greet(args[index], Mood.HAPPY);
				}
			}
		} catch (IOException error) {
			showMessage(error.getMessage());
		} finally {
			showMessage("Greetings sent: " + count);
		}
	}
}`,
};
let editor;
let highlightedLines = [];
let activeCodeLanguage = selectedCodeLanguage();
try {
	const createDemoEditor = async (value, codeLanguage) => {
		const instance = await createEditor(document.querySelector('#editor'), {
			language: selectedLanguage(),
			codeLanguage,
			colorScheme: selectedColorScheme(),
			value,
			fontSize: 18,
			...extensionSettings(),
		});
		instance.setSettings({ ...extensionSettings(), colorScheme: selectedColorScheme() });
		instance.setHighlightedLines(highlightedLines);
		return instance;
	};
	editor = await createDemoEditor(samples[activeCodeLanguage], activeCodeLanguage);
	highlightForm.onsubmit = event => {
		event.preventDefault();
		if (!editor) return;

		const value = highlightInput.value.trim();
		const entries = value ? value.split(',').map(entry => entry.trim()) : [];
		const lines = entries.map(Number);
		if (entries.some(entry => !/^\d+$/.test(entry)) ||
			lines.some(line => !Number.isSafeInteger(line) || line < 1 || line > editor.getLineCount())) {
			status.textContent = `Enter line numbers from 1 to ${editor.getLineCount()}, separated by commas.`;
			return;
		}
		highlightedLines = [...new Set(lines)].map(line => line - 1);
		editor.setHighlightedLines(highlightedLines);
		status.textContent = highlightedLines.length ? 'Line highlights applied.' : 'Line highlights cleared.';
	};
	highlightForm.querySelector('button').disabled = false;
	document.querySelector('#language').onchange = () => editor.setSettings({ language: selectedLanguage() });
	document.querySelector('#appearance').onchange = () => editor?.setSettings({ colorScheme: selectedColorScheme() });
	document.querySelector('#code-language').onchange = async () => {
		const nextLanguage = selectedCodeLanguage();
		if (nextLanguage === activeCodeLanguage) return;

		if (editor) {
			samples[activeCodeLanguage] = editor.getValue();
			editor.destroy();
			editor = null;
		}
		activeCodeLanguage = nextLanguage;
		try {
			editor = await createDemoEditor(samples[activeCodeLanguage], activeCodeLanguage);
			status.textContent = `Switched to ${activeCodeLanguage}.`;
		} catch (error) {
			status.textContent = error.stack || error.message;
		}
	};
	extensionControls.onchange = () => editor?.setSettings(extensionSettings());
	document.querySelector('#undo').onclick = () => editor.execute('undo');
	document.querySelector('#paste').onmousedown = event => event.preventDefault();
	document.querySelector('#paste').onclick = async () => {
		const settings = editor.getSettings();
		if (settings.disabled || settings.readOnly) {
			status.textContent = 'Paste is disabled while the editor is read-only or disabled.';
			return;
		}
		const before = editor.getValue();
		try {
			editor.execute('paste');
			await new Promise(resolve => setTimeout(resolve, 50));
			status.textContent = editor.getValue() !== before
				? 'Editor text changed after Paste.'
				: 'No text change detected. Your browser may block the Paste button. Try Ctrl+V or Command+V in the editor. Pasting identical text may also leave it unchanged.';
		} catch (error) {
			status.textContent = 'Paste failed: ' + error.message;
		}
	};
	document.querySelector('#format').onclick = () => editor.execute('format');
	document.querySelector('#analysis').onclick = async () => {
		status.textContent = JSON.stringify(await editor.analyzeNow(), null, 2);
	};
	for (const key of ['readonly', 'disabled']) {
		document.querySelector('#' + key).onclick = () => {
			const setting = key === 'readonly' ? 'readOnly' : key;
			editor.setSettings({
				[setting]: !editor.getSettings()[setting],
			});
			status.textContent = JSON.stringify(editor.getState());
		};
	}
	document.querySelector('#recreate').onclick = async () => {
		const value = editor.getValue();
		editor.destroy();
		editor = await createDemoEditor(value, activeCodeLanguage);
		status.textContent = 'Editor recreated.';
	};
	status.textContent = 'Ready. Try IME input, search, completion, and resizing.';
} catch (error) {
	status.textContent = error.stack;
}
