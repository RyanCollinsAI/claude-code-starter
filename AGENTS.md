# AGENTS.md

A working global instruction file for coding agents, with the personal parts taken out.
Drop it at `~/.claude/AGENTS.md` and edit it to match you. See the next section on whether you also need a `CLAUDE.md`.

Every rule below earned its place by the same mistake happening twice.
Delete anything that does not match how you work. A rule you do not believe is a rule the agent will not follow either.

## Profile

Replace this section with three to six lines about you. Say the things the agent cannot guess:
what you do, what you are optimising for (speed, correctness, learning, cost), your stack and hardware,
and whether you would rather spend money to save time or the reverse.

Keep it short. This file loads on every single request, so a line here costs more than a line anywhere else.

## One instruction file, not two

`AGENTS.md` is the real file. Edit and cite `AGENTS.md`. Never write instructions into a `CLAUDE.md`.

That way Claude Code, Codex, and other harnesses all read one file instead of three that drift apart.

Claude Code **v2.1.277** (2026-09-18) reads `AGENTS.md` natively, so on a new machine you may not need a `CLAUDE.md` at all.
Two things to know, because the default is a fallback and not a merge:

- Native reading only kicks in when there is **no** `CLAUDE.md`, `CLAUDE.local.md`, or `.claude/CLAUDE.md` at or above your working directory. One stray `CLAUDE.md` in a parent folder silently suppresses every `AGENTS.md` underneath it. Your `~/.claude/CLAUDE.md` is exempt and does not suppress anything.
- To load **both**, put this in `~/.claude/settings.json`. It is ignored in project and local settings files, so it has to go in the user one:

```json
{
  "pluginConfigs": {
    "agents-md@builtin": {
      "options": { "instructionFiles": "claude-md-and-agents-md" }
    }
  }
}
```

Valid values are `"claude-md-or-agents-md"` (the default), `"claude-md-and-agents-md"`, `"claude-md"`, and `"managed-only"`.
You can also set it with `/config` under **Project instructions**. Not yet supported on Bedrock, Vertex, or Foundry.

The one-line `@AGENTS.md` import in `CLAUDE.md` is still the most portable option, and it is safe to keep:
it works on older versions, it works on other harnesses, and Claude never reads the same `AGENTS.md` twice whichever value you pick.
Keep the import if you support mixed machines. Drop the `CLAUDE.md` if everyone is on 2.1.277 or newer.

## Execution Speed / Token Conservation

- Decide whether your usage is metered or on a subscription, and say which. If it is a subscription, say so plainly: the rules below are then about SPEED, not money. Never skip work, narrow scope, or decline to verify something because it looks expensive.
- Cheapest-capable-agent first. If a mid-tier model does the task as well as the top one, use the mid-tier model.
- When spawning subagents, always pass an explicit model. Default to the mid-tier one; use the cheap one for trivial mechanical tasks and the top one only when the task genuinely needs it. Subagents inherit the main session's model when none is passed, so one expensive session silently multiplies its cost across every subagent.
- Effort is the other half of that dial, and it is per SESSION, not per subagent. In-process subagents all run at whatever the session is set to. Set it before the work, not on the agents: medium or low for mechanical passes (bulk edits, renames, log sweeps, doc cleanup, applying a fix list someone else wrote), high for normal building, and the top setting only for a genuinely hard one (a bug that survived its own fix, a race, an architecture call). Put it back when that step is done.
- A spawned CLI session is the exception: pass the effort level on the command line next to the model, or the child inherits yours.
- When making widespread changes to a file, use one Write instead of many sequential Edit calls.
- Don't overexplain, overengineer, or add unrequested improvements.
- Read the docs before using any unfamiliar API or platform. The tokens spent reading docs save ten times the tokens wasted on trial and error.
- If the docs will not load as HTML because the page is JavaScript-rendered, drive a real browser to get them.

## Shell

Fill this in with the traps on *your* box. These are the two that bite hardest on Windows:

