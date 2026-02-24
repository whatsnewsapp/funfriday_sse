# Quiz Banks — Requirements & Implementation

## 1. Overview

Quiz Banks replace the category-based question selection with precreated, curated collections of questions. Instead of choosing a category (e.g. "History") and getting random questions from it, quiz creators now select a **bank** — a named set of questions with metadata — when creating a party.

### 1.1 Motivation

- Categories are too broad and provide no control over which questions appear together
- Banks allow precurated question sets that can be reused or marked as "used" to prevent repeats
- Banks carry metadata (title, description, creator) giving quiz creators more context when choosing

### 1.2 What Changed

| Before | After |
|--------|-------|
| Creator picks a **category** from a dropdown | Creator picks a **bank** from a dropdown |
| Questions fetched randomly from that category | Questions fetched randomly from that bank |
| No usage tracking | Banks marked as "used" after a party is created |
| Category name stored on the party | Bank title stored as the party's `category` field |

### 1.3 What Did NOT Change

- The `Party` model still has a `category` field (now stores the bank title)
- Scoring by category continues to work — `category_scores` uses the bank title
- Party list, quiz page, start quiz, SSE events — all unchanged
- Game service, user service, party service — no modifications needed

---

## 2. Requirements

### 2.1 Bank Data Model

- **REQ-BK-001**: System shall support a `banks` collection in MongoDB
- **REQ-BK-002**: Each bank shall have: `bankId` (unique string), `title`, `description`, `creator`, `used` (boolean), `createdAt` (date)
- **REQ-BK-003**: The `bankId` field shall have a unique index

### 2.2 Question-Bank Assignment

- **REQ-BK-004**: Each question shall have an optional `bankId` field linking it to a bank
- **REQ-BK-005**: The `bankId` field on questions shall be indexed for efficient queries
- **REQ-BK-006**: Bank assignment is done at database seed time, not in the static `questions.json`

### 2.3 Bank Listing

- **REQ-BK-007**: System shall provide an API endpoint to list available (unused) banks
- **REQ-BK-008**: Each bank in the list shall include the count of questions it contains
- **REQ-BK-009**: Banks shall be sorted by title

### 2.4 Party Creation with Banks

- **REQ-BK-010**: Party creation shall accept a `bank_id` instead of a `category`
- **REQ-BK-011**: System shall validate the bank exists before creating a party
- **REQ-BK-012**: System shall fetch questions from the selected bank (random subset)
- **REQ-BK-013**: System shall store the bank's title as the party's `category` display name
- **REQ-BK-014**: System shall mark the bank as used after successful party creation

### 2.5 Frontend

- **REQ-BK-015**: Game creation page shall display a bank dropdown instead of a category dropdown
- **REQ-BK-016**: Each option shall show the bank title and question count
- **REQ-BK-017**: Selected bank's description shall be visible to the user
- **REQ-BK-018**: Number of rounds shall be capped to the selected bank's question count

---

## 3. Implementation

### 3.1 Database Seed — `database/init-mongo.js`

Seeds 5 banks with descriptive titles and randomly assigns each question a `bankId`:

```js
const banks = [
  { bankId: 'bank-1', title: 'Friday Quiz #1', ... },
  { bankId: 'bank-2', title: 'Mixed Bag #2', ... },
  { bankId: 'bank-3', title: 'Brain Buster #3', ... },
  { bankId: 'bank-4', title: 'Pub Quiz #4', ... },
  { bankId: 'bank-5', title: 'Lightning Round #5', ... },
];
```

Each question gets a random `bankId` before insertion. Indexes created on both `questions.bankId` and `banks.bankId` (unique).

### 3.2 Backend Model — `backend/src/models/bank.model.ts` (new)

```ts
interface Bank {
  bankId: string;
  title: string;
  description: string;
  creator: string;
  used: boolean;
  createdAt: Date;
}
```

### 3.3 Backend Model — `backend/src/models/question.model.ts` (modified)

Added optional `bankId?: string` to the existing `Question` interface. `QuestionForGame` unchanged.

### 3.4 Backend Service — `backend/src/services/bank.service.ts` (new)

| Function | Description |
|----------|-------------|
| `getAvailableBanks()` | Returns banks where `used === false`, sorted by title |
| `getBankById(bankId)` | Fetches a single bank by its `bankId` |
| `markBankAsUsed(bankId)` | Sets `used = true` on the bank document |

### 3.5 Backend Service — `backend/src/services/question.service.ts` (modified)

