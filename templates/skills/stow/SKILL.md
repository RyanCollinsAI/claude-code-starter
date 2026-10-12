---
name: stow
description: Sweep the current conversation for durable knowledge - user preferences, project facts, machine and tooling traps, standing decisions, and unfinished next steps - and file each one where the user's setup says it belongs, curating tiered, decaying entries as it writes. Use when the user types /stow, says save or write down what we learned, or before a context reset or long break. The nudge-stow Stop hook points here when a session gets long.
user-invocable: true
---

<!-- Adapted from First Mate's public /stow skill (https://github.com/kunchenguid/firstmate, MIT, Copyright (c) 2026 Kun Chen). Notice: LICENSE-firstmate beside this file. Changes: routing swapped for the user's memory rules, the .stow-notes.md fallback removed, decay markers kept. -->

# stow

Sweep this conversation for durable knowledge that only exists in chat right now, and file it where the user's setup already keeps that kind of knowledge.
The goal is a compact, current map for the next session, not a journal: every durable finding lands on disk, and every file this skill touches comes out more accurate, not merely longer.
Entries are tiered and decay between passes. Stale material retires to a local archive instead of being deleted.
Everything files locally. Nothing goes to an external system (issue tracker, Slack, board) unless the user said so in this conversation.

## What it does

1. **Sweep the conversation for uncaptured durable knowledge.**
   - The user facts and preferences: a working-style, tooling, formatting, or approval preference stated in passing.
   - Corrections: something the user told you to do differently, with the reason.
   - Machine and tooling traps: a sharp edge, workaround, or non-obvious cause found on this box.
   - Code facts: build, test, deploy, or convention facts about one part of a codebase.
   - Standing decisions: an approach settled on, an option ruled out, a convention agreed to.
   - Undone next steps: anything left open that is not written down anywhere.
   Before filing a finding, check if it already lives somewhere authoritative: the code, a README, an AGENTS.md, an existing memory file, a hook.
   If so, file a one-line pointer to that owner, not a copy.
   Skip what the repo already records (code structure, git history, past fixes).
   Skip anything that only matters to this one conversation.

