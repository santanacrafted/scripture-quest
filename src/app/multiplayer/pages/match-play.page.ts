import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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
@Component({
  selector: 'app-match-play-page',
  standalone: true,
  imports: [CommonModule],
  template: `<main *ngIf="match && question">
    <header>
      <span>{{ icon }} {{ label }}</span
      ><b>{{ phase }}</b
      ><span>⏱ {{ time }}s</span>
    </header>
    <section>
      <p class="type">{{ typeLabel }}</p>
      <h1>{{ question.text }}</h1>
      <div class="answers">
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
        ><button class="continue" (click)="done()">Return to board</button>
      </article>
    </section>
    <div *ngIf="showTimeoutAlert" class="timeout-alert" role="alert">
      <div><b>⏳</b><strong>Time’s up!</strong><span>You lost your turn</span></div>
    </div>
  </main>`,
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
        min-height: 100svh;
        background: radial-gradient(circle at top, #275e52, #081311 60%);
        overflow-x: hidden;
        padding: calc(env(safe-area-inset-top) + 0.75rem) 1rem
          calc(env(safe-area-inset-bottom) + 1.25rem);
      }
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
  private turnSave?: Promise<void>;
  time = 20;
  letters = ['A', 'B', 'C', 'D'];
  timer: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: QuickMatchService
  ) {}
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
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
    this.cachedCorrectAnswer = sessionStorage.getItem(`quick-match-answer:${this.match.id}:${this.question.id}`) || '';
    this.timer = setInterval(() => {
      if (--this.time <= 0) {
        clearInterval(this.timer);
        this.handleTimeout();
      }
    }, 1000);
  }
  ngOnDestroy() {
    clearInterval(this.timer);
  }
  get icon() {
    return this.match?.selectedCategory
      ? CATEGORY_ICONS[this.match.selectedCategory]
      : '';
  }
  get label() {
    return this.match?.selectedCategory
      ? CATEGORY_LABELS[this.match.selectedCategory]
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
  async answer(a: string) {
    if (this.submitting || this.answered || !this.match || !this.question) return;
    const match = this.match;
    const question = this.question;
    clearInterval(this.timer);
    this.selected = a;
    this.submitting = true;
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
  async done() {
    if (!this.match) return;
    // Feedback is instant, but do not reopen the board until its Firestore
    // phase has advanced beyond the question that was just answered.
    await this.turnSave;
    if (this.waitingForOpponent) {
      await this.router.navigate(['/multiplayer-battle']);
      return;
    }
    await this.router.navigate([
      '/multiplayer/board',
      this.match.id,
    ]);
  }
}
