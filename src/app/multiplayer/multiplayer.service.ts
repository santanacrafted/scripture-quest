import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  Match,
  MatchTurn,
  MatchCategoryProgressMap,
  MultiplayerStatus,
  Question,
  MatchCategory,
} from './multiplayer.models';
import { QuestionService } from './question.service';

@Injectable({ providedIn: 'root' })
export class MultiplayerService {
  private readonly storageKey = 'scripture-quest.multiplayer-matches';
  private readonly turnsKey = 'scripture-quest.multiplayer-turns';
  private readonly targetProgress = 2;

  private readonly matchesSubject = new BehaviorSubject<Match[]>(
    this.loadMatches()
  );
  readonly matches$ = this.matchesSubject.asObservable();

  private readonly turnsSubject = new BehaviorSubject<MatchTurn[]>(
    this.loadTurns()
  );
  readonly turns$ = this.turnsSubject.asObservable();

  constructor(private readonly questionService: QuestionService) {}

  createRandomMatch(playerId: string): Match {
    const waitingMatch = this.getMatches().find(
      (match) => match.status === 'waiting_for_opponent'
    );
    if (waitingMatch) {
      return this.joinMatch(waitingMatch.id, playerId);
    }

    const match = this.createMatch(playerId, null, 'waiting_for_opponent');
    this.upsertMatch(match);
    return match;
  }

  createFriendMatch(
    playerId: string,
    inviteCode?: string,
    friendId?: string
  ): Match {
    const match = this.createMatch(
      playerId,
      inviteCode ?? this.createInviteCode(),
      'waiting_for_opponent'
    );
    if (friendId) {
      match.playerIds.push(friendId);
    }
    this.upsertMatch(match);
    return match;
  }

  joinMatch(matchId: string, playerId: string): Match {
    const match = this.getMatchById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    if (match.playerIds.includes(playerId)) {
      return match;
    }

    if (match.status !== 'waiting_for_opponent') {
      throw new Error('This match is no longer waiting for a challenger.');
    }

    const updated: Match = {
      ...match,
      playerIds: [...match.playerIds, playerId],
      currentPlayerId: match.playerIds[0] ?? playerId,
      status: 'active',
      updatedAt: new Date().toISOString(),
      lastTurnSummary: 'The match is live. The first player is up.',
    };

    this.upsertMatch(updated);
    return updated;
  }

