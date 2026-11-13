import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type CachedCall = { content: string; cost_usd: number; model: string };

export interface LlmCache {
  get(key: string): Promise<CachedCall | null>;
  set(key: string, value: CachedCall): Promise<void>;
}

export function hashRequest(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

export function createFileCache(dir: string): LlmCache {
  const fileFor = (key: string) => path.join(dir, key.slice(0, 2), `${key}.json`);
  return {
    async get(key) {
      try {
        return JSON.parse(await readFile(fileFor(key), "utf8")) as CachedCall;
      } catch {
        return null;
      }
    },
    async set(key, value) {
      const file = fileFor(key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, JSON.stringify(value));
    },
  };
}

export function createMemoryCache(): LlmCache {
  const store = new Map<string, CachedCall>();
  return {
    async get(key) {
      return store.get(key) ?? null;
    },
    async set(key, value) {
      store.set(key, value);
    },
  };
}