- Never write a heredoc in the Bash tool. It hangs until the timeout. Use the Write tool for files.
- Never chain `cd` into a write or a redirect. Use absolute paths. The working directory persists between calls anyway.

Both of the above are worth enforcing with a hook rather than prose. See the Hooks note below.

## Agency / Don't Slow Me Down

- The agent can run shell commands, call APIs, execute multi-step plans, and drive browsers. Do not ask the human to do things the agent can do itself.
- When asked how long something will take, factor in the AGENT's speed, not a human doing it by hand.
- Don't hand over a link and say "click here". Open it, run it, do it. If it looks impossible, try it first.
- For anything long-running (builds, renders, uploads, deploys, CI, a queue draining), use an event-driven watch rather than polling, sleeping, or checking a background shell by hand. Say what to watch for, not how often to look.
- **Fan out without asking.** Spawning parallel agents is standing permission, not a per-task one. Fan out whenever the work splits cleanly: a search across several places at once, N independent angles on one question, or a batch of similar edits. Ask first only when the agents would write to the same files or spend money.

## Quality / Behavior

- If your messages come from voice-to-text, say so. Then small punctuation, spelling, and homophone errors ("there/their", "to/too") get read for intent instead of nitpicked.
- Don't add docstrings, comments, type annotations, or refactors to code you didn't change.
- Don't add error handling for scenarios that can't happen.
- When asked a question, lead with the answer, not the reasoning.
- If two approaches exist and one is simpler, pick the simpler one unless the complex one is actually needed.
- Expand an acronym on first use. Say what it stands for once, then use the short form.

## Writing Things Down

When the agent learns something worth keeping, route it by scope. Never default to the top-level file.

- A machine or tooling trap goes in a notes skill for that topic, so it loads only when relevant.
- A fact about one part of the codebase goes in the nearest `AGENTS.md` to that code, never the root one.
- Decisions, standing preferences, and facts about you go in memory.
- Anything that must be caught **every** time it comes up becomes a hook, not prose. Prose gets ignored about one run in thirty. A hook never does.
- Add a rule only after the same mistake happens twice. A one-off failure is noise, not a lesson.
- One rule at a time. Then rerun that same kind of task once to confirm the mistake actually stopped. If it did not, delete the rule and write a more specific one. Never stack a second rule on a failed first. That is how an instruction file gets long enough to stop being read.
- On every model release, prune rather than add. Guardrails written for an older model inhibit a newer one.
- Keep the root instruction file under about 3,000 tokens.

## Hooks: what earns one

A hook is a script the harness runs on every tool call, so it cannot be ignored.
That power is also the cost, so the bar is specific:

**The trap must fail SILENTLY or EXPENSIVELY.**

A loud, instant, self-correcting failure does not qualify. If the command errors out obviously in one second, prose is enough.
Write the hook the same day you learn the trap, test it, then write the memory.
Make every hook fail open, so a bug in the hook does not brick the session.

`templates/hooks/block-example-trap.py` is a working PreToolUse hook to copy.

## Writing & Formatting

- Never use the em dash. Use a plain dash instead.
- When writing or substantially editing long Markdown files, put each full sentence on its own line. Preserve normal Markdown structure, but avoid wrapping several sentences onto one physical line. It makes diffs readable.

## Visual Output Defaults

- Have no house design language unless you actually have one. A generic "make it beautiful" instruction produces the same purple gradient every time.
- Anything carrying a brand uses that brand's own design.
- School or client deliverables follow that submitter's formatting rules.
- Everything else is plain and clean: readable type, real spacing, no decoration that does not earn its place.
- Always overridable. When a specific look is named, that wins.

## Show, Don't Describe

Build the thing and open it for review instead of writing paragraphs about it.
Reach for this without being asked whenever a decision is faster to look at than to read.

Trigger it when about to:

- present two or more options that must be chosen between (layouts, architectures, plans, ranked candidates)
- describe anything with a shape (a UI, a pipeline, a schedule, a folder structure, a data flow)
- hand back a research summary, audit, or comparison longer than a screen
- ask a question whose answer depends on seeing something

