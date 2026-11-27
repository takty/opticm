(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var{createEditor:e}=await import(new URL(`opticm.min.js`,document.baseURI).href),t=document.querySelector(`#status`),n=()=>document.querySelector(`input[name="language"]:checked`).value,r=()=>document.querySelector(`input[name="code-language"]:checked`).value,i=()=>document.querySelector(`input[name="color-scheme"]:checked`).value,a=document.querySelector(`#extensions`),o=document.querySelector(`#static-line-highlighting`),s=document.querySelector(`#highlight-lines`),c=()=>Object.fromEntries(Array.from(a.querySelectorAll(`input[type="checkbox"]`),e=>[e.name,e.checked])),l={javascript:`// A greeter with two moods and a fallback for invalid input.
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

runDemo();`,java:`import java.io.BufferedReader;
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
}`},u,d=[],f=r();try{let p=async(t,r)=>{let a=await e(document.querySelector(`#editor`),{language:n(),codeLanguage:r,colorScheme:i(),value:t,fontSize:18,...c()});return a.setSettings({...c(),colorScheme:i()}),a.setHighlightedLines(d),a};u=await p(l[f],f),o.onsubmit=e=>{if(e.preventDefault(),!u)return;let n=s.value.trim(),r=n?n.split(`,`).map(e=>e.trim()):[],i=r.map(Number);r.some(e=>!/^\d+$/.test(e))||i.some(e=>!Number.isSafeInteger(e)||e<1||e>u.getLineCount())?t.textContent=`Enter line numbers from 1 to ${u.getLineCount()}, separated by commas.`:(d=[...new Set(i)].map(e=>e-1),u.setHighlightedLines(d),t.textContent=d.length?`Line highlights applied.`:`Line highlights cleared.`)},o.querySelector(`button`).disabled=!1,document.querySelector(`#language`).onchange=()=>u.setSettings({language:n()}),document.querySelector(`#appearance`).onchange=()=>u?.setSettings({colorScheme:i()}),document.querySelector(`#code-language`).onchange=async()=>{let e=r();if(e!==f){u&&=(l[f]=u.getValue(),u.destroy(),null),f=e;try{u=await p(l[f],f),t.textContent=`Switched to ${f}.`}catch(e){t.textContent=e.stack||e.message}}},a.onchange=()=>u?.setSettings(c()),document.querySelector(`#undo`).onclick=()=>u.execute(`undo`),document.querySelector(`#paste`).onmousedown=e=>e.preventDefault(),document.querySelector(`#paste`).onclick=async()=>{let e=u.getSettings();if(e.disabled||e.readOnly){t.textContent=`Paste is disabled while the editor is read-only or disabled.`;return}let n=u.getValue();try{u.execute(`paste`),await new Promise(e=>setTimeout(e,50)),t.textContent=u.getValue()===n?`No text change detected. Your browser may block the Paste button. Try Ctrl+V or Command+V in the editor. Pasting identical text may also leave it unchanged.`:`Editor text changed after Paste.`}catch(e){t.textContent=`Paste failed: `+e.message}},document.querySelector(`#format`).onclick=()=>u.execute(`format`),document.querySelector(`#analysis`).onclick=async()=>{t.textContent=JSON.stringify(await u.analyzeNow(),null,2)};for(let e of[`readonly`,`disabled`])document.querySelector(`#`+e).onclick=()=>{let n=e===`readonly`?`readOnly`:e;u.setSettings({[n]:!u.getSettings()[n]}),t.textContent=JSON.stringify(u.getState())};document.querySelector(`#recreate`).onclick=async()=>{let e=u.getValue();u.destroy(),u=await p(e,f),t.textContent=`Editor recreated.`},t.textContent=`Ready. Try IME input, search, completion, and resizing.`}catch(e){t.textContent=e.stack}