# <Client Name> Engagement

<One or two sentences: what this engagement is, who the client is, and why deliverable quality here matters beyond this one project.>

Drop this file at the root of the <client> working directory on the work machine.

## Audience

<Name every distinct reader who will see output from this engagement, and what each one actually wants. Mixing up audiences is the single most common way a deliverable lands badly.>

- **<Person / role A>.** <What they want. What NOT to show them.>
- **<Person / role B>.** <What they want. What NOT to show them.>

Write every artifact for one of them, not both. A deliverable that tries to serve two audiences serves neither.

## Deliverable types

| Type | Rules |
|---|---|
| Decks / slides | <Design system to use, if any. Do not substitute another visual language.> |
| Prototypes / demos | Must actually run. A mockup presented as working costs more trust than not demoing at all. |
| Written docs / emails | <House style pass required before it ships, if any.> |
| Technical writeups | Name the trade-offs and the failure modes. Do not present one option as inevitable. |

## Data handling

- Seed and demo data is synthetic by default. Never point a prototype at real client data without explicit written approval.
- Never copy real client records (customer data, financials, PII) onto this machine.
- Never send client data to a third-party service, including an AI provider not already approved for this engagement.

## Boundaries

This directory touches a real client. Treat every one of these as needing explicit, per-action approval.

- No email, message, or shared document goes out without explicit approval of that specific message.
- No client data goes into third-party services.
- Nothing touching production systems, customer records, or financials happens without a human in the loop, every time.
- **Approval for one action does not carry to the next one.** An earlier yes is not blanket future authorization.

<If any of these must never be broken and would fail silently, back it with a PreToolUse hook rather than trusting this file. Prose gets ignored roughly 1 run in 30, and on a client machine that is the wrong risk to carry.>

## Landmines

<Anything that has already gone wrong once on this engagement, or that is structurally easy to get wrong: stale dates in decks, empty speaker-note stubs, scope creep from a meeting conversation, an assumption inherited from a previous phase.>

-

## Lab Notes

Things already tried that did not work on this engagement. Date every entry.

-
