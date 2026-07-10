import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Match } from '../multiplayer.models';
import { MultiplayerService } from '../multiplayer.service';
import { FirestoreQuickMatch } from '../quick-match.models';
import { QuickMatchService } from '../quick-match.service';
import { FriendBattleService } from '../../friend-battle/friend-battle.service';
import { FriendBattleMatch } from '../../friend-battle/friend-battle.models';

@Component({
  selector: 'app-active-matches-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="active-panel" aria-labelledby="active-matches-title">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Battle Rooms</p>
          <h2 id="active-matches-title">Active matches</h2>
        </div>
        <span>{{ totalMatches }}</span>
      </div>

      <div *ngIf="totalMatches === 0; else matchList" class="empty-state">
        No active matches yet. Start Quick Match to open one.
      </div>

      <p *ngIf="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

      <ng-template #matchList>
        <div class="match-list">
          <article *ngFor="let match of quickMatches" class="match-row">
            <div class="match-copy">
              <p class="match-title">Quick Match</p>
              <p class="match-meta">
                {{ match.playerIds.length }}/2 explorers · {{ match.matchmaking.source === 'live-queue' ? 'Live queue' : 'Recent player' }}
              </p>
            </div>
            <a class="open-link" [routerLink]="['/multiplayer/lobby', match.id]">Open</a>
          </article>

          <article *ngFor="let match of friendBattleMatches" class="match-row">
            <div class="match-copy">
              <p class="match-title">Friend Battle</p>
              <p class="match-meta">{{ match.playerIds.length }}/2 explorers · {{ match.status === 'lobby' ? 'Lobby' : 'Round ' + match.roundNumber }}</p>
            </div>
            <a class="open-link" [routerLink]="['/multiplayer/lobby', match.id]">Open</a>
          </article>

          <article *ngFor="let match of localMatches" class="match-row">
            <div class="match-copy">
              <p class="match-title">Friend Battle</p>
              <p class="match-meta">{{ match.playerIds.length }}/2 explorers · {{ match.status }}</p>
            </div>
            <a class="open-link" [routerLink]="['/multiplayer/lobby', match.id]">Open</a>
            <button class="delete-button" type="button" (click)="deleteLocalMatch(match.id)">Delete</button>
          </article>
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    .active-panel {
      border: 1px solid #332415;
      border-radius: 8px;
      background: rgba(13, 14, 16, 0.86);
      box-shadow:
        inset 0 1px 0 rgba(255, 244, 196, 0.24),
        inset 0 0 0 1px rgba(245, 197, 93, 0.76),
        inset 0 0 0 3px rgba(20, 13, 7, 0.48),
        0 12px 20px rgba(0, 0, 0, 0.34);
      color: #fff8df;
      padding: 0.85rem;
      backdrop-filter: blur(8px);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .eyebrow {
      margin: 0;
      color: #f5d36e;
      font-size: 0.68rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    h2 {
      margin: 0.1rem 0 0;
      color: #fff;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: clamp(1rem, 4vw, 1.25rem);
      line-height: 1;
      text-transform: uppercase;
    }

    .panel-header span {
      display: grid;
      min-width: 2.25rem;
      min-height: 2.25rem;
      place-items: center;
      border: 2px solid #d8b15f;
      border-radius: 999px;
      background: rgba(39, 91, 80, 0.92);
      font-weight: 900;
    }

    .empty-state {
      border: 1px solid rgba(216, 177, 95, 0.65);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 248, 223, 0.82);
      font-size: 0.82rem;
      font-weight: 800;
      line-height: 1.35;
      padding: 0.8rem;
    }

    .error-message {
      border: 2px solid rgba(255, 193, 122, 0.7);
      border-radius: 8px;
      background: rgba(83, 27, 27, 0.84);
      color: #ffe1d6;
      font-size: 0.78rem;
      font-weight: 800;
      line-height: 1.35;
      margin: 0 0 0.65rem;
      padding: 0.7rem;
    }

    .match-list {
      display: grid;
      gap: 0.6rem;
      max-height: min(34vh, 18rem);
      overflow: auto;
      padding-right: 0.1rem;
    }

    .match-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      align-items: center;
      gap: 0.45rem;
      border: 2px solid #d8b15f;
      border-radius: 8px;
      background: linear-gradient(180deg, rgba(39, 91, 80, 0.93), rgba(28, 70, 74, 0.93));
      box-shadow: inset 0 0 0 2px rgba(22, 27, 33, 0.62);
      padding: 0.58rem;
    }

    .match-copy {
      min-width: 0;
    }

    .match-title {
      margin: 0;
      color: #fff;
      font-size: clamp(0.72rem, 3.1vw, 0.86rem);
      font-weight: 900;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .match-meta {
      margin: 0.2rem 0 0;
      color: #fff6d5;
      font-size: clamp(0.62rem, 2.6vw, 0.7rem);
      font-weight: 800;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .open-link,
    .delete-button {
      flex: 0 0 auto;
      border: 2px solid #ffe28a;
      border-radius: 8px;
      color: #201407;
      font: inherit;
      font-size: clamp(0.58rem, 2.4vw, 0.68rem);
      font-weight: 900;
      min-height: 2.45rem;
      padding: 0 0.48rem;
      text-decoration: none;
      text-transform: uppercase;
    }

    .open-link {
      display: grid;
      place-items: center;
      background: linear-gradient(180deg, #fce6a6 0%, #e8bb49 48%, #b8761d 100%);
    }

    .delete-button {
      background: rgba(83, 27, 27, 0.88);
      color: #ffe1d6;
    }
  `],
})
export class ActiveMatchesListComponent implements OnInit, OnDestroy {
  localMatches: Match[] = [];
  quickMatches: FirestoreQuickMatch[] = [];
  friendBattleMatches: FriendBattleMatch[] = [];
  errorMessage = '';
  private subscription = new Subscription();

  constructor(
    private readonly multiplayerService: MultiplayerService,
    private readonly quickMatchService: QuickMatchService,
    private readonly friendBattleService: FriendBattleService,
  ) {}

  ngOnInit(): void {
    this.localMatches = this.multiplayerService.getActiveMatches();
    this.subscription.add(this.quickMatchService.observeActiveMatches().subscribe({
      next: (matches) => {
        this.quickMatches = matches;
      },
      error: (error) => {
        console.warn('Failed to load active Quick Matches:', error);
      },
    }));
    this.subscription.add(this.friendBattleService.observeMatches().subscribe({
      next: matches => this.friendBattleMatches = matches.filter(match => match.mode === 'friend-battle' && ['lobby', 'waiting', 'active'].includes(match.status)),
      error: error => console.warn('Failed to load active Friend Battles:', error),
    }));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async deleteQuickMatch(matchId: string): Promise<void> {
    this.errorMessage = '';
    try {
      await this.quickMatchService.deleteMatchForTesting(matchId);
    } catch (error) {
      console.error('Failed to delete Quick Match:', error);
      this.errorMessage = 'Unable to delete this match yet. Deploy the latest Functions and try again.';
    }
  }

  deleteLocalMatch(matchId: string): void {
    this.errorMessage = '';
    this.multiplayerService.deleteLocalMatch(matchId);
    this.localMatches = this.multiplayerService.getActiveMatches();
  }

  get totalMatches(): number {
    return this.localMatches.length + this.quickMatches.length + this.friendBattleMatches.length;
  }
}
