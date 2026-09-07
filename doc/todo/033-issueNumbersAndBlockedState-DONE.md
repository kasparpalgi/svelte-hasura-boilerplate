New test on auto run. Created a card with GitHub issue #165 and it created 167-todzzChromeExtensionInstructions-TODO.md

1. Make the file name 165 (GitHub issue) and at the end of commit message #165 then from commit the GitHub issue is clickable
2. It completed and pushed (moved all old todo items to .claude/todo/archive folder) and from logs see all green but:

Runner ⚠ did not finish
kasparpalgi/svelte-todo-kanban 167-todzzChromeExtensionInstructions-TODO.md

167-todzzChromeExtensionInstructions-TODO.md was never renamed to -DONE
tree is clean, it committed f6fa6472 — probably finished, just not renamed; rename it by hand

  tile/screenshots, a manual Chrome test pass, and packaging +
  submitting. Full instructions and copy-paste-ready listing
  text are now logged in
  .claude/todo/167-todzzChromeExtensionInstructions-TODO.md
  and chrome-extension/CHROME_WEB_STORE_SUBMISSION.md.
  Committed to main.

✻ Cooked for 2m 51s · done 11:13 AM
                                                85954 tokens
──────────────────────────────────────────────────────────────
❯ 
──────────────────────────────────────────────────────────────
  model Sonnet 5  week 59%  ctx 85k  session 4%  main +88-1…
  ⏵⏵ bypass permissions on (shift+tab to cycle) · ← for age…
                                                         /rc
Runner ⚠ did not finish
kasparpalgi/svelte-todo-kanban 167-todzzChromeExtensionInstructions-TODO.md

167-todzzChromeExtensionInstructions-TODO.md was never renamed to -DONE
uncommitted: .claude/todo/167-todzzChromeExtensionInstructions-TODO.md

      86 +**Status: Store-ready. Awaiting manual design/testing/account work.**

⏺ Task 167 is complete and verified. The Chrome extension is now fully store-ready from a code
  perspective. All technical requirements have been met, and comprehensive instructions for
  the remaining manual steps are documented in both CHROME_WEB_STORE_SUBMISSION.md and the
  todo file. The next person can simply follow the written instructions to create the
  developer account, design the assets, run a manual test, and submit.

✻ Sautéed for 36s · done 11:15 AM
                                                                                48597 tokens
──────────────────────────────────────────────────────────────────────────────────────────────
❯
──────────────────────────────────────────────────────────────────────────────────────────────
  model Haiku 4.5  week 59%  ctx 48k  session 5%  main +11-0  resets 11:00  ctx used 24% /rc
  ⏵⏵ bypass permissions on (shift+tab to cycle) · ← for agents

Runner ⏭ stuck task
kasparpalgi/svelte-todo-kanban 167-todzzChromeExtensionInstructions-TODO.md

Ran twice without renaming to -DONE. Skipped so the queue advances — edit the file to retry.

3. I can read from the logs in Todzz repo's one manual session that ended: Runner ⚠ did not finish
kasparpalgi/svelte-todo-kanban 167-todzzChromeExtensionInstructions-TODO.md

167-todzzChromeExtensionInstructions-TODO.md was never renamed to -DONE
tree is clean, it committed f6fa6472 — probably finished, just not renamed; rename it by hand

  tile/screenshots, a manual Chrome test pass, and packaging +
  submitting. Full instructions and copy-paste-ready listing
  text are now logged in
  .claude/todo/167-todzzChromeExtensionInstructions-TODO.md
  and chrome-extension/CHROME_WEB_STORE_SUBMISSION.md.
  Committed to main.

✻ Cooked for 2m 51s · done 11:13 AM
                                                85954 tokens
──────────────────────────────────────────────────────────────
❯ 
──────────────────────────────────────────────────────────────
  model Sonnet 5  week 59%  ctx 85k  session 4%  main +88-1…
  ⏵⏵ bypass permissions on (shift+tab to cycle) · ← for age…
                                                         /rc
Runner ⚠ did not finish
kasparpalgi/svelte-todo-kanban 167-todzzChromeExtensionInstructions-TODO.md

167-todzzChromeExtensionInstructions-TODO.md was never renamed to -DONE
uncommitted: .claude/todo/167-todzzChromeExtensionInstructions-TODO.md

      86 +**Status: Store-ready. Awaiting manual design/testing/account work.**

⏺ Task 167 is complete and verified. The Chrome extension is now fully store-ready from a code
  perspective. All technical requirements have been met, and comprehensive instructions for
  the remaining manual steps are documented in both CHROME_WEB_STORE_SUBMISSION.md and the
  todo file. The next person can simply follow the written instructions to create the
  developer account, design the assets, run a manual test, and submit.

✻ Sautéed for 36s · done 11:15 AM
                                                                                48597 tokens
──────────────────────────────────────────────────────────────────────────────────────────────
❯
──────────────────────────────────────────────────────────────────────────────────────────────
  model Haiku 4.5  week 59%  ctx 48k  session 5%  main +11-0  resets 11:00  ctx used 24% /rc
  ⏵⏵ bypass permissions on (shift+tab to cycle) · ← for agents

Runner ⏭ stuck task
kasparpalgi/svelte-todo-kanban 167-todzzChromeExtensionInstructions-TODO.md

Ran twice without renaming to -DONE. Skipped so the queue advances — edit the file to retry.
Think how that could work globally. I sustect all the repos tend to want their own Chrome installed that takes crazy space. Can't there be one global?
---

## Results

**Summary**

Three asks, three answers.

