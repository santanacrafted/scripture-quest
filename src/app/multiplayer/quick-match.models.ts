import { Timestamp } from 'firebase/firestore';

export type QuickMatchQueueStatus = 'searching' | 'matched' | 'cancelled' | 'expired';
export type QuickMatchResultStatus = QuickMatchQueueStatus;

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
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  isAsynchronous: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  currentTurnPlayerId: string;
  roundNumber: number;
  totalRounds: number;
  playerIds: string[];
  players: Record<string, {
    displayName: string;
    username?: string;
    avatarUrl: string | null;
    ratingAtMatchStart: number;
    score: number;
    status: 'ready' | 'playing' | 'finished';
  }>;
  matchmaking: {
    ratingDifference: number;
    searchDurationMs: number;
    source: 'live-queue' | 'recent-player';
  };
}