Skip it for single-answer factual questions, code review, terminal output, and anything asked for as plain text.

The point is the feedback loop, not the artifact. Pinpointing an element and commenting on it beats a paragraph of prose describing the same choice, and it beats guessing.

## Git & Generated Files

- When writing commit messages, NEVER auto-add the agent's name as co-author.
- Never manually modify `CHANGELOG.md` or any file marked auto-generated.
- **Ship without being asked.** When work is done and verified, commit it, push it, merge it. Do not end a turn leaving your own edits uncommitted. Asking costs a round trip and the answer is always yes.
- Stage only the files the task touched. `git add -A` sweeps in logs and state files and buries the real change.
- Commit in the repo that owns the file. That is the nearest `.git`, which is often a nested repo, not the top one.
- The readiness gate is blast radius, not confidence. **Contained** ships all the way to main. **Wide** stops and waits for a human. Auto-shipping does not override that.
- Never auto-ship a `.env`, a credential file, or anything a `.gitignore` was covering.

## Engineering Standards

- When making technical decisions, do not give much weight to development cost. Prefer quality, simplicity, robustness, scalability, and long-term maintainability.
- When fixing a bug, always start by reproducing it end to end, as close to how a real user hits it as possible. That is how you find the real problem, so the fix actually solves it.
- When end-to-end testing a product, be picky about the UI and obsessed with pixel perfection. If something clearly looks off, even if unrelated to the current task, get it fixed along the way.
- Apply the same standard to lint errors, test failures, and test flakiness. If you see one, fix it, even if you did not cause it.
- When fixing a constant or a path bug, grep ALL occurrences across the codebase before editing. Fixing one of two copies hides the bug instead of fixing it.

## Verify, Don't Assert

"The code looks correct" is not proof. Proof is command output, a screenshot, or a real run.

- A unit test passing is not the same as the feature working. Test the real environment, not a stand-in for it.
- A working fallback hides a dead feature. If a code path has a fallback, prove the primary path actually ran.
- A watcher that never fires looks exactly like a job that is still running. Prove it fired.
- Fan-out produces half-fixes that look whole. When N agents fix the same class of bug, check that N of them actually changed something, not one plus N-1 near-misses.
- Never discard a check that failed. A failing verdict that gets ignored is worse than no verdict.

Anything visual gets recorded and packed into one openable proof page, not handed over as a file path.

## Parallel Agents

If several agents run at once, give each one its own git worktree.

Agents sharing one working tree will destroy each other's work.
One agent's `git stash` plus a later `stash drop` permanently discards every other agent's uncommitted edits.
Separate worktrees remove the shared tree and the whole class of bug. Inside its own worktree, an agent has full git freedom.

The one rule that still holds: never run repo-level git operations from a shared checkout while other agents are active.

Note that a fresh worktree has no gitignored files at all, so no `.env`, no credentials, no build artifacts.
Keep a list of files to carry into each new worktree if the agents need to actually run the code.

## Feature Lifecycle

After building any new feature or non-trivial change, run it through a fixed loop before calling the work done:
scout, plan, build, review, fix, verify with proof, ship.

Trivial edits (typos, comments, docs-only, a one-line config change) skip the loop and ship directly.

After a session with several corrections, turn those corrections into rewrite rules before the next task.
Section 9 of `PLAYBOOK.md` has the long version.

## Browser Automation

- NEVER delete or clear a browser profile directory that holds a logged-in session. Clearing one costs a manual re-login with two-factor.
- Keep one throwaway "scratch" profile for clean-state work. Clear only that one.
- Kill stale browser processes before starting a session.
- Prefer attaching to an already-logged-in browser over launching a fresh logged-out one.
- If the managed browser tools fail twice, try the command-line tool before stopping.
- Never close browser tabs by id on a browser shared with other sessions. Close only the ones you opened, in a `finally` block, in your own context.
