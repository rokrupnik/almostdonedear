/**
 * The one place that knows there is an email provider (ADR-011).
 *
 * Resend is replaceable behind this interface, which matters because
 * deliverability problems are provider-specific and the fix is often "try
 * another one" rather than "debug this one".
 */
export type Mail = {
	to: string;
	subject: string;
	text: string;
	html: string;
};

export interface Mailer {
	send(mail: Mail): Promise<void>;
}

const FROM = 'AlmostDone, Dear <pozdrav@almostdonedear.app>';

class ResendMailer implements Mailer {
	constructor(
		private readonly apiKey: string,
		/** A domain that can receive mail scores better, and replies stop vanishing. */
		private readonly replyTo?: string
	) {}

	async send(mail: Mail): Promise<void> {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				authorization: `Bearer ${this.apiKey}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				from: FROM,
				to: [mail.to],
				subject: mail.subject,
				text: mail.text,
				html: mail.html,
				...(this.replyTo ? { reply_to: this.replyTo } : {})
			})
		});

		if (!response.ok) {
			// the body carries the reason; the key is not in it
			throw new Error(`resend: ${response.status} ${await response.text()}`);
		}
	}
}

/** No key configured — development. The message goes to the terminal instead. */
class ConsoleMailer implements Mailer {
	async send(mail: Mail): Promise<void> {
		console.log(`\n--- mail to ${mail.to}\n${mail.subject}\n\n${mail.text}\n---\n`);
	}
}

export function mailer(env: Env | undefined): Mailer {
	const key = env?.RESEND_API_KEY;
	const replyTo = (env as unknown as Record<string, string | undefined> | undefined)?.REPLY_TO;
	return key ? new ResendMailer(key, replyTo || undefined) : new ConsoleMailer();
}

/**
 * Two lines and a link is the shape of a phishing message, which is part of why
 * the first one landed in spam even with DKIM, SPF and DMARC all passing. It
 * says who we are, why this arrived, and shows the address it leads to.
 */
export function signInMail(link: string): Omit<Mail, 'to'> {
	return {
		subject: 'Tvoja prijavna povezava za AlmostDone, Dear',
		text: [
			'Živjo!',
			'',
			'Nekdo — najbrž ti — je na almostdonedear.app zahteval prijavo s tem',
			'naslovom. AlmostDone, Dear je aplikacija za dogovarjanje o mobah in',
			'izposojo orodja med prijatelji. Gesel nima; prijaviš se s to povezavo:',
			'',
			link,
			'',
			'Povezava velja 15 minut in samo enkrat.',
			'',
			'Če prijave nisi zahteval, ni treba storiti ničesar — brez klika se ne',
			'zgodi nič in sporočilo lahko izbrišeš.'
		].join('\n'),
		html: [
			'<p>Živjo!</p>',
			'<p>Nekdo — najbrž ti — je na <strong>almostdonedear.app</strong> zahteval ',
			'prijavo s tem naslovom. AlmostDone, Dear je aplikacija za dogovarjanje o ',
			'mobah in izposojo orodja med prijatelji. Gesel nima.</p>',
			`<p><a href="${link}">Prijavi se</a></p>`,
			`<p style="font-size:13px;color:#57534e">Če povezava ne deluje, prilepi v brskalnik:<br>${link}</p>`,
			'<p>Povezava velja 15 minut in samo enkrat.</p>',
			'<p style="font-size:13px;color:#57534e">Če prijave nisi zahteval, ni treba ',
			'storiti ničesar — brez klika se ne zgodi nič.</p>'
		].join('')
	};
}
