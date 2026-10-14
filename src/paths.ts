import path from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(srcDir, "..");
export const dataDir = path.join(repoRoot, "data");
export const secretsDir = path.join(dataDir, ".secrets");
export const stateDir = path.join(dataDir, "state");
export const cvDocsDir = path.join(dataDir, "cv", "docs");
export const cvPdfsDir = path.join(dataDir, "cv", "pdfs");

export const jobBoardsPath = path.join(dataDir, "sources", "job-boards.json");
export const matchPolicyPath = path.join(dataDir, "match-policy.json");
export const recommendedJobsPath = path.join(dataDir, "recommended-jobs.json");
export const gmailTokenPath = path.join(secretsDir, "gmail-token.json");
export const processedIdsPath = path.join(stateDir, "processed-message-ids.json");
