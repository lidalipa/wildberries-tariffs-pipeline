import env from "#config/env/env.js";
// Lazy import to avoid type resolution issues during tsc check environments
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { google } from "googleapis";

export type Row = [string, number];

function getJwt() {
    const email = env.GOOGLE_CLIENT_EMAIL;
    let key = env.GOOGLE_PRIVATE_KEY;
    if (!email || !key) throw new Error("Google credentials are not configured");
    // Support newline-escaped private key from .env
    key = key.replace(/\\n/g, "\n");
    return new google.auth.JWT({
        email,
        key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
}

export async function writeCoefficients(spreadsheetId: string, rows: Row[], sheetTitle = env.GOOGLE_SHEET_TITLE ?? "stocks_coefs") {
    const auth = getJwt();
    const sheets = google.sheets({ version: "v4", auth });

    // Ensure sheet exists
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const titles = meta.data.sheets?.map((s: any) => s.properties?.title) ?? [];
    const requests: any[] = [];
    if (!titles.includes(sheetTitle)) {
        requests.push({
            addSheet: {
                properties: { title: sheetTitle },
            },
        });
    }
    if (requests.length > 0) {
        await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
    }

    // Clear range
    const range = `${sheetTitle}!A1:B1`;
    await sheets.spreadsheets.values.clear({ spreadsheetId, range });

    // Prepare data with header
    const values: (string | number)[][] = [["path", "coefficient"], ...rows.map((r) => r as (string | number)[])];
    const writeRange = `${sheetTitle}!A1:B${values.length}`;
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: writeRange,
        valueInputOption: "RAW",
        requestBody: { values },
    });
}
