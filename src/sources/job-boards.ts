import { readFile } from "node:fs/promises";
import { jobBoardsPath } from "../paths.js";
import { jobBoardsSchema, type JobBoard } from "../schemas.js";

export async function loadJobBoards(): Promise<JobBoard[]> {
  const raw = await readFile(jobBoardsPath, "utf8");
  return jobBoardsSchema.parse(JSON.parse(raw));
}

export function boardsWithEmail(boards: JobBoard[]): JobBoard[] {
  return boards.filter((board): board is JobBoard & { emailAddress: string } =>
    Boolean(board.emailAddress),
  );
}

export function gmailSearchQuery(boards: JobBoard[], newerThanDays = 7): string {
  const senders = boardsWithEmail(boards).map(
    (board) => `from:${board.emailAddress}`,
  );
  if (senders.length === 0) {
    throw new Error("No job boards define emailAddress");
  }
  return `(${senders.join(" OR ")}) newer_than:${newerThanDays}d`;
}

export function boardForSender(
  boards: JobBoard[],
  fromHeader: string,
): JobBoard | undefined {
  const address = extractEmailAddress(fromHeader);
  if (!address) {
    return undefined;
  }
  return boards.find(
    (board) => board.emailAddress?.toLowerCase() === address,
  );
}

export function extractEmailAddress(header: string): string | undefined {
  const angled = header.match(/<([^>]+)>/);
  const raw = angled?.[1] ?? header.match(/(\S+@\S+)/)?.[1];
  return raw?.replace(/[<>]/g, "").toLowerCase();
}
