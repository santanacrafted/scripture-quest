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
          [class.correct]="answered && a === question.correctAnswer"
          [class.wrong]="answered && selected === a && a !== question.correctAnswer"
          (click)="answer(a)"
        >
          <i>{{ letters[i] }}</i
          >{{ a }}
        </button>
      </div>
      <article *ngIf="answered">
        <strong>{{ correct ? 'A LIGHT SPARK!' : 'KEEP SEEKING' }}</strong>
        <p>{{ question.explanation }}</p>
        <small>{{ question.reference }}</small
        ><button class="continue" (click)="done()">Return to board</button>
      </article>
    </section>
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
    this.timer = setInterval(() => {
      if (--this.time <= 0) {
        clearInterval(this.timer);
        this.answer('__timeout__');
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
  async answer(a: string) {
    if (this.submitting || this.answered || !this.match || !this.question) return;
    clearInterval(this.timer);
    this.selected = a;
    this.submitting = true;
    try {
      const result = await this.service.submitAnswer(this.match.id, a);
      this.correct = result.correct;
      this.waitingForOpponent = result.waitingForOpponent;
      this.question.correctAnswer = result.correctAnswer;
      this.question.explanation = result.explanation;
      this.question.reference = result.reference;
      this.answered = true;
    } catch {
      this.selected = '';
      void this.router.navigate(['/multiplayer/board', this.match.id]);
    } finally {
      this.submitting = false;
    }
  }
  done() {
    if (!this.match) return;
    if (this.waitingForOpponent) {
      this.router.navigate(['/multiplayer-battle']);
      return;
    }
    this.router.navigate([
      '/multiplayer/board',
      this.match.id,
    ]);
  }
}
