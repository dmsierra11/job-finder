import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { google } from "googleapis";
import { gmailTokenPath, secretsDir } from "../paths.js";

export type GmailAuth = InstanceType<typeof google.auth.OAuth2>;

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const REDIRECT_PORT = 53682;
const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}/oauth2callback`;

type TokenPayload = {
  refresh_token?: string | null;
  access_token?: string | null;
  scope?: string;
  token_type?: string | null;
  expiry_date?: number | null;
  id_token?: string | null;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and add your Google OAuth desktop client. Redirect URI must be ${REDIRECT_URI}`,
    );
  }
  return value;
}

function createClient(): GmailAuth {
  return new google.auth.OAuth2(
    requireEnv("GOOGLE_CLIENT_ID"),
    requireEnv("GOOGLE_CLIENT_SECRET"),
    REDIRECT_URI,
  );
}

async function loadSavedTokens(): Promise<TokenPayload | undefined> {
  try {
    const raw = await readFile(gmailTokenPath, "utf8");
    return JSON.parse(raw) as TokenPayload;
  } catch {
    return undefined;
  }
}

async function saveTokens(tokens: TokenPayload): Promise<void> {
  await mkdir(secretsDir, { recursive: true });
  await writeFile(gmailTokenPath, `${JSON.stringify(tokens, null, 2)}\n`, {
    mode: 0o600,
  });
}

function openBrowser(url: string): void {
  const opener = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(opener, [url], { detached: true, stdio: "ignore" }).unref();
}

async function authorizeInteractively(client: GmailAuth): Promise<void> {
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${REDIRECT_PORT}`);
      if (url.pathname !== "/oauth2callback") {
        res.writeHead(404);
        res.end();
        return;
      }
      const nextCode = url.searchParams.get("code");
      if (!nextCode) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Missing code");
        reject(new Error("OAuth callback missing code"));
        server.close();
        return;
      }
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Gmail access granted. You can close this tab and return to the terminal.");
      resolve(nextCode);
      server.close();
    });
    server.on("error", reject);
    server.listen(REDIRECT_PORT, "127.0.0.1", () => {
      console.log("Opening a browser to authorize Gmail (readonly).");
      console.log(`If it does not open, visit:\n${authUrl}`);
      openBrowser(authUrl);
    });
    setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting for Gmail OAuth (5 minutes)"));
    }, 5 * 60 * 1000);
  });

  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  await saveTokens(tokens);
}

export async function getGmailClient(): Promise<GmailAuth> {
  const client = createClient();
  const saved = await loadSavedTokens();
  if (saved?.refresh_token || saved?.access_token) {
    client.setCredentials(saved);
    client.on("tokens", (tokens) => {
      void saveTokens({ ...saved, ...tokens });
    });
    return client;
  }
  await authorizeInteractively(client);
  return client;
}
