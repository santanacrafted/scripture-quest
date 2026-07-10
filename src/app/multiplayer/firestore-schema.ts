// Firestore schema notes for the MVP multiplayer system.
// Future-ready structure: swap the local demo storage below for collection-backed
// Firestore reads and writes once authentication and Cloud Functions are enabled.

export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  questions: 'questions',
  matches: 'matches',
  matchTurns: 'matchTurns',
  friendInvites: 'friendInvites',
} as const;

// Match document shape:
// - id, playerIds, currentPlayerId, winnerId, status, createdAt, updatedAt,
//   completedAt, categoryProgress, lastTurnSummary, inviteCode.
//
// Turn document shape:
// - matchId, playerId, questionId, selectedAnswer, isCorrect, category,
//   startedAt, answeredAt, timeExpired.
//
// The app currently uses local persistence for the MVP preview, but the service API is
// intentionally designed so these collections can replace it later without changing routes.