2. **Route each finding. The destination depends on the kind.**
   Never default to the root `AGENTS.md`.
   - **Machine and tooling traps** go in the matching notes skill: `host-machine-notes` (this PC, drivers, paths, Windows), `wezterm-terminal-notes` (terminal, panes, shell), `browser-media-notes` (Chrome, Playwright, ffmpeg, yt-dlp, media), `vercel-slack-notes` (Vercel, Slack).
     These live in `C:\Users\YOURNAME\Vault\.claude\skills\<name>\SKILL.md`. Add the trap to the file that skill already uses for traps.
   - **A fact about one part of the codebase** goes in the nearest `AGENTS.md` to that code. Never write instructions into a `CLAUDE.md`: it is a one-line `@AGENTS.md` import.
   - **Decisions, standing preferences, corrections, and facts about the user** go in auto-memory: one file per fact in `C:\Users\YOURNAME\.claude\projects\<project>\memory\`, with frontmatter (`name`, `description`, `metadata.type` of user, feedback, project, or reference). Feedback and project files end with a **Why:** line and a **How to apply:** line. Add the one-line pointer to `MEMORY.md` for each new file.
   - **Something that must be caught every time** (a mistake that repeated) is not prose. Propose a hook (PreToolUse, PostToolUse, or Stop) to the user. Do not write the hook in this pass.
   - **Undone next steps** go in the project's existing TODO or handoff file if there is one. If there is none, say so in the report and keep the step out of the files.
   When nothing fits, leave the finding unfiled and say so. Do not invent a new file, folder, or note system.
   Never store, create, or edit a skill as a destination for a finding. This skill only proposes moves into a skill.

3. **Ask once when two destinations both fit.** One short question, two options max, and your pick. Use the answer for the rest of the pass.

4. **Read the destination before writing: inspect-then-update, never blind-append.**
   Read the destination file in full. Then classify the finding: new, duplicate, superseding an entry, or proof that an entry is now wrong.
   Write the replacement that classification implies. A duplicate folds into the entry that has it. A superseding finding rewrites the entry it supersedes. A wrong entry is fixed or archived.
   Prefer a one-sentence rewrite of an old entry over a second entry saying the same thing.
   Check existing memory files by name and description before creating one. Update the old file. Delete a memory that turns out to be wrong.
   Mark each entry per the tier contract below.

5. **Curate every memory file this pass has open, not only the one a finding routes to.**
   Judge each dated entry against its clock. Refresh what this session proves, archive what stays stale.
   Never plainly delete a unique current fact: archive it with provenance, or move it to the live owner that now holds it.
   This is an accuracy rule, not a length target.

6. **Finish with an honest safe-to-end verdict and a resume pointer.**
   Report one action per file touched or considered: `unchanged`, `added`, `rewritten`, `pruned`, `archived`, or `routed`.
   Say what was captured and where, what could not be captured and why, and whether it is now safe to end or reset the session (every durable finding on disk, not only in chat).
   Name any proposed hook or skill move that still waits for the user.
   Close with a short RESUME POINTER: the files a fresh session should load to pick this back up cold. List only files this pass wrote or updated. Skip it if nothing was written.

## Tiered, decaying entries

A marker is a trailing HTML comment at the end of the entry's line. Markers cost bytes in every file, so they stay small.

- `<!--a:YYYY-MM-DD-->` - **aging**. The date is when the entry was last proven true. Stale at 30 days.
- `<!--p:YYYY-MM-DD-->` - **perishable**. Stale at 7 days. The text must name a checkable expiry (a ticket, a version, a date). If it cannot, it is aging, not perishable.
- `<!--P-->` - **pinned**. Never decays. Changes only when the user or reality changes it.
- `<!--g-->` - migration only: an old unmarked entry that used its one grace cycle. It has no date.

```markdown
- The staging deploy needs the VPN profile active or the smoke test hangs. <!--a:2026-10-09-->
- CI is red on the flaky auth test until the runner image updates (ticket 412). <!--p:2026-10-09-->
- Always run the schema linter before touching migrations. <!--P-->
```

Where the marker goes:
- In an auto-memory file, on the last line of the fact (the **How to apply:** line for feedback and project files). The frontmatter stays clean.
- In a notes skill or an AGENTS.md, at the end of the entry line.
- Never in `MEMORY.md` index lines.

Defaults by destination. An entry that matches its file's default carries no marker:
- Auto-memory `user` and `feedback` files: **pinned**. the user's facts and corrections stay until he or reality changes them.
- Auto-memory `project` and `reference` files: **aging**. They carry `a:`, or `p:` when they name an expiry.
- Notes skills and AGENTS.md: **pinned**. Mark only an entry that is a temporary workaround as `a:` or `p:`.

Rules:
- Refresh a date only on real evidence from this session: the fact was used, confirmed, or re-derived. Re-reading a file is not evidence.
- A stale `perishable` entry is checked against its named expiry. Still open: refresh the date. Resolved or no longer checkable: archive it now.
- A stale `aging` entry is re-validated (date refreshed) or archived. Never kept by inertia.
- Decay runs only when this skill runs. Nothing happens between passes.
- Unmarked entries in a file whose default carries a clock get a dated marker on the first pass if this session confirms them. If not, they get `<!--g-->`. On the next pass, evidence replaces `<!--g-->` with a dated marker. Without evidence, archive the entry with a `legacy-unvalidated` note.
- An unmarked entry in a default-pinned file is simply pinned. Unknown age is not guilt.
- The pass-horizon counter (`/N`) from the original skill is off. Never write one. If you see one, leave it byte-for-byte.
- Stale never means deleted. A stale entry moves to `.stow-archive.md` in the source file's own directory. The archive record has the source file name, tier, last-proven date, and a one-line reason.
  Before writing an archive file in a git repo, check it is not tracked. If it is tracked, do not write to it and report that archiving is blocked.
  Otherwise add a `.stow-archive.md` line to the `.gitignore` in that directory. Never write archived facts into a tracked file.
  Recovery is search plus copy back.
- A header pointer is not needed. This skill is the only scheme owner, and the markers are self-describing.

## What this skill does not do

It never stages, commits, or pushes. Every write lands in the working tree for the user to review. (The global git rule still ships work, but that is a separate step after this one.)
It never edits `settings.json` or a hook. It only proposes them.
It never files credentials, tokens, or other secrets.
It never files to an issue tracker, Slack, or any external system on its own inference.
It never edits `MEMORY.md` except to add the one-line pointer for a memory file it just created, and only when the user ran /stow himself. The nudge hook never writes anything.
