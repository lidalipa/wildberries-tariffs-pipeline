import knex from "#postgres/knex.js";

export async function upsertTodayPayload(payload: unknown): Promise<void> {
    const today = new Date();
    const dayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
    await knex("wb_tariffs_box_daily")
        .insert({ day: dayStr, payload, updated_at: knex.fn.now() })
        .onConflict(["day"]) // Postgres upsert by PK
        .merge({ payload, updated_at: knex.fn.now() });
}

export async function getTodayPayload(): Promise<any | null> {
    const today = new Date().toISOString().slice(0, 10);
    const row = await knex("wb_tariffs_box_daily").where({ day: today }).first();
    return row?.payload ?? null;
}

export async function listSpreadsheetIds(): Promise<string[]> {
    const rows = await knex("spreadsheets").select("spreadsheet_id");
    return rows.map((r: any) => r.spreadsheet_id);
}
