/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
// @ts-nocheck
export async function seed(knex) {
    // In production we skip inserting example spreadsheet id to avoid 404s
    if (process.env.NODE_ENV === "production") {
        console.log("Skipping example spreadsheets seed in production");
        return;
    }
    await knex("spreadsheets")
        .insert([{ spreadsheet_id: "some_spreadsheet" }])
        .onConflict(["spreadsheet_id"])
        .ignore();
}
