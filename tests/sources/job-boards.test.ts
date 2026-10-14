import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  boardForSender,
  gmailSearchQuery,
  loadJobBoards,
} from "../../src/sources/job-boards.js";

describe("job boards", () => {
  it("builds a Gmail query from every emailAddress", async () => {
    const boards = await loadJobBoards();
    const query = gmailSearchQuery(boards);
    assert.match(query, /from:jobs-noreply@linkedin.com/);
    assert.match(query, /from:help@welcometothejungle.com/);
    assert.match(query, /from:noreply@glassdoor.com/);
    assert.match(query, /newer_than:7d/);
  });

  it("routes From headers to a board", async () => {
    const boards = await loadJobBoards();
    const board = boardForSender(
      boards,
      "LinkedIn Job Alerts <jobs-noreply@linkedin.com>",
    );
    assert.equal(board?.name, "LinkedIn Jobs");
    assert.equal(boardForSender(boards, "Random <other@example.com>"), undefined);
  });
});
