import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { App as CapacitorApp } from '@capacitor/app';
import { Subscription, interval } from 'rxjs';
import { QuickMatchQueueEntry } from '../quick-match.models';
import { QuickMatchService } from '../quick-match.service';

@Component({
  selector: 'app-quick-match-search-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="search-page route-page">
      <img class="background-image" src="/multiplayer-page.png" alt="" aria-hidden="true" />

      <section class="search-panel" aria-labelledby="quick-match-title">
        <div class="compass" aria-hidden="true">
          <span></span>
        </div>

        <p class="eyebrow">Quick Match</p>
        <h1 id="quick-match-title">{{ title }}</h1>
        <p class="message">{{ message }}</p>

        <div class="timer" aria-live="polite">
          <span>{{ elapsedSeconds }}</span>
          <small>seconds searching</small>
        </div>

        <p *ngIf="!isOnline" class="notice" role="status">Reconnecting to the kingdom...</p>
        <p *ngIf="errorMessage" class="error" role="alert">{{ errorMessage }}</p>

        <div class="actions">
          <button
            class="primary-button"
            type="button"
            *ngIf="status === 'expired' || status === 'error'"
            [disabled]="isBusy"
            (click)="retry()"
          >
            Try again
          </button>
          <button
            class="cancel-button"
            type="button"
            [disabled]="isBusy || status === 'matched'"
            (click)="cancel()"
          >
            Cancel
          </button>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #e7e4dc;
      color: #17140d;
    }

    .search-page {
      position: relative;
      display: flex;
      min-height: 100svh;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      isolation: isolate;
      padding: max(1.5rem, env(safe-area-inset-top)) 1.25rem max(1.5rem, env(safe-area-inset-bottom));
      background:
        radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.72) 0, rgba(255, 255, 255, 0) 42%),
        #e7e4dc;
    }

    .background-image {
      position: absolute;
      inset: 0;
      z-index: -2;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center center;
    }

    .search-page::before {
      position: absolute;
      inset: 0;
      z-index: -1;
      content: '';
      background:
        linear-gradient(180deg, rgba(7, 10, 18, 0.08) 0%, rgba(7, 10, 18, 0.22) 38%, rgba(7, 10, 18, 0.72) 100%),
        linear-gradient(90deg, rgba(7, 10, 18, 0.2), rgba(7, 10, 18, 0.02), rgba(7, 10, 18, 0.26));
    }

    .search-panel {
      width: min(100%, 31rem);
      border: 0;
      background: transparent;
      box-shadow: none;
      padding: clamp(0.5rem, 4vw, 1.5rem);
      text-align: center;
    }

    .compass {
      position: relative;
      display: grid;
      width: 5.5rem;
      height: 5.5rem;
      margin: 0 auto 1.1rem;
      place-items: center;
      border: 2px solid #d8b15f;
      border-radius: 999px;
      background: linear-gradient(145deg, #2b6f62, #173f3d);
      box-shadow:
        inset 0 0 0 4px #123633,
        0 0.8rem 1.5rem rgba(56, 49, 34, 0.2);
    }

    .compass span {
      width: 0;
      height: 0;
      border-right: 0.7rem solid transparent;
      border-bottom: 2.7rem solid #f8d36c;
      border-left: 0.7rem solid transparent;
      filter: drop-shadow(0 0.35rem 0.2rem rgba(0, 0, 0, 0.45));
      transform-origin: center 70%;
      animation: compass-search 1.8s ease-in-out infinite;
    }

    .eyebrow {
      margin: 0 0 0.55rem;
      color: #766425;
      font-size: 0.82rem;
      font-weight: 900;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      color: #17140d;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: clamp(2.2rem, 9vw, 3.4rem);
      line-height: 0.98;
      text-transform: uppercase;
      text-wrap: balance;
    }

    .message {
      min-height: 2.6rem;
      margin: 1rem auto 0;
      color: #625d51;
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.35;
    }

    .timer {
      display: grid;
      margin: 1.6rem auto;
      width: 9.5rem;
      min-height: 5.5rem;
      place-items: center;
      border: 2px solid #d8b15f;
      border-radius: 14px;
      background: rgba(250, 248, 242, 0.9);
      box-shadow:
        inset 0 0 0 3px rgba(118, 100, 37, 0.14),
        0 0.65rem 1.4rem rgba(56, 49, 34, 0.13);
      padding: 0.4rem;
    }

    .timer span {
      color: #174a43;
      font-size: 2.25rem;
      font-weight: 900;
      line-height: 1;
    }

    .timer small {
      color: #766425;
      font-size: 0.68rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    .notice,
    .error {
      margin: 0 0 0.85rem;
      border-radius: 8px;
      padding: 0.75rem;
      font-size: 0.9rem;
      font-weight: 800;
    }

    .notice {
      border: 1px solid #9bbab0;
      background: #dce9e3;
      color: #174a43;
    }

    .error {
      border: 1px solid #d6a196;
      background: #f5dfda;
      color: #8f3028;
    }

    .actions {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.7rem;
    }

    button {
      min-height: 3.4rem;
      border-radius: 8px;
      font: inherit;
      font-weight: 900;
      text-transform: uppercase;
      cursor: pointer;
    }

    .primary-button {
      border: 2px solid #ffe28a;
      background: linear-gradient(180deg, #fce6a6 0%, #e8bb49 48%, #b8761d 100%);
      color: #201407;
    }

    .cancel-button {
      border: 2px solid #8f825f;
      background: transparent;
      color: #332e23;
    }

    button:disabled {
      cursor: default;
      opacity: 0.58;
    }

    @keyframes compass-search {
      0%, 100% {
        transform: rotate(-28deg);
      }
      50% {
        transform: rotate(34deg);
      }
    }

    @media (min-width: 860px) {
      .search-page {
        align-items: center;
        justify-content: flex-end;
        padding: 2rem clamp(2rem, 8vw, 6rem);
      }
    }

    .background-image,
    .search-page::before {
      display: none;
    }

    @media (min-width: 860px) {
      .search-page {
        justify-content: center;
        padding: 2rem;
      }
    }
  `],
})
export class QuickMatchSearchPage implements OnInit, OnDestroy {
  // Keep the UI aligned with the server-side queue TTL so a waiting player
  // does not lose their FIFO position while the search is still valid.
  private readonly searchWindowSeconds = 90;
  readonly messages = [
    'Searching nearby kingdoms...',
    'Looking for another explorer...',
    'Preparing the challenge...',
    'Checking the battle scrolls...',
  ];

  status: 'searching' | 'matched' | 'expired' | 'cancelled' | 'error' = 'searching';
  elapsedSeconds = 0;
  message = this.messages[0];
  errorMessage = '';
  isBusy = false;
  isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

  private searchStartedAt = Date.now();
  private subscriptions = new Subscription();
  private timerSubscription?: Subscription;
  private attemptTimer: ReturnType<typeof setTimeout> | null = null;
  private resumeListener?: { remove: () => Promise<void> };
  private queueReady = false;
  private readonly startNewMatch = history.state?.startNewMatch === true;

  constructor(
    private readonly quickMatchService: QuickMatchService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.startElapsedTimer();

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    void CapacitorApp.addListener('resume', () => this.resume()).then((listener) => {
      this.resumeListener = listener;
    });

    this.subscriptions.add(
      this.quickMatchService.queueState$.subscribe((queue) => this.handleQueueState(queue)),
    );

    void this.startOrResume();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearAttemptTimer();
    this.quickMatchService.dispose();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    void this.resumeListener?.remove();
  }

  async retry(): Promise<void> {
    if (this.isBusy) {
      return;
    }

    this.isBusy = true;
    this.clearAttemptTimer();
    try {
      const cancelResult = await this.quickMatchService.cancelSearch();
      if (cancelResult?.matchId) {
        await this.navigateToMatch(cancelResult.matchId);
        return;
      }
    } catch {
      this.quickMatchService.clearSearch();
    } finally {
      this.isBusy = false;
    }

    await this.startSearch(true);
  }

  async cancel(): Promise<void> {
    if (this.isBusy) {
      return;
    }

    this.isBusy = true;
    try {
      const result = await this.quickMatchService.cancelSearch();
      if (result?.matchId) {
        await this.navigateToMatch(result.matchId);
        return;
      }

      this.finishSearch('cancelled');
      await this.router.navigate(['/multiplayer-battle']);
    } catch (error) {
      this.finishSearch('error');
      this.errorMessage = this.formatError(error, 'Unable to cancel Quick Match.');
    } finally {
      this.isBusy = false;
    }
  }

  private async startOrResume(): Promise<void> {
    if (this.startNewMatch) {
      this.quickMatchService.clearSearch();
      this.queueReady = true;
      await this.startSearch(true);
      return;
    }
    try {
      const queue = await this.quickMatchService.resumeSearch();
      if (queue?.matchId) {
        const match = await this.quickMatchService.observeMatch(queue.matchId);
        const userId = queue.playerId;
        const isPlayable = !!match
          && match.playerIds?.includes(userId)
          && match.playerIds.length >= 1
          && match.status === 'active'
          && !!match.currentTurnPlayerId
          && ['spin', 'light_challenge', 'question'].includes(match.phase);
        if (isPlayable) {
          await this.navigateToMatch(queue.matchId);
          return;
        }

        // Legacy queue entries can reference browser-era or incomplete matches.
        // Starting again replaces that queue document with a fresh search token.
        this.quickMatchService.clearSearch();
        this.queueReady = true;
        await this.startSearch(true);
        return;
      }

      if (queue?.status === 'searching') {
        this.queueReady = true;
        this.searchStartedAt = queue.createdAt.toMillis();
        this.resetVisibleSearch(false);
        this.scheduleAttempt(600);
        return;
      }
    } catch {
      this.quickMatchService.clearSearch();
    }

    this.queueReady = true;
    await this.startSearch(true);
  }

  private async startSearch(resetTimer: boolean): Promise<void> {
    this.resetVisibleSearch(resetTimer);
    this.isBusy = true;

    try {
      const result = await this.quickMatchService.startSearch();
      if (result.matchId) {
        await this.navigateToMatch(result.matchId);
        return;
      }
      this.scheduleAttempt(result.nextAttemptAfterMs ?? 2500);
    } catch (error) {
      this.finishSearch('error');
      this.errorMessage = this.formatError(error, 'Unable to start Quick Match.');
    } finally {
      this.isBusy = false;
    }
  }

  private async attempt(): Promise<void> {
    if (this.status !== 'searching') {
      return;
    }

    if (!this.isOnline) {
      this.scheduleAttempt(2500);
      return;
    }

    try {
      const result = await this.quickMatchService.attemptSearch();
      if (!result) {
        await this.startSearch(false);
        return;
      }

      if (result.matchId) {
        await this.navigateToMatch(result.matchId);
        return;
      }

      if (result.status === 'expired') {
        if (this.elapsedSeconds < this.searchWindowSeconds) {
          this.quickMatchService.clearSearch();
          await this.startSearch(false);
          return;
        }

        this.finishSearch('expired');
        this.errorMessage = 'No explorers are available right now. Try again in a moment.';
        return;
      }

      this.scheduleAttempt(result.nextAttemptAfterMs ?? 2500);
    } catch (error) {
      this.finishSearch('error');
      this.errorMessage = this.formatError(error, 'Matchmaking was interrupted.');
    }
  }

  private handleQueueState(queue: QuickMatchQueueEntry | null): void {
    if (!this.queueReady || !queue) {
      return;
    }

    if (queue.matchId) {
      void this.navigateToMatch(queue.matchId);
      return;
    }

    if (queue.status === 'expired') {
      if (this.elapsedSeconds < this.searchWindowSeconds && this.status === 'searching') {
        this.quickMatchService.clearSearch();
        void this.startSearch(false);
        return;
      }

      this.finishSearch('expired');
      this.errorMessage = 'No explorers are available right now. Try again in a moment.';
    }
  }

  private async resume(): Promise<void> {
    if (this.status === 'matched') {
      return;
    }

    await this.startOrResume();
  }

  private async navigateToMatch(matchId: string): Promise<void> {
    this.finishSearch('matched');
    await this.router.navigate(['/multiplayer/board', matchId], { replaceUrl: true });
  }

  private startElapsedTimer(): void {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.status !== 'searching') {
        this.timerSubscription?.unsubscribe();
        this.timerSubscription = undefined;
        return;
      }

      this.elapsedSeconds = Math.max(0, Math.floor((Date.now() - this.searchStartedAt) / 1000));
      this.message = this.messages[Math.floor(this.elapsedSeconds / 3) % this.messages.length];

      if (this.elapsedSeconds >= this.searchWindowSeconds) {
        void this.attempt();
      }
    });
    this.subscriptions.add(this.timerSubscription);
  }

  private resetVisibleSearch(resetTimer: boolean): void {
    this.status = 'searching';
    this.errorMessage = '';
    if (resetTimer) {
      this.searchStartedAt = Date.now();
      this.elapsedSeconds = 0;
      this.message = this.messages[0];
    }
    this.startElapsedTimer();
  }

  private finishSearch(status: 'matched' | 'expired' | 'cancelled' | 'error'): void {
    this.status = status;
    this.clearAttemptTimer();
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = undefined;
  }

  private scheduleAttempt(delayMs: number): void {
    this.clearAttemptTimer();
    this.attemptTimer = setTimeout(() => void this.attempt(), delayMs);
  }

  private clearAttemptTimer(): void {
    if (this.attemptTimer) {
      clearTimeout(this.attemptTimer);
      this.attemptTimer = null;
    }
  }

  private handleOnline = (): void => {
    this.isOnline = true;
    if (this.status === 'searching') {
      this.scheduleAttempt(250);
    }
  };

  private handleOffline = (): void => {
    this.isOnline = false;
  };

  private formatError(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
  }

  get title(): string {
    if (this.status === 'matched') {
      return 'Match found';
    }

    if (this.status === 'expired' || this.status === 'error') {
      return 'No match yet';
    }

    return 'Searching for another explorer...';
  }
}
