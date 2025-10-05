// @ts-nocheck
import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.union([z.undefined(), z.enum(["development", "production"])]),
    POSTGRES_HOST: z.union([z.undefined(), z.string()]),
    POSTGRES_PORT: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value)),
    POSTGRES_DB: z.string(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    APP_PORT: z.union([
        z.undefined(),
        z
            .string()
            .regex(/^[0-9]+$/)
            .transform((value) => parseInt(value)),
    ]),
    // WB API
    WB_API_TOKEN: z.union([z.undefined(), z.string()]),
    WB_API_URL: z.union([z.undefined(), z.string()]),
    // Scheduler (minutes)
    FETCH_INTERVAL_MINUTES: z
        .union([
            z.undefined(),
            z
                .string()
                .regex(/^[0-9]+$/)
                .transform((value) => parseInt(value)),
        ]),
    // Google Service Account
    GOOGLE_CLIENT_EMAIL: z.union([z.undefined(), z.string()]),
    GOOGLE_PRIVATE_KEY: z.union([z.undefined(), z.string()]),
    GOOGLE_SHEET_TITLE: z.union([z.undefined(), z.string()]),
});

const env = envSchema.parse({
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
    APP_PORT: process.env.APP_PORT,
    WB_API_TOKEN: process.env.WB_API_TOKEN,
    WB_API_URL: process.env.WB_API_URL,
    FETCH_INTERVAL_MINUTES: process.env.FETCH_INTERVAL_MINUTES,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_SHEET_TITLE: process.env.GOOGLE_SHEET_TITLE,
});

export default env;
