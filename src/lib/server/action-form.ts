import { fromLocalInput } from '$lib/format';
import type { ActionInput } from './actions';

/** One parser for the create form and the edit form, so they cannot drift. */
export function readActionForm(form: FormData): Partial<ActionInput> {
	const number = (name: string) => {
		const raw = String(form.get(name) ?? '').trim();
		return raw === '' ? null : Number(raw);
	};

	return {
		title: String(form.get('title') ?? ''),
		description: String(form.get('description') ?? ''),
		// an unparseable date stays invalid rather than becoming "now"
		startsAt: fromLocalInput(String(form.get('startsAt') ?? '')) ?? new Date(NaN),
		endsAt: fromLocalInput(String(form.get('endsAt') ?? '')) ?? new Date(NaN),
		locationName: String(form.get('locationName') ?? ''),
		locationAddress: String(form.get('locationAddress') ?? ''),
		minParticipants: number('minParticipants'),
		minDecisionAt: fromLocalInput(String(form.get('minDecisionAt') ?? '')),
		maxParticipants: number('maxParticipants')
	};
}
