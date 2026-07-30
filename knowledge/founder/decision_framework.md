# Decision Framework — StayOS

**Domain**: Founder
**Audience**: Founders, Senior Leadership
**Version**: 1.0
**Last Reviewed**: 2026-07-27
**Review Frequency**: Semi-annually
**Tags**: decisions, framework, strategy, tradeoffs, reversibility, founder, governance

---

## Purpose

This article defines how decisions are made at StayOS — what types of decisions exist, who makes each type, how to make irreversible decisions carefully, and how to move fast on reversible ones. Good decision-making is the primary determinant of startup survival.

---

## Background

Startups fail in two opposing ways: too slow (endless deliberation, committee decisions, risk aversion) or too fast (insufficient analysis, reversing decisions that cost dearly to reverse, rushing into irreversible commitments). The framework below is designed to get StayOS to "appropriately fast" — slow where it matters, fast where it doesn't.

The canonical insight (from Jeff Bezos, operationalized for StayOS): not all decisions are equal. Type 1 decisions are irreversible — making them wrong costs a lot to fix. Type 2 decisions are reversible — making them wrong costs very little because you can just change course.

**Type 1 decisions**: Move slowly. Use formal process. Seek broad input. Document rationale.
**Type 2 decisions**: Move fast. Individual or small team authority. Don't wait for consensus.

---

## Decision Classification

### Type 1: Irreversible or Hard-to-Reverse Decisions

**Criteria**: A decision is Type 1 if reversing it would cost >30 days of team time, >EGP 50,000, or would create a significant breach of trust with a key stakeholder.

**Examples at StayOS**:
- Choosing Paymob as the primary payment processor (DEC-004) — switching payment processors requires re-integrating all payment flows and migrating all host payout accounts
- Arabic-first UX (DEC-003) — a fundamental design decision that affects all UI components; reversing it would require rebuilding the entire frontend
- The escrow model (DEC-008) — the financial trust mechanism; changing it mid-operation would require communicating to all existing hosts and guests
- Choosing Egypt as the first market (DEC-002) — establishing operations, team, supplier relationships, and brand in Egypt; moving to a different country means starting over
- Hiring a senior executive (any C-level or above) — firing costs morale, relationships, and time; takes months to recover
- Signing a long-term lease or infrastructure contract

**Process for Type 1 decisions**:
1. Document the decision in the Decision Log before making it
2. Write out alternatives considered and why they were rejected
3. Identify the reversibility cost explicitly: "If this is wrong, what does it cost to fix?"
4. Get input from at least one qualified external party (advisor, investor, domain expert)
5. Sleep on it — no Type 1 decisions under time pressure unless the timing itself is the constraint
6. Make the decision and document the date and rationale

---

### Type 2: Reversible Decisions

**Criteria**: A decision is Type 2 if reversing it would cost less than 3 days of team time and no significant stakeholder relationship damage.

**Examples at StayOS**:
- Pricing a specific listing higher or lower
- The wording of a WhatsApp support template
- Which neighborhood to start geographic concentration in
- Whether to run a specific marketing campaign
- How the daily operations runbook is structured
- Which cleaning team is assigned to which property

**Process for Type 2 decisions**:
- Make them. Tell the relevant people. Move on.
- If you're waiting for the founder's approval on a Type 2 decision, the delegation isn't working. Type 2 decisions should be delegated to the person most informed about the specific situation.

---

## The Three-Question Test

When a decision doesn't clearly fit Type 1 or Type 2, apply these three questions:

**Question 1: What's the cost of being wrong?**
Think through the worst plausible outcome if this decision is wrong. How long to fix? How much to fix? Who is affected?
- Cost <EGP 10,000 and <3 days to fix → Type 2
- Cost >EGP 50,000 or >30 days to fix → Type 1

**Question 2: How much information do I have?**
No decision is made with perfect information. The question is: would waiting for more information meaningfully change the decision?
- If more time = meaningfully better decision → wait
- If more time = incrementally better decision → don't wait
- If more time = same decision → stop analyzing and decide

**Question 3: What's the cost of delay?**
Some decisions have a cost of delay (the competitor will move while we deliberate; the supplier will sign with someone else; the season will change). Others don't (database architecture decisions are not time-sensitive).
- If delay has significant cost → weight toward faster decision
- If delay has low cost → take the time to do it right

---

## Governance Structure (Stage 1)

**Founder-level decisions (Type 1)**:
- Business model changes
- Major product direction changes
- Hiring for senior roles
- Partnership agreements above EGP 50,000 in value
- Any public communication about an incident
- Regulatory engagement
- Investor communications
- Company financial decisions above EGP 10,000

