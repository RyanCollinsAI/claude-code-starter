/**
 * example-audit.js - a reusable Workflow-tool script.
 *
 * A workflow is plain JavaScript that orchestrates fresh-context subagents under
 * deterministic control flow. It exists to solve the orchestration tax: every hop
 * from subagent A to orchestrator to subagent B re-passes most of the same tokens
 * through a paid model call. In a workflow, no intermediate output passes through
 * the main context window at all.
 *
 * This is the "fan out over units of work, verify a sample, synthesize a report"
 * shape that most audit-style workflows are a variation of.
 */

export const meta = {
  name: 'example-audit',
  description: 'Discover a set of targets, evaluate each one against a rubric, verify the weakest findings, and write a ranked report',
  whenToUse: 'Read-only sweep. Pass args as { scope?: string } to narrow the discovery root; defaults to the whole repo.',
  phases: [
    { title: 'Discover' },
    { title: 'Evaluate', model: 'sonnet' },
    { title: 'Verify', model: 'sonnet' },
    { title: 'Report' },
  ],
}

// Args always arrive as either a plain object or a JSON string. Normalize once,
// up top, and fall back to a safe default rather than throwing.
const input = typeof args === 'string'
  ? (() => { try { return JSON.parse(args) } catch { return {} } })()
  : (args ?? {})
const SCOPE = input?.scope ?? '.'
const OUT_PATH = `./reports/example-audit-${SCOPE.replace(/[\\/]/g, '_')}.md`

// Schemas constrain every agent's final output to structured data the orchestrator
// can filter and sort in plain JS afterward, instead of prose that needs re-parsing.
// This is the backbone of every reliable workflow.
const DISCOVER_SCHEMA = {
  type: 'object',
  required: ['targets'],
  properties: {
    targets: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'path'],
        properties: {
          id: { type: 'string' },
          path: { type: 'string' },
        },
      },
    },
  },
}

const EVAL_SCHEMA = {
  type: 'object',
  required: ['id', 'score', 'finding'],
  properties: {
    id: { type: 'string' },
    score: { type: 'number', description: '1-5, higher is better' },
    // Explicit word limits in schema descriptions are how you survive output caps
    // when scoring many items.
    finding: { type: 'string', description: 'MAX 40 WORDS - what is wrong and why it matters' },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  required: ['confirmed', 'reason'],
  properties: {
    confirmed: { type: 'boolean', description: 'true ONLY if you reproduced the finding yourself' },
    reason: { type: 'string' },
  },
}

// --- Phase 1: Discover -------------------------------------------------------
// One agent, broad read-only search. This is a BARRIER on purpose: Evaluate needs
// the full target list to divide work, so nothing downstream can start first.
phase('Discover')
const disc = await agent(
  `Find every target worth evaluating under ${SCOPE}. Read-only - change nothing.`,
  { label: 'discover', phase: 'Discover', model: 'sonnet', schema: DISCOVER_SCHEMA },
)
const targets = disc?.targets ?? []
log(`Discovered ${targets.length} targets`)
if (!targets.length) return { error: 'Discovery found nothing - check the scope.' }

// PLAUSIBILITY FLOOR: a workflow that silently audits 2 of 400 files and reports
// "0 defects found" looks identical to a clean bill of health. Abort loudly instead.
// Replace BASELINE with a real independent count for your target population.
// const BASELINE = <independent count>
// if (targets.length < BASELINE * 0.4) {
//   return { error: `Inventory implausibly small: ${targets.length} of ~${BASELINE}. Aborting.` }
// }

// --- Phase 2: Evaluate -------------------------------------------------------
// parallel(), not pipeline(): every target's evaluation is fully independent and
// nothing downstream needs a global view until Verify picks its sample.
phase('Evaluate')
const evaluated = (await parallel(targets.map((t) => () =>
  agent(
    `Evaluate ONE target against the rubric. Return score 1-5 and a short finding.\n\nid: ${t.id}\npath: ${t.path}`,
    { label: `eval:${t.id}`, phase: 'Evaluate', model: 'sonnet', schema: EVAL_SCHEMA },
  )
))).filter(Boolean)
log(`Evaluated ${evaluated.length}/${targets.length}`)

// --- Phase 3: Verify ---------------------------------------------------------
// Adversarial verification with a default-false prior. The verifier is told to
// REFUTE, and must reproduce the evidence itself rather than trust the auditor.
//
// Only the weakest findings get re-checked. Verifying everything would cost N
// agents for marginal benefit on items that were already fine. That is a
// deliberate, stated sampling decision, not an oversight - say so in the report
// rather than letting it read as full coverage.
phase('Verify')
const weakest = evaluated.filter((e) => e.score <= 2)
const verified = (await parallel(weakest.map((e) => () =>
  agent(
    `Adversarially verify this finding. Your default answer is NOT CONFIRMED - try to refute it. Re-run the evidence yourself; do not trust the claim as written.\n\n${JSON.stringify(e)}`,
    { label: `verify:${e.id}`, phase: 'Verify', model: 'sonnet', schema: VERIFY_SCHEMA },
  ).then((v) => ({ ...e, verdict: v }))
))).filter(Boolean)
log(`Verified ${verified.length}/${weakest.length} weak findings`)

// --- Phase 4: Report ---------------------------------------------------------
// Report writing is an agent call so it can use the Write tool and format
// Markdown well, but the DATA was already assembled and sorted in plain JS above.
// Never ask an agent to re-emit a merged list of everything it already returned -
// that blows the output cap on anything but a small input.
phase('Report')
evaluated.sort((a, b) => a.score - b.score)
await agent(
  `Write a Markdown report to ${OUT_PATH} (create parent dirs if needed).
Include a table of all findings sorted worst-first, and a separate section for the
${verified.length} verified weak findings with their verifier reason. State plainly
that only findings scoring 2 or below were verified.

ALL FINDINGS:
${JSON.stringify(evaluated)}

VERIFIED WEAK FINDINGS:
${JSON.stringify(verified)}`,
  { label: 'report', phase: 'Report', model: 'sonnet' },
)

return {
  reportPath: OUT_PATH,
  targetsDiscovered: targets.length,
  evaluated: evaluated.length,
  weakVerified: verified.length,
}

/* ---------------------------------------------------------------------------
 * PARALLEL VS PIPELINE
 *
 * parallel(thunks)  Independent work. Every item finishes on its own schedule
 *                   and nothing downstream waits for the whole set.
 *
 * pipeline(items, stage1, stage2, ...)
 *                   A multi-stage transform where each item's stage 2 depends on
 *                   that SAME item's stage 1, but different items do not depend
 *                   on each other. Item 1 enters stage 2 while item 2 is still in
 *                   stage 1. Strictly more concurrent than chaining two parallel
 *                   calls, which would barrier between them.
 *
 * A BARRIER is only justified when the next step genuinely needs a global view:
 *   - deduplication across the whole catalog
 *   - a final ranking that needs every score to sort correctly
 *   - a population count that must see everything to catch a short inventory
 * If the next step needs only one item's own upstream result, that is a pipeline
 * stage, not a barrier. Inserting one anyway just adds idle time.
 *
 * WRITING FILES
 * Any phase that writes should work in a fresh git worktree, and should prove its
 * own identity with `git rev-parse --show-toplevel` before trusting a git command
 * against it. Gate then merge; never auto-commit. Let a human review the diff.
 * --------------------------------------------------------------------------- */
