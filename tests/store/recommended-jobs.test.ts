import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { jobIdFromUrl } from "../../src/parsers/html.js";
import type { JobDraft } from "../../src/parsers/types.js";
import type { RecommendedJob, RecommendedJobsStore } from "../../src/schemas.js";
import type { ScoreResult } from "../../src/scoring/score-job.js";
import {
  loadRecommendedJobs,
  saveRecommendedJobs,
  upsertRecommendations,
} from "../../src/store/recommended-jobs.js";

const draft: JobDraft = {
  source: "LinkedIn Jobs",
  title: "Senior Product Engineer",
  company: "Acme",
  location: "Barcelona",
  url: "https://linkedin.com/jobs/view/111",
};

const pass: ScoreResult = {
  score: 80,
  reasons: ["title: product engineer"],
  recommend: true,
};

describe("recommended-jobs store", () => {
  it("dedupes by URL and updates a recommended row", () => {
    const first = upsertRecommendations(emptyStore(), [draft], [pass], "t1");
    assert.equal(first.result.added, 1);

    const second = upsertRecommendations(
      first.store,
      [{ ...draft, title: "Senior Product Engineer II" }],
      [{ ...pass, score: 84 }],
      "t2",
    );

    assert.equal(second.result.updated, 1);
    assert.equal(second.store.jobs.length, 1);
    assert.equal(second.store.jobs[0]?.title, "Senior Product Engineer II");
    assert.equal(second.store.jobs[0]?.discoveredAt, "t1");
  });

  it("does not overwrite saved, dismissed, or applied", () => {
    for (const status of ["saved", "dismissed", "applied"] as const) {
      const existing = existingJob({ status });
      const next = upsertRecommendations(
        { schemaVersion: 1, updatedAt: null, jobs: [existing] },
        [draft],
        [pass],
      );
      assert.equal(next.result.preserved, 1);
      assert.equal(next.store.jobs[0]?.status, status);
      assert.equal(next.store.jobs[0]?.title, existing.title);
    }
  });

  it("skips jobs below the recommend threshold", () => {
    const next = upsertRecommendations(emptyStore(), [draft], [
      { score: 10, reasons: ["rejected title: junior"], recommend: false },
    ]);
    assert.equal(next.result.skippedBelowThreshold, 1);
    assert.equal(next.store.jobs.length, 0);
  });

  it("round-trips JSON", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "job-finder-"));
    const filePath = path.join(dir, "recommended-jobs.json");
    const built = upsertRecommendations(emptyStore(), [draft], [pass], "t1");
    await saveRecommendedJobs(built.store, filePath);
    const loaded = await loadRecommendedJobs(filePath);
    assert.equal(loaded.jobs.length, 1);
    assert.equal(loaded.jobs[0]?.url, draft.url);
  });

  it("treats an empty file as an empty store", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "job-finder-"));
    const filePath = path.join(dir, "recommended-jobs.json");
    await writeFile(filePath, "");
    const loaded = await loadRecommendedJobs(filePath);
    assert.deepEqual(loaded.jobs, []);
  });
});

function emptyStore(): RecommendedJobsStore {
  return { schemaVersion: 1, updatedAt: null, jobs: [] };
}

function existingJob(
  overrides: Partial<RecommendedJob>,
): RecommendedJob {
  return {
    id: jobIdFromUrl(draft.url),
    source: draft.source,
    title: "Old title",
    company: draft.company,
    location: draft.location,
    url: draft.url,
    postedAt: null,
    discoveredAt: "old",
    discoveryChannel: "email",
    score: 70,
    reasons: [],
    status: "recommended",
    ...overrides,
  };
}
