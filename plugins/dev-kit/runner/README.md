# kanban-runner

Move a card to **TODO** on the Kanban → Claude Code writes `doc/todo/NNN-*.md` in the
matching repo and runs `/todo NNN` against it. The card comes back as **Review** (with the
file name and commit SHA in a comment) or **Blocked** (with the tail of the output).

```
Kanban card ──move to TODO──▶ runner polls Hasura
                                   │  claim: TODO → Doing (atomic, so re-moves are safe)
                                   │  write doc/todo/NNN-slug-TODO.md
                                   │  claude -p "/todo NNN" --model … --effort …
                                   ▼
                          card → Review + comment      (exit 0)
                          card → Blocked + last 30 lines (exit ≠ 0)
```

> **Personal tooling, not the product.** This needs the Kanban's _global_ admin secret, so
> it can only ever run on a machine you own, for boards you own. The multi-user path is
> todzz.eu writing the task file server-side (`doc/todo/014`), after which this drops Hasura
> and just watches the local clone (`015`).

**It polls; it never listens.** No public endpoint, no tunnel, no webhook secret, no Hasura
event trigger. The Mac reaches out to Hasura, so the whole thing works from behind NAT.

**It changes nothing in the Kanban's database.** Columns are `lists` rows, the claim is a
`list_id` update, the outcome is a `comments` row. Zero migrations.

## Setup

```bash
cd plugins/dev-kit/runner
cp config.example.json config.json     # edit endpoint + repo map
export HASURA_ADMIN_SECRET=…           # the Kanban's admin secret
npm run check                          # what would it do? runs nothing
npm start
```

`config.json` is gitignored — it names your local clone paths.

| Key           | Meaning                                                                     |
| ------------- | --------------------------------------------------------------------------- |
| `endpoint`    | Kanban Hasura GraphQL URL                                                   |
| `pollSeconds` | how often to look (default 20)                                              |
| `lists`       | column names on the board: `todo`, `doing`, `review`, `blocked`             |
| `repos`       | `"owner/repo"` (as connected on the board) → local clone path; `~/` is fine |

**`repos` is required and is the security boundary.** The admin secret is global — on the
shared instance it can see all 49 users' boards — so the query is scoped to these
`owner/repo` names. An empty `repos` is a startup error, not an "everything" wildcard.

**`lists` almost certainly needs editing.** Column names are free text and boards use
whatever their owner typed: `Sooner`, `Töös`, `in Arbeit`. Run `npm run check` and it prints
any column it cannot find on each board.

## Model & effort

The card decides, if it says so: a line like `Run with: opus` (or `sonnet` / `haiku`)
anywhere in the description. Otherwise a `claude -p --model haiku` call classifies it into
one of the three tiers, defaulting to `Sonnet 5 / medium` if that call fails. The chosen
tier is written as the task file's `> Run with:` line, which is what `/todo` expects.

## Notes

- **One card at a time**, enforced in the query (`limit: 1`), not just by the loop — a real
  column can hold ninety cards, and each one is a Claude session. Cards left in TODO are
  picked up on later ticks.
- **Card bodies are HTML.** The Kanban's editor stores `<p>…</p>`; `toText()` converts it
  before it reaches the task file. Plain-text and voice cards pass through untouched.
- **Idempotent.** The claim is `UPDATE … WHERE list_id = <TODO>`; a second move while the
  card is in Doing affects zero rows and is ignored.
- **Credentials live here, never in the Kanban app.** The admin secret is an env var on
  this machine; repo push rights are the local git config.
- Requires Node ≥ 20 (built-in `fetch`) and `claude` on `PATH`. No npm dependencies.
