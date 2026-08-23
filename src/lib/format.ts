/** Dates as a Slovenian reads them. Used on both sides of the wire. */
const day = new Intl.DateTimeFormat('sl-SI', {
	weekday: 'short',
	day: 'numeric',
	month: 'long'
});

const time = new Intl.DateTimeFormat('sl-SI', { hour: '2-digit', minute: '2-digit' });

export function formatWhen(startsAt: Date, endsAt: Date): string {
	const sameDay = startsAt.toDateString() === endsAt.toDateString();
	return sameDay
		? `${day.format(startsAt)}, ${time.format(startsAt)}–${time.format(endsAt)}`
		: `${day.format(startsAt)} ${time.format(startsAt)} → ${day.format(endsAt)} ${time.format(endsAt)}`;
}

/** `datetime-local` wants local wall-clock time, not an ISO string in UTC. */
export function toLocalInput(value: Date | null | undefined): string {
	if (!value) return '';
	const offset = value.getTimezoneOffset() * 60_000;
	return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

export function fromLocalInput(value: string | null | undefined): Date | null {
	if (!value) return null;
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}
