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

type MatchSpinResultQuestion = Awaited<ReturnType<QuickMatchService['spinWheel']>>['question'];
@Component({
  selector: 'app-match-board-page',
  standalone: true,
  imports: [CommonModule],
  template: `
  <main *ngIf="syncingAnswer && !match" class="board !grid place-items-center" aria-live="polite">
    <div class="text-center text-emerald-100"><span class="block text-5xl text-amber-300">✦</span><h2 class="my-2 font-serif text-xl font-black uppercase text-amber-300">Returning to the board</h2><p>Preparing your next turn…</p></div>
  </main>
  <main class="board" *ngIf="match" style="position:relative">
    <p *ngIf="wheelError" class="wheel-error" role="alert">{{ wheelError }}</p>
    <header style="position:absolute;z-index:9;top:calc(max(env(safe-area-inset-top),1.5rem) + .75rem);left:1rem;right:1rem">
      <button (click)="back()">‹</button><span>LIGHT BATTLE</span><button type="button" (click)="showHelp=!showHelp" aria-label="How to play">?</button>
    </header>
    <section *ngIf="showHelp" style="position:absolute;z-index:8;top:calc(max(env(safe-area-inset-top),1.5rem) + 4.5rem);left:1rem;right:1rem;padding:1rem;border:1px solid #9e8143;border-radius:14px;background:#fffdf6;color:#302817;box-shadow:0 10px 24px #0004;text-align:left">
      <strong>How to play</strong><p style="margin:.5rem 0 0">Press and hold the center Spin button to build power, then release. Answer challenges to earn sparks and collect all five Lights.</p>
    </section>
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
      <div class="wheel-shell" [class.charging]="charging" [class.waiting]="!isMyTurn">
      <div class="wheel-marker">▼</div>
      <div *ngIf="charging" class="charge-feedback">
        <div class="charge-track"><i [style.width.%]="chargePercent"></i></div>
        <b>{{chargePercent >= 100 ? 'MAX POWER!' : 'HOLD TO CHARGE'}}</b>
      </div>
      <p class="waiting-label" *ngIf="!isMyTurn" style="position:absolute;z-index:7;top:50%;left:0;width:100%;margin:0;transform:translateY(-50%);color:#000;font-size:clamp(1.2rem,5vw,1.6rem);font-weight:900;text-align:center">Waiting for opponent</p>
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
        <button class="hub" type="button" [disabled]="!isMyTurn || spinning" aria-label="Spin the wheel"
          (pointerdown)="$event.stopPropagation(); startWheelCharge($event)"
          (pointerup)="$event.stopPropagation(); releaseWheel($event)"
          (pointercancel)="cancelWheelCharge()"
          (keydown.enter)="act()" (keydown.space)="$event.preventDefault(); act()"><span>✦</span><b>{{isMyTurn?'SPIN':'WAIT'}}</b></button>
      </div>
      </div>
      <div class="result" *ngIf="match.selectedCategory && !spinning">
        <span>{{ icon(match.selectedCategory) }}</span
        ><b>{{ label(match.selectedCategory) }}</b>
      </div>
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
      <strong class="type-label" [class.found]="rouletteLanded">{{ displayedQuestionType }}</strong>
    </section>
  </main>`,
  styles: [
    `
      :host {
        display: block;
        background: #e7e4dc;
        color: #fff;
      }
      .board {
        box-sizing: border-box;
        width: 100%;
        overflow-x: hidden;
        min-height: 100svh;
        background: #e7e4dc;
        display: grid;
        grid-template-rows: auto 1fr auto;
        align-content: stretch;
        padding: calc(max(env(safe-area-inset-top), 1.5rem) + 4rem) 1rem
          calc(env(safe-area-inset-bottom) + 1rem);
      }
      .wheel-error { position:fixed;z-index:20;top:calc(env(safe-area-inset-top) + .75rem);left:50%;width:min(calc(100% - 2rem),30rem);box-sizing:border-box;margin:0;padding:.8rem 1rem;transform:translateX(-50%);border:1px solid #f1ce70;border-radius:12px;background:#602f28;color:#fff7df;box-shadow:0 10px 28px #0006;text-align:center;font-weight:800; }
      header {
        display: grid;
        grid-template-columns: 46px 1fr 46px;
        align-items: center;
        color: #725d20;
        font: 900 0.8rem Georgia;
        letter-spacing: 0.2em;
      }
      header span { text-align:center; }
      header::after { content:''; }
      header button {
        width: 46px;
        height: 46px;
        border: 1px solid #9e8143;
        border-radius: 50%;
        background: #101817;
        color: #f5d36e;
        font-size: 1.7rem;
      }
      .player {
        box-sizing: border-box;
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
        padding: clamp(1.5rem, 5svh, 3rem) 0;
        text-align: center;
      }
      .wheel {
        box-sizing: border-box;
        max-width: 100%;
        position: relative;
        width: min(86vw, 36rem);
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
        box-shadow: 0 0 0 5px #352711, 0 10px 24px #0006;
        touch-action: none;
        user-select: none;
        transition-property: transform;
        transition-timing-function: cubic-bezier(.12,.72,.18,1);
      }
      .wheel.spinning {
        pointer-events: none;
      }
      .wheel-shell { position:relative; }
      .wheel-shell.waiting .wheel { filter:grayscale(.65); opacity:.48; }
      .wheel-marker { position:absolute; z-index:4; left:50%; top:-1.45rem; transform:translateX(-50%); color:#ffe078; font-size:2.2rem; line-height:1; filter:drop-shadow(0 3px 2px #000); }
      .wheel-shell.charging .wheel { filter:brightness(1.15); box-shadow:0 0 0 5px #352711,0 0 35px #ffd96899; }
      .charge-feedback{position:absolute;z-index:6;left:50%;bottom:-4.4rem;width:min(78vw,18rem);transform:translateX(-50%);pointer-events:none}.charge-track{height:1rem;overflow:hidden;border:2px solid #ffe18a;border-radius:1rem;background:#17140d;box-shadow:0 0 18px #f7ca55aa}.charge-track i{display:block;height:100%;background:linear-gradient(90deg,#42d39a,#f6d34e 58%,#ff5a3d);box-shadow:0 0 16px #fff;transition:width .06s linear}.charge-feedback b{display:block;margin-top:.35rem;color:#ffe17d;font-size:.74rem;letter-spacing:.14em;text-shadow:0 2px 5px #000}.wheel-shell.charging{animation:charge-rumble .12s linear infinite alternate}.wheel-shell.charging:has(.charge-track i[style*="100"]){animation-duration:.055s}@keyframes charge-rumble{from{transform:translateX(-1px)}to{transform:translateX(1px)}}
      .wheel > button:not(.hub) {
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
      .wheel > button:not(.hub) span {
        position: absolute;
        left: 50%;
        top: 3%;
        display: block;
        font-size: 1.8rem;
        transform: translateX(-50%) rotate(calc(var(--i) * -72deg - 36deg));
      }
      .hub {
        position: absolute;
        inset: 34%;
        display: grid;
        place-items: center;
        border: 4px solid #ecd17f;
        border-radius: 50%;
        background: radial-gradient(circle,#315f56,#102d29 70%);
        color: #ffe078;
        box-shadow:0 0 0 4px #173f39,0 5px 14px #0008,inset 0 0 10px #fff3;
        touch-action:none;
      }
      .hub span,.hub b { display:block; line-height:1; }
      .hub span { font-size:1.45rem; }
      .hub b { font-size:.58rem; letter-spacing:.08em; }
      .charging .hub { transform:scale(.9); box-shadow:0 0 0 5px #ffe078,0 0 28px #ffd968,inset 0 0 12px #fff6; }
      .hub:disabled { filter:grayscale(.55); opacity:.7; }
      .result {
        display: flex;
        gap: 0.4rem;
        margin-top: 0.7rem;
        align-items: center;
        color: #f7dc80;
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
      .type-label { position:relative;display:grid;min-width:min(76vw,18rem);min-height:5rem;place-items:center;padding:1rem;border:2px solid #f6d474;border-radius:16px;background:#102b27;color:#fff5cf;box-shadow:0 1rem 2.5rem #0008,0 0 28px var(--category-color);font:900 1.2rem Georgia;text-transform:uppercase; }
      .type-label.found { animation:type-found 1s cubic-bezier(.2,.8,.2,1); }
      @keyframes type-found { 0%{transform:scale(.7) rotate(-8deg)}25%{transform:scale(1.18) rotate(7deg)}50%{transform:scale(.92) rotate(-5deg)}75%{transform:scale(1.08) rotate(3deg)}100%{transform:none} }
      @media(max-height:700px){.category-emblem{width:4.5rem;font-size:2.2rem}}

      /* Keep the immersive board on the shared Multiplayer page canvas. */
      .board {
        box-sizing:border-box;
        width:min(100%,42rem);
        margin-inline:auto;
        box-shadow:0 12px 36px rgba(21,18,10,.18);
      }
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
  wheelError = '';
  charging = false;
  chargePercent = 0;
  wheelRotation = 0;
  spinDuration = 0;
  private chargeStartedAt = 0;
  private chargeTimer?: ReturnType<typeof setTimeout>;
  private chargeFrame?: number;
  private maxChargeHaptic = false;
  transitionCategory: MatchCategory | null = null;
  displayedQuestionType = 'Mystery challenge';
  rouletteLanded = false;
  showHelp = false;
  syncingAnswer = false;
  private subscription?: Subscription;
  private syncFallbackTimer?: ReturnType<typeof setTimeout>;
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
    this.restoreWheelPosition(id);
    this.syncingAnswer = this.service.hasPendingAnswer(id);
    const optimisticMatch = history.state?.optimisticMatch as FirestoreQuickMatch | undefined;
    if (this.syncingAnswer && optimisticMatch?.id === id) {
      this.match = optimisticMatch;
    }
    if (this.syncingAnswer) {
      this.syncFallbackTimer = setTimeout(() => void this.resolveSyncFallback(id), 8000);
    }
    this.subscription = this.service.watchMatch(id).subscribe(match => {
      if (!match || !match.playerIds.includes(this.myId) || ['cancelled', 'completed'].includes(match.status)) {
        void this.router.navigate(['/multiplayer-battle']);
        return;
      }
      if (this.match?.currentTurnPlayerId === this.myId && match.currentTurnPlayerId !== this.myId) {
        void this.router.navigate(['/multiplayer-battle']);
        return;
      }
      // Firestore may first replay the question snapshot that existed before
      // the answer transaction committed. Never make that stale phase
      // interactive after the player has already returned to the board.
      if (this.syncingAnswer && match.phase === 'question') return;
      this.syncingAnswer = false;
      clearTimeout(this.syncFallbackTimer);
      this.match = match;
    });
  }
  ngOnDestroy() {
    this.subscription?.unsubscribe();
    clearTimeout(this.chargeTimer);
    cancelAnimationFrame(this.chargeFrame || 0);
    clearTimeout(this.syncFallbackTimer);
    if (this.charging) void Haptics.selectionEnd();
  }
  private async resolveSyncFallback(matchId: string) {
    if (!this.syncingAnswer) return;
    const latest = await this.service.observeMatch(matchId);
    this.syncingAnswer = false;
    if (latest?.phase === 'question') {
      void this.router.navigate(['/multiplayer/play', matchId]);
      return;
    }
    if (latest) this.match = latest;
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
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.beginWheelCharge();
  }
  private beginWheelCharge() {
    if (!this.match || !this.isMyTurn || this.spinning || this.charging || this.match.phase !== 'spin') return;
    this.charging = true;
    this.chargePercent = 0;
    this.maxChargeHaptic = false;
    this.chargeStartedAt = performance.now();
    void Haptics.selectionStart();
    this.runChargeMeter();
    this.runChargePulse();
  }
  releaseWheel(event: PointerEvent) {
    event.preventDefault();
    this.finishWheelCharge();
  }
  private finishWheelCharge() {
    if (!this.charging) return;
    this.charging = false;
    clearTimeout(this.chargeTimer);
    cancelAnimationFrame(this.chargeFrame || 0);
    void Haptics.selectionEnd();
    const charge = Math.min(1, Math.max(0.08, (performance.now() - this.chargeStartedAt) / 1500));
    if (charge >= 1 && !this.maxChargeHaptic) this.reachMaxCharge();
    void this.spinWheelWithCharge(charge);
  }
  cancelWheelCharge() { this.charging = false; clearTimeout(this.chargeTimer); cancelAnimationFrame(this.chargeFrame || 0); this.chargePercent = 0; void Haptics.selectionEnd(); }
  private runChargeMeter() {
    if (!this.charging) return;
    this.chargePercent = Math.min(100, Math.round((performance.now() - this.chargeStartedAt) / 15));
    if (this.chargePercent >= 100 && !this.maxChargeHaptic) this.reachMaxCharge();
    if (this.chargePercent < 100) this.chargeFrame = requestAnimationFrame(() => this.runChargeMeter());
  }
  private reachMaxCharge() {
    this.chargePercent = 100;
    this.maxChargeHaptic = true;
    void Haptics.vibrate({ duration: 180 }).catch(() => navigator.vibrate?.([45,35,65]));
  }
  private runChargePulse() {
    if (!this.charging) return;
    const charge = Math.min(1, (performance.now() - this.chargeStartedAt) / 1500);
    const style = charge > .72 ? ImpactStyle.Heavy : charge > .35 ? ImpactStyle.Medium : ImpactStyle.Light;
    void Haptics.selectionChanged();
    void Haptics.impact({ style }).catch(() => navigator.vibrate?.(charge > .72 ? 35 : 18));
    if (charge >= 1) return;
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
        new Promise(resolve => setTimeout(resolve, 1000)),
      ]);
      clearInterval(rouletteTimer);
      this.displayedQuestionType = this.formatQuestionType(spinResult.question.questionType);
      this.rouletteLanded = true;
      await new Promise(resolve => setTimeout(resolve, 1000));
      sessionStorage.setItem(`quick-match-answer:${matchId}:${spinResult.question.id}`, spinResult.correctAnswer);
      sessionStorage.setItem(`quick-match-question:${matchId}`, JSON.stringify({ question: spinResult.question, category }));
      await this.router.navigate(['/multiplayer/play', matchId], {
        state: { optimisticMatch: this.questionReadyMatch(category, spinResult.question) },
      });
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
      this.wheelError = '';
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
      sessionStorage.setItem(this.wheelPositionKey(matchId), String(normalizedRotation));
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
          new Promise(resolve => setTimeout(resolve, 1000)),
        ]);
        clearInterval(rouletteTimer);
        this.displayedQuestionType = this.formatQuestionType(spinResult.question.questionType);
        this.rouletteLanded = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
        sessionStorage.setItem(`quick-match-answer:${matchId}:${spinResult.question.id}`, spinResult.correctAnswer);
        sessionStorage.setItem(`quick-match-question:${matchId}`, JSON.stringify({ question: spinResult.question, category: selectedCategory }));
        await this.router.navigate(['/multiplayer/play', matchId], {
          state: { optimisticMatch: this.questionReadyMatch(selectedCategory, spinResult.question) },
        });
      } catch (error) {
        console.error('[Quick Match] Wheel spin failed.', error);
        this.wheelError = error instanceof Error && error.message
          ? error.message
          : 'The challenge could not be loaded. Please spin again.';
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
  private wheelPositionKey(matchId: string) {
    return `quick-match-wheel:${matchId}:${this.myId}`;
  }
  private restoreWheelPosition(matchId: string) {
    const value = sessionStorage.getItem(this.wheelPositionKey(matchId));
    if (value === null) return;
    const stored = Number(value);
    if (Number.isFinite(stored)) this.wheelRotation = ((stored % 360) + 360) % 360;
  }
  private questionReadyMatch(category: MatchCategory, question: MatchSpinResultQuestion): FirestoreQuickMatch | undefined {
    return this.match ? {
      ...this.match,
      phase: 'question',
      selectedCategory: category,
      currentQuestion: question as FirestoreQuickMatch['currentQuestion'],
    } : undefined;
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
    this.router.navigate(['/multiplayer-battle']);
  }
}
