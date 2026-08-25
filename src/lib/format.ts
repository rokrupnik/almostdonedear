/**
 * Times as a Slovenian reads them, in one timezone.
 *
 * Everyone using this app is in the same country, and the alternative — storing
 * the browser's offset and reasoning about it per user — buys nothing here and
 * costs a class of bug that only appears twice a year. So: the wall-clock time a
 * person types is Ljubljana time, and every rendering is Ljubljana time,
 * including the one the worker renders in UTC before hydration.
 */
export const APP_TZ = 'Europe/Ljubljana';

const day = new Intl.DateTimeFormat('sl-SI', {
	weekday: 'short',
	day: 'numeric',
	month: 'long',
	timeZone: APP_TZ
});

const time = new Intl.DateTimeFormat('sl-SI', {
	hour: '2-digit',
	minute: '2-digit',
	timeZone: APP_TZ
});

const parts = new Intl.DateTimeFormat('en-CA', {
	timeZone: APP_TZ,
	hour12: false,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit'
});

function fields(date: Date) {
	const found = Object.fromEntries(parts.formatToParts(date).map((p) => [p.type, p.value]));
	return {
		year: Number(found.year),
		month: Number(found.month),
		day: Number(found.day),
		// midnight comes back as 24 in some runtimes
		hour: Number(found.hour) % 24,
		minute: Number(found.minute),
		second: Number(found.second)
	};
}

/** How far Ljubljana is from UTC at that instant — DST included. */
function offsetAt(date: Date): number {
	const f = fields(date);
	return Date.UTC(f.year, f.month - 1, f.day, f.hour, f.minute, f.second) - date.getTime();
}

export function formatWhen(startsAt: Date, endsAt: Date): string {
	const sameDay = day.format(startsAt) === day.format(endsAt);
	return sameDay
		? `${day.format(startsAt)}, ${time.format(startsAt)}–${time.format(endsAt)}`
		: `${day.format(startsAt)} ${time.format(startsAt)} → ${day.format(endsAt)} ${time.format(endsAt)}`;
}

/** `datetime-local` wants wall-clock time, and this app's wall clock is Ljubljana's. */
export function toLocalInput(value: Date | null | undefined): string {
	if (!value) return '';
	const f = fields(value);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${f.year}-${pad(f.month)}-${pad(f.day)}T${pad(f.hour)}:${pad(f.minute)}`;
}

/**
 * The inverse: "2026-09-05T08:00" typed by a person means 08:00 in Ljubljana,
 * whatever the server thinks the time is. Applying the offset twice settles the
 * hour on either side of a DST change, where the first guess can land in the
 * wrong regime.
 */
export function fromLocalInput(value: string | null | undefined): Date | null {
	if (!value) return null;
	const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value.trim());
	if (!match) return null;

	const [, y, mo, d, h, mi] = match.map(Number) as unknown as number[];
	const asUtc = Date.UTC(y, mo - 1, d, h, mi);

	let instant = new Date(asUtc - offsetAt(new Date(asUtc)));
	instant = new Date(asUtc - offsetAt(instant));
	return Number.isNaN(instant.getTime()) ? null : instant;
}
