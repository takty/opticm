(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var{createEditor:e}=await import(new URL(`opticm.min.js`,document.baseURI).href),t=document.querySelector(`#status`),n=()=>document.querySelector(`input[name="language"]:checked`).value,r=()=>document.querySelector(`input[name="code-language"]:checked`).value,i=()=>document.querySelector(`input[name="color-scheme"]:checked`).value,a=document.querySelector(`#extensions`),o=()=>Object.fromEntries(Array.from(a.querySelectorAll(`input[type="checkbox"]`),e=>[e.name,e.checked])),s={javascript:`// Functions, parameters and literals
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

const options = { enabled: true, name: "Opticm" };
const { enabled, name } = options;
const { name: displayName } = options;
showMessage(displayName);
const isName = value => /^[A-Z]/.test(value);
for (let index = 0; index < 2; index++) {
	if (enabled && isName(name)) new Greeter().greet(name);
}`,java:`// Types, fields, methods and parameters
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
		Person person = new Person("Opticm", 20);
		Mood mood = Mood.HAPPY;
		boolean enabled = true;
		for (int index = 0; index < 2; index++) {
			if (enabled && mood == Mood.HAPPY) {
				new Greeter().greet(person.name());
			}
		}
	}
}`},c,l=r();try{let u=async(t,r)=>{let a=await e(document.querySelector(`#editor`),{language:n(),codeLanguage:r,colorScheme:i(),value:t,fontSize:18,...o()});return a.setSettings({...o(),colorScheme:i()}),a};c=await u(s[l],l),document.querySelector(`#language`).onchange=()=>c.setSettings({language:n()}),document.querySelector(`#appearance`).onchange=()=>c?.setSettings({colorScheme:i()}),document.querySelector(`#code-language`).onchange=async()=>{let e=r();if(e!==l){c&&=(s[l]=c.getValue(),c.destroy(),null),l=e;try{c=await u(s[l],l),t.textContent=`Switched to ${l}.`}catch(e){t.textContent=e.stack||e.message}}},a.onchange=()=>c?.setSettings(o()),document.querySelector(`#undo`).onclick=()=>c.execute(`undo`),document.querySelector(`#paste`).onmousedown=e=>e.preventDefault(),document.querySelector(`#paste`).onclick=async()=>{let e=c.getSettings();if(e.disabled||e.readOnly){t.textContent=`Paste is disabled while the editor is read-only or disabled.`;return}let n=c.getValue();try{c.execute(`paste`),await new Promise(e=>setTimeout(e,50)),t.textContent=c.getValue()===n?`No text change detected. Your browser may block the Paste button. Try Ctrl+V or Command+V in the editor. Pasting identical text may also leave it unchanged.`:`Editor text changed after Paste.`}catch(e){t.textContent=`Paste failed: `+e.message}},document.querySelector(`#format`).onclick=()=>c.execute(`format`),document.querySelector(`#analysis`).onclick=async()=>{t.textContent=JSON.stringify(await c.analyzeNow(),null,2)};for(let e of[`readonly`,`disabled`])document.querySelector(`#`+e).onclick=()=>{let n=e===`readonly`?`readOnly`:e;c.setSettings({[n]:!c.getSettings()[n]}),t.textContent=JSON.stringify(c.getState())};document.querySelector(`#recreate`).onclick=async()=>{let e=c.getValue();c.destroy(),c=await u(e,l),t.textContent=`Editor recreated.`},t.textContent=`Ready. Try IME input, search, completion, and resizing.`}catch(e){t.textContent=e.stack}