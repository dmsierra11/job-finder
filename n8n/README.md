# n8n trigger (Mac)

n8n only starts a run. The CLI still reads Gmail, parses, scores, and writes `data/recommended-jobs.json`.

## Start

From any directory, with this repo already working (`pnpm poll-email` by hand at least once):

```bash
npx n8n
```

Open `http://localhost:5678` and create the owner account.

Do not run n8n in Docker for this first setup. A container cannot see `pnpm` in this repo.

## Workflow

1. Import [gmail-poll-email.json](gmail-poll-email.json) (**… → Import from File**).
2. Open **Gmail Trigger**, connect your Google account, and keep the search query. To print the live query from this repo:

   ```bash
   pnpm print-gmail-query
   ```

3. Open **Run poll-email** and set the command to this repo (replace the path):

   ```bash
   cd /Users/danielsierra/Projects/job-finder && pnpm poll-email
   ```

4. Activate the workflow.

n8n checks Gmail about once a minute. The Mac and n8n must stay running. If either is off, run `pnpm poll-email` yourself.

The CLI is idempotent: a second fire does not duplicate jobs already stored or messages already processed.
