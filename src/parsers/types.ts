import type { JobBoard } from "../schemas.js";

export type JobDraft = {
  source: string;
  title: string;
  company: string;
  location: string;
  url: string;
};

export type ParseEmailInput = {
  source: JobBoard;
  headers: { from: string; subject: string };
  text: string;
  html: string;
};

export type EmailParser = (input: ParseEmailInput) => JobDraft[];
