/**
 * Configure automatic closing of brackets and quotes for a language.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { keymap } from '@codemirror/view';

export function closeBracketsFor(language, ...extraBrackets) {
	return closeBraces => {
		const brackets = ['(', '[', "'", '"', ...extraBrackets];
		if (closeBraces) {
			brackets.push('{');
		}
		return [
			language.data.of({
				closeBrackets: { brackets }
			}),
			closeBrackets(),
			keymap.of(closeBracketsKeymap)
		];
	};
}
