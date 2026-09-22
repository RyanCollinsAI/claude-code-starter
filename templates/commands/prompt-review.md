---
description: Critique the user's own prompting in this session - names the costliest habit, quotes the prompts that wasted time, and gives rewrites and rules for next time
argument-hint: "[scope, e.g. last 10 turns, or since the auth bug]"
---

# /prompt-review

Critique **the user's prompting**, not the work you produced. This is a mistake log for the human side of the session, not a summary of what got built.

Scope: $ARGUMENTS - if given, review only that slice of the conversation; if empty, review the whole session so far.

Run this at the END of a session, after the change is finished. Running it mid-task reviews an incomplete picture.

Ground rules, apply all of them:

- Quote the user's actual words, pulled verbatim from the transcript, in quotes. Never paraphrase a prompt into a cleaner version and present that as what they said - the paraphrase belongs in the rewrite, not the quote.
- No flattery, no hedging, no "overall this went smoothly." If a section genuinely has nothing in it, write one line saying so and move on. Do not pad it with a weak example to fill space.
- Judge the prompt, not the outcome. A vague prompt that happened to land is still vague; say so.
- Before section 1, write one sentence naming the single prompting habit that cost the most time or tokens this session. Be specific about the cost - a redo, a wrong-direction build, a clarifying round trip, a context dump the agent had to re-derive. Not "communication could be clearer."

Return exactly these five sections, in this order, with these headers:

## 1. Prompts that worked

Quote 1-3 prompts that got a clean result on the first pass. For each, name the specific thing that made it land - constraint stated up front, example given, scope bounded, file or path named instead of described. Not "this was clear."

## 2. Prompts that cost time

For each offending prompt: quote it verbatim, state what it actually cost (round trips, a scrapped build, tokens spent guessing), then write the rewritten version they should have sent instead. One quote-cost-rewrite triplet per prompt, as many as apply.

## 3. Patterns to fix

Recurring habits only - something that happened 2+ times this session, cited with both instances. A single bad prompt already covered in section 2 is not a pattern; skip anything that only happened once.

## 4. Missing context

What did the agent have to guess at or ask about because it was not told upfront, and where should that fact live so it never has to guess again? Route each item to the right home rather than dumping everything into one bucket:

- A fact about one part of the codebase goes in the nearest CLAUDE.md, not the root one.
- A standing decision or preference goes in memory.
- A rule that must never be broken, where breaking it fails silently or expensively, goes in a PreToolUse hook, not prose.

## 5. Rules for next time

Three to five imperatives, one sentence each. Every rule must trace back to something that actually happened in this session. No generic prompting advice.
