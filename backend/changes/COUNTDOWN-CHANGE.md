# Change Log

## CHANGE-001: Early Round Completion When All Players Have Answered

**Date**: 2026-02-15
**Status**: Approved

### Problem

Currently, each quiz round always runs for the full timeout duration (`party.timeout` seconds), even if all connected players have already submitted their answers. This creates unnecessary waiting time and a poor user experience.

**Related Requirements**: REQ-GP-006, REQ-GP-011

### Discussion

**Initial approach considered**: Replace the single `setTimeout` with a repeating interval (`setInterval`) that periodically checks whether all players have answered. This was rejected because:
- It polls for a state change that the server already knows about at the moment it happens (each answer submission is an explicit event)
- Adds unnecessary timer overhead
- The round would not end instantly — it would wait until the next interval tick
- Harder to reason about: a loop checking state vs two clear triggers

**Decided approach**: Check at answer submission time and cancel the timeout early.

Two triggers end a round:
1. The existing `setTimeout` fires (not everyone answered in time) — no change to this path
2. The last player submits an answer — cancel the timeout, immediately trigger the same `handleQuestionTimeout` flow

### Design

#### 1. Track which users have answered the current round

Add `answered_users` (a `string[]` of user IDs) to the `Party` interface in `backend/src/models/party.model.ts`. This is serializable and compatible with the current JSON-based memory store (and future Redis migration).

#### 2. Clear the set at round start

In `game.service.ts` → `startRound()`, before the `// Pop next question` comment, reset the tracking:

```ts
party.answered_users = [];
```

#### 3. Record answers and check for early completion

In `game.service.ts` → `submitAnswer()`, after processing the answer, add the user to `answered_users`. Then check if all participants have answered:

```ts
party.answered_users.push(userId);
await savePartyToCache(partyId, party);

if (party.answered_users.length === party.participants.length) {
  const timeoutId = activeTimeouts.get(partyId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    activeTimeouts.delete(partyId);
  }
  await handleQuestionTimeout(partyId, party.current_question!.answer);
}
```

#### 4. Store timeout handles in a module-level Map

In `game.service.ts`, add a module-level map to hold active timeout references:

```ts
const activeTimeouts = new Map<string, NodeJS.Timeout>();
```

In `startRound()`, store the timeout ID when scheduling:

```ts
const timeoutId = setTimeout(async () => {
  activeTimeouts.delete(partyId);
  await handleQuestionTimeout(partyId, question.answer);
}, party.timeout * 1000);

activeTimeouts.set(partyId, timeoutId);
```

**Why a module-level Map and not on the Party object**: `NodeJS.Timeout` is a runtime handle — it cannot be serialized to JSON. The current memory store uses `JSON.stringify`/`JSON.parse`, and a future move to Redis would also require serializable data. Timer handles are inherently process-local and must stay in process memory.

#### 5. Race condition guard

If two players submit near-simultaneously, both could see "all answered" and call `handleQuestionTimeout` twice. Guard against this by adding an early return in `handleQuestionTimeout`:

```ts
if (!party.current_question) return;
```

This works because `handleQuestionTimeout` already deletes `current_question` (line 68 of `game.service.ts`). The second call will find it missing and bail out.

### Files to modify

| File | Change |
|------|--------|
| `backend/src/models/party.model.ts` | Add `answered_users?: string[]` to `Party` interface |
| `backend/src/services/game.service.ts` | Add `activeTimeouts` Map, update `startRound()` to clear `answered_users` and store timeout handle, update `submitAnswer()` to track answers and trigger early completion, add guard in `handleQuestionTimeout()` |

### Requirements impact

- **REQ-GP-006** (Question shall automatically advance when timer reaches zero): Unchanged — timeout still fires as fallback
- **REQ-GP-011** (System shall accept answer submissions until timeout expires): Unchanged — answers accepted until round resolves by either trigger
- **REQ-NFR-009** (System shall gracefully handle concurrent answer submissions): Addressed via `current_question` null check guard
