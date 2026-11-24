const LOOP_STATEMENTS = new Set(['for_statement', 'enhanced_for_statement', 'while_statement', 'do_statement']);

export function diagnoseJava(root, locale, parser, source) {
	const opening = parser && root.hasError ? findUnclosedString(root) : null;
	if (!opening) return collectDiagnostics(root, locale);

	const start = opening.startIndex;
	const line = opening.startPosition.row;
	const column = opening.startPosition.column;
	const remainder = source.slice(start + 1).split(/[\r\n]/, 1)[0];
	// Keep a trailing statement terminator outside the repaired string.
	const content = remainder.replace(/;[^\S\r\n]*$/, '');
	const insertion = start + 1 + content.length;
	const repaired = parser.parse(source.slice(0, insertion) + '"' + source.slice(insertion));
	try {
		const insertionColumn = column + 1 + content.length;
		const originalPosition = position => ({
			line: position.line,
			ch: position.line === line && position.ch > insertionColumn ? position.ch - 1 : position.ch,
		});
		return [{
			message: locale === 'ja' ? '文字列を閉じる「"」が必要です。' : 'Expected a closing quote for this string.',
			severity: 'error',
			from: { line, ch: column },
			to: { line, ch: column + 1 },
		}, ...collectDiagnostics(repaired.rootNode, locale).map(item => ({
			...item,
			from: originalPosition(item.from),
			to: originalPosition(item.to),
		}))];
	} finally {
		repaired.delete();
	}
}

function findUnclosedString(root) {
	const cursor = root.walk();
	try {
		for (;;) {
			const node = cursor.currentNode;
			if (node.type === 'string_literal' && node.startPosition.row !== node.endPosition.row) {
				const opening = node.firstChild;
				if (opening?.type === '"') return opening;
			}
			if (node.type === '"' && !node.isMissing && node.parent?.isError) {
				const next = node.nextSibling;
				if (!next || next.type === 'string_fragment') return node;
			}
			if (cursor.gotoFirstChild()) continue;
			while (!cursor.gotoNextSibling()) {
				if (!cursor.gotoParent()) return null;
			}
		}
	} finally {
		cursor.delete();
	}
}

function collectDiagnostics(root, locale) {
	const japanese = locale === 'ja';
	const diagnostics = [];
	const position = ({ row, column }) => ({ line: row, ch: column });
	const add = (node, severity, message) => diagnostics.push({
		message,
		severity,
		from: position(node.startPosition),
		to  : position(node.endPosition),
	});
	const checkBody = node => {
		if (!node || node.type === 'block' || node.hasError) return;
		add(node, 'warning', japanese ? '文を波括弧 { } で囲んでください。' : 'Wrap the statement in braces.');
	};

	const cursor = root.walk();
	try {
		for (;;) {
			const node = cursor.currentNode;
			if (node.isMissing) {
				add(node, 'error', japanese ? `「${node.type}」が必要です。` : `Expected "${node.type}".`);
			} else if (node.isError) {
				add(node, 'error', japanese ? 'この部分の構文を確認してください。' : 'Unexpected syntax.');
			} else if (node.type === 'if_statement') {
				checkBody(node.childForFieldName('consequence'));
				const alternative = node.childForFieldName('alternative');
				if (alternative?.type !== 'if_statement') checkBody(alternative);
			} else if (LOOP_STATEMENTS.has(node.type)) {
				checkBody(node.childForFieldName('body'));
			}
			if (!node.isError && cursor.gotoFirstChild()) continue;
			while (!cursor.gotoNextSibling()) {
				if (!cursor.gotoParent()) return diagnostics;
			}
		}
	} finally {
		cursor.delete();
	}
}
