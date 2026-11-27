/**
 * Assemble shared Java analysis snapshots from classified ranges and section starts.
 *
 * @author Takuto Yanagida
 * @version 2026-11-28
 */

export function buildCommonAnalysis(sourceLength, complete, ranges, sectionStarts, lineStarts) {
	const { structures, declarations, syntax, references } = ranges;
	return {
		sourceLength,
		complete,
		structures,
		declarations,
		syntax,
		references,
		sections: sectionStarts.map(line => ({ kind: 'function', from: lineStarts[line] })),
	};
}
