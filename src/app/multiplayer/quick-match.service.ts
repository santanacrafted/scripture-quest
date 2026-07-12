import { Injectable } from '@angular/core';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { firebaseDb, firebaseFunctions } from '../firebase';
import {
  FirestoreQuickMatch,
  QuickMatchFunctionResult,
  QuickMatchQueueEntry,
} from './quick-match.models';

@Injectable({ providedIn: 'root' })
export class QuickMatchService {
  private readonly storageKey = 'scripture-quest.quick-match';
  private readonly queueStateSubject = new BehaviorSubject<QuickMatchQueueEntry | null>(null);
  readonly queueState$ = this.queueStateSubject.asObservable();

  private unsubscribeQueue?: () => void;

  constructor(private readonly authService: AuthService) {}

  async startSearch(): Promise<QuickMatchFunctionResult> {
    const result = await this.callFunction('joinQuickMatchQueue');
    this.persistSearch(result);
    this.observeQueueState();
    return result;
  }

  async attemptSearch(): Promise<QuickMatchFunctionResult | null> {
    const stored = this.getStoredSearch();
    if (!stored?.searchToken) {
      return null;
    }

    const result = await this.callFunction('attemptQuickMatch', {
      searchToken: stored.searchToken,
    });
    this.persistSearch(result);
    return result;
  }

  async cancelSearch(): Promise<QuickMatchFunctionResult | null> {
    const stored = this.getStoredSearch();
    if (!stored?.searchToken) {
      this.clearSearch();
      return null;
    }

    const result = await this.callFunction('cancelQuickMatch', {
      searchToken: stored.searchToken,
    });

    if (result.status !== 'matched') {
      this.clearSearch();
    } else {
      this.persistSearch(result);
    }

    return result;
  }

  async resumeSearch(): Promise<QuickMatchQueueEntry | null> {
    const userId = this.requireUserId();
    const snapshot = await getDoc(doc(firebaseDb, 'matchmakingQueue', userId));
    if (!snapshot.exists()) {
      this.clearSearch();
      return null;
    }

    const queue = snapshot.data() as QuickMatchQueueEntry;
    if (queue.matchId || queue.status === 'searching') {
      this.persistSearch({
        status: queue.status,
        matchId: queue.matchId,
        searchToken: queue.searchToken,
      });
      this.observeQueueState();
      return queue;
    }

    this.clearSearch();
    return queue;
  }

  observeQueueState(): Observable<QuickMatchQueueEntry | null> {
    const userId = this.requireUserId();
    this.unsubscribeQueue?.();
    this.unsubscribeQueue = onSnapshot(
      doc(firebaseDb, 'matchmakingQueue', userId),
      (snapshot) => {
        const queue = snapshot.exists() ? (snapshot.data() as QuickMatchQueueEntry) : null;
        this.queueStateSubject.next(queue);
        if (queue?.matchId || queue?.status === 'matched') {
          this.persistSearch({
            status: 'matched',
            matchId: queue.matchId,
            searchToken: queue.searchToken,
          });
        }
      },
      () => {
        this.queueStateSubject.next(this.queueStateSubject.getValue());
      },
    );

    return this.queueState$;
  }

  async observeMatch(matchId: string): Promise<FirestoreQuickMatch | null> {
    const snapshot = await getDoc(doc(firebaseDb, 'matches', matchId));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as FirestoreQuickMatch) : null;
  }

  watchMatch(matchId: string): Observable<FirestoreQuickMatch | null> {
    return new Observable(subscriber => onSnapshot(
      doc(firebaseDb, 'matches', matchId),
      snapshot => subscriber.next(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as FirestoreQuickMatch) : null),
      error => subscriber.error(error),
    ));
  }

  async spinWheel(matchId: string): Promise<void> {
    await this.callFunction('spinMatchWheel', { matchId });
  }

  async submitAnswer(matchId: string, answer: string): Promise<import('./quick-match.models').MatchAnswerResult> {
    return this.callFunction('submitAnswer', { matchId, answer }) as unknown as Promise<import('./quick-match.models').MatchAnswerResult>;
  }

  async deleteMatchForTesting(matchId: string): Promise<void> {
    await this.callFunction('deleteMatchForTesting', { matchId });
  }

  async forfeitMatch(matchId: string): Promise<void> {
    await this.callFunction('forfeitMatch', { matchId });
  }

  observeActiveMatches(): Observable<FirestoreQuickMatch[]> {
    return new Observable<FirestoreQuickMatch[]>((subscriber) => {
      const userId = this.requireUserId();
      const matchesQuery = query(
        collection(firebaseDb, 'matches'),
        where('playerIds', 'array-contains', userId),
      );

      const unsubscribe = onSnapshot(
        matchesQuery,
        (snapshot) => {
          const matches = snapshot.docs
            .map((entry) => ({ id: entry.id, ...entry.data() }) as FirestoreQuickMatch)
            .filter((match) => ['waiting', 'waiting_for_opponent', 'active'].includes(match.status))
            .sort((left, right) => right.createdAt.toMillis() - left.createdAt.toMillis());
          subscriber.next(matches);
        },
        (error) => subscriber.error(error),
      );

      return () => unsubscribe();
    });
  }

  dispose(): void {
    this.unsubscribeQueue?.();
    this.unsubscribeQueue = undefined;
  }

  clearSearch(): void {
    this.queueStateSubject.next(null);
    this.unsubscribeQueue?.();
    this.unsubscribeQueue = undefined;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  getStoredSearch(): QuickMatchFunctionResult | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(this.storageKey);
    return raw ? (JSON.parse(raw) as QuickMatchFunctionResult) : null;
  }

  private async callFunction(
    name: 'joinQuickMatchQueue' | 'attemptQuickMatch' | 'cancelQuickMatch' | 'deleteMatchForTesting' | 'forfeitMatch' | 'spinMatchWheel' | 'submitAnswer',
    payload: Record<string, unknown> = {},
  ): Promise<QuickMatchFunctionResult> {
    const callable = httpsCallable<Record<string, unknown>, QuickMatchFunctionResult>(firebaseFunctions, name);
    const response = await callable(payload);
    return response.data;
  }

  private persistSearch(result: QuickMatchFunctionResult): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(result));
  }

  private requireUserId(): string {
    const userId = this.authService.getCurrentUser()?.uid;
    if (!userId) {
      throw new Error('You must be signed in to use Quick Match.');
    }
    return userId;
  }
}
