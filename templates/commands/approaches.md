---
description: Three genuinely different approaches to a decision, each with build cost, maintenance cost, and what it forecloses - then one committed recommendation and the single fact that would flip it
argument-hint: <the decision, e.g. how to store per-environment config>
---

# /approaches

The decision is: **$ARGUMENTS**

If that came through empty, reply with exactly one line asking what the decision is, and stop. Do not guess at it from the conversation.

This is the mid-weight option. Heavier than just answering, lighter than a full advisor-panel review - no peer review, one pass by you. If the decision is genuinely high-stakes and deserves pressure-testing from multiple angles, say so in one line at the end and let the user call for that; do not run it yourself.

Read whatever you need to answer accurately before writing anything - the relevant CLAUDE.md, the actual files, the tools already installed. An approach that duplicates something the user already has is a wasted slot.

## The three approaches

They must differ **in kind, not in degree**. Three variations of one idea is a failed run - "do it in Python / do it in Python but faster / do it in Python with a cache" is one approach, not three. They should disagree about something structural: where the work lives, who or what does it, when it runs, whether it is built at all. If you can only find two that differ in kind, present two and say the third would have been filler.

Buying a tool, using something that already exists, and doing nothing are all legitimate approaches. So is the boring one.

For each, in this order and this compact:

- **What it is** - two sentences, concrete enough to start on.
- **Build cost** - your hours, not a human's. Price it that way.
- **Maintenance cost** - what breaks, how often, and who notices when it does.
- **What it makes harder later** - the thing this locks in or forecloses. Every approach has one. If you write "none," you have not thought about it.
- **True for this to win** - the condition under which this is the right pick. State it as a fact that is either true or false about the actual setup, not a preference.

## The recommendation

Exactly one. Committed, in the first sentence, no hedge. No "it depends," no "all three are viable," no ranking. Give the **single** reason it wins - the one that would still be decisive if every other reason vanished.

Then: **What would flip this.** One fact, stated so plainly the user can confirm or deny it in a sentence. If that fact were different, name which approach wins instead.

## Then stop

Do not start building, scaffolding, writing files, or spawning subagents. Do not ask "want me to build it?" The next turn is the user picking. End after the flip condition.
