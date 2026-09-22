---
description: One table of everything blocked on the user right now
---

# /next

Answer one question: what is sitting still because the user has not said something yet.

Read-only. Never edit a file, never approve a job, never start a build, never spawn a subagent, never call any write endpoint. Gathering is the whole job.

## Gather (all sources, in parallel)

Adapt this list to the actual setup. For each source, define three things: the exact command or query to run, what counts as "waiting on the user" versus "waiting on an agent" for that source, and what a failed or unreachable source means for the rest of the run.

A source that is down is skipped and reported. Never retry it, and never start the thing that is down.

**1. Open pull requests.**

```
gh pr list --json number,title,createdAt,isDraft,reviewDecision --limit 50
```

Waiting on the user: `REVIEW_REQUIRED` or `CHANGES_REQUESTED` where the user is the reviewer. Not waiting on the user: drafts, and anything with CI still running.

**2. Decision markers in tracked files.**

Grep the backlog, spec, and planning files for lines marked as needing a human: "needs a decision", "blocked on", "open decision", "awaiting sign-off". A marker is resolved and gets dropped if the same file says so elsewhere - "resolved", "approved", "shipped", "dropped".

**3. Running background tasks.**

List background tasks still running in this session with elapsed time. A long-running task is only a user item if it is finished or wedged and waiting for someone to look. If nothing is running, skip it silently.

## Output

Print exactly one markdown table. Nothing above it. No heading, no preamble, no counts, no summary.

| Item | Waiting on for | Age | What it unblocks |
|---|---|---|---|

Emit that separator row. Without it the output is not a table.

Rules for the table:

- Oldest first, across all sources mixed together.
- **Item** names the thing concretely. Never a vague noun.
- **Waiting on for** is the decision or input in under ten words.
- **Age** is time since it started waiting, rounded (`3d`, `4h`).
- Cap at 15 rows. If there are more, keep the 15 oldest and add one final row for the remainder: `| +N more | assorted | - | - |`.
- If every source is empty, print the header, the separator, and a single row: `| - | nothing | - | - |`.

If a source was unreachable, put one line directly under the table naming it. That is the only line allowed between the table and the last line.

Last line, always, on its own:

`Next: <one named action>` - a single specific thing, naming the item.

Or, if the table is empty: `Next: nothing on you.`

Never both. Never a third line. Do not offer to do any of it.
