import { readFile } from "node:fs/promises";
import type { z } from "zod";
import { matchPolicyPath } from "./paths.js";
import { matchPolicySchema, type MatchPolicy } from "./schemas.js";

export async function loadJson<T>(
  filePath: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return schema.parse(JSON.parse(raw));
}

export async function loadMatchPolicy(): Promise<MatchPolicy> {
  return loadJson(matchPolicyPath, matchPolicySchema);
}
