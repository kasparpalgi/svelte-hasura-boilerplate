> Run with: Sonnet 5.5 / medium

# Readable transcript on the card for machines without Remote Control

## Original Requirement

[NEVER REMOVE]

Follow-up from #85. Original request: "see where claude native apps win and integrate to run also it in claude apps? what else could be improved implement" (see `doc/how-it-works.md`).

#85 puts a claude.ai/code link on the card, but only for machines logged in to the
user's own account. For the others the only live view is a herdr pane squeezed onto a
phone. The runner already reads the session JSONL for cost (`sessionUsage.js`). Every
minute or so, append Claude's last few text messages and tool names (no tool output) to
the live status comment (`status.js`), capped at ~15 lines.

Acceptance: a running card on Dell shows what the agent is doing, readable on a phone.
