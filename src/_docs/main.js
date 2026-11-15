import 'klales/klales.min.css';

// Load the distributed modules unchanged, including the analysis worker.
const { createEditor } = await import(/* @vite-ignore */ new URL('croq-mirror.min.js', document.baseURI).href);
const status = document.querySelector('#status');
const selectedLanguage = () => document.querySelector('input[name="language"]:checked').value;
const selectedCodeLanguage = () => document.querySelector('input[name="code-language"]:checked').value;
const extensionControls = document.querySelector('#extensions');
const extensionSettings = () => Object.fromEntries(
	Array.from(extensionControls.querySelectorAll('input[type="checkbox"]'), input => [input.name, input.checked]),
);
const samples = {
	javascript: `// Functions, parameters and literals
function showMessage(message) {
	console.log(message);
}

class Greeter {
	prefix = "Hello";
	static count = 0;

	greet(name) {
		const message = this.prefix + ", " + name;
		let remaining = 2;
		while (remaining > 0) {
			if (name !== null && name !== "") {
				showMessage(message);
			} else {
				showMessage("Hello, guest");
			}
			remaining--;
		}
	}
}

const options = { enabled: true, name: "Croqujs" };
const { enabled, name } = options;
const { name: displayName } = options;
showMessage(displayName);
const isName = value => /^[A-Z]/.test(value);
for (let index = 0; index < 2; index++) {
	if (enabled && isName(name)) new Greeter().greet(name);
}`,
	java: `// Types, fields, methods and parameters
interface Greeting {
	void greet(String name);
}

enum Mood { HAPPY, QUIET }
record Person(String name, int age) {}

class Greeter implements Greeting {
	private final String prefix = "Hello";
	private static int count = 0;

	public void greet(String name) {
		count++;
		String message = prefix + ", " + name;
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

	public static void main(String[] args) {
		Person person = new Person("Croqujs", 20);
		Mood mood = Mood.HAPPY;
		boolean enabled = true;
		for (int index = 0; index < 2; index++) {
			if (enabled && mood == Mood.HAPPY) {
				new Greeter().greet(person.name());
			}
		}
	}
}`,
};
let editor;
let activeCodeLanguage = selectedCodeLanguage();
try {
	const createDemoEditor = async (value, codeLanguage) => {
		const instance = await createEditor(document.querySelector('#editor'), {
			language: selectedLanguage(), codeLanguage, value, fontSize: 18,
			...extensionSettings(),
		});
		instance.setSettings(extensionSettings());
		return instance;
	};
	editor = await createDemoEditor(samples[activeCodeLanguage], activeCodeLanguage);
	document.querySelector('#language').onchange = () => editor.setSettings({ language: selectedLanguage() });
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
