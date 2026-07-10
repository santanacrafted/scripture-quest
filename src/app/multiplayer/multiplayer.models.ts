export type MultiplayerStatus =
  | 'waiting_for_opponent'
  | 'active'
  | 'completed'
  | 'abandoned';

export type MatchCategory =
  | 'old_testament'
  | 'new_testament'
  | 'jesus_and_gospels'
  | 'bible_characters'
  | 'prophets_and_kings'
  | 'memory_verses';

export interface CategoryProgress {
  current: number;
  target: number;
  completed: boolean;
}

export interface MatchCategoryProgressMap {
  [category: string]: CategoryProgress;
}

export interface Match {
  id: string;
  playerIds: string[];
  currentPlayerId: string | null;
  winnerId: string | null;
  status: MultiplayerStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  categoryProgress: Record<string, MatchCategoryProgressMap>;
  lastTurnSummary: string | null;
  inviteCode: string | null;
}

export interface MatchTurn {
  id: string;
  matchId: string;
  playerId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  category: MatchCategory;
  startedAt: string;
  answeredAt: string;
  timeExpired: boolean;
}

export interface Question {
  id: string;
  category: MatchCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  choices: string[];
  correctAnswer: string;
  reference: string;
  explanation: string;
}

export interface FriendInvite {
  id: string;
  fromPlayerId: string;
  toPlayerId: string | null;
  inviteCode: string;
  matchId: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
}

export const MULTIPLAYER_CATEGORIES: MatchCategory[] = [
  'old_testament',
  'new_testament',
  'jesus_and_gospels',
  'bible_characters',
  'prophets_and_kings',
  'memory_verses',
];

export const CATEGORY_LABELS: Record<MatchCategory, string> = {
  old_testament: 'Old Testament',
  new_testament: 'New Testament',
  jesus_and_gospels: 'Jesus & Gospels',
  bible_characters: 'Bible Characters',
  prophets_and_kings: 'Prophets & Kings',
  memory_verses: 'Memory Verses',
};
