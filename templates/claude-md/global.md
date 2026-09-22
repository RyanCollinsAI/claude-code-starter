# Global Instructions

Personal preferences and working style for <YOUR NAME>, applied across every project.
Keep this file free of any single project's paths, credentials, or business detail. That belongs in the project's own CLAUDE.md.

This file loads on every request. Every line is a recurring cost.
The test for any line: if the agent did not read it, would it do the wrong thing? If no, delete the line.

## Profile

<Your role, field, and the one or two sentences that explain how you work.>

**Tech stack:** <languages, frameworks, CLI tools you use across projects>
**Primary work:** <the one or two things most sessions are about>

## Execution Speed / Token Conservation

- Cheapest-capable-agent first. If a smaller model can do the task as well as a larger one, use it.
- When spawning subagents, always pass an explicit model. Subagents inherit the parent's model when none is passed, so an expensive session silently multiplies its own cost across every subagent it spawns.
- When making widespread changes to one file, use a single full-file write instead of many sequential small edits.
- Do not overexplain, overengineer, or add unrequested improvements.
- Read the docs before using an unfamiliar API or platform. Tokens spent reading docs save far more than trial-and-error against an API you are guessing at.

## Agency

- You can run shell commands, call APIs, execute multi-step plans, and use tools autonomously. Do not ask the user to do by hand what you can do yourself.
- When asked how long something will take, estimate based on YOUR capabilities, not a human doing it manually.
- Do not hand back a link and say "click here." Open it, run it, do it.
- If a request seems impossible, try it before concluding it cannot be done.
- For anything long-running, use an event-based watch rather than polling or sleeping.

## Quality / Behavior

- <How to handle typos or ambiguity in the user's phrasing, if relevant - for example voice-to-text quirks.>
- Do not add docstrings, comments, type annotations, or refactors to code you did not change.
- Do not add error handling for scenarios that cannot happen.
- When asked a direct question, lead with the answer, not the reasoning.
- If two approaches exist and one is simpler, use the simpler one unless the more complex one is specifically needed.
- When you learn something worth keeping, route it by scope. A fact about one part of the codebase goes in the nearest CLAUDE.md, never the root one. A standing decision goes in memory. A rule that must never be broken becomes a hook, not prose.
- Add a rule only after the same mistake happens twice. A one-off failure is noise, not a lesson.
- On every model release, prune rather than add. Guardrails written for an older model inhibit a newer one.

## Writing & Formatting

- <House style rules that apply everywhere: punctuation, sentence structure, formatting defaults.>
- Never use the em dash. Use a plain hyphen instead.

## Engineering Standards

- When making technical decisions, do not give heavy weight to development cost. Prefer quality, simplicity, robustness, scalability, and long-term maintainability.
- For bug fixes, always start by reproducing the bug end to end, as close to how a real user would hit it as possible. That is what makes sure the fix solves the actual problem.
- When end-to-end testing anything with a UI, be picky. If something looks off, even if unrelated to the current task, flag or fix it.
- Apply the same standard to lint failures, test failures, and flaky tests. See one, fix it.
- Verification means proof, not a claim. Command output, a screenshot, or a real run. Never "the code looks correct."
- Never let a builder grade its own work. Verify in a fresh context.

## Git

- Never auto-add an agent name as co-author in commit messages.
- Never manually modify auto-generated files (changelogs, lockfiles, generated docs).
- Stage only the files the task touched.
- Commit in the repo that owns the file, which is the nearest `.git` and is sometimes a nested repo.
- <State your shipping policy explicitly: either "commit and push when work is done and verified" or "commit only when asked." Do not leave it implicit.>

## Lab Notes

Machine-specific or tool-specific failures and dead ends. Date every entry. Prune once the underlying cause is genuinely gone.

-
