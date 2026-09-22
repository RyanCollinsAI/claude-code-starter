# <Project Name>

<One or two sentences: what this is and who it is for. Not a feature list.>

<!--
START THIS FILE NEARLY EMPTY.
Delete every section below that you cannot fill with something specific and true.
Add a line only after you watch the agent make the same mistake twice.
Do not seed this from /init output or a downloaded template - both trend toward
bloat that measurably degrades output.
Ceilings: under 60 lines is good, under 300 is a warning, over 300 should be split
into nested files.
-->

## Commands

| Task | Command |
|---|---|
| Install | `` |
| Run locally | `` |
| Test | `` |
| Single test | `` |
| Lint | `` |
| Build | `` |

<Delete any row where the command is obvious from package.json, Makefile, or pyproject.toml. Annotate only where a flag or default is non-obvious.>

## Routing

<Delete this whole section if the project is small enough for one file. Otherwise this table is the root file's main job: hold the map, not the content.>

| Working on | Read first |
|---|---|
| <domain> | `<path>/CLAUDE.md` |
| <domain> | `<path>/CLAUDE.md` |

## Architecture

<Only what the agent cannot infer by reading two files. Name real files and real functions. State the consequence, not just the shape.

Prefer a pointer over prose: "see `api/routes/users.ts` for the pattern" stays accurate as the code evolves. Writing the pattern out in prose goes stale silently.>

## Landmines

<The highest-value section in this file. A landmine is something that looks fine and silently does the wrong thing.

Each entry: what it looks like, what actually happens, and the fix. Add a date and a measured cost where you have one - a dated, measured claim survives review and self-invalidates cleanly when the code changes.

Weak:   "be careful with the upload path"
Strong: "`upload.py --dry-run` still writes the sidecar file, so a dry run
         leaves the folder marked uploaded. Cost us 3 re-runs on 2026-05-02.
         Use `--dry-run --no-sidecar`."-->

-
-

## Conventions

<Only conventions invisible from reading any single file, or ones the codebase is inconsistent about. If every file already follows the pattern, delete this section - the codebase itself is the instruction.

Never write a rule a linter already enforces. Never write an aspirational standard the codebase does not actually practice.>

-

## Boundaries

<What the agent must not touch without asking: generated files, vendored code, production data, anything needing a human in the loop.

If a rule here must NEVER be broken and breaking it fails silently or expensively, it does not belong in this file. Make it a PreToolUse hook. Prose gets ignored roughly 1 run in 30.>

-

## Lab Notes

Things already tried that did not work. Do not repeat these. Date every entry.

-
