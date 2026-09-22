"""
block-example-trap.py - PreToolUse hook for Claude Code (Bash).

Blocks <describe the exact command shape and why it is dangerous>.

THE BAR FOR ADDING A HOOK AT ALL:
Add one only when the trap fails SILENTLY or EXPENSIVELY. A loud, instant,
self-correcting failure does not earn a hook - it costs one tool call and the
model fixes itself. Combine that with the twice-rule: promote a prose rule to a
hook only after the same mistake has actually happened twice.

Kill switch: <hooks-dir>/.example-trap-off
If that file exists this exits 0 immediately, checked before anything else runs.
That lets one hook be disabled with one `touch`, with no settings.json edit and
no restart.

FAIL OPEN ON EVERYTHING: unparseable stdin, an unexpected payload shape, a
missing field, any exception at all - exit 0 and let the command through. A
guard that blocks real work because of its own bug is worse than the trap it
exists to catch.

Manual test (no real tool-call payload needed):
    py block-example-trap.py --simulate "the dangerous command text"
"""

import json
import re
import sys
from pathlib import Path

HOOKS_DIR = Path(__file__).resolve().parent
KILL_SWITCH = HOOKS_DIR / ".example-trap-off"

# The pattern that identifies the dangerous shape. Keep it narrow enough that it
# never fires on an innocent command that merely mentions the same words - a
# comment, this file's own --simulate self-test, or a grep for the string.
TRAP_RE = re.compile(r"\bdangerous-command\b.*--unsafe-flag")

# The model reads this text. Name what breaks, then name the safe alternative.
# A reason the model can act on turns a block into a correction; a bare "denied"
# just makes it retry the same thing.
REASON = (
    "Blocked: <one sentence naming exactly what breaks and why>. "
    "<One sentence naming the safe alternative to use instead>."
)


def evaluate(command: str) -> str | None:
    if TRAP_RE.search(command):
        return REASON
    return None


def deny(reason: str) -> None:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))


def main() -> int:
    try:
        if KILL_SWITCH.exists():
            return 0

        if "--simulate" in sys.argv:
            idx = sys.argv.index("--simulate")
            command = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else ""
            reason = evaluate(command)
            print(f"WOULD {'DENY: ' + reason if reason else 'ALLOW'}", file=sys.stderr)
            if reason:
                deny(reason)
            return 0

        raw = sys.stdin.read()
        if not raw.strip():
            return 0
        payload = json.loads(raw)

        tool_name = (payload.get("tool_name") or "").lower()
        if tool_name != "bash":
            return 0

        tool_input = payload.get("tool_input") or {}
        command = tool_input.get("command") or ""
        if not command:
            return 0

        reason = evaluate(command)
        if reason:
            deny(reason)
        return 0
    except Exception:  # noqa: BLE001 - fail open, never block on our own bug
        return 0


if __name__ == "__main__":
    sys.exit(main())

# ---------------------------------------------------------------------------
# REGISTRATION
#
# Append this block to the existing PreToolUse array in settings.json.
# Do NOT assign over the key - multiple blocks on the same event all fire, and
# overwriting silently drops every hook already registered there.
#
#   {
#     "matcher": "Bash",
#     "hooks": [
#       { "type": "command", "command": "py \"<hooks-dir>/block-example-trap.py\"" }
#     ]
#   }
#
# Relaunch Claude Code after any settings.json hook edit. Hooks are not
# hot-reloaded mid-session.
#
# ---------------------------------------------------------------------------
# OTHER EVENTS, AND WHAT THEY RETURN
#
# PreToolUse   Prevent a call. Allow: print nothing, exit 0. Deny: the JSON above.
#
# PostToolUse  The call already happened and cannot be undone. React to it.
#              Plain stdout only reaches the transcript. To put text in front of
#              the model, print:
#              {"hookSpecificOutput":{"hookEventName":"PostToolUse",
#               "additionalContext":"<text>"}}
#
# Stop         Catch a pattern in how the TURN ends, not in any one tool call.
#              Let it end: print nothing, exit 0.
#              Bounce it back: {"decision":"block","reason":"<text>"}
#              ALWAYS check payload["stop_hook_active"] first and exit 0 if true,
#              or a blocking Stop hook loops forever, one bounce per turn.
#
# SessionStart Inject context once at session open. Plain stdout here IS
#              injected into the session's context.
# ---------------------------------------------------------------------------
