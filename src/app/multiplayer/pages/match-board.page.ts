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
import { Haptics, ImpactStyle } from '@capacitor/haptics';
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
      <div class="wheel-shell" [class.charging]="charging">
      <div class="wheel-marker">▼</div>
      <div *ngIf="charging" class="charge-feedback">
        <div class="charge-track"><i [style.width.%]="chargePercent"></i></div>
        <b>{{chargePercent >= 100 ? 'MAX POWER!' : 'HOLD TO CHARGE'}}</b>
      </div>
      <div class="wheel" [class.spinning]="spinning"
        [style.transform]="'rotate(' + wheelRotation + 'deg)'"
        [style.transition-duration.ms]="spinDuration"
        (pointerdown)="startWheelCharge($event)"
        (pointerup)="releaseWheel($event)"
        (pointercancel)="cancelWheelCharge()">
        <button
          *ngFor="let c of categories; let i = index"
          [style.--i]="i"
          [style.--c]="color(c)"
        >
          <span>{{ icon(c) }}</span>
        </button>
        <div class="hub">✦</div>
      </div>
      </div>
      <div class="result" *ngIf="match.selectedCategory && !spinning">
        <span>{{ icon(match.selectedCategory) }}</span
        ><b>{{ label(match.selectedCategory) }}</b>
      </div>
      <h2 *ngIf="!spinning">{{ statusTitle }}</h2>
      <p *ngIf="!spinning">{{ match.lastTurnSummary }}</p>
      <button *ngIf="!spinning" class="action" [disabled]="!isMyTurn"
        (pointerdown)="startWheelCharge($event)" (pointerup)="releaseWheel($event)"
        (pointercancel)="cancelWheelCharge()" (click)="act()">
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
    <section *ngIf="match.phase === 'light_challenge' && isMyTurn && !transitionCategory && !spinning" class="light-choice">
      <div class="choice-panel">
        <div class="choice-lantern">🏮</div><p>Lantern charged</p><h2>Choose your Light Challenge</h2>
        <h3>Claim a new Light</h3>
        <div class="choice-grid"><button *ngFor="let category of availableCaptureCategories" (click)="chooseLight(category,'capture')"><span>{{icon(category)}}</span><b>{{label(category)}}</b><small>Claim Light</small></button></div>
        <ng-container *ngIf="availableStealCategories.length"><h3>Challenge your opponent</h3><div class="choice-grid steal"><button *ngFor="let category of availableStealCategories" (click)="chooseLight(category,'steal')"><span>{{icon(category)}}</span><b>{{label(category)}}</b><small>Take their Light</small></button></div></ng-container>
      </div>
    </section>
    <section
      *ngIf="transitionCategory"
      class="question-transition"
      [style.--category-color]="color(transitionCategory)"
      aria-live="polite"
    >
      <div class="category-glow"></div>
      <div class="category-emblem">{{ icon(transitionCategory) }}</div>
      <p>{{ label(transitionCategory) }}</p>
      <h2>Choosing your challenge</h2>
      <div class="type-roulette" [class.landed]="rouletteLanded">
        <div class="roulette-ring">
          <span *ngFor="let type of questionTypes; let i = index" [style.--slot]="i">{{ type.icon }}</span>
        </div>
        <div class="roulette-pointer">▼</div>
        <strong>{{ displayedQuestionType }}</strong>
      </div>
      <small>{{ rouletteLanded ? 'Challenge selected' : 'Searching the battle scrolls…' }}</small>
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
        touch-action: none;
        user-select: none;
        transition-property: transform;
        transition-timing-function: cubic-bezier(.12,.72,.18,1);
      }
      .wheel.spinning {
        pointer-events: none;
      }
      .wheel-shell { position:relative; }
      .wheel-marker { position:absolute; z-index:4; left:50%; top:-1.45rem; transform:translateX(-50%); color:#ffe078; font-size:2.2rem; line-height:1; filter:drop-shadow(0 3px 2px #000); }
      .wheel-shell.charging .wheel { filter:brightness(1.15); box-shadow:0 0 0 5px #352711,0 0 35px #ffd96899; }
      .charge-feedback{position:absolute;z-index:6;left:50%;bottom:-4.4rem;width:min(78vw,18rem);transform:translateX(-50%);pointer-events:none}.charge-track{height:1rem;overflow:hidden;border:2px solid #ffe18a;border-radius:1rem;background:#17140d;box-shadow:0 0 18px #f7ca55aa}.charge-track i{display:block;height:100%;background:linear-gradient(90deg,#42d39a,#f6d34e 58%,#ff5a3d);box-shadow:0 0 16px #fff;transition:width .06s linear}.charge-feedback b{display:block;margin-top:.35rem;color:#ffe17d;font-size:.74rem;letter-spacing:.14em;text-shadow:0 2px 5px #000}.wheel-shell.charging{animation:charge-rumble .12s linear infinite alternate}.wheel-shell.charging:has(.charge-track i[style*="100"]){animation-duration:.055s}@keyframes charge-rumble{from{transform:translateX(-1px)}to{transform:translateX(1px)}}
      .wheel button {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        transform-origin: 50% 50%;
        transform: rotate(calc(var(--i) * 72deg + 36deg));
        border: 0;
        background: transparent;
        pointer-events: none;
      }
      .wheel button span {
        position: absolute;
        left: 50%;
        top: 3%;
        display: block;
        font-size: 1.8rem;
        transform: translateX(-50%) rotate(calc(var(--i) * -72deg - 36deg));
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
      .question-transition {
        position: fixed;
        inset: 0;
        z-index: 20;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        padding: calc(env(safe-area-inset-top) + 1.5rem) 1.25rem calc(env(safe-area-inset-bottom) + 1.5rem);
        background: radial-gradient(circle at center, color-mix(in srgb, var(--category-color) 78%, white 12%), color-mix(in srgb, var(--category-color) 48%, #06100e 52%) 48%, #06100e 100%);
        text-align: center;
      }
      .light-choice{position:fixed;inset:0;z-index:19;display:grid;place-items:center;overflow:auto;padding:calc(env(safe-area-inset-top) + 1rem) 1rem calc(env(safe-area-inset-bottom) + 1rem);background:radial-gradient(circle at top,#315f55,#07100f 72%)}
      .choice-panel{width:min(100%,36rem);padding:1rem;border:2px solid #e4bd5f;border-radius:16px;background:#0c1917ee;box-shadow:0 1rem 3rem #0009;text-align:center}.choice-lantern{font-size:3.2rem;filter:drop-shadow(0 0 18px #ffd850)}.choice-panel>p{margin:.2rem;color:#f6d46e;font-weight:900;letter-spacing:.15em;text-transform:uppercase}.choice-panel h2{margin:.25rem 0 1rem;font:900 1.8rem Georgia}.choice-panel h3{margin:1rem 0 .5rem;color:#cce1db;font-size:.8rem;letter-spacing:.12em;text-transform:uppercase}.choice-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.6rem}.choice-grid button{display:grid;min-height:6rem;place-items:center;padding:.55rem;border:2px solid #d8b15f;border-radius:11px;background:#20594f;color:#fff}.choice-grid button span{font-size:1.8rem}.choice-grid button b,.choice-grid button small{display:block}.choice-grid button small{color:#ffe082}.choice-grid.steal button{background:#682d2d;border-color:#ff9c7b}
      .category-glow { position:absolute; width:70vmin; aspect-ratio:1; border-radius:50%; background:var(--category-color); filter:blur(70px); opacity:.32; }
      .category-emblem { position:relative; display:grid; width:6rem; aspect-ratio:1; place-items:center; border:3px solid #ffe59a; border-radius:50%; background:#09201dd9; box-shadow:0 0 35px var(--category-color),inset 0 0 20px #fff2; font-size:3rem; }
      .question-transition>p { position:relative; margin:.8rem 0 .15rem; color:#ffe48c; font-weight:900; letter-spacing:.16em; text-transform:uppercase; }
      .question-transition>h2 { position:relative; margin:0 0 1rem; font:900 clamp(1.55rem,7vw,2.5rem) Georgia; text-transform:uppercase; }
      .type-roulette { position:relative; display:grid; width:min(76vw,19rem); aspect-ratio:1; place-items:center; }
      .roulette-ring { position:absolute; inset:0; border:4px solid #f6d474; border-radius:50%; background:#071311dd; box-shadow:0 1rem 2.5rem #0008,inset 0 0 30px var(--category-color); animation:type-spin .72s linear infinite; }
      .roulette-ring span { position:absolute; left:50%; top:50%; font-size:1.5rem; transform:rotate(calc(var(--slot) * 45deg)) translateY(-7.5rem) rotate(calc(var(--slot) * -45deg)); transform-origin:0 0; }
      .roulette-pointer { position:absolute; z-index:2; top:-.35rem; color:#ffe078; font-size:1.7rem; filter:drop-shadow(0 2px 2px #000); }
      .type-roulette strong { position:relative; z-index:2; display:grid; width:56%; min-height:4.5rem; place-items:center; padding:.6rem; border:2px solid #f6d474; border-radius:50%; background:#102b27; color:#fff5cf; font:900 .92rem Georgia; text-transform:uppercase; }
      .type-roulette.landed .roulette-ring { animation:none; box-shadow:0 0 38px var(--category-color),inset 0 0 30px var(--category-color); }
      .question-transition>small { position:relative; color:#d4e8e2; font-weight:800; }
      @keyframes type-spin { to { transform:rotate(360deg); } }
      @media(max-height:700px){.category-emblem{width:4.5rem;font-size:2.2rem}.type-roulette{width:min(54vh,16rem)}.roulette-ring span{transform:rotate(calc(var(--slot) * 45deg)) translateY(-6.2rem) rotate(calc(var(--slot) * -45deg));}}
    `,
  ],
})
export class MatchBoardPage implements OnInit, OnDestroy {
  match?: FirestoreQuickMatch;
  myId = 'player-1';
  categories = MULTIPLAYER_CATEGORIES;
  readonly questionTypes = [
    { label: 'Who Am I', icon: '👤' }, { label: 'Multiple Choice', icon: '✦' },
    { label: 'True or False', icon: '⚖️' }, { label: 'Verse Completion', icon: '📖' },
    { label: 'Reference Match', icon: '🔎' }, { label: 'Sequence', icon: '🔢' },
    { label: 'Emoji Challenge', icon: '✨' }, { label: 'What Happens Next', icon: '➡️' },
  ];
  spinning = false;
  charging = false;
  chargePercent = 0;
  wheelRotation = 0;
  spinDuration = 0;
  private chargeStartedAt = 0;
  private chargeTimer?: ReturnType<typeof setTimeout>;
  transitionCategory: MatchCategory | null = null;
  displayedQuestionType = 'Mystery challenge';
  rouletteLanded = false;
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
    clearTimeout(this.chargeTimer);
    if (this.charging) void Haptics.selectionEnd();
  }
  get opponentId() {
    return this.match?.playerIds.find((x) => x !== this.myId) || '';
  }
  get isMyTurn() {
    return this.match?.currentTurnPlayerId === this.myId;
  }
  get actionLabel() {
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
    if (this.match.phase === 'spin') {
      await this.spinWheelWithCharge(0.25);
    } else this.router.navigate(['/multiplayer/play', this.match.id]);
  }
  startWheelCharge(event: PointerEvent) {
    if (!this.match || !this.isMyTurn || this.spinning || this.match.phase !== 'spin') return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.charging = true;
    this.chargePercent = 0;
    this.chargeStartedAt = performance.now();
    void Haptics.selectionStart();
    this.runChargePulse();
  }
  releaseWheel(event: PointerEvent) {
    if (!this.charging) return;
    event.preventDefault();
    this.charging = false;
    clearTimeout(this.chargeTimer);
    void Haptics.selectionEnd();
    const charge = Math.min(1, Math.max(0.08, (performance.now() - this.chargeStartedAt) / 1500));
    void this.spinWheelWithCharge(charge);
  }
  cancelWheelCharge() { this.charging = false; clearTimeout(this.chargeTimer); this.chargePercent = 0; void Haptics.selectionEnd(); }
  private runChargePulse() {
    if (!this.charging) return;
    const charge = Math.min(1, (performance.now() - this.chargeStartedAt) / 1500);
    this.chargePercent = Math.round(charge * 100);
    const style = charge > .72 ? ImpactStyle.Heavy : charge > .35 ? ImpactStyle.Medium : ImpactStyle.Light;
    void Haptics.selectionChanged();
    void Haptics.impact({ style }).catch(() => navigator.vibrate?.(charge > .72 ? 35 : 18));
    if (charge >= 1) {
      void Haptics.vibrate({ duration: 180 }).catch(() => navigator.vibrate?.([45, 35, 65]));
      return;
    }
    const nextPulseMs = Math.round(210 - charge * 145);
    this.chargeTimer = setTimeout(() => this.runChargePulse(), nextPulseMs);
  }
  get availableCaptureCategories() {
    const owned = this.match?.players[this.myId]?.lights || [];
    return this.categories.filter(category => !owned.includes(category));
  }
  get availableStealCategories() {
    const owned = this.match?.players[this.myId]?.lights || [];
    const opponentLights = this.match?.players[this.opponentId]?.lights || [];
    return this.categories.filter(category => opponentLights.includes(category) && !owned.includes(category));
  }
  async chooseLight(category: MatchCategory, action: 'capture' | 'steal') {
    if (!this.match || this.spinning) return;
    this.spinning = true;
    const matchId = this.match.id;
    this.transitionCategory = category;
    this.rouletteLanded = false;
    let typeIndex = 0;
    const rouletteTimer = setInterval(() => {
      this.displayedQuestionType = this.questionTypes[typeIndex++ % this.questionTypes.length].label;
    }, 120);
    try {
      await this.service.chooseLightChallenge(matchId, category, action);
      const [spinResult] = await Promise.all([
        this.service.spinWheel(matchId, category),
        new Promise(resolve => setTimeout(resolve, 2000)),
      ]);
      clearInterval(rouletteTimer);
      this.displayedQuestionType = this.formatQuestionType(spinResult.question.questionType);
      this.rouletteLanded = true;
      await new Promise(resolve => setTimeout(resolve, 1000));
      sessionStorage.setItem(`quick-match-answer:${matchId}:${spinResult.question.id}`, spinResult.correctAnswer);
      await this.router.navigate(['/multiplayer/play', matchId]);
    } finally {
      clearInterval(rouletteTimer);
      this.transitionCategory = null;
      this.spinning = false;
    }
  }
  private async spinWheelWithCharge(charge: number) {
    if (!this.match || this.spinning) return;
    if (this.match.phase === 'spin' || this.match.phase === 'light_challenge') {
      this.spinning = true;
      const fullTurns = 3 + Math.floor(charge * 6);
      this.spinDuration = 1100 + Math.round(charge * 1400);
      if (this.match.phase === 'light_challenge' && this.match.selectedCategory) {
        const targetIndex = this.categories.indexOf(this.match.selectedCategory);
        const targetRotation = (360 - (targetIndex * 72 + 36)) % 360;
        const currentRotation = ((this.wheelRotation % 360) + 360) % 360;
        const landingDelta = (targetRotation - currentRotation + 360) % 360;
        this.wheelRotation += fullTurns * 360 + landingDelta;
      } else {
        this.wheelRotation += fullTurns * 360 + Math.floor(Math.random() * 360);
      }
      const normalizedRotation = ((this.wheelRotation % 360) + 360) % 360;
      const pointerAngle = (360 - normalizedRotation) % 360;
      const landedIndex = Math.min(this.categories.length - 1, Math.floor(pointerAngle / 72));
      const selectedCategory = this.match.phase === 'light_challenge' && this.match.selectedCategory
        ? this.match.selectedCategory
        : this.categories[landedIndex];
      const matchId = this.match.id;
      const questionRequest = this.service.spinWheel(matchId, selectedCategory);
      let rouletteTimer: ReturnType<typeof setInterval> | undefined;
      try {
        // Let the category wheel finish and visibly land before covering it.
        await new Promise(resolve => setTimeout(resolve, this.spinDuration));
        this.transitionCategory = selectedCategory;
        this.rouletteLanded = false;
        let typeIndex = 0;
        rouletteTimer = setInterval(() => {
          this.displayedQuestionType = this.questionTypes[typeIndex++ % this.questionTypes.length].label;
        }, 120);
        const [spinResult] = await Promise.all([
          questionRequest,
          new Promise(resolve => setTimeout(resolve, 2000)),
        ]);
        clearInterval(rouletteTimer);
        this.displayedQuestionType = this.formatQuestionType(spinResult.question.questionType);
        this.rouletteLanded = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
        sessionStorage.setItem(`quick-match-answer:${matchId}:${spinResult.question.id}`, spinResult.correctAnswer);
        await this.router.navigate(['/multiplayer/play', matchId]);
      } finally {
        clearInterval(rouletteTimer);
        this.transitionCategory = null;
        this.spinning = false;
      }
    }
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
  formatQuestionType(type: string) {
    return type.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
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
