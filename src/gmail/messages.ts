import { google, type gmail_v1 } from "googleapis";
import type { GmailAuth } from "./oauth.js";

export type GmailMessage = {
  id: string;
  from: string;
  subject: string;
  text: string;
  html: string;
};

export async function listMessageIds(
  auth: GmailAuth,
  query: string,
): Promise<string[]> {
  const gmail = google.gmail({ version: "v1", auth });
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const response = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 100,
      pageToken,
    });
    for (const message of response.data.messages ?? []) {
      if (message.id) {
        ids.push(message.id);
      }
    }
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return ids;
}

export async function getMessage(
  auth: GmailAuth,
  id: string,
): Promise<GmailMessage> {
  const gmail = google.gmail({ version: "v1", auth });
  const response = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "full",
  });
  const payload = response.data.payload;
  return {
    id,
    from: header(payload, "From") ?? "",
    subject: header(payload, "Subject") ?? "",
    text: collectBodies(payload, "text/plain").join("\n"),
    html: collectBodies(payload, "text/html").join("\n"),
  };
}

function header(
  payload: gmail_v1.Schema$MessagePart | undefined,
  name: string,
): string | undefined {
  return payload?.headers?.find(
    (item) => item.name?.toLowerCase() === name.toLowerCase(),
  )?.value ?? undefined;
}

function collectBodies(
  part: gmail_v1.Schema$MessagePart | undefined,
  mimeType: string,
): string[] {
  if (!part) {
    return [];
  }
  const chunks: string[] = [];
  if (part.mimeType === mimeType && part.body?.data) {
    chunks.push(Buffer.from(part.body.data, "base64url").toString("utf8"));
  }
  for (const child of part.parts ?? []) {
    chunks.push(...collectBodies(child, mimeType));
  }
  return chunks;
}
