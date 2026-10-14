import { writeFile } from "node:fs/promises";
import { chromium, type Browser } from "playwright";
import { buildCvDocument } from "./document.js";

let sharedBrowser: Browser | undefined;
let sharedBrowserLaunch: Promise<Browser> | undefined;

async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({
      headless: true,
      args:
        process.env.PLAYWRIGHT_CHROMIUM_SANDBOX === "0"
          ? ["--no-sandbox", "--disable-dev-shm-usage"]
          : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not start Chromium. Run "pnpm exec playwright install chromium" and try again.\n${message}`,
      { cause: error },
    );
  }
}

export async function getSharedBrowser(): Promise<Browser> {
  if (sharedBrowser?.isConnected()) {
    return sharedBrowser;
  }

  sharedBrowserLaunch ??= launchBrowser()
    .then((browser) => {
      sharedBrowser = browser;
      browser.on("disconnected", () => {
        sharedBrowser = undefined;
        sharedBrowserLaunch = undefined;
      });
      return browser;
    })
    .catch((error: unknown) => {
      sharedBrowserLaunch = undefined;
      throw error;
    });

  return sharedBrowserLaunch;
}

function isAllowedDocumentUrl(url: string): boolean {
  return url === "about:blank" || url.startsWith("data:");
}

async function printPdf(
  browser: Browser,
  content: string,
  title: string,
): Promise<Buffer> {
  const context = await browser.newContext();

  try {
    await context.route("**/*", (route) => {
      if (isAllowedDocumentUrl(route.request().url())) {
        return route.continue();
      }

      return route.abort();
    });

    const page = await context.newPage();
    await page.setContent(buildCvDocument(content, title), {
      waitUntil: "load",
    });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } finally {
    await context.close();
  }
}

export async function renderPdfBytes(
  content: string,
  title: string,
  browser?: Browser,
): Promise<Buffer> {
  const owned = browser === undefined;
  const instance = browser ?? (await launchBrowser());

  try {
    return await printPdf(instance, content, title);
  } finally {
    if (owned) {
      await instance.close();
    }
  }
}

export async function renderPdf(
  content: string,
  outputPath: string,
  title: string,
): Promise<void> {
  const pdf = await renderPdfBytes(content, title);
  await writeFile(outputPath, pdf);
}