  getActiveMatches(): Match[] {
    return this.getMatches()
      .filter(
        (match) =>
          match.status === 'active' || match.status === 'waiting_for_opponent'
      )
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime()
      );
  }

  getMatchById(matchId: string): Match | undefined {
    return this.getMatches().find((match) => match.id === matchId);
  }

  deleteLocalMatch(matchId: string): void {
    const matches = this.getMatches().filter((match) => match.id !== matchId);
    const turns = this.getTurns().filter((turn) => turn.matchId !== matchId);
    this.matchesSubject.next(matches);
    this.turnsSubject.next(turns);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(matches));
      localStorage.setItem(this.turnsKey, JSON.stringify(turns));
    }
  }

  submitAnswer(
    matchId: string,
    playerId: string,
    questionId: string,
    selectedAnswer: string
  ): { match: Match; turn: MatchTurn } {
    const match = this.getMatchById(matchId);
    const question = this.questionService.getQuestionById(questionId);

    if (!match || !question) {
      throw new Error('Match or question was not found.');
    }

    const isCorrect = question.correctAnswer === selectedAnswer;
    const turn: MatchTurn = {
      id: `${matchId}-${Date.now()}`,
      matchId,
      playerId,
      questionId,
      selectedAnswer,
      isCorrect,
      category: question.category,
      startedAt: match.updatedAt,
      answeredAt: new Date().toISOString(),
      timeExpired: false,
    };

    this.upsertTurn(turn);

    const nextProgress = this.buildProgressMap(
      match.categoryProgress[playerId] ?? {},
      question.category,
      isCorrect
    );
    const nextCategoryProgress = {
      ...match.categoryProgress,
      [playerId]: nextProgress,
    };

    const winnerId = this.findWinner(nextCategoryProgress);
    const nextStatus: MultiplayerStatus = winnerId ? 'completed' : 'active';
    const nextCurrentPlayerId =
      isCorrect && !winnerId
        ? this.getOpponentPlayerId(match, playerId)
        : this.getOpponentPlayerId(match, playerId);

    const updated: Match = {
      ...match,
      currentPlayerId: winnerId ? null : nextCurrentPlayerId,
      winnerId,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      completedAt: winnerId ? new Date().toISOString() : null,
      categoryProgress: nextCategoryProgress,
      lastTurnSummary: isCorrect
        ? `${playerId} answered correctly and earned progress in ${question.category}.`
        : `${playerId} missed the question. The turn passes to the other player.`,
    };

    this.upsertMatch(updated);
    return { match: updated, turn };
  }

  forfeitMatch(matchId: string, playerId: string): Match {
    const match = this.getMatchById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    const updated: Match = {
      ...match,
      status: 'abandoned',
      winnerId: this.getOpponentPlayerId(match, playerId),
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      lastTurnSummary: `${playerId} chose to leave the match.`,
    };

    this.upsertMatch(updated);
    return updated;
  }

  requestRematch(matchId: string, playerId: string): Match {
    const match = this.getMatchById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    const updated: Match = {
      ...match,
      status: 'active',
      currentPlayerId: playerId,
      winnerId: null,
      completedAt: null,
      categoryProgress: {},
      updatedAt: new Date().toISOString(),
      lastTurnSummary: `${playerId} requested a rematch. This is a future-ready extension point for a full rematch flow.`,
    };

    this.upsertMatch(updated);
    return updated;
  }

  private createMatch(
    playerId: string,
    inviteCode: string | null,
    status: MultiplayerStatus
  ): Match {
    const now = new Date().toISOString();
    return {
      id: `match-${Date.now()}`,
      playerIds: [playerId],
      currentPlayerId: playerId,
      winnerId: null,
      status,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      categoryProgress: {},
      lastTurnSummary:
        status === 'waiting_for_opponent'
          ? 'Waiting for an opponent to join.'
          : 'The match is live.',
      inviteCode,
    };
  }

  private buildProgressMap(
    progress: MatchCategoryProgressMap,
    category: MatchCategory,
    isCorrect: boolean
  ): MatchCategoryProgressMap {
    const currentProgress = progress?.[category] ?? {
      current: 0,
      target: this.targetProgress,
      completed: false,
    };
    const nextCurrent = isCorrect
      ? Math.min(this.targetProgress, currentProgress.current + 1)
      : currentProgress.current;
    const completed = nextCurrent >= this.targetProgress;

    return {
      ...progress,
      [category]: {
        current: nextCurrent,
        target: this.targetProgress,
        completed,
      },
    };
  }

  private findWinner(
    categoryProgress: Record<string, MatchCategoryProgressMap>
  ): string | null {
    return (
      Object.entries(categoryProgress).find(([, progressMap]) => {
        const completedCategories = Object.values(progressMap).filter(
          (entry) => entry.completed
        ).length;
        return completedCategories >= 6;
      })?.[0] ?? null
    );
  }

  private getOpponentPlayerId(match: Match, playerId: string): string | null {
    return match.playerIds.find((entry) => entry !== playerId) ?? null;
  }

  private upsertMatch(match: Match): void {
    const matches = this.getMatches().filter((entry) => entry.id !== match.id);
    matches.push(match);
    this.matchesSubject.next(matches);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(matches));
    }
  }

  private upsertTurn(turn: MatchTurn): void {
    const turns = this.getTurns().filter((entry) => entry.id !== turn.id);
    turns.push(turn);
    this.turnsSubject.next(turns);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.turnsKey, JSON.stringify(turns));
    }
  }

  private getMatches(): Match[] {
    return this.matchesSubject.getValue();
  }

  private getTurns(): MatchTurn[] {
    return this.turnsSubject.getValue();
  }

  private loadMatches(): Match[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) : [];
  }

  private loadTurns(): MatchTurn[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    const raw = localStorage.getItem(this.turnsKey);
    return raw ? JSON.parse(raw) : [];
  }

  private createInviteCode(): string {
    return `QUEST-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
}
