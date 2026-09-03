> Run with: Sonnet 5 / medium

# Give voice-dumped cards a `/plan` pass before `/todo` runs them

## Original Requirement

[NEVER REMOVE]

The open question from `009`:

> Should voice-created Backlog cards get an automatic `/plan` pass before they are runnable?
> Probably yes — a raw voice dump is not a task file.

Answered in `009`: **yes, but only when the card needs it, and it happens on the way out of
Backlog, not on the way into TODO.** A 20-word card that already says what to do should go
straight to work; a three-minute rambling transcript should not.

## Design

Add a second, cheap loop to `plugins/dev-kit/runner/`, or a `--plan` mode on the same
process — whichever is smaller once you see the code:

1. Watch the **Backlog** column (config key `lists.backlog`).
2. Skip any card already marked planned. Mark it by prefixing the card's `content` with a
   `<!-- planned -->` line — no schema change, same rule as the rest of the runner. Skip
   short cards too (say under 300 characters of body): they are already a task.
3. For a long one: `claude -p "/plan <card text>" --model sonnet` in the mapped repo. `/plan`
   writes `doc/todo/NNN-*.md` itself, so the runner does not write the file here.
4. Rewrite the card body to the tightened requirement `/plan` produced, keep the raw
   transcript below a `## Raw voice note` heading (never destroy the original words), and
   leave the card in Backlog for the human to read and move.

The human still makes the Backlog → TODO move. That is the point: `/plan` sharpens the
card, it does not launch the work.

## Watch out for

- **Cost.** This runs on every long Backlog card. Length gate first, model call second.
- **Idempotency.** Editing `content` re-triggers nothing only because of the marker — get
  that check in before the first live run.
- **Language.** Voice notes may not be in English; do not let `/plan` silently translate the
  raw note.

## Verification

- [ ] A short card is left completely untouched
- [ ] A long card gets a rewritten body plus the raw note preserved below
- [ ] The same card is not planned twice across restarts
- [ ] `/plan`'s task file lands in the right repo with a `> Run with:` line

---

## Note from the second pass of `009`

The design above still holds, but place it in the corrected architecture before building:
the `/plan` pass belongs **server-side, next to `014`**, not in the personal runner. It needs
the card body and the OpenAI/Claude call, both of which todzz.eu already has (`OPENAI_API_KEY`
is in that repo's `.env`, and the board already does AI correction on voice input) — and
putting it there means every user gets it without installing anything.

Two details the live data confirms: card bodies are **HTML**, so the length gate must measure
`toText()` output rather than raw markup, and voice notes are frequently not in English —
the existing AI correction path already handles that, so reuse it rather than adding a
second one.
