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
	constructor(private readonly apiKey: string) {}

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
				html: mail.html
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
	return key ? new ResendMailer(key) : new ConsoleMailer();
}

export function signInMail(link: string): Omit<Mail, 'to'> {
	return {
		subject: 'Prijava v AlmostDone, Dear',
		text: [
			'Živjo!',
			'',
			'Za prijavo odpri to povezavo:',
			link,
			'',
			'Povezava velja 15 minut in samo enkrat.',
			'Če prijave nisi zahteval, to sporočilo mirno izbriši.'
		].join('\n'),
		html: [
			'<p>Živjo!</p>',
			`<p><a href="${link}">Prijavi se</a></p>`,
			'<p>Povezava velja 15 minut in samo enkrat.<br>',
			'Če prijave nisi zahteval, to sporočilo mirno izbriši.</p>'
		].join('')
	};
}
