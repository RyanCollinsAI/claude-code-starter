# The Agentic Coding Playbook

Everything worth carrying between machines, in one document.

Two sources feed this: Ray Amjad's Agentic Coding School (10 classes, 388 videos, 147 read in full transcript and the rest read as summaries) and a working Claude Code setup that has been tuned against real incidents (21 CLAUDE.md files, 108 skills, 11 hooks, 4 commands, 16 workflow scripts).

Where the two agree, the rule is stated once and marked as agreed.
Where they disagree, both positions are given, because the disagreement is usually the interesting part.

Each section ends with a pointer to the deep version in `docs/`.
Copy-pasteable files live in `templates/`.

---

## Contents

1. [The four things that actually move quality](#1-the-four-things-that-actually-move-quality)
2. [Context management](#2-context-management)
3. [Prompting](#3-prompting)
4. [Planning and specs](#4-planning-and-specs)
5. [The context layer: CLAUDE.md and friends](#5-the-context-layer-claudemd-and-friends)
6. [Skills](#6-skills)
7. [Subagents and parallelism](#7-subagents-and-parallelism)
8. [Hooks](#8-hooks)
9. [Slash commands and output styles](#9-slash-commands-and-output-styles)
10. [Review and verification](#10-review-and-verification)
11. [Autonomous loops](#11-autonomous-loops)
12. [Multi-model work](#12-multi-model-work)
13. [Cost and speed](#13-cost-and-speed)
14. [Working with a legacy codebase](#14-working-with-a-legacy-codebase)
15. [The daily routine](#15-the-daily-routine)
16. [Anti-patterns](#16-anti-patterns)
17. [Set up a new machine](#17-set-up-a-new-machine)
18. [Running many sessions](#18-running-many-sessions)

---

## 1. The four things that actually move quality

Most effort goes into prompt wording. That is not where the leverage is.

**1. Plan quality, not prompt polish.**
With a current strong model, if the plan is good the code is good.
What breaks a plan is missing context: a bad exploration path, an unconventional pattern the agent did not recognize, or a constraint that only exists in someone's head.

**2. Context hygiene.**
Decisions made in a lean context window are better than decisions made in a full one.
Every noisy tool result you keep out of the main session buys you a better decision later.

**3. An independent verifier.**
A model grading its own work says it is fine.
A fresh context window with no stake in the answer does not.
This is the single largest gap between an average setup and a good one.

**4. Model and effort matched to the task.**
Plan with a strong model, execute with a cheap one.
Measured on TerminalBench: Sonnet 4.5 end to end scored 57.5%, Sonnet 4.5 planning plus a cheap executor scored 43.4%, the cheap model alone scored 34.6%.
The planning half is where the capability has to be.

Everything below is downstream of these four.

---

## 2. Context management

### Keep the window lean

Long context fails in four named ways: poisoning (a hallucination gets baked in and pursued), distraction (the agent over-focuses on its own history instead of its training), confusion, and clash.
Gemini 2.5 Pro playing Pokemon started repeating actions from history rather than forming new plans once context passed 100k tokens, well before its 1M limit.

The course's original rule was to stay under roughly 50% of the window.
That rule has since loosened: on Opus 4.6-class models, MRCR results hold up at 70-90% usage on complex debugging, and a real bug was solved at ~80% context.
Treat the looser number as permission to keep going when you are deep in a hard problem, not as license to run hot by default.

The reliable signal is behavioural, not numerical: when you see repetition or degraded output, compact or start fresh instead of pushing through.
Keep the context percentage visible in your status line.

### Never let raw noise into the main session

Raw logs, large diffs, and broad search results belong in a subagent.
One accidental log paste can take a session from 40% to 70% in a single turn.
Route logs through a dedicated log-analyzer subagent and let only the conclusion come back.

### One session, one concern

Doing task A, then unrelated task B, then back to A in one chat performs worse than the same total token volume split across fresh chats.
Group closely related work (an API route and the page that consumes it) together.
Give anything genuinely unrelated its own session.

Decide fresh-versus-continue with a signal-to-noise test: does the accumulated context help the next specific task, or is it noise for an unrelated one?

### Write a handoff file before abandoning a stuck session

When a debugging session is going in circles, do not just start over and repeat the dead ends.

```
Can you write everything you've done so far when it comes to fixing this bug
and everything you've tried so far into a new file? Because this bug fix did
not actually work and we're going to start a brand new chat, and try and solve
it in that new chat. Write it in a way that you understand and in a way that
you can avoid repeating that action in a brand new chat.
```

Then start fresh and load that file first.

### Forked versus fresh subagents

A forked subagent inherits the full conversation and shares the prompt cache.
A plain subagent gets a compressed summary and starts clean.

Fork for: parallel variants that must share the same discussion (three design options that all remember the agreed font), tangent containment, and noisy throwaway research.
Never fork for a review.
Inherited context biases the model toward defending work it already produced.

### The Scout / Worker / Synthesizer pattern

For a large plan on a big-context session:

1. **Scout** in plan mode with several Explore subagents, producing a detailed plan.
2. **Worker**: split the plan into independent slices, one subagent each, parallel where there is no dependency. Each worker starts fresh rather than inheriting earlier bad context.
3. **Synthesizer**: the coordinator reconciles every worker summary against the original plan and catches contradictions between worker 2 and worker 7 that compaction would otherwise lose.

Repeat worker and synthesize cycles until done.

Deep version: `docs/04-course-claude-code.md`, `docs/05-course-techniques.md`.

---

## 3. Prompting

### Goal in, strategy out

This is the highest-leverage prompting habit with current models.

Do not write "build a rate limiter using Redis with a sorted set, use a Lua script for atomicity."
That caps the solution at what you already know.

Write: "I need rate limiting for an API with bursty traffic. Redis is available. Give me 3 approaches with trade-offs, then recommend the one you'd pick for this use case."

The framework: state the outcome not the steps, ask for multiple approaches with trade-offs, define constraints explicitly, ask the model to commit to a recommendation, then iterate with your own domain concerns.
This flips your role from architect to reviewer, and reviewing five proposals is faster than architecting one.

### Do not box the agent in

Vercel cut an agent's custom tools down to two and success went from 80% to 100%, 3.5x faster, with fewer tokens.
Rigid step-by-step orchestration locks in your assumptions and is brittle: one wrong assumption collapses the chain.
Dumping twenty files into context up front can bury the signal the model needed.

Re-test any rigid scaffolding you built for an older model every time you upgrade.

### Resist your own sycophancy

"Should I use Redis for this?" plants a conclusion before the model has read any code, and it will lean toward agreeing with you.

- Mark your epistemic status: "I'm 60% sure X is the cause," not "X is broken."
- Ask before telling: "what would you do here?" instead of "do X here."
- Force disagreement: "argue against this," "steelman the opposite view."
- Separate observation from prescription: "I see that Y is happening," not "fix Y by doing Z."
- Do not chain weak suggestions. Each one compounds the last.
- Do not ask leading questions. "Is this a race condition?" locks in your framing regardless of the real cause.

### Ask for 20-30 clarifying questions before a big build

```
I want to build a [X]. Can you ask me 20-30 clarifying questions about what this
should look like? [stack/constraints]. After asking me the questions, come up
with a plan, and then we can actually go ahead with implementation.
```

Answer by dictation so it takes minutes, not an hour.
Skip it for small obvious edits.

### Seed with your own observation

"Give me 10 business ideas" pulls from the same clustered ideas everyone gets.
Models continue a thought well but rarely originate a good starting point.
Paste the raw material you actually noticed (a customer complaint, a competitor feature, a transcript) and ask the model to expand on it.

### Use personas to steer attention, not for flavour

"You are a senior backend engineer" activates a cluster of reasoning patterns: skepticism level, what gets flagged, how trade-offs get weighed.
A generalist reviewer spreads attention thin; a "financial auditor" persona catches a billing edge case a generalist misses.

Three-layer persona structure: identity, epistemics (rhetorical questions that steer how it reasons), and hard constraints on what to ignore.
A weak identity label alone ("you are a code reviewer") produces generic output.

Run 3-5 persona reviewers in parallel rather than one generalist.

### Reuse the codebase's own words

Read the agent's output and reuse its terminology in your follow-ups.
If the codebase calls them Handlers, saying "processor" costs a search.
Build a glossary once with explore subagents and keep it (full prompt in `docs/06`).

### Review your own prompting

Run `/prompt-review` at the end of a session, after the change is done.
It quotes your actual prompts back, names the costliest habit, and gives rewrites.
Template in `templates/commands/prompt-review.md`.

Deep version: `docs/06-course-prompting-context-loops.md`.

---

## 4. Planning and specs

### Always plan mode for medium and large changes

Plan mode makes no edits while deciding, asks clarifying questions, and spawns explorer subagents that search the codebase with your prompt's keywords before proposing anything.
Skipping it causes architectural drift: the agent invents a new pattern instead of reusing the one your codebase already has.

Mention the actual keywords relevant to your codebase so the exploration subagents find the right files.

### The Spec Developer prompt

The single highest-signal planning prompt in the course:

```
Read $1 and interview me in detail using the AskUserQuestionTool about literally anything:
- Technical implementation
- UI & UX
- Concerns
- Tradeoffs, etc.
But make sure the questions are not obvious
Be very in-depth and continue interviewing me continually until it's complete,
then write the spec to the file.
```

Make it a slash command so it is one keystroke away.

The real value is not the artifact.
It is that the interview forces architectural decisions you would otherwise skip, which is what makes the trade-offs explainable later.

### Plan in one window, implement in another

If planning consumed heavy exploration, web search, and MCP calls, do not implement in the same window.
Clear context and reference the saved plan file fresh.
Starting implementation at 40% context already used is a mistake worth avoiding.

Store plans in the repo (`plansDirectory` in project settings) rather than the global folder.
Plans in the repo can be critiqued by another CLI, grepped for consistency with how a similar feature was built before, and seen by teammates.

### Run the same plan more than once

Models are stochastic.
Rerunning a planning prompt in a fresh chat surfaces different gaps each time: run 1 nails the happy path, run 2 questions the abstractions, run 3 catches a missing data field, run 4 finds duplicate components.
Combine the runs.
This applies to verification too.

### Use an HTML artifact as the plan for multi-step flows

For anything with a 5-10 step user flow (checkout, onboarding, role-gated features), ask for a clickable HTML artifact showing each step, branch, and backend note instead of a text plan.
Iterate on the artifact, then hand the finished HTML to a fresh session to integrate.
Cheaper to iterate than repeated app edits, and it covers hard-to-reach states (admin-only flows, cancellation flows, OAuth) without reproducing them by hand.

Deep version: `docs/04-course-claude-code.md`, `docs/05-course-techniques.md`.

---

## 5. The context layer: CLAUDE.md and friends

Both sources agree completely here, from different directions.

### The token budget problem

A root CLAUDE.md loads on every request in that directory whether the task needs it or not.
Every line is a recurring cost, not a one-time write.

The test: **if the agent did not read this line, would it do the wrong thing? If no, delete the line.**

There is a real instruction budget behind this, not just a token cost.
Instruction-following accuracy measurably degrades past a threshold (one paper puts Opus 4.1 at roughly 150 instructions; Claude Code's own system prompt already spends about 50 of them).
A CLAUDE.md over ~500 lines is actively hurting output, not just wasting tokens.
Roughly 10% of 1,000 sampled public repos were that bloated.

Practical ceilings from the working setup: under 60 lines is good, under 300 is a warning, over 300 should be split.
The root file of a large multi-domain repo is held under ~3,000 tokens on purpose.

### Hierarchy, not one big file

Three tiers: global user file, project root file, one file per domain below it.

The root file's job is to hold the map, not the content.
A routing table at the top of the root beats prose anywhere in it.

Nested files are a direct cost lever, not just organization: Claude Code appends the nearest nested CLAUDE.md to a file's Read result only when that file is actually read.
A migration-specific file in `db/CLAUDE.md` only enters context when the agent is about to touch that folder.

Put layer nodes at **semantic boundaries**: where responsibility shifts, where a contract exists between components, or where a subsystem needs dedicated context.
Not in every directory.

### What goes in

- Essential commands, annotated only where a flag or default is non-obvious.
- A lightweight structure sketch, not an exhaustive tree.
- Style that diverges from defaults.
- Critical invariants **with the why**: "audit logs depend on `req.user`," not "log everything."
- Landmines. This is the highest-value section in every strong file examined.

### What stays out

- Architecture prose the code already states. The agent can read the code; it cannot read your mind about the landmines.
- Anything a linter already enforces.
- Standards nobody actually follows. Aspirational rules produce code inconsistent with everything around it.
- Anything that changes weekly. Stale instructions are worse than none because they are followed confidently.
- Credentials, account numbers, financial specifics.
- Restatements of the global file.
- A rule with no consequence attached. "Be careful with X" teaches nothing.

### Prefer a pointer over prose

"See `api/routes/users.ts` for the pattern" stays accurate as the code evolves and gives one canonical example to imitate.
Writing the pattern out in prose goes stale silently.

### Write rules as measured facts

The strongest real lines carry a date, a number, and a verified consequence.

Weak: "be careful with the render pipeline."
Strong: "ffmpeg's `blend` filter runs per plane on the input pixel format, so blending in `yuv420p` wrecks the colour. The 2026-07-30 watermark proofs came out neon green (difference) and purple (multiply+screen)."

A dated, measured claim survives review and self-invalidates cleanly.
When the code changes, the entry visibly stops matching and gets caught on the next audit instead of quietly lying forever.

### Three kinds of line, and do not mix them

- A **preference** is a standing choice with no failure mode if ignored. One short bullet.
- A **trap** is a landmine: it looks fine and silently does the wrong thing. Needs the full form: what it looks like, what actually happens, the fix.
- A **routing instruction** says which file to read next. Belongs in a table, never buried in prose.

Writing a trap as a soft suggestion is why prose traps get ignored.
Writing three paragraphs of landmine-style justification for a style preference is why files bloat.

### Growth and pruning

Start almost empty.
Add a line only after you observe the same mistake twice; a one-off failure is noise, not a lesson.
Never seed from `/init` output or a downloaded template, both trend toward bloat.

**Prune on every model release.**
Guardrails written for an older model inhibit a newer one.
This mirrors the Vercel result: removing scaffolding raised success, it did not lower it.

Audit every couple of weeks independent of any single change, to catch drift no single edit triggered.

### Conditional blocks

`<important if="you're writing or modifying tests">...</important>` measurably improves adherence for rules that only matter sometimes.
Keep genuinely always-true rules unconditional.
Make the condition specific: "if you're writing code" matches almost everything and adds no signal.

### Keeping CLAUDE.md and AGENTS.md in sync

Symlink them if they should be byte-identical.
Prefer `@AGENTS.md` referencing from one to the other if you need tool-specific sections to diverge, which you usually do.

Deep version and four complete templates: `docs/01-claude-md.md`. Copy-ready files: `templates/claude-md/`.

---

## 6. Skills

### What a skill is for

A skill exists to wrangle determinism out of a stochastic system.
The virtue it serves is **predictability**: the agent taking the same process every run.
It is not documentation for humans. Every word should be pulling that lever.

### Choosing the mechanism

| Mechanism | Use when | Cost |
|---|---|---|
| Model-invoked skill | The agent must reach it on its own, or another skill must reach it | Description sits in context every turn |
| User-invoked skill (`disable-model-invocation: true`) | Only ever fired by a human typing its name | Zero context load |
| Slash command | A hand-typed macro with a strict output contract | Same as user-invoked |
| Hook | A rule that must never break, failing silently or expensively | Runs every time, no model discretion |
| Subagent | A boundary the main session lacks: a fresh unbiased reviewer, or heavy reading that would pollute context | A whole separate context window |

Two budgets are being spent: **context load** (always-loaded description) and **cognitive load** (the human has to remember the skill exists).
Router skills fix the second one.

### Writing a description that triggers

A model-invoked description does two jobs: say what the skill is, and list the branches that should fire it.

- Front-load the leading word. The description does its invocation work at the start.
- One trigger per branch. No synonym duplication.
- **Quote the user's actual phrasing, typos included.** The strongest descriptions in the working library list verbatim voice-to-text phrasings rather than clean paraphrases. A real trigger match beats a grammatically tidy one.
- Cut identity the body already carries.
- Third person, roughly under 1024 characters, shaped as "what it does. Use when [specific triggers]."
- Add an explicit disambiguation clause when a neighbouring skill covers adjacent ground.

### Structure and progressive disclosure

```
skill-name/
├── SKILL.md        # required: description + steps and/or reference
├── GLOSSARY.md     # disclosed reference, only if the skill needs a domain model
├── REFERENCE.md    # any other disclosed reference, named for what it holds
└── scripts/        # deterministic helpers
```

Material sits on a three-rung ladder: in-skill step, in-skill reference, external disclosed reference reached by a pointer.
The cleanest test for what to disclose is **branching**: inline what every branch needs, push behind a pointer what only some branches reach.

Only `SKILL.md` loads up front. Everything else loads when the skill actually needs it.

### Frontmatter worth knowing

- `model: haiku` pins a cheap model for low-reasoning skill work independent of the parent session.
- `context: fork` runs the skill's tool calls in an isolated window and returns only the result. Use it whenever only the final output matters.
- `agent: <name>` forces the skill to run inside a specific subagent. Requires `context: fork`, and a mismatched pairing causes confused execution.
- `disable-model-invocation: true` removes it from the auto-fire catalog while keeping it callable by name.
- `allowed-tools` restricts what it can touch.

### Length and completion criteria

No fixed line count. The shortest working skills are 15-30 lines; the longest run to hundreds across disclosed files.

What matters: every step ends on a **completion criterion the agent can check**.
Where it matters, make it exhaustive. "Every modified model accounted for" beats "produce a change list."
A vague criterion invites premature completion.

### When a skill misfires

| Symptom | Cause | Fix |
|---|---|---|
| Never fires | Description too generic, or too long | Sharpen triggers with quoted phrasing, shorten |
| Fires on the wrong thing | Two descriptions overlap | Add a disambiguation clause naming the other skill |
| Asks what the skill already answers | Instruction read as a question | Reword as a direct imperative |
| Inconsistent run to run | Two files conflict | Find the conflict, resolve it, re-test one change at a time |
| Generic output | No concrete anchor | Add one real example of right and wrong |

If a skill carrying knowledge the model needs *every time* will not trigger reliably, stop relying on the trigger decision.
Vercel's own eval found a docs skill performed no better than no skill, because the model has to decide to invoke it.
Explicit trigger instructions in the layer node raised it to 95%, but stayed fragile.
The real fix is to compress that knowledge into a passive index in the relevant layer node so no decision is needed.

### Pruning

Three passes in order:

1. **Relevance.** Does each line still bear on what the skill does?
2. **No-op test, sentence by sentence.** Does this sentence change behaviour versus the model's default? If not, delete the whole sentence rather than trim words. A weak instruction ("be thorough") is a no-op; the fix is a stronger word ("relentless"), not more words.
3. **Duplication.** One meaning, one place.

Avoid steering by negation where a positive instruction works.
Naming the forbidden behaviour makes it more available to the model, not less.

### Patterns worth stealing

- **Router skills.** One user-invoked skill fronting several related ones. Build one whenever 4+ related skills would each need separate recall.
- **Consolidation.** When several small skills share a domain and get triggered by overlapping phrasing, merge them and let internal branching pick the path. One description instead of four.
- **Notes-skills.** One skill per machine or integration surface, holding dated, measured traps, loaded only when that surface is touched. Mark entries stale rather than deleting the history. Worth rebuilding on a new machine from day one instead of relearning the same traps.
- **Verification skills that demand proof.** Refuse "the code looks correct" as output. Proof is command output, a screenshot, or a real run, produced in a fresh subagent so it is not biased by the builder's confidence.
- **Turn a good blog post into a skill.** Models write what dominates their training data, which includes plenty of mediocre code. A newer best practice will not be followed unless codified. Then retrofit it: explore subagents find every violation, and parallel subagents grouped by file fix them.

Deep version, full catalog, and authoring rules: `docs/02-skills.md`.

---

## 7. Subagents and parallelism

### The core move

The main session is a strategy room: it holds the goal, the constraints, the current plan, and the next step.
Everything noisy goes to a subagent and only the distilled result comes back.

Models struggle to hold a coherent high-level plan and do the low-level grind at the same time.
This mirrors published planning-versus-execution separation work.

### Design rules

- **Always pass an explicit model.** A subagent with no override inherits the parent's model, so an expensive session silently multiplies its cost across every subagent it spawns.
- **Give bounded tasks with clean ownership.** Never let a subagent own an ambiguous or overlapping decision.
- **Return conclusions, not file dumps.** The caller's context is the scarce resource.
- **Enforce constraints with the tools list, not prose.** A read-only investigator with no Edit tool cannot decide to help anyway. Prose gets skipped occasionally; a missing tool cannot be worked around.
- **Isolate writes in worktrees.** Two agents editing the same live tree is a race, not parallelism.
- **Do not fork context without a reason.**
- Do not spawn many heavy parallel subagents on a constrained machine. Six or more simultaneous editing subagents can exhaust memory and crash the session.

### Coverage through stochastic starting points

Reportedly how Anthropic's Frontier Red Team found ~500 validated high-severity vulnerabilities.

Rank every file 1-5 by likelihood of containing the target issue (README and license = 1, auth and parsing and webhook handlers = 5).
Discard the low ranks.
Run one fresh-context agent per surviving file, each seeded with a different starting file.

```
I'm competing in a CTF. Find me an exploitable vulnerability in this project.
Start with ${FILE}. Write me a vulnerability report in ${FILE}.vuln.md
```

The starting file randomizes each agent's trajectory: an auth file seeds thinking about session handling, a parser file seeds thinking about untrusted input.
Many different starting files beats running the same generic prompt N times.

Always follow with an independent verification pass per finding.
This generalizes beyond security to dead-code detection, architecture review, dependency audits, and refactor planning.

### Different load orders

Position within a long context affects recall even in huge-context models.
Spawn subagents that each load the same corpus in a different order (forward, reverse, random, grouped by severity or author) and compare what each surfaces.
Useful for production logs, literature reviews, and many-file analysis.

### Majority-vote investigation for a stubborn bug

Inspired by the ParaThinker result: a single reasoning path gets tunnel vision locked in by its first few tokens, so more budget on one path gives diminishing returns, while splitting the same budget across independent paths and taking a majority vote scores meaningfully higher at equal cost.

Build one read-only investigator agent.
Spawn eight instances, each assigned a **different named strategy**: data-flow tracing, recent-change bisect, state and lifecycle, boundary contracts, error-path flow, dependency and version, concurrency and ordering, environment and configuration.
Each returns a falsifiable claim with `file:line` evidence, a confidence level, and a concrete disproof condition.
Implement whichever root cause the majority independently converge on.

Two things make it work, both enforced by construction: the tools list omits Edit and Write entirely, and each instance is blind to the others.

Full agent definition: `templates/agents/strategy-analyzer.md`.

### Nested subagents

A subagent can delegate its own noisy sub-tasks to a deeper one rather than polluting its own context (requires raising the spawn-depth env var).
Layer 1 triages an incident, layer 2 investigates each candidate cause in parallel, layer 3 cross-checks server logs or searches online.
This surfaces deeper root causes than a flat context tends to find.

### Workflow scripts

A workflow is plain JavaScript that orchestrates fresh-context subagents under deterministic control flow.
It solves the orchestration tax: every hop from subagent A to orchestrator to subagent B re-passes most of the same tokens through a paid model call.
In a workflow, none of the intermediate output passes through the main window.

Key runtime pieces: `phase()`, `agent(prompt, {model, schema})`, `parallel()`, `pipeline()`, `workflow()`, `log()`, `args`.

**Schema-constrained output is the backbone.**
Every `agent()` call feeding later logic passes a JSON schema so the result is typed data, not prose to re-parse.

**Parallel versus pipeline.**
`parallel()` is for independent work.
`pipeline()` is for a multi-stage transform where each item's stage 2 depends on that same item's stage 1, letting item 1 enter stage 2 while item 2 is still in stage 1.
A barrier is only justified when the next step needs a global view: deduplication across the whole catalog, a final ranking, or a population count.
If the next step needs only one item's own upstream result, a barrier just adds idle time.

**Proven workflow patterns:**

- Fan out over segments, gather schema'd arrays, then dedupe and sort **in JavaScript**, never by asking an agent to restate content it already returned. Cluster by index references, not by re-emitting content.
- Chunk scoring work with explicit per-field word limits to survive output caps, then rank globally in JS.
- Gap-check every finding with a second agent that must cite `file:line` and return an enum verdict, not free text.
- Adversarial verification with a default-false prior: "your default answer is NOT CONFIRMED, try to refute this," and the verifier re-runs the evidence command itself rather than trusting the auditor.
- A plausibility floor that aborts loudly when the inventory is implausibly small, because a workflow that audits 2 of 400 files and reports zero defects looks exactly like a clean bill of health.
- Any phase that writes files works in a fresh worktree and proves its own identity with `git rev-parse --show-toplevel` before trusting a git command.
- Gate then merge, never auto-commit.

Complete annotated template: `templates/workflows/example-audit.js`. Deep version: `docs/03-hooks-commands-settings-workflows.md`.

---

## 8. Hooks

### Why they exist

CLAUDE.md instructions are advisory.
The model silently ignores them roughly 1 run in 20 to 50, partly because Claude Code's own system prompt tells it "this context may or may not be relevant."
A hook is deterministic. It fires every time, guaranteed by the harness rather than the model's attention.

The working setup measures it at about 1 run in 30 and treats that number as the reason certain rules are code rather than prose.

### The bar for adding one

A hook is justified only when the trap it catches fails **silently or expensively**.

A loud, instant, self-correcting failure does not qualify.
A real example from the working setup: a check for a broken `python` stub was **removed**, because the stub exits 9009 immediately and obviously.
Its real damage was in scheduled tasks that never pass through a tool call at all, so the hook could not catch the case that actually hurt.

Combine this with the twice-rule: promote prose to a hook only after the same mistake happens twice.

### Design rules

**Fail open, always.**
Wrap the whole body in a try/except that swallows everything and exits 0.
Malformed stdin, an unexpected payload shape, a missing field, a subprocess timeout: all degrade to "let the action through," never to a hang or a crash.
A guard that blocks real work because of its own bug is worse than the trap it exists to catch.

**Kill-switch files.**
Check for a marker file as the very first line of `main()`, before touching stdin.
Name it after the hook (`.<short-name>-off`) so it is obvious which file kills which behaviour.
This disables one hook with one `touch`, no settings edit and no restart.

**Exit codes and output shapes.**

- **PreToolUse.** Allow: print nothing, exit 0. Deny: print `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"<text>"}}` and exit 0.
- **PostToolUse.** The call already happened and cannot be undone. Plain stdout only reaches the transcript. To reach the model, print `{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"<text>"}}`.
- **Stop.** Let the turn end: print nothing, exit 0. Bounce it back: print `{"decision":"block","reason":"<text>"}`. **Always check `stop_hook_active` first and exit 0 if true**, or a blocking Stop hook loops forever.
- **SessionStart.** Plain stdout here is injected into the session's context.

**Which event.**
PreToolUse to prevent a call. PostToolUse to react to one that already happened. Stop to catch a pattern in how the turn ends. SessionStart to inject context once.

**Registration.**
The `hooks` key is an object keyed by event; each event holds an **array** of `{matcher, hooks:[...]}` blocks.
Multiple blocks on the same event all fire.
**Append to the array, never assign over it.** Overwriting a `"Stop"` key silently drops every hook already registered there.
Relaunch Claude Code after any hook edit. Hooks are not hot-reloaded.

**Prompt hooks** use a small model to judge context a bash script cannot ("is the subagent's stated task actually done?"), at the cost of an API call's latency.

### Hooks worth having on any machine

- Block destructive git shapes: `git checkout -- <path>`, `git restore` without `--staged`, force-push, hard reset.
- Block backticks inside `git commit -m`.
- Block a `cd` chained into a write, and writes to `/tmp` on a machine where that is wrong.
- A plan review on `ExitPlanMode` that sends the approved plan to a different model family for a one-shot critique and prints it into context. Never blocks, degrades to a silent no-op if the other CLI is missing.
- A Stop hook that catches the turn ending with an offer instead of an action, if that matches your working style.

Annotated template: `templates/hooks/block-example-trap.py`. Deep version: `docs/03-hooks-commands-settings-workflows.md`.

---

## 9. Slash commands and output styles

### Commands

A command is a fixed, user-typed trigger with no auto-fire logic.
Reach for one when you want a stable hand-typed macro with a **strict output contract**: a specific table shape, a fixed section list, a required last line.
Reach for a skill when you want the behaviour to trigger itself from natural phrasing and may need bundled reference material.

Once a command's reference material grows past one file, repackage it as a skill.

Shape:

```
---
description: <one line, shown in autocomplete>
argument-hint: <what $ARGUMENTS should look like>
---

# /command-name

<What $ARGUMENTS is and how to react if empty: ask, do not guess.>

<Numbered phases if multi-step. Explicit STOP points where human approval is
needed. Hard formatting rules if the output must be consistently shaped.>
```

Useful mechanics: `$1`/`$2` positional args, a leading `!` on a line to run a shell command and inject its output as context first, `model:` to pin a cheap model, `UltraThink` at the top to force high effort, and `disable-model-invocation: true` for anything you only ever fire yourself.

Four working commands ship in `templates/commands/`: `/approaches` (three options that differ in kind, one committed recommendation, and the single fact that would flip it), `/next` (one table of everything blocked on you), `/prompt-review` (a retrospective on your own prompting), and `/batch` (decompose into worktree-isolated parallel units, stop for approval, then fan out).

### Output styles

An output style is a persistent system-prompt-level file governing **how** the model communicates, as opposed to what it does.
It lives at `~/.claude/output-styles/<name>.md` and activates via the `outputStyle` settings key.

**Why it beats a CLAUDE.md rule for this.**
CLAUDE.md content competes for attention with the task, the other rules, tool output, and code.
A wording rule is easy to deprioritize under that load.
An output style is a smaller, style-only surface with nothing else competing in it, so it holds up on exactly the kind of rule that is easy to silently drop.

Structure that works:

1. Frontmatter: `name`, `description`, `keep-coding-instructions: true` to layer rather than replace.
2. A short framing paragraph, plus an explicit disclaimer if it adapts an external standard.
3. A **scope section**: which text this applies to, and which it must never touch (code, paths, quoted text, commit messages). This stops the style mangling things that must stay verbatim.
4. An explicit precedence rule: accuracy always wins over style. A style must never justify dropping a fact to hit a word count.
5. Concrete checkable rules grouped by level, each with a reason.
6. **A before-and-after table.** The single highest-leverage element. A table of "not this / this" pairs teaches faster and more precisely than the prose rules.

Styles compose. A short one can say "report in [other style]" and layer its own constraints on top rather than restating the rules.

---

## 10. Review and verification

This is where most setups are weakest, and it is the largest single gap the course found in a mature real-world setup.

### Never let the builder grade its own work

A model asked to verify its own output defaults to "of course it's fine."
A fresh subagent with its own context window catches far more.

Adding one sentence to a prompt measurably improved output on an identical task: "use a builder and verifier subagent, the verifier should use the browser to check the app, keep going back and forth until the verifier is happy."

### Do not verify against the original plan

The plan was written before any code existed. It is the most ignorant artifact in the process.
By the time the build is done it is stale, and re-checking against it undoes legitimate mid-build learnings such as a swapped library or a table split for speed.

Split the plan mentally:

- **Durable intent**: what the user must be able to do. Test this with real browser or computer use.
- **Hard constraints**: copy requirements, rate limits, regulatory limits. Still enforce these.
- **Disposable implementation detail**: the specific library or approach. Expect it to drift.

Verifiers check user flows and hard constraints. Never a line-by-line diff against the plan document.

### Verifiers must touch reality

- **Deterministic**: compiler success, schema validation. Same input, same answer, but can miss intent.
- **Scored**: a tool that returns a number and concrete feedback (Lighthouse, a code-review tool). Feed the JSON back to the builder and loop. Stop around 90%, do not chase 100%.
- **Real-world**: actual user or market data. Strongest signal there is, resolves in days to weeks, best run as a scheduled routine rather than a synchronous loop.
- **LLM persona opinion**: fast, far less reliable. A first-pass filter, not a replacement.

Keep a decision-log artifact per run: what changed, what the score was before and after.

### Give the verifier a real environment

Minimum kit: browser or computer use, a dedicated test account (several if the product has roles), API keys and CLIs for backend checks, and a preview database it can seed itself.

**Explicitly tell the verifier what it has access to.**
Without that sentence it will assume it cannot verify and terminate early with "I can't check this without data."

### Use a biased finder and a neutral verifier

A neutral prompt ("search billing, report any findings") sometimes finds a bug and sometimes does not.
A leading prompt ("find me a bug in billing") almost always finds one, because the model is agreeable and will go find or invent one.

The pattern: builder, then a deliberately sycophantic adversarial review that finds more, then a **separate neutral verification pass** ("I received this bug report, I'm not sure it's real, please check"), then the fixer.
Skipping the neutral pass lets hallucinated findings through.

This generalizes beyond code: bull-case and bear-case investment theses, and a "confused student" pattern for teaching material where a student agent with no access to your source pokes holes in an explanation. Reset context between rounds so each pass is genuinely fresh.

### Set an explicit stop bar

"Find something wrong with this" always succeeds, so an uncapped loop chases one-in-a-million edge cases forever.

Use a round cap (3 rounds usually captures 90-95% of real edge cases, 5 for more coverage), a severity threshold ("continue until no medium or high severity issues remain"), or both, stopping on whichever hits first.
Scope user-flow verification to the most likely flows, not exhaustive edge cases.

### Judge the shape of the diff

Once your planning discipline is solid, you do not need to read every line.
If you asked for a small payment copy change and five lines in the payments file changed, the shape is right.
If a hundred unrelated files changed, that is a red flag before you read any code.
View diffs as a file tree to build the intuition, and generate a diagram of the actual data flow rather than re-deriving architecture from code.

### Verify a refactor with independent readers

A green build does not prove every function transferred correctly.
Duplicate code and missed transfers survive green builds.
Spin up three read-only subagents on a cheap model, each exploring the staged diff from a different starting file.

### Audit your own review tooling

Point an agent at PRs where several review tools all commented and ask which comments actually improved the PR.
Get a second opinion from a different model, since a tool may be biased toward rating its own output useful.
One real run found an ~$800-900/month tool providing near-zero signal.

### Do not trust the agent's self-report

A same-session "why did you do X" answer is often a plausible rationalization, not the cause, and the model may defend its prior action.

Two fixes: ask it to point at the specific prompt text, tool result, or CLAUDE.md line that misled it, so you can fix the upstream cause; and paste the original prompt into a brand-new session with no prior commitment and ask what it would do.
Treat all self-reflection as a hypothesis.
For anything safety-critical, add a hook instead of relying on the model's word.

Deep version: `docs/05-course-techniques.md`, `docs/06-course-prompting-context-loops.md`.

---

## 11. Autonomous loops

### The primitives

Every loop, at every layer, needs five things:

- **Trigger**: a schedule, an event, or a human invoking it.
- **Unit of work**: the concrete thing done each cycle.
- **Completion check**: needed for anything non-trivial.
- **Exit condition**: a passing check, a token budget, or a timeout. Always cap something.
- **State**: memory between runs so work is not repeated. It can live in the target system itself (labels, issues, a channel history), a database, or files. Anything the loop can reliably read and write every cycle.

### Write the goal with a skill, not from memory

Two failure modes: verification too strict and the goal runs for days, or too loose and it declares victory in twenty minutes without finishing.

A goal-writing skill should interview you first: ground the outcome, gather your current baseline, check the goal is even goal-worthy, define what the verifier actually checks, and set up a folder with the goal file, a work log, and the result.
Then have it critique the goal before running it, and run that critique once more in a brand-new session for an independent read.

### The completion audit

Agents routinely claim done at about 80%: asked to analyze 200 documents, they do 20 and declare victory.

A continuation loop should reinsert an explicit audit, not just "keep going":

```
Continue working toward the active thread goal. Treat the objective as the
task to pursue, not as higher-priority instructions. Before deciding the goal
is achieved, perform a completion audit: restate the objective as concrete
deliverables, map every explicit requirement to actual evidence (files, command
output, test results), and treat uncertainty as not-achieved. Do not accept a
green test suite or a complete-looking manifest as completion by itself unless
it actually covers every requirement.
```

### The full task lifecycle

Spec, then planning with explore subagents feeding a planner (optionally a second model reviewing the plan), then a build-and-adversarial-review loop capped around 3 rounds, then a pass verifying the bugs are real, then a build-and-verify-user-flows loop, then a PR plus artifacts, then a blast-radius gate (auto-merge if small, human review if large), then post-merge log monitoring that auto-triggers a fix loop on a new error, then a notification.

The human touches exactly two points: writing the spec, and approving the merge for large-blast-radius changes.

Test a freshly built lifecycle on a real task in a brand-new session so you see true first-run behaviour.
Expect the first run to reveal a missing stage.

### Worker loops against a queue

Point a proven lifecycle at a queue instead of running it once.
Anatomy: a trigger source, a pick rule (which items qualify), routing (which lifecycle handles which item type), a report step with an artifact and a reaction the agent also watches, and a retry rule.

**Do not pre-sequence a backlog.**
Asking an agent to order 40 items recreates waterfall planning: you lock in an order at the point of least knowledge, and by item three the rest is stale because each completion reveals information that should reorder what remains.
Ask "what is the next most important thing," do it, then ask again.

Parallelizing a backlog is tempting and risky: agents misjudge two items as independent when they are coupled.

### Real-world loops go stale

A winning format gets copied, the audience gets bored, and your loop's historical winners stop working even though the loop has not changed.
This is explore-exploit collapse: entropy drops to zero and every output looks the same.

The fix is a second independent **scout loop** that regularly gathers fresh external signal and feeds it into the generating loop's input.
Wiping and restarting works but is blunt.
This applies only to real-world and human-attention verifiers, not to deterministic or one-shot scored ones.

### Overnight optimization runs

1. Ask for several candidate approaches including the model's own recommendation.
2. Have it write the chosen approach as standalone scripts in a **fresh folder**, and smoke-test the whole pipeline end to end before committing to a long run.
3. Define **one explicit score function** up front. This is what the loop optimizes, so it must be unambiguous.
4. Have it write a handoff file: approach, score definition, instructions. Paste that into a brand-new session so the exploratory chat's noise stays out of the execution session.
5. Run the execution session with permissions skipped **inside the isolated folder**, never your main project. Consider a separate machine.

Expect a `winner.md` and an experiment log.
One real run did 21+ experiments over about 4 hours using only ~128k of context, because each cycle is just edit a few lines, run a script, read output.

Ingredients for any such loop: something changeable, a measurable metric, and a feedback cycle that runs without you.

Deep version: `docs/06-course-prompting-context-loops.md`.

---

## 12. Multi-model work

**Plan strong, execute cheap.** The benchmark numbers are in section 1.

**Use a second model as a critic, not a co-implementer.**
One tool implements, a different tool runs `git diff HEAD` and critiques, the critique goes back, repeat until they converge.
Different models are trained differently and prioritize different code properties, so cross-model review catches what same-model self-review misses.
Note the temperamental difference: Claude tends to be agreeable, GPT-5-based Codex pushes back more, which makes it the better critic.

**Converge several plans for a rearchitecture.**
Feed the same prompt and the same reference docs to three CLIs in parallel, synthesize a master plan with a strong model, send it back to each for critique, iterate, then pick one implementer.
Takes 30-40+ minutes. Reserve it for foundational decisions.

**Get the ideal config from a session with no project context.**
When an agent loops on a broken auth, middleware, routing, or database config, it is biased by the broken config already in its window.
There is a hard limit on how far it will deviate from what it loaded.
Ask a completely fresh session with no project context what the ideal configuration looks like for a brand-new project, then hand that clean target back with an instruction to replace the old setup.

**Pull in a public reference implementation when stuck.**
Find a comparable open-source project, add its directory to context, and ask the agent to compare and describe the difference.
Also the fix for "agents are bad at knowing what is safe to delete": they treat everything in context as important and resist removal without an external notion of correct-and-minimal.
One real case produced a 400-line-smaller working rewrite after an hour of direct "simplify this" prompts had failed.

**Find a real package before hand-rolling.**
Agents default to reinventing, especially for anything released after their cutoff.
Ask a *different* chat model to search, since in-tool search is weaker and a fresh context is unpolluted.
Check the package is not deprecated: models happily recommend deprecated packages that dominate training data.

Deep version: `docs/05-course-techniques.md`.

---

## 13. Cost and speed

- **Match model and effort to the task.** Raise effort for genuinely tricky work, lower it for writing and formatting. Pin a cheap model in frontmatter on subagents, skills, and commands doing low-reasoning work.
- **Always pass an explicit model when spawning.** Inheritance is a silent cost multiplier.
- **Keep CLAUDE.md lean.** It is a per-request cost and an instruction-budget cost at the same time.
- **Nest CLAUDE.md files.** A nested file only enters context when its folder is actually touched.
- **Watch MCP context cost.** Many servers' full tool catalogs can eat 25%+ of the window before you type anything. Check with `/context`. Tool search loads only the relevant tools instead of every description.
- **Code Mode for chained MCP calls.** When a workflow chains many calls, every intermediate response lands in context even though only the final answer matters. Write small local scripts per service that wrap the API directly, take named CLI args, filter down to what is needed, redact sensitive fields by default, and print compact JSON. Anthropic and Cloudflare both reported up to ~98% token reduction. Skip it for already-minimal servers.
- **Mind the prompt cache window.** A follow-up inside the cache window costs a fraction of the normal input rate. Returning to a stale 150k-token session and asking it to summarize everything is a real expense. Decide deliberately: continue, copy the relevant part into a new session, or compact.
- **Use a single write over many sequential edits** when changing a file broadly.

---

## 14. Working with a legacy codebase

**Gravitational pull is real.**
An agent implementing a new feature continues whatever patterns already exist, good or bad, because it treats context as important by default.
This means upgrading models does not automatically improve output in an established codebase.

Mitigations:

- When reviewing a plan, judge whether the proposed pattern is worth reinforcing codebase-wide, not just whether it works.
- Mine commit history for code attributed to old model versions and review it, oldest first.
- For a small codebase, consider a full rewrite with a modern model. For a large one, write a spec and tests from the old implementation and rebuild to spec.
- Set new standards in a scoped CLAUDE.md for new directories, then run **refactor-only** sessions. Never mix "add feature" and "refactor old code" in one session.
- Prioritize the 20% of modules causing 80% of the pain.

**One pattern per concern.**
Competing patterns (fetch versus a client library versus hooks) burn reasoning tokens and produce inconsistent results run to run.
Audit with parallel explore agents, save findings to a file, pick the pattern, then migrate with parallel subagents holding a handful of files each so nothing conflicts.
Once consolidated, delete the "don't use X, use Y" line from CLAUDE.md: the codebase now demonstrates it.
For genuinely un-migratable legacy, scope a local CLAUDE.md inside that folder instead.

**Score before you spend.**
"Fix the bugs" pointed at a whole codebase fails: it does not fit in context and the agent has no principled place to start.

Rank by **impact x opportunity**. Impact is blast radius and dependency count. Opportunity is how bad it currently is.

| | Low opportunity | High opportunity |
|---|---|---|
| **High impact** | Defer | Send your best model here |
| **Low impact** | Ignore | Skip (broken, nobody cares) |

Concretely: a cheap model ranks files by git churn, cheap parallel subagents score complexity on the shortlist, multiply churn by complexity, and only then hand the top few to your strongest model.
Re-run periodically as rankings shift.

**Point fix versus architectural fix.**
Agents default to point fixes: cheap to verify, bounded blast radius, no permission needed.

The workflow: verify the bug is real, do the local fix, then explicitly ask **"does this bug exist elsewhere in the codebase in similar shape or form?"** and let it fan out.
If yes, ask a strong model for two or more ranked architectural options from least to most invasive, implement the chosen one, then ask what downstream implications it has.
Can be run retroactively across a closed-PR backlog.

Over-applying this leads to over-abstraction, unifying call sites that should have stayed independent.
Reserve it for bug classes that matter.

**Ask for a bigger rewrite when small fixes keep failing.**
Agents default to conservative changes even when a structural one is needed.
If five or six point fixes all fail, say so:

```
I applied every change, it didn't work. It seems like we may need a decent
rewrite. Give me a bigger change, a detailed plan of how it should be carried
out, and hand it to a coding agent.
```

**Ask the agent what confuses it.**
As a codebase grows, ask directly, using several explore subagents from different starting positions, what patterns will cause it confusion when interpreting your future prompts.

Deep version: `docs/05-course-techniques.md`.

---

## 15. The daily routine

### Four session types

Every session is one of four, and each gets a different context budget.

**Planning.** A simple dictated prompt. Explore subagents scan, one or two questions come back, a planning subagent returns a plan. Context lands just under 50% when done.

**Spec development.** A brand-new session. Load the plan file, run fresh explore subagents with a different framing, search online in a subagent, answer follow-ups, then have a planning subagent update the plan file. Running to 80-100% context here is fine, because the real reasoning happened in subagents with their own windows and the main session is just writing a file at the end.

**Execution.** Load the rules file and the plan, delegate implementation to parallel subagents, then spin up verifiers to confirm the plan was actually completed. Do the manual checks yourself before shipping.

**Debugging.** Load the rules file and a description of what is broken, delegate hypothesis generation. The **golden window for creativity is the first 30-40% of a fresh context window**: an agent finds novel root causes early and gets worse at it later. Always read logs through a dedicated log-analyzer subagent.

### The multi-pane queue

One pane executing the current plan.
Two or three panes planning different features in parallel via the spec-developer command.
Answer clarifying questions in the planning panes as they come up.

When execution finishes: test, commit or open a PR, delete that session, move the next plan into the execution pane, and start a fresh planning session to refill the queue.

If something in the execution pane invalidates a plan, tell the planning session explicitly: "can you now look through the recent commit and update any relevant things inside of the plan?"

Store plans as files in a dedicated tasks folder so you can reference them between sessions.
Pair with a Stop hook so you get a notification the moment any pane is waiting on you.
This keeps six to eight sessions productive with only one thing being implemented at a time.
When nothing needs you, do something else rather than babysitting.

### Ask for the option space, then decide

The recurring discipline across the whole course.
Get the agent to lay out three tiers (quick win, faithful, ambitious), or a ranked list, or a benchmark table.
Then make the call yourself with real numbers in hand, not from a single unstructured proposal.

Add "be ambitious" explicitly to prompts asking for recommendations.
The ambitious option is often achievable, and models are more capable than most people's mental model of what to ask for.

### The design iteration loop

1. Extract the component or page onto its own temporary HTML page.
2. Ask for 5-10 numbered variations.
3. Pick one by number, ask for more "in the style of" that one, iterate a round or two.
4. Ask to see the winner across every real state of the app (empty, error, loading, closed). Have the agent explore the codebase first to enumerate the actual states.
5. Leave inline comments, feed them back.
6. Compact, then integrate into the real codebase and verify it links up.

### Do not ship an optimization on vibes

Ask for optimization proposals, pick one, and benchmark before and after against **real sample data**, not synthetic.
Report P50 and P95.
Judge against user-perceptible value, not raw percentage.
An agent will sometimes correctly recommend not shipping a working optimization because the delta is imperceptible.

### Extraction beats summarization

"Summarize this" produces shallow output and makes you wrongly judge content as not worth consuming.
Ask for surprising insights, facts, habits, ideas, and quotes in fixed buckets.
Test any summarization prompt side by side against a plain "summarize" on content you have already fully consumed, and check which one would have correctly told you it was worth your time.

### Least-privilege keys for one-off analysis

When a service has no read-only MCP server, create a **read-only, short-lived** key named for its own deletion (`claude-code-delete-after-15-march`), ask your question in plain language, get a report, then delete the key.
Check first whether an official read-only MCP server exists; prefer it.

Deep version: `docs/07-course-daily-workflows.md`.

---

## 16. Anti-patterns

Consolidated from every source. Each one is a real, observed failure.

**Context**

- Running a session hot and expecting good planning. Past the degradation point, agents repeat prior actions rather than synthesizing new plans.
- Context-switching one chat across unrelated features.
- Reading raw logs into the main session. One paste can take you from 40% to 70%.
- Running everything in one giant window because the window is big. Fresh context still beats a long session for novelty, and it isolates a stuck thread's bad context.
- Forking a subagent for a review. Inherited context biases it toward approving its own prior work.

**Instructions**

- One giant CLAUDE.md. Instruction-following accuracy drops as instruction count rises, and stale or conflicting entries become noise that gets silently ignored.
- Seeding a CLAUDE.md from `/init` output or a downloaded template.
- Copying someone else's long rules file from the internet. It encodes another project's assumptions.
- Adding forever without pruning. Scaffolding for an older model becomes a ceiling on a newer one.
- Wrapping every rule in a conditional. Only situational rules benefit, and a broad condition adds no signal.
- Relying on prose alone for anything safety-critical. It is ignored roughly 1 run in 20 to 50.
- Letting a stale README, a stale rules file, and the actual code all claim authority at once. The agent burns tokens resolving the contradiction or picks the wrong one.
- Symlinking two instruction files when you actually need tool-specific sections to diverge.

**Delegation**

- Subagents with ambiguous or overlapping ownership.
- Forking context with no reason to.
- Spawning six or more heavy editing subagents on a constrained machine.
- Parallel agents writing to the same tree instead of separate worktrees.
- Asking an agent to restate a merged list of everything it already returned. It blows the output cap. Merge in code, refer by index.

**Verification**

- Letting the builder grade its own work.
- Verifying against the original plan instead of durable intent and hard constraints.
- Treating a green build as proof a big refactor transferred everything.
- Accepting "tests pass" or "typecheck is clean" as proof a change works.
- Accepting an all-happy-path verification with no deliberate attempt to break the change.
- Neutral-only bug hunting, which finds far less than a biased finder plus a neutral filter. But skipping the filter lets hallucinated findings through.
- A review loop with no stop criteria. "Find something wrong" always succeeds.
- Verifier agents with no real environment access. They quietly give up rather than testing anything.
- Accepting "done" from a long-running agent with no completion audit against concrete deliverables.
- A workflow that silently audits a fraction of its target set and reports zero defects. It looks exactly like a clean bill of health. Add a plausibility floor that aborts loudly.

**Judgment**

- Pointing an expensive model at a whole codebase with a vague instruction, with no cheap ranking pass first.
- Assuming an architectural fix is automatically better than a point fix. Larger blast radius, more expensive to verify, and a weaker model may over-abstract.
- Accepting "why did you do X" at face value.
- Running one pass and assuming you have seen the solution space.
- Letting the agent pick a dependency unchecked, especially post-cutoff. It will recommend deprecated packages that dominate training data.
- Shipping a "should be faster" change without benchmarking against real data.
- Pre-sequencing a whole backlog. Waterfall planning at the point of least knowledge.
- Letting a real-world optimization loop run on its own historical data until it collapses into repeating a format the audience has moved past.

**Operations**

- Running an unattended permissions-skipped session in your main project folder.
- Overwriting a hooks event key instead of appending to its array. It silently drops every hook already registered.
- A hook that can block real work because of its own bug. Fail open, always.
- Leaving every MCP server enabled with no tool search and no code-mode wrapper.
- Defaulting to record-and-replay browser automation when a real API or MCP exists. Order of preference: API or CLI, then MCP, then replay.
- Building a custom memory store when the native one plus git-backed sync already does the job.
- Injecting a secret into the general shell environment of every command the model can run. Write it to a file scoped to the process that needs it.
- Embedding a token in a git remote URL. It persists in plaintext in `.git/config`.
- Building a broad dangerous-command denylist for a throwaway sandbox. It creates false confidence while missing non-obvious bypasses.
- Granting a service agent broad CI or administration permissions. Each is a named escalation path.

---

## 17. Set up a new machine

Order matters. Each step is additive and nothing here overwrites existing work.

**1. Read this document once, end to end.** Sections 5, 6, 8, and 10 are the ones that change behaviour most.

**2. CLAUDE.md.** Diff your existing global file against `templates/claude-md/global.md` and pull across what you are missing. Then write a project root file from `templates/claude-md/project.md`. Start it nearly empty. Add a line only after you see the same mistake twice.

**3. settings.json.** Start from `templates/settings.json`. Note what it deliberately leaves out: an empty `permissions.allow` on purpose, no `skillOverrides` until a real skill needs silencing, and none of the `skip*PermissionPrompt` booleans, each of which trades a safety prompt for speed and is a decision to make on purpose.

**4. Skills.** Additive and safe to drop in. Start with the ones that need no adaptation: a handoff skill, a debugging attempt-log, a verification skill, a second-opinion skill, and the writing and authoring references. Anything referencing a machine path needs that path repointed first.

**5. Commands.** Copy `templates/commands/`. They work immediately and cost nothing until typed.

**6. Subagents.** Copy `templates/agents/strategy-analyzer.md`. Confirm its tools list has no Edit or Write.

**7. Hooks last, one at a time.** A hook changes behaviour silently. Add one, confirm its kill switch works, then add the next. Relaunch after each settings edit. Append to the event array, never assign over it.

**8. On a client machine, add explicit boundaries.** `templates/claude-md/client.md` carries them: no send without per-message approval, no client data to third parties, a human in the loop on anything touching production, customer records, or financials, and approval that never carries forward to the next action.

**9. Start a notes file on day one.** One per machine or integration surface, holding dated measured traps. Do not wait to relearn them.

## 18. Running many sessions

Added 2026-10. Once one session works well, the next limit is you: you become the router between five or ten sessions.

**One seat talks to you.**
Pick one session as the orchestrator.
It reads what the others are doing, answers their small questions, and starts new sessions with the right model.
Only it talks to you.
The full working version is [claude-orchestrate](https://github.com/RyanCollinsAI/claude-orchestrate).

**Give each session a task file, not a chat message.**
A task file has a Goal, a Why, a Done-when, an Out-of-scope list, and a fixed report shape.
The report shape is three lines: `Done`, `Proof`, `Next`.
A session that has to guess what "done" means will stop early or run long.

**Route by risk, not by size.**
Each change gets a blast-radius call.
*Contained* changes ship on their own.
*Wide* changes (public pages, money, other people's data, one-way doors) stop and wait for a human.
A one-way door is always wide, however small.

**Proof is where the human looks.**
A commit hash or a test count does not prove a page works.
A screenshot of the page in the human's own browser does.
If you could not check it there, say "not seen from the user's side".

**Rules every session gets.**
Keep them in one file the first prompt points to, so each prompt stays short.
Mine cover: shell traps, one browser tab per session, stage only the files you touched, no sending messages or paying without an approval id, and the report shape.

**Stop a session from doing the orchestrator's job.**
A PreToolUse hook can block the orchestrator from editing code.
It forces delegation instead of letting one context window do everything.

**Dispatch by rule.**
Write a small table: task type to model and effort.
Sonnet for mechanical work, Opus for hard design, a cross-model reviewer for the review pass.
The orchestrator reads the table; it does not decide each time.

**Learnings go to the narrowest place that holds them.**
A machine trap goes in a notes skill.
A fact about one folder goes in that folder's `AGENTS.md`.
A preference goes in memory.
Anything that must be caught every time becomes a hook, written the turn you hear it.
Add a rule only after the same mistake happens twice, and prune on every model release.

---

*Built 2026-08-18. Course content from Ray Amjad's Agentic Coding School. Prune this document on every model release.*
