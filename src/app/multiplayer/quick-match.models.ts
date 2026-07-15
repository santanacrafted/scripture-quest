import { Timestamp } from 'firebase/firestore';

export type QuickMatchQueueStatus = 'searching' | 'matched' | 'cancelled' | 'expired';
export type QuickMatchResultStatus = QuickMatchQueueStatus;
export type MatchDifficulty = 'beginner' | 'disciple' | 'scholar' | 'mixed';
export type MatchDifficultyPreference = MatchDifficulty | 'any';

export interface QuickMatchQueueEntry {
  playerId: string;
  status: QuickMatchQueueStatus;
  mode: 'quick-match';
  rating: number;
  level: number;
  region: string | null;
  language: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
  matchId: string | null;
  searchToken: string;
  difficultyPreference?: MatchDifficultyPreference;
}

export interface QuickMatchFunctionResult {
  status: QuickMatchResultStatus;
  matchId: string | null;
  searchToken: string;
  elapsedMs?: number;
  nextAttemptAfterMs?: number;
}

export interface FirestoreQuickMatch {
  id: string;
  mode: 'quick-match';
  status: 'waiting' | 'waiting_for_opponent' | 'active' | 'completed' | 'cancelled';
  isAsynchronous: boolean;
  difficulty: MatchDifficulty;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  currentTurnPlayerId: string | null;
  phase: 'spin' | 'light_challenge' | 'question' | 'complete';
  selectedCategory: import('./multiplayer.models').MatchCategory | null;
  currentQuestion: { id: string; text: string; choices: string[]; questionType: string; difficulty: string; kind?: 'standard' | 'light_challenge'; media?: { downloadUrl: string; altText: string }; matchPairs?: { left: string[]; right: string[] }; verseSegments?: { id: string; text: string }[] } | null;
  lastTurnSummary: string;
  completionReason?: 'forfeit' | 'lights';
  forfeitedBy?: string;
  winnerId?: string | null;
  lightChallengeAction?: 'capture' | 'steal' | null;
  lightChallengeOpponentId?: string | null;
  roundNumber: number;
  totalRounds: number;
  playerIds: string[];
  players: Record<string, {
    displayName: string;
    username?: string;
    avatarUrl: string | null;
    ratingAtMatchStart: number;
    score: number;
    sparks: number;
    lights: import('./multiplayer.models').MatchCategory[];
    status: 'ready' | 'playing' | 'finished';
  }>;
  matchmaking: {
    ratingDifference: number;
    searchDurationMs: number;
    source: 'live-queue' | 'recent-player';
  };
}

export interface MatchAnswerResult {
  matchId: string;
  correct: boolean;
  waitingForOpponent: boolean;
  correctAnswer: string;
  explanation: string;
  reference: string;
}

export interface MatchSpinResult {
  matchId: string;
  category: string;
  question: { id: string; questionType: string };
  correctAnswer: string;
}
