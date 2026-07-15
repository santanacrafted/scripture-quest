import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  MatchCategory,
  Question,
} from '../multiplayer.models';
import { firebaseAuth } from '../../firebase';
import { FirestoreQuickMatch } from '../quick-match.models';
import { QuickMatchService } from '../quick-match.service';
import { InteractiveQuestionComponent } from '../components/interactive-question.component';
@Component({
  selector: 'app-match-play-page',
  standalone: true,
  imports: [CommonModule, DragDropModule, InteractiveQuestionComponent],
  template: `<app-interactive-question *ngIf="question" [question]="question" [categoryLabel]="icon + ' ' + label" [modeLabel]="phase || ''" [timerLabel]="'⏱ ' + time + 's'" [answered]="answered" [correct]="correct" [submitting]="submitting" [showContinue]="answered" [continueLabel]="returningToBoard ? 'Returning…' : 'Return to board'" (answerSelected)="answer($event)" (continued)="done()"></app-interactive-question>
  <main *ngIf="false && question">
    <header>
      <span>{{ icon }} {{ label }}</span
      ><b>{{ phase }}</b
      ><span>⏱ {{ time }}s</span>
    </header>
    <section>
      <p class="type">{{ typeLabel }}</p>
      <h1>{{ question.text }}</h1>
      <figure *ngIf="isPictionary" class="pictionary-image">
        <img *ngIf="question.media; else missingPictionaryImage"
          [src]="question.media.downloadUrl"
          [alt]="question.media.altText"
        />
        <ng-template #missingPictionaryImage><span>Image unavailable</span></ng-template>
      </figure>
      <div
        *ngIf="isSequence"
        class="sequence-list"
        cdkDropList
        [cdkDropListData]="sequenceItems"
        [cdkDropListDisabled]="answered || submitting"
        (cdkDropListDropped)="dropSequence($event)"
      >
        <div
          *ngFor="let item of sequenceItems; let i = index"
          class="sequence-item"
          [class.sequence-correct]="answered && correct"
          [class.sequence-wrong]="answered && !correct"
          cdkDrag
          [cdkDragStartDelay]="250"
          (cdkDragStarted)="sequenceDragStarted()"
        >
          <span>{{ i + 1 }}</span>
          <b>{{ item }}</b>
          <i aria-hidden="true">⠿</i>
          <div class="sequence-placeholder" *cdkDragPlaceholder></div>
        </div>
      </div>
      <p *ngIf="isSequence && !answered" class="sequence-help">
        Press and hold an item, then drag it into the correct position.
      </p>
      <button
        *ngIf="isSequence && !answered"
        class="submit-order"
        [disabled]="submitting"
        (click)="submitSequence()"
      >
        {{ submitting ? 'Checking…' : 'Submit order' }}
      </button>
      <div
        *ngIf="isMatchPairs && question.matchPairs"
        class="pairs-board"
        [class.pairs-correct]="answered && correct"
        [class.pairs-wrong]="answered && !correct"
      >
        <div class="pair-column">
          <strong>Choose from this side</strong>
          <button
            *ngFor="let item of question.matchPairs.left"
            [disabled]="answered || submitting"
            [class.pair-selected]="selectedPairLeft === item"
            [class.pair-connected]="!!pairMatches[item]"
            [style.--pair-color]="pairColorForLeft(item)"
            (click)="choosePairLeft(item)"
          >
            <span></span><b>{{ item }}</b><i>{{ pairMatches[item] ? '✓' : '○' }}</i>
          </button>
        </div>
        <div class="pair-column">
          <strong>Match with this side</strong>
          <button
            *ngFor="let item of question.matchPairs.right"
            [disabled]="answered || submitting"
            [class.pair-selected]="selectedPairRight === item"
            [class.pair-connected]="isRightConnected(item)"
            [style.--pair-color]="pairColorForRight(item)"
            (click)="choosePairRight(item)"
          >
            <span></span><b>{{ item }}</b><i>{{ isRightConnected(item) ? '✓' : '○' }}</i>
          </button>
        </div>
      </div>
      <p *ngIf="isMatchPairs && !answered" class="sequence-help">
        Tap one item on each side to connect them. Tap a connected item to undo it.
      </p>
      <button
        *ngIf="isMatchPairs && !answered"
        class="submit-order"
        [disabled]="submitting || !allPairsConnected"
        (click)="submitPairs()"
      >
        {{ submitting ? 'Checking…' : 'Submit matches' }}
      </button>
      <div
        *ngIf="isArrangeVerse"
        class="verse-builder"
        [class.verse-correct]="answered && correct"
        [class.verse-wrong]="answered && !correct"
      >
        <strong>Your verse</strong>
        <div
          class="verse-line"
          cdkDropList
          cdkDropListOrientation="mixed"
          [cdkDropListData]="placedVerseSegments"
          [cdkDropListDisabled]="answered || submitting"
          (cdkDropListDropped)="dropVerseSegment($event)"
        >
          <button
            *ngFor="let segment of placedVerseSegments; let i = index"
            cdkDrag
            [cdkDragStartDelay]="250"
            (cdkDragStarted)="verseDragStarted()"
            (cdkDragEnded)="verseDragEnded()"
            [disabled]="answered || submitting"
            (click)="returnVerseSegment(segment)"
          >
            <small>{{ i + 1 }}</small>{{ segment.text }}<i>⠿</i>
            <span class="verse-tile-placeholder" *cdkDragPlaceholder></span>
          </button>
          <p *ngIf="!placedVerseSegments.length">Tap the tiles below to build the verse.</p>
        </div>
        <strong *ngIf="availableVerseSegments.length">Available tiles</strong>
        <div class="verse-bank">
          <button
            *ngFor="let segment of availableVerseSegments"
            [disabled]="answered || submitting"
            (click)="placeVerseSegment(segment)"
          >
            {{ segment.text }}
          </button>
        </div>
      </div>
      <p *ngIf="isArrangeVerse && !answered" class="sequence-help">
        Tap to place or remove a tile. Press and hold a placed tile to rearrange it.
      </p>
      <button
        *ngIf="isArrangeVerse && !answered"
        class="submit-order"
        [disabled]="submitting || availableVerseSegments.length > 0"
        (click)="submitVerse()"
      >
        {{ submitting ? 'Checking…' : 'Submit verse' }}
      </button>
      <div *ngIf="!isSequence && !isMatchPairs && !isArrangeVerse" class="answers">
        <button
          *ngFor="let a of question.choices; let i = index"
          [disabled]="submitting || answered"
          [class.chosen]="selected === a"
          [class.correct]="answered && !timedOut && a === question.correctAnswer"
          [class.wrong]="answered && selected === a && a !== question.correctAnswer"
          (click)="answer(a)"
        >
          <i *ngIf="!isTrueFalse">{{ letters[i] }}</i
          >{{ a }}
        </button>
      </div>
      <article *ngIf="answered">
        <strong>{{ timedOut ? 'TURN LOST' : (correct ? 'A LIGHT SPARK!' : 'KEEP SEEKING') }}</strong>
        <p *ngIf="timedOut">Time expired before an answer was chosen.</p>
        <p>{{ question.explanation }}</p>
        <small>{{ question.reference }}</small
        ><button class="continue" [disabled]="returningToBoard" (click)="done()">{{ returningToBoard ? 'Returning…' : 'Return to board' }}</button>
      </article>
    </section>
    <div *ngIf="showTimeoutAlert" class="timeout-alert" role="alert">
      <div><b>⏳</b><strong>Time’s up!</strong><span>You lost your turn</span></div>
    </div>
  </main>
  <main *ngIf="!question" class="question-loading"><div><span>✦</span><b>Preparing your question…</b></div></main>`,
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
        background: #081311;
        color: #fff;
      }
      main {
        box-sizing: border-box;
        height: 100svh;
        min-height: 100svh;
        background: radial-gradient(circle at top, #275e52, #081311 60%);
        overflow-x: hidden;
        overflow-y: auto;
        padding: calc(env(safe-area-inset-top) + 0.75rem) 1rem
          calc(env(safe-area-inset-bottom) + 1.25rem);
      }
      .question-loading { display:grid; place-items:center; background:radial-gradient(circle at top,#275e52,#081311 60%); }
      .question-loading div { display:grid; gap:.7rem; place-items:center; color:#f3d675; }
      .question-loading span { font-size:3rem; animation:loading-pulse .8s ease-in-out infinite alternate; }
      @keyframes loading-pulse { to { transform:scale(1.15); filter:drop-shadow(0 0 15px #f3d675); } }
      header {
        max-width: 42rem;
        margin: auto;
        display: flex;
        justify-content: space-between;
        color: #f3d675;
        font-size: 0.76rem;
        font-weight: 900;
        text-transform: uppercase;
      }
      header b {
        color: #c2d8d1;
      }
      section {
        max-width: 42rem;
        margin: clamp(1.25rem, 5vh, 3rem) auto 0;
        text-align: center;
      }
      .type {
        color: #f5d36e;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0.65rem 0 0;
        overflow-wrap: anywhere;
        font: 900 clamp(1.45rem, 6vw, 2.65rem) Georgia;
        line-height: 1.08;
        text-shadow: 0 3px 10px #000;
      }
      .pictionary-image {
        width: 100%;
        aspect-ratio: 16 / 9;
        margin: 0.75rem 0 1rem;
        overflow: hidden;
        border: 3px solid #e5c56b;
        border-radius: 18px;
        background: #0d211d;
        box-shadow: 0 12px 30px #0008, 0 0 24px #e5c56b33;
      }
      .pictionary-image img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .pictionary-image span {
        display: grid;
        height: 100%;
        place-items: center;
        color: #d9c98f;
        font-weight: 800;
      }
      .answers {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.7rem;
        margin-top: clamp(1rem, 3vh, 2rem);
      }
      .answers button {
        min-height: 56px;
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.65rem;
        border: 2px solid #8d7746;
        border-radius: 12px;
        background: #122724;
        color: #fff;
        text-align: left;
        font-weight: 800;
        touch-action: manipulation;
      }
      .answers i {
        display: grid;
        place-items: center;
        min-width: 30px;
        height: 30px;
        border-radius: 50%;
        background: #295d54;
        color: #f8da78;
        font-style: normal;
      }
      .answers .chosen {
        border-color: #fff;
      }
      .answers .correct {
        background: #17694f;
        border-color: #65e0a2;
      }
      .answers .wrong {
        background: #7a2828;
        border-color: #f98c86;
      }
      .sequence-list {
        display: grid;
        gap: 0.65rem;
        margin-top: clamp(1rem, 3vh, 2rem);
      }
      .sequence-item {
        display: grid;
        grid-template-columns: 2.4rem 1fr 2rem;
        min-height: 58px;
        align-items: center;
        gap: 0.75rem;
        padding: 0.65rem 0.8rem;
        border: 2px solid #8d7746;
        border-radius: 13px;
        background: #122724;
        text-align: left;
        user-select: none;
        -webkit-touch-callout: none;
        touch-action: none;
      }
      .sequence-item > span {
        display: grid;
        width: 2.2rem;
        height: 2.2rem;
        place-items: center;
        border-radius: 50%;
        background: #295d54;
        color: #f8da78;
        font-weight: 900;
      }
      .sequence-item > i {
        color: #f8da78;
        font-size: 1.5rem;
        font-style: normal;
        text-align: center;
      }
      .sequence-correct { background: #17694f; border-color: #65e0a2; }
      .sequence-wrong { background: #642525; border-color: #f98c86; }
      .sequence-help { margin: 0.75rem 0; color: #b7cec7; font-size: 0.82rem; }
      .submit-order {
        width: 100%;
        min-height: 52px;
        border: 2px solid #ffe39a;
        border-radius: 11px;
        background: linear-gradient(#ffe9a4, #d89e2f);
        color: #17130b;
        font-weight: 900;
        text-transform: uppercase;
      }
      .cdk-drag-preview {
        box-sizing: border-box;
        border: 2px solid #f8da78;
        border-radius: 13px;
        background: #1e4c43;
        color: white;
        box-shadow: 0 18px 36px #0009;
        transform: scale(1.02);
      }
      .sequence-placeholder {
        width:100%;
        min-height: 58px;
        border: 2px dashed #f8da78;
        border-radius:13px;
        background:#f8da7814;
        transition:transform 220ms cubic-bezier(0,0,.2,1),height 220ms ease;
        border-radius: 13px;
        background: #f8da781a;
      }
      .cdk-drag-animating { transition: transform 240ms cubic-bezier(0, 0, .2, 1); }
      .sequence-list.cdk-drop-list-dragging .sequence-item:not(.cdk-drag-placeholder) {
        transition: transform 240ms cubic-bezier(0, 0,.2,1);
      }
      .pairs-board {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.8rem;
        margin-top: clamp(1rem, 3vh, 2rem);
      }
      .pair-column { display: grid; align-content: start; gap: 0.6rem; }
      .pair-column > strong {
        color: #b7cec7;
        font-size: 0.72rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .pair-column button {
        display: grid;
        grid-template-columns: 0.8rem 1fr 1.2rem;
        min-height: 58px;
        align-items: center;
        gap: 0.55rem;
        padding: 0.65rem;
        border: 2px solid #8d7746;
        border-radius: 12px;
        background: #122724;
        color: white;
        text-align: left;
      }
      .pair-column button > span {
        width: 0.7rem;
        height: 70%;
        border-radius: 1rem;
        background: var(--pair-color, #58746c);
      }
      .pair-column button > i { color: var(--pair-color, #b7cec7); font-style: normal; }
      .pair-column .pair-selected { border-color: #ffe08a; box-shadow: 0 0 18px #ffe08a44; }
      .pair-column .pair-connected { border-color: var(--pair-color); background: color-mix(in srgb, var(--pair-color) 20%, #122724); }
      .pairs-correct .pair-connected { border-color: #65e0a2; background: #17694f; }
      .pairs-wrong .pair-connected { border-color: #f98c86; background: #642525; }
      .submit-order:disabled { opacity: 0.45; }
      .verse-builder {
        display: grid;
        gap: 0.7rem;
        margin-top: clamp(1rem, 3vh, 2rem);
        text-align: left;
      }
      .verse-builder > strong {
        color: #f5d36e;
        font-size: 0.74rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .verse-line {
        display: flex;
        min-height: 8rem;
        align-content: flex-start;
        flex-wrap: wrap;
        gap: 0.55rem;
        padding: 0.8rem;
        border: 2px dashed #8d7746;
        border-radius: 14px;
        background: #0d201d;
      }
      .verse-line > p { width: 100%; margin: auto; color: #8ca9a1; text-align: center; }
      .verse-line button, .verse-bank button {
        min-height: 46px;
        padding: 0.55rem 0.75rem;
        border: 2px solid #8d7746;
        border-radius: 10px;
        background: #173a34;
        color: white;
        font-weight: 800;
        touch-action: manipulation;
      }
      .verse-line button { display: flex; align-items: center; gap: 0.45rem; }
      .verse-line button small {
        display: grid;
        width: 1.35rem;
        height: 1.35rem;
        place-items: center;
        border-radius: 50%;
        background: #f5d36e;
        color: #17211e;
      }
      .verse-line button i { color: #f5d36e; font-style: normal; }
      .verse-bank { display: flex; flex-wrap: wrap; gap: 0.55rem; }
      .verse-bank button { background: #102824; }
      .verse-tile-placeholder {
        display: block;
        min-width: 5rem;
        min-height: 44px;
        border: 2px dashed #f5d36e;
        border-radius: 10px;
      }
      .verse-correct .verse-line { border-color: #65e0a2; background: #123c30; }
      .verse-wrong .verse-line { border-color: #f98c86; background: #421c1c; }
      article {
        margin-top: 1rem;
        padding: 1rem;
        border: 1px solid #b69850;
        border-radius: 12px;
        background: #101b19;
        scroll-margin-bottom: calc(env(safe-area-inset-bottom) + 1rem);
      }
      article strong {
        color: #f7d76d;
        font: 900 1.2rem Georgia;
      }
      article p {
        margin: 0.4rem;
      }
      article small {
        color: #9fc0b7;
      }
      .continue {
        display: block;
        width: 100%;
        min-height: 48px;
        margin-top: 1rem;
        border: 2px solid #ffe39a;
        border-radius: 9px;
        background: linear-gradient(#ffe9a4, #d89e2f);
        font-weight: 900;
        touch-action: manipulation;
      }
      .timeout-alert { position:fixed; inset:0; z-index:30; display:grid; place-items:center; padding:1rem; background:#260706d9; animation:timeout-flash .32s ease-out 3 alternate; }
      .timeout-alert div { display:flex; width:min(88vw,24rem); min-height:15rem; flex-direction:column; align-items:center; justify-content:center; border:3px solid #ff8b78; border-radius:50%; background:radial-gradient(circle,#a91f19,#4c0907 72%); box-shadow:0 0 70px #ff3028aa; animation:timeout-pulse .55s ease-out; text-align:center; text-transform:uppercase; }
      .timeout-alert b { font-size:3.5rem; }
      .timeout-alert strong { font:900 clamp(2rem,10vw,3.5rem) Georgia; }
      .timeout-alert span { margin-top:.5rem; color:#ffd1c9; font-weight:900; letter-spacing:.1em; }
      @keyframes timeout-flash { from { background:#160302c9; } to { background:#770d09e8; } }
      @keyframes timeout-pulse { from { transform:scale(.7); opacity:0; } 70% { transform:scale(1.06); } to { transform:scale(1); opacity:1; } }
      @media (max-width: 360px) {
        .answers {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 420px) {
        .pairs-board { grid-template-columns: 1fr; }
      }
      @media (max-height: 740px) {
        section {
          margin-top: 0.9rem;
        }
        .type {
          margin: 0.45rem 0;
        }
        h1 {
          font-size: clamp(1.3rem, 5.5vw, 2rem);
        }
        .pictionary-image {
          height: 30svh;
          min-height: 10rem;
        }
        .answers {
          gap: 0.5rem;
          margin-top: 0.8rem;
        }
        .answers button {
          min-height: 52px;
        }
        article {
          margin-top: 0.75rem;
          padding: 0.75rem;
        }
      }
    `,
  ],
})
export class MatchPlayPage implements OnInit, OnDestroy {
  match?: FirestoreQuickMatch;
  question?: Question;
  selected = '';
  submitting = false;
  answered = false;
  correct = false;
  waitingForOpponent = false;
  timedOut = false;
  showTimeoutAlert = false;
  private cachedCorrectAnswer = '';
  private cachedCategory?: MatchCategory;
  private previousBodyOverflow = '';
  private turnSave?: Promise<void>;
  returningToBoard = false;
  time = 20;
  letters = ['A', 'B', 'C', 'D'];
  sequenceItems: string[] = [];
  selectedPairLeft = '';
  selectedPairRight = '';
  pairMatches: Record<string, string> = {};
  readonly pairColors = ['#54d6ae', '#55aaf7', '#b97aea', '#f3c94e', '#f39955', '#f1768b'];
  availableVerseSegments: { id: string; text: string }[] = [];
  placedVerseSegments: { id: string; text: string }[] = [];
  private suppressVerseTileClickUntil = 0;
  timer: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: QuickMatchService
  ) {}
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (id) {
      try {
        const cached = JSON.parse(sessionStorage.getItem(`quick-match-question:${id}`) || 'null');
        if (cached?.question) {
          this.cachedCategory = cached.category;
          this.question = { ...cached.question, category: cached.category, correctAnswer: '', reference: '', explanation: '' } as Question;
          this.initializeQuestionControls();
        }
      } catch { sessionStorage.removeItem(`quick-match-question:${id}`); }
    }
    const userId = firebaseAuth.currentUser?.uid;
    this.match = id ? (await this.service.observeMatch(id)) ?? undefined : undefined;
    if (!this.match?.selectedCategory || !this.match.currentQuestion || this.match.currentTurnPlayerId !== userId) {
      this.router.navigate(['/multiplayer/board', id]);
      return;
    }
    this.question = {
      ...this.match.currentQuestion,
      category: this.match.selectedCategory as MatchCategory,
      correctAnswer: '',
      reference: '',
      explanation: '',
    } as Question;
    this.cachedCategory = this.match.selectedCategory as MatchCategory;
    this.cachedCorrectAnswer = sessionStorage.getItem(`quick-match-answer:${this.match.id}:${this.question.id}`) || '';
    this.initializeQuestionControls();
    sessionStorage.removeItem(`quick-match-question:${this.match.id}`);
    this.timer = setInterval(() => {
      if (--this.time <= 0) {
        clearInterval(this.timer);
        this.handleTimeout();
      }
    }, 1000);
  }
  private initializeQuestionControls() {
    if (!this.question) return;
    if (this.isSequence) this.sequenceItems = [...this.question.choices];
    if (this.isArrangeVerse)
      this.availableVerseSegments = [...(this.question.verseSegments || [])];
  }
  ngOnDestroy() {
    clearInterval(this.timer);
    document.body.style.overflow = this.previousBodyOverflow;
  }
  get icon() {
    const category = this.match?.selectedCategory || this.cachedCategory;
    return category
      ? CATEGORY_ICONS[category]
      : '';
  }
  get label() {
    const category = this.match?.selectedCategory || this.cachedCategory;
    return category
      ? CATEGORY_LABELS[category]
      : '';
  }
  get phase() {
    return this.match?.phase === 'question'
      ? this.question?.difficulty
      : 'LIGHT CHALLENGE';
  }
  get typeLabel() {
    return this.question?.questionType.replaceAll('_', ' ');
  }
  get isTrueFalse() {
    return this.question?.questionType === 'true_false';
  }
  get isPictionary() {
    return this.question?.questionType === 'pictionary';
  }
  get isSequence() {
    return this.question?.questionType === 'sequence';
  }
  get isMatchPairs() {
    return this.question?.questionType === 'match_pairs';
  }
  get isArrangeVerse() {
    return this.question?.questionType === 'arrange_verse';
  }
  placeVerseSegment(segment: { id: string; text: string }) {
    if (this.answered || this.submitting) return;
    this.availableVerseSegments = this.availableVerseSegments.filter(
      (item) => item.id !== segment.id
    );
    this.placedVerseSegments = [...this.placedVerseSegments, segment];
    this.lightHaptic();
  }
  returnVerseSegment(segment: { id: string; text: string }) {
    if (this.answered || this.submitting) return;
    if (Date.now() < this.suppressVerseTileClickUntil) return;
    this.placedVerseSegments = this.placedVerseSegments.filter(
      (item) => item.id !== segment.id
    );
    this.availableVerseSegments = [...this.availableVerseSegments, segment];
  }
  dropVerseSegment(event: CdkDragDrop<{ id: string; text: string }[]>) {
    if (this.answered || this.submitting) return;
    moveItemInArray(
      this.placedVerseSegments,
      event.previousIndex,
      event.currentIndex
    );
  }
  verseDragStarted() {
    this.suppressVerseTileClickUntil = Number.MAX_SAFE_INTEGER;
    this.lightHaptic();
  }
  verseDragEnded() {
    this.suppressVerseTileClickUntil = Date.now() + 300;
  }
  submitVerse() {
    if (this.availableVerseSegments.length || !this.placedVerseSegments.length)
      return;
    void this.answer(
      JSON.stringify(this.placedVerseSegments.map((segment) => segment.id))
    );
  }
  get allPairsConnected() {
    return !!this.question?.matchPairs &&
      Object.keys(this.pairMatches).length === this.question.matchPairs.left.length;
  }
  choosePairLeft(item: string) {
    if (this.pairMatches[item]) {
      delete this.pairMatches[item];
      this.selectedPairLeft = '';
      return;
    }
    this.selectedPairLeft = this.selectedPairLeft === item ? '' : item;
    this.connectSelectedPair();
  }
  choosePairRight(item: string) {
    const connectedLeft = Object.keys(this.pairMatches).find(
      (left) => this.pairMatches[left] === item
    );
    if (connectedLeft) {
      delete this.pairMatches[connectedLeft];
      this.selectedPairRight = '';
      return;
    }
    this.selectedPairRight = this.selectedPairRight === item ? '' : item;
    this.connectSelectedPair();
  }
  private connectSelectedPair() {
    if (!this.selectedPairLeft || !this.selectedPairRight) return;
    this.pairMatches = {
      ...this.pairMatches,
      [this.selectedPairLeft]: this.selectedPairRight,
    };
    this.selectedPairLeft = '';
    this.selectedPairRight = '';
    this.lightHaptic();
  }
  isRightConnected(item: string) {
    return Object.values(this.pairMatches).includes(item);
  }
  pairColorForLeft(item: string) {
    const index = Object.keys(this.pairMatches).indexOf(item);
    return index < 0 ? '#58746c' : this.pairColors[index % this.pairColors.length];
  }
  pairColorForRight(item: string) {
    const left = Object.keys(this.pairMatches).find(
      (key) => this.pairMatches[key] === item
    );
    return left ? this.pairColorForLeft(left) : '#58746c';
  }
  submitPairs() {
    if (!this.allPairsConnected) return;
    const answer = Object.entries(this.pairMatches)
      .map(([left, right]) => ({ left: left.trim(), right: right.trim() }))
      .sort((left, right) => left.left.localeCompare(right.left));
    void this.answer(JSON.stringify(answer));
  }
  dropSequence(event: CdkDragDrop<string[]>) {
    if (this.answered || this.submitting) return;
    moveItemInArray(this.sequenceItems, event.previousIndex, event.currentIndex);
  }
  sequenceDragStarted() {
    this.lightHaptic();
  }
  submitSequence() {
    if (!this.sequenceItems.length) return;
    void this.answer(JSON.stringify(this.sequenceItems.map((item) => item.trim())));
  }
  private lightHaptic() {
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
      navigator.vibrate?.(18);
    });
  }
  async answer(a: string) {
    if (this.submitting || this.answered || !this.match || !this.question) return;
    const match = this.match;
    const question = this.question;
    clearInterval(this.timer);
    this.selected = a;
    this.submitting = true;
    // An answered question must never be revived from local cache if the
    // connection drops while its result is being committed.
    sessionStorage.removeItem(`quick-match-question:${match.id}`);
    if (this.cachedCorrectAnswer) {
      this.question.correctAnswer = this.cachedCorrectAnswer;
      this.correct = a.trim().toLowerCase() === this.cachedCorrectAnswer.trim().toLowerCase();
      this.answered = true;
    }
    this.turnSave = (async () => {
    try {
      const result = await this.service.submitAnswer(match.id, a);
      this.correct = result.correct;
      this.waitingForOpponent = result.waitingForOpponent;
      question.correctAnswer = result.correctAnswer;
      question.explanation = result.explanation;
      question.reference = result.reference;
      this.answered = true;
      sessionStorage.removeItem(`quick-match-answer:${match.id}:${question.id}`);
    } catch {
      this.selected = '';
      void this.router.navigate(['/multiplayer/board', match.id]);
    } finally {
      this.submitting = false;
    }
    })();
    await this.turnSave;
  }
  handleTimeout() {
    if (this.submitting || this.answered) return;
    this.timedOut = true;
    this.showTimeoutAlert = true;
    void this.answer('__timeout__');
    setTimeout(() => this.showTimeoutAlert = false, 1400);
  }
  done() {
    if (!this.match || this.returningToBoard) return;
    this.returningToBoard = true;

    if (this.correct) {
      const optimisticMatch = {
        ...this.match,
        phase: 'spin',
        selectedCategory: null,
        currentQuestion: null,
      };
      void this.router.navigate(['/multiplayer/board', this.match.id], {
        state: { optimisticMatch },
      });
      return;
    }

    // An incorrect answer passes the turn, so leave immediately while any
    // remaining server work finishes through the root service.
    void this.router.navigate(['/multiplayer-battle']);
  }
}
