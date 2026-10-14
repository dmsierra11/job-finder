import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { jobIdFromUrl } from "../parsers/html.js";
import type { JobDraft } from "../parsers/types.js";
import { recommendedJobsPath } from "../paths.js";
import {
  recommendedJobsStoreSchema,
  type RecommendedJob,
  type RecommendedJobsStore,
} from "../schemas.js";
import type { ScoreResult } from "../scoring/score-job.js";

const USER_STATUSES = new Set(["saved", "dismissed", "applied"]);

export type UpsertResult = {
  added: number;
  updated: number;
  preserved: number;
  skippedBelowThreshold: number;
};

export async function loadRecommendedJobs(
  filePath = recommendedJobsPath,
): Promise<RecommendedJobsStore> {
  try {
    const raw = await readFile(filePath, "utf8");
    if (!raw.trim()) {
      return emptyStore();
    }
    return recommendedJobsStoreSchema.parse(JSON.parse(raw));
  } catch (error) {
    if (isEnoent(error)) {
      return emptyStore();
    }
    throw error;
  }
}

export async function saveRecommendedJobs(
  store: RecommendedJobsStore,
  filePath = recommendedJobsPath,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const payload: RecommendedJobsStore = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    jobs: store.jobs,
  };
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

export function upsertRecommendations(
  store: RecommendedJobsStore,
  drafts: JobDraft[],
  scores: ScoreResult[],
  now = new Date().toISOString(),
): { store: RecommendedJobsStore; result: UpsertResult } {
  const jobs = [...store.jobs];
  const result: UpsertResult = {
    added: 0,
    updated: 0,
    preserved: 0,
    skippedBelowThreshold: 0,
  };

  for (let index = 0; index < drafts.length; index += 1) {
    const draft = drafts[index];
    const scored = scores[index];
    if (!draft || !scored) {
      continue;
    }
    if (!scored.recommend) {
      result.skippedBelowThreshold += 1;
      continue;
    }

    const id = jobIdFromUrl(draft.url);
    const existingIndex = jobs.findIndex(
      (job) => job.id === id || job.url === draft.url,
    );
    const next: RecommendedJob = {
      id,
      source: draft.source,
      title: draft.title,
      company: draft.company,
      location: draft.location,
      url: draft.url,
      postedAt: null,
      discoveredAt: now,
      discoveryChannel: "email",
      score: scored.score,
      reasons: scored.reasons,
      status: "recommended",
    };

    if (existingIndex === -1) {
      jobs.push(next);
      result.added += 1;
      continue;
    }

    const existing = jobs[existingIndex];
    if (!existing) {
      continue;
    }
    if (USER_STATUSES.has(existing.status)) {
      result.preserved += 1;
      continue;
    }
    jobs[existingIndex] = {
      ...next,
      discoveredAt: existing.discoveredAt,
      status: existing.status,
    };
    result.updated += 1;
  }

  return {
    store: { schemaVersion: 1, updatedAt: now, jobs },
    result,
  };
}

function emptyStore(): RecommendedJobsStore {
  return { schemaVersion: 1, updatedAt: null, jobs: [] };
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
