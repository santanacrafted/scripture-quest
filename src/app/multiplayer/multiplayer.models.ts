export type MultiplayerStatus = 'waiting_for_opponent' | 'active' | 'completed' | 'abandoned';
export interface CategoryProgress { current:number; target:number; completed:boolean; }
export interface MatchCategoryProgressMap { [category:string]:CategoryProgress; }
export type MatchCategory = 'characters' | 'scripture' | 'stories' | 'places' | 'knowledge';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type QuestionScope = 'chapter' | 'book' | 'multi_book' | 'whole_bible';
export type QuestionType = 'multiple_choice' | 'pictionary' | 'verse_completion' | 'reference_match' | 'who_am_i' | 'who_said_it' | 'sequence' | 'map_challenge' | 'emoji_challenge' | 'true_false' | 'match_pairs' | 'odd_one_out' | 'what_happens_next' | 'arrange_verse';
export type TurnPhase = 'spin' | 'question' | 'light_challenge' | 'trial' | 'complete';

export interface PlayerLightState { sparks: number; lights: MatchCategory[]; }
export interface TrialState { category: MatchCategory; challengerId: string; defenderId: string; question: number; challengerScore: number; defenderScore: number; }
export interface Match {
  id: string; playerIds: string[]; playerNames: Record<string,string>; currentPlayerId: string | null;
  winnerId: string | null; status: MultiplayerStatus; phase: TurnPhase; selectedCategory: MatchCategory | null;
  playerState: Record<string,PlayerLightState>; trial: TrialState | null; createdAt: string; updatedAt: string;
  completedAt: string | null; lastTurnSummary: string | null; mode: 'quick' | 'friend';
  inviteCode?: string | null; categoryProgress?: Record<string,MatchCategoryProgressMap>;
}
export interface MatchTurn { id:string; matchId:string; playerId:string; questionId:string; selectedAnswer:string; isCorrect:boolean; category:MatchCategory; startedAt:string; answeredAt:string; timeExpired:boolean; }
export interface Question { id:string; category:MatchCategory; questionType:QuestionType; difficulty:Difficulty; scope:QuestionScope; scopeTokens:string[]; text:string; choices:string[]; correctAnswer:string; reference:string; explanation:string; media?: { downloadUrl:string; altText:string }; matchPairs?: { left:string[]; right:string[] }; verseSegments?: { id:string; text:string }[]; }

export const MULTIPLAYER_CATEGORIES: MatchCategory[] = ['characters','scripture','stories','places','knowledge'];
export const CATEGORY_LABELS: Record<MatchCategory,string> = { characters:'Characters', scripture:'Scripture', stories:'Stories & Events', places:'Places', knowledge:'Bible Knowledge' };
export const CATEGORY_ICONS: Record<MatchCategory,string> = { characters:'👤', scripture:'📖', stories:'🏛', places:'🗺', knowledge:'🧠' };
export const CATEGORY_COLORS: Record<MatchCategory,string> = { characters:'#f59e4a', scripture:'#4dd6a7', stories:'#b978ed', places:'#4aa9f5', knowledge:'#f0c94a' };