Added two functions (existing `getRandomQuestions` and `getCategories` kept for backwards compatibility):

| Function | Description |
|----------|-------------|
| `getQuestionsByBank(bankId, count)` | Aggregation with `$match` + `$sample` on `bankId` |
| `getQuestionCountByBank(bankId)` | Returns `countDocuments({ bankId })` |

### 3.6 Backend Routes — `backend/src/routes/party.routes.ts` (modified)

**POST /api/party/init** — Now accepts `bank_id` instead of `category`:
1. Validates `bank_id` exists via `getBankById`
2. Fetches questions via `getQuestionsByBank(bank_id, rounds)`
3. Uses `bank.title` as the `category` parameter to `createParty`
4. Marks the bank as used via `markBankAsUsed`

**GET /api/party/banks/list** — Replaces `GET /api/party/categories/list`:
- Returns available (unused) banks enriched with `questionCount`
- Placed before the `/:partyId` route to avoid Express matching "banks" as a param

### 3.7 Frontend API Types — `frontend/src/types/api.types.ts` (modified)

Added `Bank` type:

```ts
interface Bank {
  bankId: string;
  title: string;
  description: string;
  questionCount: number;
}
```

### 3.8 Frontend API Client — `frontend/src/api/client.ts` (modified)

| Before | After |
|--------|-------|
| `getCategories()` → `GET /party/categories/list` | `getBanks()` → `GET /party/banks/list` |
| `createParty(playerId, category, rounds, timeout)` | `createParty(playerId, bankId, rounds, timeout)` |

The `createParty` call now sends `{ player_id, bank_id, rounds, timeout }`.

### 3.9 Frontend Component — `frontend/src/components/gamecreation/GameCreationPage.tsx` (modified)

- Loads banks via `api.getBanks()` on mount
- Dropdown shows `"{title} ({questionCount} questions)"` per option
- Selected bank's description shown below the dropdown
- Rounds input `max` capped to `selectedBank.questionCount`
- When switching banks, if current rounds exceeds the new bank's count, rounds is reduced
- Submits `bank_id` to `createParty` instead of `category`

---

## 4. API Reference

### GET /api/party/banks/list

Returns available quiz banks.

**Response:**
```json
{
  "banks": [
    {
      "bankId": "bank-1",
      "title": "Friday Quiz #1",
      "description": "A mixed bag of trivia to kick off the weekend",
      "questionCount": 12
    }
  ]
}
```

### POST /api/party/init

Creates a new quiz party from a bank.

**Request:**
```json
{
  "player_id": "uuid",
  "bank_id": "bank-1",
  "rounds": 5,
  "timeout": 30
}
```

**Response:**
```json
{
  "party_id": "uuid"
}
```

**Errors:**
- `400` — Missing required fields, invalid rounds/timeout, insufficient questions in bank
- `404` — User or bank not found

---

## 5. File Change Summary

| File | Action | What Changed |
|------|--------|--------------|
| `database/init-mongo.js` | Modified | Seeds banks, assigns `bankId` to questions, creates indexes |
| `backend/src/models/bank.model.ts` | **New** | `Bank` interface |
| `backend/src/models/question.model.ts` | Modified | Added `bankId?: string` to `Question` |
| `backend/src/services/bank.service.ts` | **New** | `getAvailableBanks`, `getBankById`, `markBankAsUsed` |
| `backend/src/services/question.service.ts` | Modified | Added `getQuestionsByBank`, `getQuestionCountByBank` |
| `backend/src/routes/party.routes.ts` | Modified | `POST /init` takes `bank_id`; new `GET /banks/list` |
| `frontend/src/api/client.ts` | Modified | `getBanks()` replaces `getCategories()`; `createParty` sends `bank_id` |
| `frontend/src/types/api.types.ts` | Modified | Added `Bank` type |
| `frontend/src/components/gamecreation/GameCreationPage.tsx` | Modified | Bank dropdown, description display, rounds capping |

---

## 6. Verification

1. `docker compose down -v && docker compose up -d` — re-seeds DB with banks and `bankId` on questions
2. Check mongo-express at `:8081` — verify `banks` collection exists and questions have `bankId`
3. Start the app — game creation page shows bank dropdown instead of category
4. Create a party — verify rounds are capped, questions load from selected bank
5. Play a game — scoring still works, party list shows bank title as category

---

## Document Version Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-24 | Claude Code | Initial quiz banks requirements and implementation document |