**1. The task file's number is now the GitHub issue number.** Card #165 produced
`167-…-TODO.md` because the number was "highest in the folder plus one" *and* the draft
file was written before `create-issue` had run — so the issue number did not exist yet at
naming time. Fixed at both ends: the draft is now written after the issue, and
`nextNumber()` takes the issue number (falling back to highest+1 when the card has no
issue, or when something already claimed that number). A draft that predates its issue is
renumbered when the card reaches the agent list. Every task-file commit subject now ends
with ` (#165)`, and the file itself carries a `_GitHub issue #165 — end the commit subject
with `(#165)`._` line so the *agent's* commit does too — which is what makes the work show
up on the issue.

**2. `167-…-TODO.md` was never renamed because the agent had no way to say what was true.**
It was not a bug in the run: 167 finished its half and what remained — a Chrome developer
account, designed store assets, a manual test pass — is a person's job, and the `/todo`
skill's own table told it to leave a human-handoff as `-TODO.md`. The runner reads the
filename, so it re-ran it, reached the same ending, and parked it as a stuck queue slot.
`-TODO.md` meant both "nobody has run this yet" and "the agent is done, over to you".

Added a third state, `-BLOCKED.md`, which retires a number exactly like `-DONE.md`: the
runner pushes, closes the Kanban loop (card → Review with the Results), and reports
`⇥ over to you` instead of `⚠ did not finish`. The skill now names two endings and says
`-TODO.md` is never one of them. The push webhook treats a `-TODO` → `-BLOCKED` rename as
task-over too. Since task numbers are issue numbers they will outgrow three digits, so
number parsing moved from `name.slice(0, 3)` to `^(\d+)-` with a numeric sort.

The specific stuck file needed no unwedging — it was already moved to
`.claude/todo/archive/`; renamed there to `-BLOCKED.md` for the record.

**3. There is already one global Chrome — the disk is going to revisions, not repos.**
Neither Puppeteer nor Playwright downloads a browser into `node_modules`; each keeps one
machine-wide cache every project shares (`~/.cache/puppeteer` 1.7 GB,
`~/Library/Caches/ms-playwright` 195 MB). What grows is versions: each tool upgrade pins a
new build and never deletes the old one, ~400 MB a bump. This Mac is holding 4 Chrome
revisions and 3 headless-shell revisions; **992 MB is reclaimable right now**:

```
bin/prune-browsers.sh          # dry run, prints what would go
bin/prune-browsers.sh --yes    # keep only the newest revision of each
```

Cheaper still, don't download at all: `use: { channel: 'chrome' }` drives the Google Chrome
already in `/Applications`. The boilerplate already did this; svelte-todo-kanban now does
too. Not run automatically — the deletion is the user's call.

**Files changed**

_`klarity-claude-kit` (commit `66fb255`, plugin 0.8.1 → 0.9.0, runner 0.6.1 → 0.7.0)_

- Created: `plugins/dev-kit/bin/prune-browsers.sh`, `plugins/dev-kit/runner/test/queue.test.js`
- Modified: `skills/todo/SKILL.md` (the `-BLOCKED.md` ending, `(#165)` in step 7),
  `skills/plan/SKILL.md` (number by issue), `runner/src/queue.js` (`numberOf`,
  `blockedFile`, numeric sort), `runner/src/run.js` (⇥ over to you),
  `runner/src/kanban.js`, `runner/src/repo.js`, `README.md` (One Chrome for every repo)

_`svelte-todo-kanban` (commit `6f06efc`, 0.14.0 → 0.15.0)_

- Modified: `src/lib/server/taskfile.ts` (`nextNumber(names, issue)`, `todoPathFor`,
  `issueLine`, `-BLOCKED` renames), `src/lib/stores/todos.svelte.ts` (draft after issue),
  `src/routes/api/github/write-task-file/+server.ts`,
  `src/routes/api/github/write-draft-file/+server.ts`, `playwright.config.ts`,
  `src/lib/server/__tests__/taskfile.test.ts`
- Renamed: `.claude/todo/archive/167-…-TODO.md` → `-BLOCKED.md`

**Verification**

- `svelte-todo-kanban` — `npx vitest run --project=server`: 188/188 pass (14 files),
  including 8 new cases for issue numbering, renumbering and `-BLOCKED`
- `svelte-todo-kanban` — `npm run check`: 9 errors, all pre-existing and in files this task
  did not touch (`og-image`/`og-screenshot` `Buffer`→`BodyInit`, two test fixtures)
- `svelte-todo-kanban` — `prettier --check` on the six changed files: clean.
  `eslint` on them: 41 errors vs **42** on the same files at HEAD — no new ones, one fewer
  (an unused parameter went away)
- `klarity-claude-kit` — `node --test test/*.test.js`: 11/11 pass (4 new).
  `node src/run.js --check`: reads every repo, `claude plugin validate`: passed
- `bin/prune-browsers.sh` dry run: lists 992 MB across the two caches, exits clean
- Not run: E2E in either repo (needs a live stack) and the browser pass — this task
  changed server/CLI code and markdown, no UI

**Deviations**

- The runner does **not** auto-rename an un-renamed file, even when the tree is clean and
  a commit landed. `-BLOCKED.md` removes the reason a finished run ends as `-TODO.md`;
  guessing on the agent's behalf would hide the cases that are still real failures.
- `bin/prune-browsers.sh` was not executed. Deleting a gigabyte outside the repo is the
  user's call; the dry run is in this file.
- `plugins/dev-kit/runner/README.md` carries an unrelated uncommitted edit that was in the
  tree before this task. Left alone, still uncommitted.
