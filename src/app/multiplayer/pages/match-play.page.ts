import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryProgressComponent } from '../components/category-progress.component';
import { QuestionCardComponent } from '../components/question-card.component';
import {
  Match,
  Question,
  MatchCategory,
  MatchCategoryProgressMap,
} from '../multiplayer.models';
import { MultiplayerService } from '../multiplayer.service';
import { QuestionService } from '../question.service';
import { FirestoreQuickMatch } from '../quick-match.models';
import { QuickMatchService } from '../quick-match.service';

@Component({
  selector: 'app-match-play-page',
  standalone: true,
  imports: [CommonModule, QuestionCardComponent, CategoryProgressComponent],
  template: `
    <main
      class="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#f8fafc_60%)] px-4 py-6 text-slate-800"
    >
      <div class="mx-auto flex max-w-5xl flex-col gap-4">
        <section
          class="rounded-[32px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur"
        >
          <div class="flex items-center justify-between">
            <div>
              <p
                class="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600"
              >
                Turn battle
              </p>
              <h1 class="mt-2 text-2xl font-semibold">Your turn to shine</h1>
            </div>
            <div
              class="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700"
            >
              Timer: 20s
            </div>
          </div>

          <div
            *ngIf="quickMatch && !match"
            class="mt-5 rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm"
          >
            <h2 class="text-2xl font-semibold text-slate-900">
              Quick Match is ready
            </h2>
            <p class="mt-2 text-sm text-slate-600">
              The server created this match for
              {{ quickMatch.playerIds.length }} players. The next step is wiring
              the Firestore-backed turn engine.
            </p>
            <div class="mt-4 grid gap-2">
              <p
                *ngFor="let playerId of quickMatch.playerIds"
                class="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800"
              >
                {{ quickMatch.players[playerId].displayName }}
              </p>
            </div>
            <button
              class="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              (click)="goToLobby()"
            >
              Back to lobby
            </button>
          </div>

          <div *ngIf="match" class="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div class="space-y-4">
              <app-question-card
                *ngIf="!lastAnswerResult"
                [question]="question"
                (answerSelected)="submitAnswer($event)"
              ></app-question-card>

              <div
                *ngIf="lastAnswerResult"
                class="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm"
              >
                <div class="mb-3 flex items-center justify-between">
                  <span
                    class="rounded-full px-3 py-1 text-sm font-semibold"
                    [class.bg-emerald-100]="lastAnswerResult.isCorrect"
                    [class.bg-rose-100]="!lastAnswerResult.isCorrect"
                    [class.text-emerald-700]="lastAnswerResult.isCorrect"
                    [class.text-rose-700]="!lastAnswerResult.isCorrect"
                  >
                    {{ lastAnswerResult.isCorrect ? 'Correct!' : 'Nice try' }}
                  </span>
                  <span class="text-sm text-slate-500">{{
                    lastAnswerResult.category
                  }}</span>
                </div>
                <h2 class="text-xl font-semibold text-slate-900">
                  {{ lastAnswerResult.correctAnswer }}
                </h2>
                <p class="mt-2 text-sm text-slate-600">
                  {{ lastAnswerResult.explanation }}
                </p>
                <p class="mt-2 text-sm font-medium text-cyan-700">
                  Reference: {{ lastAnswerResult.reference }}
                </p>
                <button
                  class="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  (click)="continueToResult()"
                >
                  Continue
                </button>
              </div>
            </div>

            <div class="space-y-4">
              <app-category-progress
                [progress]="getPlayerProgress()"
                label="Player 1"
              ></app-category-progress>
              <div
                class="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm"
              >
                <p class="text-sm font-semibold text-slate-800">Turn status</p>
                <p class="mt-2 text-sm text-slate-600">
                  {{
                    match.currentPlayerId === 'player-1'
                      ? 'It is your turn.'
                      : 'Waiting for the opponent.'
                  }}
                </p>
                <button
                  class="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  (click)="forfeit()"
                >
                  Forfeit match
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  `,
})
export class MatchPlayPage implements OnInit {
  match: Match | undefined;
  quickMatch: FirestoreQuickMatch | null = null;
  question: Question | null = null;
  lastAnswerResult: {
    isCorrect: boolean;
    category: string;
    correctAnswer: string;
    explanation: string;
    reference: string;
  } | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly multiplayerService: MultiplayerService,
    private readonly questionService: QuestionService,
    private readonly quickMatchService: QuickMatchService
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/multiplayer']);
      return;
    }

    this.match = this.multiplayerService.getMatchById(id);
    if (!this.match) {
      this.quickMatch = await this.quickMatchService.observeMatch(id);
      return;
    }

    this.loadQuestion();
  }

  submitAnswer(answer: string): void {
    if (!this.match || !this.question) {
      return;
    }

    const result = this.multiplayerService.submitAnswer(
      this.match.id,
      'player-1',
      this.question.id,
      answer
    );
    this.match = result.match;
    this.lastAnswerResult = {
      isCorrect: result.turn.isCorrect,
      category: result.turn.category,
      correctAnswer: this.question.correctAnswer,
      explanation: this.question.explanation,
      reference: this.question.reference,
    };
  }

  continueToResult(): void {
    if (!this.match) {
      return;
    }

    this.router.navigate(['/multiplayer/result', this.match.id]);
  }

  forfeit(): void {
    if (!this.match) {
      return;
    }

    this.match = this.multiplayerService.forfeitMatch(
      this.match.id,
      'player-1'
    );
    this.router.navigate(['/multiplayer/result', this.match.id]);
  }

  goToLobby(): void {
    this.router.navigate(['/multiplayer/lobby', this.quickMatch?.id]);
  }

  private loadQuestion(): void {
    if (!this.match) {
      return;
    }

    const category = this.pickCategory();
    this.question = this.questionService.getRandomQuestionByCategory(category);
  }

  getPlayerProgress(): MatchCategoryProgressMap {
    return this.match?.categoryProgress['player-1'] ?? {};
  }

  private pickCategory(): MatchCategory {
    const categories = [
      'old_testament',
      'new_testament',
      'jesus_and_gospels',
      'bible_characters',
      'prophets_and_kings',
      'memory_verses',
    ] as const;
    return categories[Math.floor(Math.random() * categories.length)];
  }
}
