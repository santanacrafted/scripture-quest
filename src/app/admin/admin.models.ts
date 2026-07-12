import { Timestamp } from 'firebase/firestore';
export type ContentCategory =
  | 'characters'
  | 'scripture'
  | 'stories'
  | 'places'
  | 'bible_knowledge';
export type ContentQuestionType =
  | 'multiple_choice'
  | 'pictionary'
  | 'verse_completion'
  | 'reference_match'
  | 'who_am_i'
  | 'who_said_it'
  | 'sequence'
  | 'map_challenge'
  | 'emoji_challenge'
  | 'true_false'
  | 'image_reveal'
  | 'zoom_challenge'
  | 'match_pairs'
  | 'odd_one_out'
  | 'what_happens_next'
  | 'arrange_verse';
export type ContentDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type QuestionStatus =
  | 'draft'
  | 'review'
  | 'published'
  | 'rejected'
  | 'archived';
export interface Choice {
  id: string;
  text: string;
}
export interface Pair {
  id: string;
  left: string;
  right: string;
}
export interface OrderedItem {
  id: string;
  text: string;
  correctPosition: number;
}
export type QuestionAnswerData =
  | { type: 'multiple_choice'; options: Choice[]; correctOptionIds: string[] }
  | { type: 'true_false'; correctValue: boolean }
  | {
      type: 'text';
      primaryAnswer: string;
      acceptedAnswers: string[];
      caseSensitive: boolean;
    }
  | { type: 'sequence'; items: OrderedItem[] }
  | { type: 'match_pairs'; pairs: Pair[] }
  | { type: 'arrange_verse'; segments: OrderedItem[] }
  | { type: 'map'; correctRegionId: string };
export interface StudioQuestion {
  id: string;
  externalId?: string;
  translationGroupId?: string;
  contentConceptId?: string;
  language: 'en' | 'es';
  category: ContentCategory;
  questionType: ContentQuestionType;
  difficulty: ContentDifficulty;
  prompt: string;
  explanation?: string;
  scriptureReference?: string;
  answerData: QuestionAnswerData;
  media?: {
    storagePath: string;
    downloadUrl: string;
    mimeType: string;
    altText: string;
    width?: number;
    height?: number;
    zoomRegion?: { x: number; y: number; width: number; height: number };
    revealGrid?: { rows: number; columns: number };
  };
  testament?: 'old' | 'new';
  book?: string;
  topics: string[];
  tags: string[];
  status: QuestionStatus;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
  createdBy: string;
  updatedBy: string;
  publishedBy?: string;
}
export interface QuestionStats {
  questionId: string;
  timesServed: number;
  timesCorrect: number;
  timesIncorrect: number;
  accuracyRate: number;
  averageResponseTimeMs: number;
  reportCount: number;
}
export interface QuestionReport {
  id: string;
  questionId: string;
  matchId?: string;
  reportedBy: string;
  reason:
    | 'incorrect_answer'
    | 'typo'
    | 'unclear_wording'
    | 'wrong_scripture_reference'
    | 'image_issue'
    | 'translation_issue'
    | 'other';
  details?: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  resolutionNotes?: string;
}
export interface QuestionAuditLog {
  id: string;
  questionId: string;
  action:
    | 'created'
    | 'updated'
    | 'submitted_for_review'
    | 'published'
    | 'rejected'
    | 'archived'
    | 'restored'
    | 'activated'
    | 'deactivated'
    | 'imported';
  actorId: string;
  timestamp: Timestamp;
  changedFields?: string[];
  notes?: string;
}
export const CATEGORIES: [ContentCategory, string][] = [
  ['characters', '👤 Characters'],
  ['scripture', '📖 Scripture'],
  ['stories', '🏛 Stories & Events'],
  ['places', '🗺 Places'],
  ['bible_knowledge', '🧠 Bible Knowledge'],
];
export const TYPES: [ContentQuestionType, string][] = [
  ['multiple_choice', 'Multiple Choice'],
  ['pictionary', 'Pictionary'],
  ['verse_completion', 'Verse Completion'],
  ['reference_match', 'Reference Match'],
  ['who_am_i', 'Who Am I?'],
  ['who_said_it', 'Who Said It?'],
  ['sequence', 'Sequence'],
  ['map_challenge', 'Map Challenge'],
  ['emoji_challenge', 'Emoji Challenge'],
  ['true_false', 'True / False'],
  ['image_reveal', 'Image Reveal'],
  ['zoom_challenge', 'Zoom Challenge'],
  ['match_pairs', 'Match Pairs'],
  ['odd_one_out', 'Odd One Out'],
  ['what_happens_next', 'What Happens Next?'],
  ['arrange_verse', 'Arrange the Verse'],
];
