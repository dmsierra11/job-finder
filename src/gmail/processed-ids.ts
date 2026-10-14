import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { processedIdsPath } from "../paths.js";

type ProcessedStore = {
  messageIds: string[];
};

export async function loadProcessedIds(
  filePath = processedIdsPath,
): Promise<Set<string>> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as ProcessedStore;
    return new Set(parsed.messageIds ?? []);
  } catch {
    return new Set();
  }
}

export async function saveProcessedIds(
  ids: Set<string>,
  filePath = processedIdsPath,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const payload: ProcessedStore = { messageIds: [...ids].sort() };
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}
