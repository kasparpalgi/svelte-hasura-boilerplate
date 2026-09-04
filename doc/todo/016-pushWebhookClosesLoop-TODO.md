> Run with: Sonnet 5 / medium

# Push webhook closes the loop: DONE file → card moves to Review

## Original Requirement

[NEVER REMOVE]

From the second pass of `009` — the tail of the user's step 7:

> User pulls md and executes. **MD gets updated. Issue gets updated. Kanban todo item gets
> updated.**

This is layer ③: the return leg. The runner pushes; todzz.eu notices and closes the loop.
**Blocked on `014`** (nothing to report on until the server writes task files).

---

## Context (read before touching anything)

- **Webhook file**: `src/routes/api/github/webhook/+server.ts` in `svelte-todo-kanban`.
- **`handlePushEvent` already exists.** It currently logs activity for commits that reference
  issues (`#123` in the commit message). Task 016 adds a second scan in that same function:
  look for task-file renames, and when found, move the card and comment.
- **GitHub token**: stored per-user (encrypted in `users.settings.tokens.github`);
  `getGithubToken(userId)` in `src/lib/server/github.ts` decrypts it.
  `githubRequest(endpoint, token)` makes authenticated API calls. Both already exist.
- **Board columns**: Backlog (do nothing), TODO (execute), Review (needs human eye),
  Completed. Column names are free text — never hardcode them; query by name.
- **Outcome policy**: runner pushed a DONE file → move card to **Review** (human confirms
  quality). The human moves Review → Completed. This is always the right default.

---

## What a rename looks like in the push payload

Each `commit` in `event.commits` has `added: string[]` and `removed: string[]`.
A task-file rename appears as two entries across those two arrays:

```
removed: ["doc/todo/015-localTaskFileWatcher-TODO.md"]
added:   ["doc/todo/015-localTaskFileWatcher-DONE.md"]
```

The NNN prefix (`015`) is the join key. Both filenames must match `NNN` to count as a pair.

The DONE file content contains the card ID on this line (written by task-014's server-side
task writer):

```
_From Kanban card `<uuid>`, moved to TODO._
```

Fetch the file content from the GitHub API at the commit SHA to extract it:

```
GET /repos/{owner}/{repo}/contents/doc/todo/{filename}?ref={commitSha}
```

Response has a `content` field (base-64). Decode, regex the card ID.

---

## Implementation plan

All changes land in `svelte-todo-kanban`. Do not touch the runner.

### 1. Add two GraphQL queries to `src/lib/graphql/documents.ts`

**`GET_TODO_BY_ID`** — fetch a todo including its board's lists and owner:

```graphql
query GetTodoById($id: uuid!) {
  todos_by_pk(id: $id) {
    id
    title
    list_id
    github_issue_number
    github_issue_id
    github_url
    list {
      board {
        id
        user_id
        github
        lists(order_by: { sort_order: asc }) {
          id
          name
        }
      }
    }
  }
}
```

**`GET_BOARD_BY_REPO`** — look up a board when we only have the push repo full_name:

```graphql
query GetBoardByRepo($fullName: String!) {
  boards(
    where: { github: { _contains: { full_name: $fullName } } }
    limit: 1
  ) {
    id
    user_id
    lists(order_by: { sort_order: asc }) { id name }
  }
}
```

(Only needed if the DONE file doesn't contain the card ID — use as fallback, not primary.)

### 2. Add `findTaskFileRenames` helper in `+server.ts`

```ts
/** Returns [{number, todoFile, doneFile}] for any task-file rename in a commit. */
function findTaskFileRenames(commit: GitHubPushEvent['commits'][number]) {
  const results = [];
  for (const removed of commit.removed) {
    const m = /doc\/todo\/(\d{3})-.*-TODO\.md$/i.exec(removed);
    if (!m) continue;
    const added = commit.added.find(f =>
      new RegExp(`doc/todo/${m[1]}-.*-DONE\\.md$`, 'i').test(f)
    );
    if (added) results.push({ number: m[1], todoFile: removed, doneFile: added });
  }
  return results;
}
```

### 3. Add `handleTaskFileDone` helper

```ts
async function handleTaskFileDone(
  rename: { number: string; doneFile: string },
  commit: GitHubPushEvent['commits'][number],
  repo: { owner: { login: string }; name: string; full_name: string }
): Promise<void>
```

Steps inside:

1. **Find board owner's token** — query `GET_BOARD_BY_REPO` with `repo.full_name`, get
   `user_id`, call `getGithubToken(userId)`. If no token: log and return.

2. **Fetch DONE file content** via `githubRequest`:
   `/repos/${repo.full_name}/contents/${rename.doneFile}?ref=${commit.id}`.
   Base64-decode `response.content`. Regex: `/From Kanban card `([0-9a-f-]+)`/`.
   If no match: log "card ID not found in DONE file, skipping" and return.

3. **Load the todo** via `GET_TODO_BY_ID`. If not found: log and return.

4. **Idempotency** — check that `todo.list_id` still matches a list named `TODO` on the
   board. If the card is already in Review or Completed (moved by a prior delivery): log
   "already reported, skipping" and return. Never check delivery IDs — the list check is
   sufficient.

5. **Find Review list** — `todo.list.board.lists.find(l => /review/i.test(l.name))`.
   If missing: log "no Review list found on board" and fall through to comment-only.

6. **Move card** — `UPDATE_TODOS` with `{ list_id: reviewList.id }`.

7. **Post comment** on the card — `CREATE_COMMENT` with content:

   ```
   ✅ **Task complete** — [`${shortSha}`](${commit.url})

   `doc/todo/${rename.doneFile}` · ${tier label from DONE file first line if present}
   ```

   `user_id` = board owner's ID (from the board query).

8. **Close GitHub issue** — if `todo.github_issue_number` is set, call:
   `PATCH /repos/${repo.full_name}/issues/${todo.github_issue_number}` with
   `{ state: 'closed' }` using `githubRequest`.

### 4. Call from `handlePushEvent`

After the existing issue-number loop, add:

```ts
for (const commit of commits) {
  const renames = findTaskFileRenames(commit);
  for (const rename of renames) {
    await handleTaskFileDone(rename, commit, repository).catch(err =>
      console.error(`[016] ${rename.doneFile}: ${err.message}`)
    );
  }
}
```

One rename per commit in practice (runner commits one task at a time), but the loop is safe.

---

## Watch out for

- **Signature verification is not optional** — the existing path already does it; don't
  add a second endpoint or bypass it.
- **Force-push / replay** — the idempotency check (card already in Review/Completed)
  covers this. Do not add a delivery-ID table.
- **No GitHub token** — some boards may not have GitHub connected. Always check and log;
  never throw. Card can still be moved (we have the card ID from the file); only the GitHub
  issue close needs the token.
- **`GET_BOARD_BY_REPO` vs `GET_TODO_BY_ID`** — prefer the card ID path. The board query
  is a fallback only if the DONE file is unreadable.
- **Comment `user_id`** — use board owner, same pattern as the existing comment handler's
  fallback path.

---

## Verification

- [ ] A push renaming `NNN-*-TODO.md` → `NNN-*-DONE.md` moves the card to Review and posts a comment
- [ ] The linked GitHub issue closes
- [ ] An unrelated push (no doc/todo rename) does nothing extra
- [ ] A replayed delivery (card already in Review) is silently skipped
- [ ] An unsigned or wrongly-signed delivery is rejected (existing test still passes)
- [ ] A board with no Review list: card not moved but comment still posted
