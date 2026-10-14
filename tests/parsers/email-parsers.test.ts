import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { parseJobAlertEmail } from "../../src/parsers/route.js";

const fixtures = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
);

describe("email parsers", () => {
  it("extracts LinkedIn job listings and skips help links", async () => {
    const html = await readFile(path.join(fixtures, "linkedin-alert.html"), "utf8");
    const jobs = parseJobAlertEmail({
      source: {
        name: "LinkedIn Jobs",
        emailAddress: "jobs-noreply@linkedin.com",
      },
      headers: { from: "LinkedIn <jobs-noreply@linkedin.com>", subject: "Jobs" },
      text: "",
      html,
    });

    assert.equal(jobs.length, 2);
    assert.equal(jobs[0]?.title, "Senior Product Engineer");
    assert.equal(jobs[0]?.company, "Acme Labs");
    assert.match(jobs[0]?.location ?? "", /Barcelona/);
    assert.equal(
      jobs[0]?.url,
      "https://linkedin.com/comm/jobs/view/4123456789",
    );
  });

  it("extracts Welcome to the Jungle listings", async () => {
    const html = await readFile(path.join(fixtures, "wttj-alert.html"), "utf8");
    const jobs = parseJobAlertEmail({
      source: {
        name: "Welcome to the Jungle / Otta",
        emailAddress: "help@welcometothejungle.com",
      },
      headers: {
        from: "WTTJ <help@welcometothejungle.com>",
        subject: "Jobs",
      },
      text: "",
      html,
    });

    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]?.title, "Senior Frontend Engineer");
    assert.match(jobs[0]?.url ?? "", /welcometothejungle.com/);
  });

  it("extracts Glassdoor listings", async () => {
    const html = await readFile(
      path.join(fixtures, "glassdoor-alert.html"),
      "utf8",
    );
    const jobs = parseJobAlertEmail({
      source: { name: "Glassdoor", emailAddress: "noreply@glassdoor.com" },
      headers: { from: "Glassdoor <noreply@glassdoor.com>", subject: "Jobs" },
      text: "",
      html,
    });

    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]?.title, "Engineering Manager");
  });
});