**Operations Manager decisions (Type 2, operational)**:
- Property onboarding decisions (does this property pass inspection?)
- Cleaning team assignments and scheduling
- Emergency resource authorization up to EGP 1,000
- Property blocking decisions (BLOCKED status)
- On-call escalation decisions within the escalation matrix

**Support Lead decisions (Type 2, customer-facing)**:
- Refunds up to full booking value
- Goodwill credits above EGP 300
- Formal warnings to host or guest accounts
- Cancellation policy exceptions

**Trust & Safety Lead decisions (mixed)**:
- Account suspensions → Type 2 (easily reversed if wrong)
- Permanent bans → Type 1 (public, hard to reverse without reputational cost)

---

## Decision Vices to Avoid

**Vice 1: Treating Type 2 decisions as Type 1**
A team that needs founder approval to change the wording of a WhatsApp template is paralyzed. If the decision is easily reversible, the authority should be delegated.

**Vice 2: Treating Type 1 decisions as Type 2**
"We'll figure out the payment processor later" is treating a Type 1 decision as if it were reversible. Late in the game, when you realize Paymob can't support a feature you need, you are locked in.

**Vice 3: Decision by committee**
Committees make averaged, compromise decisions. In a startup, averaged decisions are usually wrong for everyone. One person with authority and accountability makes better decisions than five people sharing it. Committees are appropriate for input gathering, not decision making.

**Vice 4: Reversing Type 1 decisions under pressure**
An investor pushes back on the Arabic-first UX decision. The team starts second-guessing. The pressure to reverse is social, not evidence-based. A Type 1 decision that was made carefully should require equally careful re-analysis to reverse — not social pressure.

**Vice 5: Decisions without documentation**
A decision made in a WhatsApp conversation that nobody records is a decision that will be re-litigated in 3 months. Document all Type 1 decisions and all Type 2 decisions with significant implications.

---

## The Pre-Mortem Technique

Before making a significant Type 1 decision, run a pre-mortem:

> "It is [date 12 months from now]. The decision we made today has led to disaster. What specifically went wrong?"

Write down 5 specific failure scenarios. Examine each:
- How likely is this scenario? (1–10)
- How bad is it if it happens? (1–10)
- What would we do to prevent it?
- What would we do if it happened anyway?

If any scenario scores high on both likelihood and severity, the decision needs more analysis or a contingency plan.

**Example**: Applying the pre-mortem to DEC-004 (Paymob as primary processor):
- Scenario: Paymob terminates our account due to chargebacks. Likelihood: 3/10. Severity: 9/10.
- Prevention: Monitor chargeback rate weekly; maintain Stripe as active backup.
- If it happens: Activate Stripe immediately, notify hosts of payout delay.
- Pre-mortem finding: The scenario is severe enough that we must ensure Stripe is actually production-ready, not just referenced in code.

---

## Reversing Decisions

When evidence suggests a Type 1 decision was wrong, reversing it requires:

1. **Evidence, not emotion**: The decision should be reversed because the evidence shows it was wrong — not because of pressure, doubt, or a single counter-example.

2. **Proper analysis**: Apply the same rigor to the reversal as to the original decision. What is the new decision? What are the alternatives? What is the cost of reversal?

3. **Stakeholder communication**: Who is affected by the reversal? They must be told clearly: "We made decision X. We are changing it to Y. Here's why." Reversals without communication erode trust.

4. **Document the reversal**: Add to the Decision Log: "DEC-[number] was revised on [date] based on [evidence]."

---

## The "70% Rule"

Make most decisions at 70% confidence. Waiting for 90%+ confidence on reversible or moderately reversible decisions means:
- You miss time-sensitive opportunities
- You wait for information that doesn't actually change the decision
- You create a culture of analysis paralysis

The 70% rule does not apply to:
- Safety decisions (require full confidence)
- Type 1 decisions with very high reversal cost (require 90%+)
- Legal and regulatory commitments (require full confidence)

---

## Decision Debt

"Decision debt" is the accumulation of decisions that were deferred, made implicitly (by doing something without explicitly deciding), or made without documentation. Like technical debt, decision debt compounds — undocumented decisions get re-litigated; implicit decisions become invisible constraints.

**Signs of decision debt at StayOS**:
- "Why do we do it this way?" answers are "I don't know, we've always done it this way"
- The same discussion recurring in team meetings without resolution
- Team members making inconsistent choices in similar situations (because the decision was never made explicitly)

**Clearing decision debt**: When you notice a pattern where the team is making inconsistent decisions or re-litigating the same question, make the decision explicitly, document it, and communicate it.

---

## Related Documents

- `.ai/CURRENT/DECISION_LOG.md` — All recorded product and business decisions
- `knowledge/founder/vision_and_principles.md`
- `knowledge/founder/scaling_playbook.md`
- `knowledge/product/product_decision_framework.md`
