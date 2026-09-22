# Notes on these templates

## settings.json

### Keys worth knowing

| Key | What it does |
|---|---|
| `permissions.allow` / `permissions.deny` | Arrays of `Tool(pattern)` strings. `allow` pre-approves command shapes so they never prompt. `deny` hard-blocks a shape regardless of mode. |
| `permissions.defaultMode` | Fallback for anything not explicitly listed. |
| `env` | Environment variables injected into every session. Encoding fixes, feature flags. |
| `model` / `fallbackModel` | Default session model, and an ordered fallback if the primary is unavailable. |
| `hooks` | Object keyed by event name, each an array of `{matcher, hooks:[...]}` blocks. **Append, never overwrite.** |
| `skillOverrides` | Maps a skill name to `"off"` to stop it auto-firing without deleting it. |
| `statusLine` | `{type:"command", command}` to render the terminal status line. Worth using to keep context percentage visible. |
| `outputStyle` | Name of an active output style. |
| `enabledPlugins` | `"<plugin>@<marketplace>": true/false`. |
| `defaultShell` | Which shell tool to prefer. |
| `cleanupPeriodDays` | How long session history is kept. Raise it a lot if you ever want to mine your own history for patterns; the default throws that data away. |

### Deliberately left out of the starting file

- **`permissions.allow` starts empty on purpose.** Build it from real friction rather than copying someone else's, which reflects their repo layout and tool habits, not yours.
- **`skillOverrides`** - add entries only once a real skill needs silencing.
- **`enabledPlugins`** - account-specific.
- **`statusLine`** - needs the script to exist first.
- **Every `skip*PermissionPrompt` boolean.** Each trades a safety prompt for speed. That is a deliberate risk choice to make on purpose, not one to inherit blind, and especially not on a client machine.

### settings.json vs settings.local.json

`settings.json` is the tracked, shared config. `settings.local.json` sits alongside it for per-machine overrides that should not be versioned.

Keep policy decisions (hooks, deny rules) in the tracked file so they travel with the account. Put genuinely machine-specific things (a local tool's allow entries, a path) in the local file.

## Hooks

Read the header comment in `hooks/block-example-trap.py`. It covers the bar for adding one, fail-open design, kill switches, exit codes for every event type, and registration.

The one rule that costs the most when broken: **append to the event array, never assign over it.** Multiple blocks on the same event all fire, and overwriting a key silently drops every hook already registered there.

Relaunch after any hook edit. Hooks are not hot-reloaded.

## Commands

Drop these in `~/.claude/commands/` (user-level, cross-project) or `.claude/commands/` (project-level).

They cost nothing until typed, so they are the safest thing to copy first.

Useful mechanics not shown in every template:

- `$1`, `$2` for positional args, with `argument-hint` enabling tab completion.
- A line prefixed with `!` runs that shell command first and injects its output as context.
- `model:` in frontmatter pins a cheap model for low-reasoning commands.
- `UltraThink` at the top of the body forces high reasoning effort.
- `disable-model-invocation: true` stops the agent firing it autonomously.

## Subagents

Drop `agents/strategy-analyzer.md` in `~/.claude/agents/` or `.claude/agents/`.

Check the `tools:` line survived the copy. Its read-only guarantee comes from that list omitting Edit and Write, not from the prose telling it not to fix things.

## Workflows

`workflows/example-audit.js` is a working skeleton, not pseudocode. Adapt the schemas and prompts.

The two things that make a workflow reliable rather than impressive: schema-constrained agent output, so results are typed data instead of prose to re-parse; and doing merges, dedupes, and sorts in plain JavaScript rather than asking an agent to restate content it already returned.
