> Run with: Sonnet 5.5 / medium

# Runner onboarding re-clones a repo after it was renamed or transferred

## Original Requirement

[NEVER REMOVE]

When `tektok-app/tektok-app` was transferred to `mytekdok/tektok-app`, the runner's
onboarding (`klarity-claude-kit/plugins/dev-kit/runner/src/onboard.js`) cloned a second copy
into `~/Documents/GitHub/tektok-app` on all three machines. The second copy had no `.env`
files. It happened because `findClone` compares the board's `owner/repo` with each clone's
origin as plain strings. The board still said the old name while the existing clone's
origin already said the new one (or the other way round), so nothing matched.

Fix: before `findClone`, and before writing `config.json`, resolve the board's repo to its
canonical name with `gh api repos/<owner>/<repo> --jq .full_name` (GitHub follows renames
and transfers). Then match clones and config keys on that name, and do the same for each
clone's origin. If both resolve to the same repo, adopt the existing clone and never clone
again. Add a test with a renamed repo. See task 054 (Follow-up 2) for the cleanup.

_GitHub issue #55 — end the commit subject with `(#55)`._
