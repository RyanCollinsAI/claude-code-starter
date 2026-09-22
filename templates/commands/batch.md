---
description: Decompose a big instruction into disjoint units of work, fan them out to isolated worktrees in parallel, and open one PR per unit with a live status table. Two-phase - plan, then execute after approval.
argument-hint: <repo> <instruction>
---

# /batch

Turn one instruction into N independent PRs, built in parallel, each in its own worktree.

**$ARGUMENTS** is the raw text after `/batch`. It mixes two things: which repo to work in, and the instruction to decompose. If the repo is not stated plainly, infer it from context (cwd, the tool named in the instruction) rather than guessing wrong. Ask only if genuinely ambiguous.

Resolve the repo to its actual git root first. A workspace may nest several repos, and `git status` from the wrong level shows nothing. Resolve the real base branch per repo rather than assuming `main`: `git rev-parse --abbrev-ref HEAD`, or `git remote show origin | grep 'HEAD branch'` from the main checkout.

## When NOT to use this

A single coherent feature or fix that touches an interconnected set of files - a signature change and all its call sites, a refactor that threads through one module - is the wrong shape. Splitting it into "disjoint" units is a fiction: the units will either collide on files, or the feature will half-work spread across unmerged PRs. That is one unit, one branch, no `/batch`.

`/batch` is for instructions that are naturally a bundle of independent tasks: fix N lint warnings scattered across the repo, write tests for N unrelated functions, apply the same mechanical change across N files, knock out N backlog items that do not share files.

## PHASE 1 - PLAN (always; never skip to execution)

1. Read enough of the repo (structure, relevant CLAUDE.md, the instruction's targets) to decompose responsibly.
2. Break the instruction into **5-30 units**. Each unit is self-contained: one clear deliverable, one explicit file list, one branch name. If honest decomposition yields fewer than 5 truly independent pieces, say so and recommend a single branch instead of manufacturing filler units. If it yields more than 30, cluster related pieces until it fits, or say the instruction needs scoping down.
3. **Units must not overlap in files.** This is the whole point of the split. Two agents editing the same file from two different worktrees produce two PRs that conflict on merge, and neither agent can see the other's edit while working. Check every unit's file list against every other unit's before presenting the plan. If two tasks genuinely need the same file, either merge them into one unit or drop the overlapping one from this batch and say it needs to run serially, later.
4. Print the plan as a table: `ID | Description | Files touched | Branch`. Then **stop and wait for explicit approval**. Do not proceed on an ambiguous reply. If the user edits the plan, reprint the full updated table and stop again.

## PHASE 2 - EXECUTE (only after explicit approval)

1. Confirm the base branch and current HEAD are clean before fanning out. Uncommitted changes in the main checkout can bleed into freshly created worktrees.
2. Spawn **one task per unit, all in a single message** (true parallelism, not sequential calls), each with:
   - worktree isolation
   - background execution
   - a prompt stating: the unit's exact scope, the file list it may touch **and no others**, the branch name, and the required end state - commit, `git push -u origin <branch>`, then open a PR against the resolved base branch. The worker must never touch git outside its own worktree, and must report its final status (committed / pushed / PR URL, or what blocked it) in a short structured line the orchestrator can parse.
3. Maintain a live status table - `Unit | Status | Branch | PR` - updating each row as notifications arrive. Do not poll or sleep-loop; react to notifications as they land.
4. When all units report in, print the final table. Flag any unit that failed, could not push, or hit an unexpected file collision. A collision is a plan bug Phase 1 should have caught; note it so the next plan does. Do not auto-resolve merge conflicts between unit PRs - that contradicts the disjoint-files premise and means the plan was wrong.

## Worktree caveat

A fresh worktree carries **no gitignored files**: no `.env`, no credential directories, no local build artifacts. If a unit's work needs to actually run something that depends on those, its prompt must say so explicitly, and the files must be copied in first. Otherwise the worker fails confusingly on a missing-credentials error that has nothing to do with its actual task.

Never run repo-level git operations from the main checkout while units are in flight.
