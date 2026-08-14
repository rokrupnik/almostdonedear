/** Tiny class joiner — falsy entries drop out. Not worth a dependency. */
export function cx(...parts: (string | false | null | undefined)[]): string {
	return parts.filter(Boolean).join(' ');
}
