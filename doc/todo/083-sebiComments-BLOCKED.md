> Run with: Opus 5.5 / high
> Machine: karel

# Sebi comments

## Original Requirement

[NEVER REMOVE]

Reading it through and recommandations in my head started to appear, don't harcode in using Haiku to read the tasks, give model/effort/machine, try using a model as large you can get (opus, fable ok not fable) because it should be still cheap, that's why ussualy you plan with Opus and implement with Sonent, anyways this needs to be measured as it’s only my theory, i would also use TypeSafe Jev for thing specific thing. Uhm, maybe share it also with me and i add these in?

\--&gt; plan and implement

_From Kanban card `cd51c97f-c874-4d2d-a56e-9dfbb1cf9e04`, moved to the agent list._

_GitHub issue #83 — end the commit subject with `(#83)`._

---

## Plan

Sebi read the how-it-works doc (task 082) and had four suggestions:

1. **"Don't hardcode Haiku to read the tasks; give model/effort/machine."** When a card is on
   **Auto**, `classify.js` ran `claude -p --model haiku`, and Haiku chose a family only. →
   Make the judge configurable, and have it choose the effort too.
2. **"Use the biggest model you can (Opus, not Fable), it's still cheap."** The call is
   ~500 characters in and two words out. → Default judge: `Opus / low`.
3. **"Plan with Opus, build with Sonnet is a theory; measure it."** → Report per tier from the
   `claude_usage` rows the runner already records. No new table needed.
4. **"TypeSafe Jev for this specific thing"** and **"share it with me and I'll add these"** →
   a person has to answer these (see Results).

Verify: runner unit tests, prettier on the changed files, one live `classify` call, and one
live `npm run tiers` against the production Hasura.

## Results

**Summary** — Built 1–3 in the runner (`klarity-claude-kit` `e365831`, runner 0.29.1 → 0.30.0):

- **Configurable judge.** `config.json` takes `"classifier": "Opus / low"`, written the same
  way as a `Run with:` line. The default is Opus / low. Haiku is no longer hardcoded. A Gemini
  judge falls back to the default, because Gemini runs through aider and can't take a `claude -p` call.
- **Auto now picks effort, not only the family.** The prompt asks for two words, e.g.
  `opus high`, and `readAnswer` parses them. If the reply has no effort word, the family's
  default effort applies. On any error the run falls back to Sonnet 5.5 / medium, as before.
- **Opus and Sonnet "latest" are now 5.5** (they were 5). A bare `Run with: opus` and an Auto
  pick now run the newest Opus/Sonnet. The README table had fallen behind too, and now shows 5.5.
- **Machine stays first-free-claims.** No usage API exists to route by usage left (see 082).
  The judge doesn't choose the machine.
- **Measuring it: `npm run tiers -- --days 30`.** It prints one row per model / effort: sessions,
  cards, sessions per card (above 1 means retries), median minutes, median output tokens and cost.
  Rows from API errors (`<synthetic>` model) are skipped. The first real run covered the last
  30 days, 509 sessions:
  - Opus 5.5 at medium/high: about 9 minutes, 19–26k output tokens, 1.05–1.07 sessions per card.
  - Opus 5.5 at xhigh: 25 minutes, 89k tokens.
  - Sonnet 5.5 / medium: 6 minutes, 8k tokens, 1.0 sessions per card. That is only 14 cards, too few to conclude anything yet.
  - Opus 5.5 and Sonnet 5.5 show cost **$0** because LiteLLM has no price for them yet. Compare tokens until it does.
  - Rows whose card effort is unset (`auto`) show 19–24 sessions per card on 3–9 cards. That
    looks like long-lived cards (rework/retry loops, or interactive sessions tied to a card), not the classifier. Worth a look.

**What's left for a person (why BLOCKED):**
1. **"TypeSafe Jev for thing specific thing"**: I couldn't work out what this means. It may be
   a voice-transcription error. Ask Sebi which tool he means and what it is for, then put the answer on this card.
2. **"Share it with me and I'll add these in"**: `kasparpalgi/klarity-claude-kit` is already
   **public**, so Sebi can read it and open PRs now. If he should push directly, Kaspar adds
   him as a collaborator: `gh api -X PUT repos/kasparpalgi/klarity-claude-kit/collaborators/<his-github-login>`.
3. Not measurable yet: **"plan with Opus, build with Sonnet"** within *one* card. A run is one
   session at one tier, so the report compares tiers across cards. To test the split, the runner
   would need an Opus plan step before a Sonnet build. That is a feature to plan if the numbers suggest it's worth it.

**Files changed**
- `klarity-claude-kit` `e365831`:
  - modified: `plugins/dev-kit/runner/src/classify.js`, `src/config.js`, `src/run.js`,
    `config.example.json`, `README.md`, `package.json`, `test/classify.test.js`
  - created: `src/tiers.js`, `scripts/tiers.mjs`, `test/tiers.test.js`
- This repo: this file (renamed to `-BLOCKED.md`); `package.json` 0.19.4 → 0.19.5.

**Verification**
- Runner `npm test`: 208/208 pass. 6 of them are new: bare-tier parsing, answer parsing,
  configured-judge argv, Gemini judge fallback + error fallback, explicit line skips the
  judge, tier report grouping.
- Prettier check on every changed runner file: clean (per-file).
- Live `classify` with `Opus / low`: a typo fix came back Haiku 4.5 / low, and multi-tenant RLS came back Opus 5.5 / high.
- Live `npm run tiers` against the production Hasura: printed the table above.
- No app code changed in this repo, so `npm run check` and app tests were not needed.

**Deviations** — Bumped Opus/Sonnet `latest` to 5.5. It's next to the judge default and was out
of date, but it changes what a bare `Run with: opus` runs.
