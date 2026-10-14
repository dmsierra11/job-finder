import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadMatchPolicy } from "../../src/load-json.js";
import { scoreJob } from "../../src/scoring/score-job.js";

describe("scoreJob", () => {
  it("recommends a senior product engineer in Barcelona", async () => {
    const policy = await loadMatchPolicy();
    const result = scoreJob(
      {
        source: "LinkedIn Jobs",
        title: "Senior Product Engineer",
        company: "Acme",
        location: "Barcelona, Spain · TypeScript React",
        url: "https://linkedin.com/jobs/view/1",
      },
      policy,
    );

    assert.equal(result.recommend, true);
    assert.ok(result.score >= policy.recommendThreshold);
    assert.ok(result.reasons.some((reason) => reason.startsWith("title:")));
    assert.ok(result.reasons.some((reason) => reason.startsWith("location:")));
  });

  it("rejects junior titles", async () => {
    const policy = await loadMatchPolicy();
    const result = scoreJob(
      {
        source: "LinkedIn Jobs",
        title: "Junior Software Engineer",
        company: "Acme",
        location: "Barcelona, Spain",
        url: "https://linkedin.com/jobs/view/2",
      },
      policy,
    );

    assert.equal(result.recommend, false);
    assert.equal(result.score, 0);
    assert.deepEqual(result.reasons, ["rejected title: junior"]);
  });

  it("downranks engineering-manager titles", async () => {
    const policy = await loadMatchPolicy();
    const result = scoreJob(
      {
        source: "Glassdoor",
        title: "Engineering Manager",
        company: "Globex",
        location: "Barcelona, Spain",
        url: "https://glassdoor.com/job-listing/em",
      },
      policy,
    );

    assert.ok(result.reasons.some((reason) => reason.includes("downrank")));
    assert.ok(result.score < 60);
  });

  it("penalizes US-only roles without EU remote", async () => {
    const policy = await loadMatchPolicy();
    const result = scoreJob(
      {
        source: "LinkedIn Jobs",
        title: "Senior Software Engineer",
        company: "Globex",
        location: "New York, United States",
        url: "https://linkedin.com/jobs/view/3",
      },
      policy,
    );

    assert.equal(result.recommend, false);
    assert.ok(result.reasons.some((reason) => reason.includes("united states")));
  });
});
