---
name: <skill-name>
description: <What it does, in one clause. Then: Use when [the specific branches that should fire it]. Quote the user's actual phrasing, typos included - a real trigger match beats a grammatically tidy one. Add an explicit disambiguation clause if a neighbouring skill covers adjacent ground: "For X, use <other-skill> instead.">
allowed-tools: <optional - restrict to the minimum this skill needs>
model: <optional - haiku or sonnet to pin a cheap model for low-reasoning work>
context: <optional - "fork" to run tool calls in an isolated window and return only the result>
disable-model-invocation: <optional - true if this should only ever fire when a human types its name>
---

# <Skill Name>

<One or two sentences: what this does and when it applies. Do not restate the description.>

<!--
DIRECTORY LAYOUT

  skill-name/
  ├── SKILL.md       # this file: description + steps and/or reference
  ├── GLOSSARY.md    # disclosed reference, only if the skill needs a domain model
  ├── REFERENCE.md   # any other disclosed reference, named for what it holds
  └── scripts/       # deterministic helpers

Only SKILL.md loads up front. Everything else loads when the skill reaches for it.

WHAT TO DISCLOSE: the test is branching. Inline what every branch needs. Push
behind a pointer what only some branches reach.
-->

## Steps

<Ordered actions. Every step ends on a completion criterion the agent can check -
done versus not-done. Where it matters, make it exhaustive: "every modified model
accounted for" beats "produce a change list." A vague criterion invites premature
completion.>

1. **<Step name>.** <What to do.> <How you know it is done.>
2. **<Step name>.** <What to do.> <How you know it is done.>
3. **<Step name>.** <What to do.> <How you know it is done.>

## Reference

<Definitions, rules, and facts consulted on demand rather than executed in order.
A flat peer-set is legitimate here. If this grows past what the top file can carry
legibly, move it to a sibling file and leave a pointer:

  For the full term list, read [GLOSSARY.md](GLOSSARY.md).
-->

## Examples

<One real example of right and wrong. This is the fix for generic, off-voice
output - a concrete anchor beats any amount of adjectives.>

**Wrong:**
```
<the failure mode>
```

**Right:**
```
<what it should look like>
```

<!--
WRITING RULES, APPLIED TO THIS FILE ITSELF

The virtue every rule serves is PREDICTABILITY: the agent taking the same process
every run. This is not documentation for humans. Every word should pull that lever.

Before you ship it, run three pruning passes in order:

1. RELEVANCE. Does each line still bear on what the skill does? Delete what does not.
2. NO-OP TEST, sentence by sentence. Does this sentence change behaviour versus the
   model's default? If not, delete the whole sentence rather than trim words from it.
   A weak instruction ("be thorough") is a no-op. The fix is a stronger word
   ("relentless"), not more words.
3. DUPLICATION. One meaning, one place. The same rule stated twice inflates its
   apparent importance and costs a two-place edit later.

Avoid steering by negation where a positive instruction works. Naming the forbidden
behaviour makes it more available to the model, not less. Keep a prohibition only as
a hard guardrail that cannot be phrased positively, and pair it with the positive
target anyway.

No fixed line count. Working skills run from 15 lines to several hundred split
across disclosed files. Length alone does not trigger a split; legibility does.

IF IT MISFIRES

  Never fires              Description too generic or too long -> sharpen triggers
                           with quoted phrasing, shorten
  Fires on the wrong thing Two descriptions overlap -> add a disambiguation clause
                           naming the other skill
  Asks what it answers     Instruction read as a question -> reword as an imperative
  Inconsistent run to run  Two files conflict -> find it, resolve it, re-test one
                           change at a time
  Generic output           No concrete anchor -> add one real right/wrong example

If this skill carries knowledge the model needs EVERY time and the trigger is
unreliable, stop relying on the trigger decision at all. Compress that knowledge
into a passive index in the relevant CLAUDE.md instead, so no decision is needed.
-->
