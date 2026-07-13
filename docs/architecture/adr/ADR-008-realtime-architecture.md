# ADR-008: Realtime Architecture

**Status**: Accepted
**Date**: 2026-07-13
**Decision Maker**: Founder (Islam Elbaz)
**Related ADRs**: ADR-002 (Backend — FastAPI WebSocket), ADR-005 (Database — event sourcing), ADR-013 (Event-driven)

**References**:
- [`MASTER_CONTEXT.md`](../../MASTER_CONTEXT.md) — marketplace coordination requirements
- [`PRODUCT_CANON.md`](../../PRODUCT_CANON.md) — §8 BR-INV-01 (calendar locking), §11 Experience thresholds
- [`ARCHITECTURE.md`](../../ARCHITECTURE.md) — §4 Core Data Flows
- [`TECH_STACK.md`](../../TECH_STACK.md) — §1 Confirmed
- [`ENGINEERING_RULES.md`](../../ENGINEERING_RULES.md) — §3 Business Rules

---

## Problem

Several marketplace interactions require real-time or near-real-time updates:

1. **Calendar availability locking** (FC-03): When Guest A is in checkout on a unit, Guest B must see that unit as "hold in progress" — not available. Without real-time updates, double-booking attempts increase.
2. **OpsManager ticket state** (FC-05): Field staff must see ticket assignments appear instantly on their mobile app. A 60-second polling delay means missed assignments.
3. **Booking confirmation** (FC-03): Guest must see "booking confirmed" immediately after payment — not after a page refresh.
4. **PMS calendar updates** (FC-04): When a host manually blocks dates, that change must propagate to the guest search results immediately.

No realtime architecture is specified in the repository. This blocks FC-03 and FC-05 implementation.

---

## Realtime Requirement Classification

| Interaction | Latency Requirement | Direction | Frequency |
|------------|-------------------|-----------|-----------|
| Calendar lock during checkout | < 1 second | Server → Client | Medium |
| Booking confirmation | < 2 seconds | Server → Client | Medium |
| OpsManager ticket arrival | < 3 seconds | Server → Client | Medium |
| PMS calendar update | < 5 seconds | Server → Client | Low |
| Live chat (guest-host) | Not Phase 1 — WhatsApp handles this | N/A | N/A |

---

## Options Evaluated

### Option A: WebSockets (bidirectional, persistent connection)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Requires sticky connections. AWS ALB supports WebSocket. ECS Fargate task stays alive per connection. Moderate compute cost at scale. |
| **Scalability** | Requires connection state management (Redis pub/sub for multi-instance). Scales to ~10K concurrent connections per Fargate task. |
| **Operational Complexity** | Moderate. FastAPI supports WebSocket natively. Redis pub/sub for broadcasting across multiple backend instances. |
| **Security** | WSS (WebSocket over TLS). JWT auth on connection handshake. |
| **Performance** | < 50ms message delivery. Best for frequent bidirectional updates. |
| **Future Global Expansion** | Standard protocol. Works across all regions. |

**Pros**: Best latency. Bidirectional — server can push; client can acknowledge. FastAPI has native WebSocket support.
**Cons**: Persistent connections consume resources. Calendar lock notifications are infrequent — WebSocket may be over-engineered for Phase 1 traffic.

---

### Option B: Server-Sent Events (SSE — unidirectional server → client)

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Lower than WebSocket. HTTP/1.1 keep-alive connection. Less overhead per connection. |
| **Scalability** | Similar to WebSocket. Redis for pub/sub broadcasting. |
| **Operational Complexity** | Low. SSE is HTTP-native. No special protocol. Next.js supports SSE via API routes. |
| **Security** | Standard HTTPS. JWT in Authorization header of initial SSE connection. |
| **Performance** | < 200ms message delivery. Sufficient for all StayOS realtime requirements (none require < 50ms). |
| **Future Global Expansion** | Works everywhere HTTP works. |

**Pros**: Simpler than WebSocket. HTTP/2 multiplexing allows multiple SSE streams over a single connection. Auto-reconnect built into browser EventSource API. Sufficient for all identified realtime needs (all server-to-client, none require client-to-server realtime).
**Cons**: Unidirectional only. For client-initiated realtime (e.g., typing indicators in chat), WebSocket needed — but live chat is not Phase 1 scope.

---

### Option C: Short Polling

