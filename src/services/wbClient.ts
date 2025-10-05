import env from "#config/env/env.js";

export type WbTariffsResponse = unknown;

export class WbClient {
    private baseUrl: string;
    private token?: string;

    constructor() {
        this.baseUrl = env.WB_API_URL ?? "https://common-api.wildberries.ru/api/v1/tariffs/box";
        this.token = env.WB_API_TOKEN;
    }

    async fetchTariffs(dateISO?: string): Promise<WbTariffsResponse | null> {
        if (!this.baseUrl) throw new Error("WB_API_URL is not configured");
        if (!this.token) {
            console.warn("WB_API_TOKEN is not set. Skipping WB fetch.");
            return null;
        }
        const date = dateISO ?? new Date().toISOString().slice(0, 10);
        const url = new URL(this.baseUrl);
        url.searchParams.set("date", date);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const doFetch = async (authHeader: string) => {
            const res = await fetch(url.toString(), {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: authHeader,
                },
                signal: controller.signal,
            });
            return res;
        };
        try {
            // WB обычно требует Authorization: <token> (без Bearer)
            let res = await doFetch(this.token);
            if (res.status === 401 || res.status === 403) {
                // На случай если нужен формат Bearer
                res = await doFetch(`Bearer ${this.token}`);
            }
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`WB API error ${res.status}: ${text}`);
            }
            return (await res.json()) as WbTariffsResponse;
        } finally {
            clearTimeout(timeout);
        }
    }
}

// Traverse arbitrary JSON and collect numeric "coefficient" fields
export function extractCoefficients(payload: unknown): Array<{ path: string; coefficient: number }> {
    const out: Array<{ path: string; coefficient: number }> = [];
    const toNumber = (val: unknown): number | null => {
        if (typeof val === "number" && Number.isFinite(val)) return val;
        if (typeof val === "string") {
            // normalize decimal comma to dot and trim spaces
            const normalized = val.replace(/\s+/g, "").replace(/,/g, ".");
            const n = Number.parseFloat(normalized);
            return Number.isFinite(n) ? n : null;
        }
        return null;
    };
    const visit = (node: any, path: string[]) => {
        if (node && typeof node === "object") {
            if (Array.isArray(node)) {
                node.forEach((v, i) => visit(v, path.concat(String(i))));
            } else {
                for (const [k, v] of Object.entries(node)) {
                    const lower = k.toLowerCase();
                    const num = toNumber(v);
                    if (num !== null && (lower === "coefficient" || lower === "coef" || lower.endsWith("_coef") || lower.includes("coef"))) {
                        out.push({ path: path.concat(k).join("."), coefficient: num });
                    }
                    visit(v, path.concat(k));
                }
            }
        }
    };
    visit(payload, []);
    out.sort((a, b) => a.coefficient - b.coefficient);
    return out;
}
