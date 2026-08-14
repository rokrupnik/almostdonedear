/**
 * Builds the Claude Design bundle from the live component gallery.
 *
 * The repository is the single source of truth for the design system; this
 * script produces a *snapshot* of it for review. Nothing here is hand-written
 * markup — it renders /dev/ui in a real browser, lifts each section out with the
 * styles that applied to it, and writes one self-contained preview per group.
 *
 * Run: pnpm run design:bundle    (output: design/*.html)
 */
import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const PORT = 5199;
const ORIGIN = `http://localhost:${PORT}`;
const OUT_DIR = new URL('../design/', import.meta.url);

/** Cards are grouped in the Design System pane by this label. */
const GROUP = 'Components';

const slug = (text) =>
	text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

async function waitForServer(url, timeoutMs = 60_000) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(url);
			if (res.ok) return;
		} catch {
			// not up yet
		}
		await new Promise((r) => setTimeout(r, 300));
	}
	throw new Error(`dev server did not start on ${url}`);
}

const server = spawn('pnpm', ['exec', 'vite', 'dev', '--port', String(PORT), '--strictPort'], {
	stdio: 'ignore',
	detached: false
});

try {
	await waitForServer(`${ORIGIN}/dev/ui`);

	const browser = await chromium.launch();
	const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
	await page.goto(`${ORIGIN}/dev/ui`, { waitUntil: 'networkidle' });

	const sections = await page.evaluate(() => {
		// every rule that made it into the page, dev-server injected styles included
		const css = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
		const nodes = [...document.querySelectorAll('main > section')];
		return nodes.map((node) => ({
			title: node.querySelector('h2')?.textContent?.trim() ?? 'Untitled',
			html: node.outerHTML,
			css
		}));
	});

	await browser.close();

	await rm(OUT_DIR, { recursive: true, force: true });
	await mkdir(OUT_DIR, { recursive: true });

	for (const section of sections) {
		const name = slug(section.title);
		const file = new URL(`${name}.html`, OUT_DIR);
		const page = `<!-- @dsCard group="${GROUP}" -->
<!doctype html>
<html lang="sl">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>${section.title} · AlmostDone, Dear</title>
		<style>
${section.css}
		</style>
		<style>
			body {
				margin: 0;
				padding: 24px;
				background: var(--app-bg);
				color: var(--app-text);
			}
		</style>
	</head>
	<body>
${section.html}
	</body>
</html>
`;
		await writeFile(file, page, 'utf8');
		console.log(`design/${name}.html  ←  ${section.title}`);
	}

	console.log(`\n${sections.length} previews written. Generated file — do not edit by hand.`);
} finally {
	server.kill('SIGTERM');
}
