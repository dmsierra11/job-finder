import { getGmailClient } from "./gmail/oauth.js";
import { getMessage, listMessageIds } from "./gmail/messages.js";
import { loadProcessedIds, saveProcessedIds } from "./gmail/processed-ids.js";
import { loadMatchPolicy } from "./load-json.js";
import { parseJobAlertEmail } from "./parsers/route.js";
import { scoreJob } from "./scoring/score-job.js";
import {
  boardForSender,
  gmailSearchQuery,
  loadJobBoards,
} from "./sources/job-boards.js";
import {
  loadRecommendedJobs,
  saveRecommendedJobs,
  upsertRecommendations,
} from "./store/recommended-jobs.js";

export async function pollEmail(): Promise<void> {
  const boards = await loadJobBoards();
  const query = gmailSearchQuery(boards);
  const policy = await loadMatchPolicy();
  const auth = await getGmailClient();
  const processed = await loadProcessedIds();
  let store = await loadRecommendedJobs();

  const ids = await listMessageIds(auth, query);
  const pending = ids.filter((id) => !processed.has(id));

  let unknownSender = 0;
  let parseFailures = 0;
  let jobsSeen = 0;
  const totals = {
    added: 0,
    updated: 0,
    preserved: 0,
    skippedBelowThreshold: 0,
  };

  for (const id of pending) {
    const message = await getMessage(auth, id);
    const board = boardForSender(boards, message.from);
    if (!board) {
      unknownSender += 1;
      processed.add(id);
      continue;
    }

    try {
      const drafts = parseJobAlertEmail({
        source: board,
        headers: { from: message.from, subject: message.subject },
        text: message.text,
        html: message.html,
      });
      jobsSeen += drafts.length;
      const scores = drafts.map((draft) => scoreJob(draft, policy));
      const next = upsertRecommendations(store, drafts, scores);
      store = next.store;
      totals.added += next.result.added;
      totals.updated += next.result.updated;
      totals.preserved += next.result.preserved;
      totals.skippedBelowThreshold += next.result.skippedBelowThreshold;
      processed.add(id);
    } catch {
      parseFailures += 1;
    }
  }

  await saveRecommendedJobs(store);
  await saveProcessedIds(processed);

  console.log(
    [
      `query: ${query}`,
      `messages: ${ids.length} listed, ${pending.length} new, ${unknownSender} unknown sender, ${parseFailures} parse failures`,
      `jobs: ${jobsSeen} parsed, ${totals.added} added, ${totals.updated} updated, ${totals.preserved} preserved, ${totals.skippedBelowThreshold} below threshold`,
    ].join("\n"),
  );
}
