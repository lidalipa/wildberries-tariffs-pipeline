// @ts-nocheck
/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    await knex.schema.createTable("wb_tariffs_box_daily", (table) => {
        table.date("day").primary();
        table.jsonb("payload").notNullable();
        table.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists("wb_tariffs_box_daily");
}