| Dimension | Assessment |
|-----------|-----------|
| **Cost** | Low per request, but high aggregate if polling interval is short. |
| **Scalability** | Simple but generates unnecessary load at high user counts. |
| **Operational Complexity** | Lowest. Just a regular HTTP endpoint. |
| **Security** | Standard HTTPS. |
| **Performance** | Latency = polling interval. 5-second poll = up to 5-second delay for updates. |
| **Future Global Expansion** | No concern. |

**Pros**: Simplest to implement. No persistent connection management.
**Cons**: Violates the experience thresholds in PRODUCT_CANON.md (§11: booking confirmation < 2 seconds). 5-second polling is too slow for calendar lock notification. Wastes server resources on no-op requests.

---

## Decision

**Server-Sent Events (SSE) for Phase 1**

- Calendar availability changes → SSE stream on listing detail page
- Booking confirmation → SSE stream on checkout page
- OpsManager ticket assignments → SSE stream on field staff app

**Redis pub/sub** (from ADR-005) serves as the message bus between FastAPI instances and SSE streams.

**If Phase 2 introduces live guest-host chat**: Upgrade to WebSocket at that point. The SSE abstraction layer makes this migration additive (add WebSocket handler; keep SSE for notification streams).

---

## Decision Rationale

1. **All Phase 1 realtime needs are server-to-client**: Calendar lock, booking confirmation, and ticket assignment are all server-pushing state to clients. No client-to-server realtime is needed in Phase 1 (live chat is out of scope per MVP_FREEZE.md). SSE is purpose-fit.

2. **Experience thresholds met**: PRODUCT_CANON.md §11 requires booking confirmation < 2 seconds. SSE delivers < 200ms latency — well within threshold. Short polling cannot meet this requirement reliably.

3. **Lower operational complexity than WebSocket**: FastAPI's `StreamingResponse` with `text/event-stream` content type implements SSE with no additional library. Redis pub/sub is already in the stack (ADR-005). No WebSocket server management required.

4. **Browser native**: `EventSource` API is built into all modern browsers. No JavaScript WebSocket library required in Next.js — reduces frontend bundle size.

5. **Phase 2 upgrade path is clean**: When live chat is added (Phase 2), WebSocket channels can be added to the backend without modifying the SSE infrastructure.

---

## Rejected Alternatives

| Alternative | Reason Rejected |
|------------|----------------|
| WebSocket (Phase 1) | Over-engineered for Phase 1 traffic; all realtime needs are unidirectional; higher complexity without benefit |
| Short polling | Cannot meet 2-second booking confirmation threshold; wastes server resources |
| Long polling | More complex than SSE; less standard; browser EventSource preferred |

---

## Architecture Detail

```
[PostgreSQL write] → [SQLAlchemy event hook] → [Redis pub/sub channel]
                                                         │
                                                [SSE broadcast worker]
                                                         │
                                              [FastAPI SSE endpoint]
                                                         │
                                              [Browser EventSource]
```

Each SSE channel is scoped to:
- `listing/{id}/availability` — calendar state changes
- `booking/{id}/status` — booking confirmation progress
- `ticket/{id}/state` — OpsManager ticket state changes

JWT token validated on SSE connection establishment. Channel subscription checked against user's permitted resources.

---

## Migration Cost

**Phase 1 → Phase 2 (add WebSocket for chat)**: SSE streams remain. WebSocket server added as a parallel endpoint. Migration cost: additive only.

---

## Dependencies

- ADR-002 (Backend) — FastAPI `StreamingResponse` + asyncio for SSE
- ADR-005 (Database) — Redis pub/sub for multi-instance broadcast
- ADR-013 (Event-driven) — PostgreSQL write events trigger Redis pub/sub messages

---

## Impact

| Affected Area | Impact |
|--------------|--------|
| FC-03 Reservation | Booking confirmation via SSE; calendar lock propagation |
| FC-04 PMS Core | Manual calendar blocks visible to guests in < 5 seconds |
| FC-05 OpsManager | Ticket assignment appears on field staff app in < 3 seconds |
| Experience thresholds | 2-second booking confirmation met |
| Phase 2 | WebSocket added additively when live chat is in scope |

---

## Review History

| Date | Reviewer | Changes | Status |
|------|----------|---------|--------|
| 2026-07-13 | Islam Elbaz (Founder) | Initial draft | Accepted |
