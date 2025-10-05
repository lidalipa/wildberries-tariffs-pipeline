// @ts-nocheck
import knex, { migrate, seed } from "#postgres/knex.js";
import env from "#config/env/env.js";
import { WbClient, extractCoefficients } from "#services/wbClient.js";
import { upsertTodayPayload, listSpreadsheetIds, getTodayPayload } from "#repositories/tariffsRepo.js";
import { writeCoefficients } from "#services/googleSheets.js";

// Run DB migrations and seeds on start
await migrate.latest();
await seed.run();
console.log("All migrations and seeds have been run");

// Core job: fetch -> upsert -> publish
async function runJob(source: string) {
	try {
		const client = new WbClient();
	const today = new Date().toISOString().slice(0, 10);
	const data = await client.fetchTariffs(today);
		if (data) {
			await upsertTodayPayload(data);
		}
		const effective = data ?? (await getTodayPayload());
		if (!effective) {
			console.warn("No WB data available to publish");
			return;
		}
		const coeffs = extractCoefficients(effective);
		const rows = coeffs.map((c) => [c.path, c.coefficient] as [string, number]);
		// If Google credentials are not provided, skip publishing
		if (!env.GOOGLE_CLIENT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
			console.warn("Google credentials are not set; skipping sheets update");
			return;
		}
		const spreadsheetIds = await listSpreadsheetIds();
		for (const id of spreadsheetIds) {
			try {
				await writeCoefficients(id, rows);
				console.log(`[${source}] Updated Google Sheet ${id} with ${rows.length} rows`);
			} catch (e) {
				console.error(`Failed to update sheet ${id}:`, e);
			}
		}
	} catch (e) {
		console.error("Job error:", e);
	}
}

// Immediate run on start
await runJob("startup");

// Schedule job
const minutes = env.FETCH_INTERVAL_MINUTES ?? 60;
setInterval(() => {
	runJob("interval");
}, minutes * 60 * 1000);

// Simple HTTP health endpoint to keep container alive if needed
const port = env.APP_PORT ?? 5000;
import http from "http";
const server = http.createServer((_req: http.IncomingMessage, res: http.ServerResponse) => {
	res.statusCode = 200;
	res.setHeader("Content-Type", "application/json");
	res.end(JSON.stringify({ ok: true }));
});
server.listen(port, () => console.log(`App listening on ${port}`));