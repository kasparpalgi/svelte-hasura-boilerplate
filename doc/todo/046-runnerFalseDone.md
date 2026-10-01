> Run with: Sonnet 5.5 / medium

# Runner marks a task DONE when the agent did nothing

## Original Requirement

[NEVER REMOVE]

Found in task 043. On a fresh Dell, Claude in the herdr pane sat at the first-run login
screen. After 16 s the runner logged "agent skipped the rename; runner finished it as
044-dellSmokeTest-DONE.md" and pushed it — a task that changed nothing is reported done.

Make the runner treat "no file changed besides the task file, and no `## Results`
appended" as a failed run (Blocked / retry), not DONE. Bonus: detect the login/onboarding
screen in the pane transcript (`Paste code here if prompted`) and notify instead.
Runner code: `klarity-claude-kit/plugins/dev-kit/runner/src/run.js`, `herdr.js`.

Also note: `test/herdr.test.js` has 3 failing tests on `main` (since 9e3dbbb or earlier).
