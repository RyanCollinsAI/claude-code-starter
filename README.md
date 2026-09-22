# Claude Code Starter

My global Claude Code setup, with the personal parts taken out.

Two things live here:

1. **[AGENTS.md](AGENTS.md)** - the global instruction file I actually run, scrubbed and commented. This is the part most people want.
2. **[PLAYBOOK.md](PLAYBOOK.md)** - a long best-practices document: seventeen sections on context, prompting, planning, skills, subagents, hooks, commands, verification, autonomous loops, multi-model work, cost, legacy codebases, and anti-patterns.

Plus `templates/`, which has copy-pasteable settings, hooks, commands, subagents, skills, workflows, and output styles.

Nothing here overwrites anything. Every step is additive.

## Install

```bash
git clone https://github.com/RyanCollinsAI/claude-code-starter.git
cd claude-code-starter
```

Then, on Mac or Linux:

```bash
cp AGENTS.md  ~/.claude/AGENTS.md
cp CLAUDE.md  ~/.claude/CLAUDE.md
```

On Windows (PowerShell):

```powershell
Copy-Item AGENTS.md "$HOME\.claude\AGENTS.md"
Copy-Item CLAUDE.md "$HOME\.claude\CLAUDE.md"
```

If you already have a `~/.claude/CLAUDE.md` you care about, **diff it first** instead of copying over it.

`CLAUDE.md` is deliberately one line: `@AGENTS.md`. That way Claude Code, Codex, and other harnesses read the same file instead of three that drift apart.

## Then do this

Open `AGENTS.md` and rewrite the **Profile** section. It is a placeholder.
The agent uses that section to pick defaults, so a generic profile gets you generic defaults.

After that, delete anything in the file that does not match how you work.
A rule you do not believe is a rule the agent will not follow either.

## Order to add the rest

`PLAYBOOK.md` section 17 has the full version. In short:

1. Read `PLAYBOOK.md` once, end to end.
2. Diff your global instruction file against `AGENTS.md` and pull across what is missing.
3. Copy commands next. They cost nothing until you type them.
4. Copy skills. Additive and safe.
5. Add hooks **last**, one at a time, checking each kill switch. A hook changes behaviour silently, so one bad hook is hard to spot.

`templates/NOTES.md` says what each template needs before it works, and what the starting `settings.json` deliberately leaves out.

## A warning about hooks

A hook runs on every tool call and cannot be ignored. That is the point, and it is also the cost.

Only write one when the trap fails **silently** or **expensively**. If a mistake errors out loudly in one second, prose in `AGENTS.md` is enough.
Make every hook fail open, so a bug in your hook does not brick your session.

`templates/hooks/block-example-trap.py` is a working PreToolUse hook to start from.

## Maintaining it

Prune this on every model release rather than adding to it.
Guardrails written for an older model actively make a newer one worse. This is the single rule I would keep if I could only keep one.

## Credits

The playbook is distilled from [Ray Amjad's Agentic Coding School](https://www.agenticcoding.school/) (ten classes, 388 videos) cross-referenced against my own live setup.
Buy the course if this is useful to you. The distillation is not a substitute for it.

## License

MIT. Take what is useful, drop the rest.
