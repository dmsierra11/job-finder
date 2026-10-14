import { parseGlassdoorEmail } from "./glassdoor-email.js";
import { parseLinkedInEmail } from "./linkedin-email.js";
import { parseWttjEmail } from "./wttj-email.js";
import type { EmailParser, JobDraft, ParseEmailInput } from "./types.js";

const parsersByEmail: Record<string, EmailParser> = {
  "jobs-noreply@linkedin.com": parseLinkedInEmail,
  "help@welcometothejungle.com": parseWttjEmail,
  "noreply@glassdoor.com": parseGlassdoorEmail,
};

export function parseJobAlertEmail(input: ParseEmailInput): JobDraft[] {
  const address = input.source.emailAddress?.toLowerCase();
  if (!address) {
    return [];
  }
  const parser = parsersByEmail[address];
  if (!parser) {
    throw new Error(`No email parser registered for ${address}`);
  }
  return parser(input).filter((job) => job.title && job.url);
}
