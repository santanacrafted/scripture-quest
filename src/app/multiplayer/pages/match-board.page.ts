import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  MatchCategory,
  MULTIPLAYER_CATEGORIES,
} from '../multiplayer.models';
import { Subscription } from 'rxjs';
import { firebaseAuth } from '../../firebase';
import { FirestoreQuickMatch } from '../quick-match.models';
import { QuickMatchService } from '../quick-match.service';
@Component({
  selector: 'app-match-board-page',
  standalone: true,
  imports: [CommonModule],
  template: ` <main class="board" *ngIf="match">
    <header>
      <button (click)="back()">‹</button><span>LIGHT BATTLE</span
      ><button (click)="forfeit()">⋯</button>
    </header>
    <section class="player opponent">
      <div class="avatar">GS</div>
      <div class="info">
        <strong>{{ name(opponentId) }}</strong
        ><small>{{ turnLabel(opponentId) }}</small>
        <div class="lights">
          <i
            *ngFor="let c of categories"
            [style.--light]="color(c)"
            [class.on]="hasLight(opponentId, c)"
          ></i>
        </div>
      </div>
      <div class="lantern">
        <b>♜</b><span>{{ sparks(opponentId) }}/3</span>
      </div>
    </section>
    <section class="arena">
      <p class="verse">
        “Let your light so shine before men...” <b>Matthew 5:16</b>
      </p>
      <div class="wheel" [class.spinning]="spinning">
        <button
          *ngFor="let c of categories; let i = index"
          [style.--i]="i"
          [style.--c]="color(c)"
        >
          <span>{{ icon(c) }}</span>
        </button>
        <div class="hub">✦</div>
      </div>
      <div class="result" *ngIf="match.selectedCategory">
        <span>{{ icon(match.selectedCategory) }}</span
        ><b>{{ label(match.selectedCategory) }}</b>
      </div>
      <h2>{{ statusTitle }}</h2>
      <p>{{ match.lastTurnSummary }}</p>
      <button class="action" [disabled]="!isMyTurn || spinning" (click)="act()">
        {{ actionLabel }}
      </button>
    </section>
    <section class="player me">
      <div class="avatar">YOU</div>
      <div class="info">
        <strong>{{ name(myId) }}</strong
        ><small>{{ turnLabel(myId) }}</small>
        <div class="lights">
          <i
            *ngFor="let c of categories"
            [style.--light]="color(c)"
            [class.on]="hasLight(myId, c)"
          ></i>
        </div>
      </div>
      <div class="lantern charged" [class.ready]="sparks(myId) === 3">
        <b>♜</b><span>{{ sparks(myId) }}/3</span>
      </div>
    </section>
  </main>`,
  styles: [
    `
      :host {
        display: block;
        background: #07100f;
        color: #fff;
      }
      .board {
        min-height: 100svh;
        background: radial-gradient(
          circle at 50% 46%,
          #276356 0,
          #122c29 35%,
          #07100f 75%
        );
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        padding: calc(env(safe-area-inset-top) + 0.5rem) 1rem
          calc(env(safe-area-inset-bottom) + 1rem);
      }
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #f5d36e;
        font: 900 0.8rem Georgia;
        letter-spacing: 0.2em;
      }
      header button {
        width: 42px;
        height: 42px;
        border: 1px solid #9e8143;
        border-radius: 50%;
        background: #101817;
        color: #f5d36e;
        font-size: 1.7rem;
      }
      .player {
        max-width: 38rem;
        width: 100%;
        margin: 0.6rem auto;
        display: flex;
        align-items: center;
        gap: 0.8rem;
        padding: 0.75rem;
        border: 1px solid #8b713b;
        border-radius: 14px;
        background: #0d1817dd;
        box-shadow: 0 8px 24px #0008;
      }
      .opponent {
        opacity: 0.9;
      }
      .avatar {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        border: 2px solid #e4bf60;
        border-radius: 50%;
        background: #244f48;
        font-weight: 900;
      }
      .info {
        flex: 1;
      }
      .info strong,
      .info small {
        display: block;
      }
      .info small {
        color: #a8c7bf;
        font-size: 0.72rem;
      }
      .lights {
        display: flex;
        gap: 0.35rem;
        margin-top: 0.4rem;
      }
      .lights i {
        width: 15px;
        height: 15px;
        border: 1px solid #6d766f;
        border-radius: 50%;
        background: #1c2422;
      }
      .lights i.on {
        background: var(--light);
        box-shadow: 0 0 12px var(--light);
      }
      .lantern {
        text-align: center;
        color: #746d55;
      }
      .lantern b {
        display: block;
        font-size: 2rem;
        filter: drop-shadow(0 0 4px #ffc94a);
      }
      .lantern span {
        font-size: 0.7rem;
        font-weight: 900;
      }
      .lantern.ready {
        color: #ffd75f;
        text-shadow: 0 0 18px #ffb82e;
      }
      .arena {
        display: flex;
        min-height: 0;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .verse {
        font: italic 0.75rem Georgia;
        color: #d5c58f;
      }
      .verse b {
        display: block;
        font-style: normal;
      }
      .wheel {
        position: relative;
        width: min(62vw, 270px);
        aspect-ratio: 1;
        border: 8px solid #d8b15f;
        border-radius: 50%;
        background: conic-gradient(
          #f59e4a 0 72deg,
          #4dd6a7 72deg 144deg,
          #b978ed 144deg 216deg,
          #4aa9f5 216deg 288deg,
          #f0c94a 288deg
        );
        box-shadow: 0 0 0 5px #352711, 0 18px 45px #000b;
      }
      .wheel.spinning {
        animation: spin 0.9s cubic-bezier(0.2, 0.8, 0.3, 1);
      }
      @keyframes spin {
        to {
          transform: rotate(720deg);
        }
      }
      .wheel button {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 50%;
        height: 50%;
        transform-origin: 0 0;
        transform: rotate(calc(var(--i) * 72deg + 36deg));
        border: 0;
        background: transparent;
      }
      .wheel button span {
        display: block;
        font-size: 1.8rem;
        transform: translate(45%, -10%) rotate(calc(var(--i) * -72deg - 36deg));
      }
      .hub {
        position: absolute;
        inset: 38%;
        display: grid;
        place-items: center;
        border: 4px solid #ecd17f;
        border-radius: 50%;
        background: #173f39;
        color: #ffd970;
        font-size: 2rem;
      }
      .result {
        display: flex;
        gap: 0.4rem;
        margin-top: 0.7rem;
        align-items: center;
        color: #f7dc80;
      }
      .arena h2 {
        margin: 0.35rem 0 0;
        font: 900 1.25rem Georgia;
        text-transform: uppercase;
      }
      .arena > p:not(.verse) {
        min-height: 2.2em;
        max-width: 24rem;
        margin: 0.25rem;
        color: #b9cdc7;
        font-size: 0.78rem;
      }
      .action {
        min-width: 190px;
        min-height: 48px;
        border: 2px solid #ffe39a;
        border-radius: 10px;
        background: linear-gradient(#ffe9a4, #d89e2f);
        color: #201707;
        font-weight: 1000;
        text-transform: uppercase;
        box-shadow: 0 6px 20px #0008;
      }
      .action:disabled {
        filter: grayscale(1);
        opacity: 0.55;
      }
    `,
  ],
})
export class MatchBoardPage implements OnInit, OnDestroy {
  match?: FirestoreQuickMatch;
  myId = 'player-1';
  categories = MULTIPLAYER_CATEGORIES;
  spinning = false;
  private subscription?: Subscription;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: QuickMatchService
  ) {}
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.myId = firebaseAuth.currentUser?.uid || '';
    if (!id || !this.myId) {
      this.router.navigate(['/multiplayer-battle']);
      return;
    }
    this.subscription = this.service.watchMatch(id).subscribe(match => {
      if (!match || !match.playerIds.includes(this.myId) || ['cancelled', 'completed'].includes(match.status)) {
        void this.router.navigate(['/multiplayer-battle']);
        return;
      }
      this.match = match;
    });
  }
  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
  get opponentId() {
    return this.match?.playerIds.find((x) => x !== this.myId) || '';
  }
  get isMyTurn() {
    return this.match?.currentTurnPlayerId === this.myId;
  }
  get actionLabel() {
    if (this.spinning) return 'Preparing question…';
    if (!this.isMyTurn) return 'Waiting for opponent';
    if (this.match?.phase === 'light_challenge') return 'Take Light Challenge';
    return this.match?.phase === 'spin' ? 'Spin the wheel' : 'Answer challenge';
  }
  get statusTitle() {
    if (!this.isMyTurn) return `${this.name(this.opponentId)} is thinking`;
    if (this.match?.phase === 'light_challenge') return 'Lantern charged!';
    return this.match?.phase === 'question' ? 'Category chosen' : 'Your turn';
  }
  async act() {
    if (!this.match || !this.isMyTurn || this.spinning) return;
    if (this.match.phase === 'spin' || this.match.phase === 'light_challenge') {
      this.spinning = true;
      try {
        const matchId = this.match.id;
        await Promise.all([
          this.service.spinWheel(matchId),
          new Promise(resolve => setTimeout(resolve, 650)),
        ]);
        await this.router.navigate(['/multiplayer/play', matchId]);
      } finally {
        this.spinning = false;
      }
    } else this.router.navigate(['/multiplayer/play', this.match.id]);
  }
  name(id: string) {
    return this.match?.players[id]?.displayName || this.match?.players[id]?.username || 'Explorer';
  }
  sparks(id: string) {
    return this.match?.players[id]?.sparks || 0;
  }
  hasLight(id: string, c: MatchCategory) {
    return this.match?.players[id]?.lights?.includes(c);
  }
  label(c: MatchCategory) {
    return CATEGORY_LABELS[c];
  }
  icon(c: MatchCategory) {
    return CATEGORY_ICONS[c];
  }
  color(c: MatchCategory) {
    return CATEGORY_COLORS[c];
  }
  turnLabel(id: string) {
    return this.match?.currentTurnPlayerId === id
      ? 'CURRENT TURN'
      : `${this.match?.players[id]?.lights?.length || 0} OF 5 LIGHTS`;
  }
  forfeit() {
    if (this.match) {
      void this.service.forfeitMatch(this.match.id).then(() => this.router.navigate(['/multiplayer-battle']));
    }
  }
  back() {
    this.router.navigate(['/matches']);
  }
}
