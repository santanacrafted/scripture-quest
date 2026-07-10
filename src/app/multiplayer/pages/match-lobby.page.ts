import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Match } from '../multiplayer.models';
import { MultiplayerService } from '../multiplayer.service';
import { FirestoreQuickMatch } from '../quick-match.models';
import { QuickMatchService } from '../quick-match.service';

@Component({
  selector: 'app-match-lobby-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="lobby-page route-page">
      <img class="background-image" src="/multiplayer-page.png" alt="" aria-hidden="true" />

      <button class="back-button" type="button" aria-label="Back to multiplayer battle" (click)="goBack()">‹</button>

      <section class="lobby-panel" aria-labelledby="lobby-title">
        <p class="eyebrow">Match Lobby</p>
        <h1 id="lobby-title">{{ isWaitingForOpponent ? 'Waiting for a challenger' : 'Match ready' }}</h1>
        <p class="summary">
          {{
            quickMatch
              ? 'Your Quick Match was created securely. Both explorers are ready for battle.'
              : 'Invite a challenger, then begin the battle when both players are ready.'
          }}
        </p>

        <div *ngIf="match || quickMatch" class="match-card">
          <div class="badge-row">
            <span>{{ match?.inviteCode ?? (quickMatch ? 'QUICK MATCH' : 'INVITE') }}</span>
            <strong>{{ sourceLabel }}</strong>
          </div>

          <div class="players">
            <article *ngFor="let player of playerSummaries; let index = index" class="player-card">
              <div class="avatar">{{ index + 1 }}</div>
              <div>
                <p>Explorer {{ index + 1 }}</p>
                <h2>{{ player.displayName }}</h2>
              </div>
            </article>
          </div>

          <div class="meta-grid">
            <div>
              <span>Players</span>
              <strong>{{ playerCount }}/2</strong>
            </div>
            <div>
              <span>Rounds</span>
              <strong>{{ quickMatch?.totalRounds ?? 6 }}</strong>
            </div>
          </div>

          <div class="actions">
            <button class="primary-button" type="button" [disabled]="isWaitingForOpponent" (click)="startMatch()">
              {{ isWaitingForOpponent ? 'Waiting...' : 'Start match' }}
            </button>
            <button class="secondary-button" type="button" (click)="goBack()">Back</button>
          </div>
        </div>

        <p *ngIf="!match && !quickMatch" class="error">This match could not be found.</p>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #070a12;
      color: #fff8df;
    }

    .lobby-page {
      position: relative;
      display: flex;
      min-height: 100svh;
      align-items: flex-end;
      justify-content: center;
      overflow: hidden;
      isolation: isolate;
      padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));
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

    .lobby-page::before {
      position: absolute;
      inset: 0;
      z-index: -1;
      content: '';
      background:
        linear-gradient(180deg, rgba(7, 10, 18, 0.04) 0%, rgba(7, 10, 18, 0.2) 38%, rgba(7, 10, 18, 0.76) 100%),
        linear-gradient(90deg, rgba(7, 10, 18, 0.2), rgba(7, 10, 18, 0.02), rgba(7, 10, 18, 0.32));
    }

    .back-button {
      position: fixed;
      top: calc(env(safe-area-inset-top) + 0.85rem);
      left: 1rem;
      z-index: 2;
      width: 2.75rem;
      height: 2.75rem;
      border: 2px solid #d8b15f;
      border-radius: 999px;
      background: rgba(14, 17, 18, 0.82);
      color: #f8d36c;
      font-size: 2rem;
      font-weight: 900;
      line-height: 1;
      box-shadow: 0 0.8rem 1.4rem rgba(0, 0, 0, 0.34);
    }

    .lobby-panel {
      width: min(100%, 30rem);
      border: 2px solid #d8b15f;
      border-radius: 8px;
      background: rgba(14, 17, 18, 0.8);
      box-shadow:
        inset 0 0 0 2px rgba(36, 24, 10, 0.8),
        inset 0 0 0 4px rgba(255, 232, 166, 0.12),
        0 1rem 2.6rem rgba(0, 0, 0, 0.42);
      padding: 1.1rem;
      backdrop-filter: blur(6px);
    }

    .eyebrow {
      margin: 0 0 0.35rem;
      color: #f5d36e;
      font-size: 0.78rem;
      font-weight: 900;
      text-align: center;
      text-transform: uppercase;
      text-shadow: 0 2px 0 rgba(0, 0, 0, 0.55);
    }

    h1 {
      margin: 0;
      color: #fff;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: clamp(2rem, 9vw, 3.15rem);
      line-height: 1;
      text-align: center;
      text-transform: uppercase;
      text-shadow:
        0 2px 0 rgba(32, 21, 7, 0.72),
        0 0.25rem 1rem rgba(0, 0, 0, 0.58);
    }

    .summary {
      margin: 0.7rem auto 1rem;
      max-width: 24rem;
      color: rgba(255, 255, 255, 0.92);
      font-size: 0.95rem;
      font-weight: 800;
      line-height: 1.35;
      text-align: center;
    }

    .match-card {
      display: grid;
      gap: 0.85rem;
    }

    .badge-row,
    .meta-grid > div,
    .player-card {
      border: 2px solid #d8b15f;
      border-radius: 8px;
      background: linear-gradient(180deg, rgba(39, 91, 80, 0.93), rgba(28, 70, 74, 0.93));
      box-shadow:
        inset 0 0 0 2px rgba(22, 27, 33, 0.62),
        inset 0 0 0 4px rgba(255, 232, 166, 0.08),
        0 0.65rem 1.4rem rgba(0, 0, 0, 0.34);
    }

    .badge-row {
      display: flex;
      min-height: 3.4rem;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.75rem 0.9rem;
    }

    .badge-row span,
    .badge-row strong {
      color: #fff;
      font-weight: 900;
      text-transform: uppercase;
      text-shadow: 0 2px 0 rgba(0, 0, 0, 0.38);
    }

    .players {
      display: grid;
      gap: 0.7rem;
    }

    .player-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
    }

    .avatar {
      display: grid;
      width: 3rem;
      height: 3rem;
      flex: 0 0 auto;
      place-items: center;
      border: 2px solid rgba(245, 211, 110, 0.8);
      border-radius: 999px;
      background: rgba(14, 17, 18, 0.6);
      color: #f8d36c;
      font-weight: 900;
    }

    .player-card p,
    .meta-grid span {
      margin: 0;
      color: #fff6d5;
      font-size: 0.72rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    .player-card h2,
    .meta-grid strong {
      margin: 0.15rem 0 0;
      color: #fff;
      font-size: 1.05rem;
      font-weight: 900;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.7rem;
    }

    .meta-grid > div {
      min-height: 4.25rem;
      padding: 0.7rem;
      text-align: center;
    }

    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.7rem;
    }

    button {
      min-height: 3.4rem;
      border-radius: 8px;
      font: inherit;
      font-weight: 900;
      text-transform: uppercase;
    }

    .primary-button {
      border: 2px solid #ffe28a;
      background: linear-gradient(180deg, #fce6a6 0%, #e8bb49 48%, #b8761d 100%);
      color: #201407;
    }

    .primary-button:disabled {
      opacity: 0.55;
    }

    .secondary-button {
      border: 2px solid #d8b15f;
      background: rgba(14, 17, 18, 0.76);
      color: #fff8df;
    }

    .error {
      border: 2px solid rgba(255, 193, 122, 0.7);
      border-radius: 8px;
      background: rgba(83, 27, 27, 0.8);
      color: #ffe1d6;
      font-weight: 800;
      padding: 0.75rem;
      text-align: center;
    }

    @media (min-width: 860px) {
      .lobby-page {
        align-items: center;
        justify-content: flex-end;
        padding: 2rem clamp(2rem, 8vw, 6rem);
      }
    }
  `],
})
export class MatchLobbyPage implements OnInit {
  match: Match | undefined;
  quickMatch: FirestoreQuickMatch | null = null;
  matchId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly multiplayerService: MultiplayerService,
    private readonly quickMatchService: QuickMatchService,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/multiplayer']);
      return;
    }

    this.matchId = id;
    this.match = this.multiplayerService.getMatchById(id);
    if (!this.match) {
      this.quickMatch = await this.quickMatchService.observeMatch(id);
    }
  }

  startMatch(): void {
    if (this.isWaitingForOpponent || (!this.match && !this.quickMatch)) {
      return;
    }

    void this.router.navigate(['/multiplayer/play', this.match?.id ?? this.matchId]);
  }

  goBack(): void {
    void this.router.navigate(['/multiplayer-battle']);
  }

  get isWaitingForOpponent(): boolean {
    if (this.match) {
      return this.match.status === 'waiting_for_opponent';
    }

    if (this.quickMatch) {
      return this.quickMatch.playerIds.length < 2;
    }

    return true;
  }

  get playerCount(): number {
    return this.match?.playerIds.length ?? this.quickMatch?.playerIds.length ?? 0;
  }

  get sourceLabel(): string {
    if (!this.quickMatch) {
      return 'Invite';
    }

    return this.quickMatch.matchmaking.source === 'live-queue' ? 'Live queue' : 'Recent player';
  }

  get playerSummaries(): Array<{ displayName: string }> {
    if (this.quickMatch) {
      return this.quickMatch.playerIds.map((playerId) => ({
        displayName: this.quickMatch?.players[playerId]?.displayName ?? 'Explorer',
      }));
    }

    return (this.match?.playerIds ?? []).map((playerId) => ({ displayName: playerId }));
  }
}
