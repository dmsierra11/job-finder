import { config } from "dotenv";
import { generateCvs } from "./cv/generate-cv.js";
import { pollEmail } from "./poll-email.js";
import { gmailSearchQuery, loadJobBoards } from "./sources/job-boards.js";

config({ quiet: true });

const command = process.argv[2] ?? "poll-email";

if (command === "poll-email") {
  await pollEmail();
} else if (command === "print-gmail-query") {
  const boards = await loadJobBoards();
  console.log(gmailSearchQuery(boards));
} else if (command === "generate-cv") {
  await generateCvs(process.argv[3]);
} else {
  console.error(
    "Usage: tsx src/cli.ts <poll-email|print-gmail-query|generate-cv> [markdown-file]",
  );
  process.exitCode = 1;
}
