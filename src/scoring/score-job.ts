import type { MatchPolicy } from "../schemas.js";
import type { JobDraft } from "../parsers/types.js";

export type ScoreResult = {
  score: number;
  reasons: string[];
  recommend: boolean;
};

const BASE_SCORE = 50;
const TITLE_HIT = 12;
const SENIORITY_HIT = 10;
const LOCATION_HIT = 10;
const INDUSTRY_HIT = 5;
const DOWNRANK = 20;
const US_ONLY_PENALTY = 30;

export function scoreJob(job: JobDraft, policy: MatchPolicy): ScoreResult {
  const haystack = `${job.title} ${job.company} ${job.location}`.toLowerCase();
  const title = job.title.toLowerCase();
  const reasons: string[] = [];

  const rejected = policy.title.reject.find((token) => includesToken(title, token));
  if (rejected) {
    return {
      score: 0,
      reasons: [`rejected title: ${rejected}`],
      recommend: false,
    };
  }

  let score = BASE_SCORE;

  for (const token of policy.title.prefer) {
    if (includesToken(title, token)) {
      score += TITLE_HIT;
      reasons.push(`title: ${token}`);
    }
  }

  for (const token of policy.title.seniorityPrefer) {
    if (includesToken(title, token)) {
      score += SENIORITY_HIT;
      reasons.push(`seniority: ${token}`);
      break;
    }
  }

  for (const token of policy.skills.prefer) {
    if (includesToken(haystack, token)) {
      score += policy.skills.weight;
      reasons.push(`skill: ${token}`);
    }
  }

  let locationHit = false;
  for (const token of policy.locations.prefer) {
    if (includesToken(haystack, token)) {
      score += LOCATION_HIT;
      reasons.push(`location: ${token}`);
      locationHit = true;
      break;
    }
  }

  for (const token of policy.industriesBonus) {
    if (includesToken(haystack, token)) {
      score += INDUSTRY_HIT;
      reasons.push(`industry: ${token}`);
    }
  }

  const downrank = policy.titleDownrank.find((token) =>
    includesToken(title, token),
  );
  if (downrank) {
    score -= DOWNRANK;
    reasons.push(`downrank: ${downrank}`);
  }

  const usLocked = policy.locations.rejectUnlessRemoteEu.find((token) =>
    includesToken(haystack, token),
  );
  const remoteEu =
    includesToken(haystack, "eu remote") ||
    (includesToken(haystack, "remote") &&
      (includesToken(haystack, "europe") ||
        includesToken(haystack, "eu") ||
        includesToken(haystack, "spain") ||
        includesToken(haystack, "barcelona")));

  if (usLocked && !remoteEu) {
    score -= US_ONLY_PENALTY;
    reasons.push(`location penalty: ${usLocked}`);
  }

  if (!locationHit && !usLocked) {
    reasons.push("no preferred location");
  }

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    reasons,
    recommend: score >= policy.recommendThreshold,
  };
}

function includesToken(haystack: string, token: string): boolean {
  const needle = token.toLowerCase();
  if (needle.includes(" ") || needle.includes(".") || needle.includes("-")) {
    return haystack.includes(needle);
  }
  return new RegExp(`\\b${escapeRegExp(needle)}\\b`, "i").test(haystack);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
