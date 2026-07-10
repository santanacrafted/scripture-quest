import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  MenuCardComponent,
  MenuCardConfig,
} from '../components/menu-card.component';

type QuizSetupStep = 'mode' | 'scope' | 'difficulty' | 'ready';

interface QuizSelection {
  mode?: string;
  scope?: string;
  difficulty?: string;
}

@Component({
  selector: 'app-quiz-mode-page',
  standalone: true,
  imports: [CommonModule, MenuCardComponent],
  template: `
    <main
      class="route-page relative min-h-screen overflow-hidden bg-quest-dark text-white"
      [style.backgroundImage]="'url(quiz-page.png)'"
      [style.backgroundSize]="'cover'"
      [style.backgroundPosition]="'center'"
      [style.backgroundAttachment]="'fixed'"
    >
      <button
        class="quest-back-button absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-20 flex h-10 w-10 items-center justify-center rounded-full bg-quest-dark/95 font-serif text-2xl font-bold text-quest-gold"
        type="button"
        aria-label="Go back"
        (click)="goBack()"
      >
        ‹
      </button>

      <div class="ml-auto flex min-h-screen w-[64%] flex-col justify-center py-12 pb-36 pl-4 pr-4 relative z-10">
        <div class="ml-auto flex w-[50vw] max-w-full translate-y-[58px] flex-col gap-3">
          <div *ngIf="setupStep !== 'mode'" class="quiz-state rounded-quest-lg px-3 py-2">
            <p class="font-serif text-[10px] font-bold uppercase tracking-[0.18em] text-quest-gold">
              {{ setupTitle }}
            </p>
            <p class="mt-1 text-[10px] leading-tight text-amber-50/90">
              {{ setupSummary }}
            </p>
          </div>

          <app-menu-card
            *ngFor="let card of visibleCards; trackBy: trackCard"
            [config]="card"
          ></app-menu-card>
        </div>
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        background: #0f0f0f;
      }

      .quest-back-button {
        border: 1px solid #332415;
        box-shadow:
          inset 0 1px 0 rgba(255, 244, 196, 0.22),
          inset 0 0 0 1px rgba(245, 197, 93, 0.72),
          inset 0 0 0 3px rgba(20, 13, 7, 0.56),
          0 12px 22px rgba(0, 0, 0, 0.36);
      }

      .quiz-state {
        border: 1px solid #332415;
        background:
          linear-gradient(180deg, rgba(31, 22, 12, 0.94), rgba(12, 10, 8, 0.94)),
          rgba(15, 15, 15, 0.94);
        box-shadow:
          inset 0 1px 0 rgba(255, 244, 196, 0.22),
          inset 0 0 0 1px rgba(245, 197, 93, 0.58),
          inset 0 0 0 3px rgba(20, 13, 7, 0.48),
          0 12px 20px rgba(0, 0, 0, 0.34);
      }
    `,
  ],
})
export class QuizModePage {
  setupStep: QuizSetupStep = 'mode';
  selection: QuizSelection = {};

  constructor(private readonly router: Router) {}

  get visibleCards(): MenuCardConfig[] {
    if (this.setupStep === 'scope') {
      return this.scopeCards;
    }

    if (this.setupStep === 'difficulty') {
      return this.difficultyCards;
    }

    if (this.setupStep === 'ready') {
      return this.readyCards;
    }

    return this.modeCards;
  }

  get setupTitle(): string {
    if (this.setupStep === 'scope') {
      return this.selection.mode ?? 'Quiz Setup';
    }

    if (this.setupStep === 'difficulty') {
      return 'Choose Difficulty';
    }

    return 'Quiz Ready';
  }

  get setupSummary(): string {
    return [this.selection.mode, this.selection.scope, this.selection.difficulty]
      .filter(Boolean)
      .join(' • ');
  }

  get modeCards(): MenuCardConfig[] {
    return [
      {
        title: 'Topics Quiz',
        description: 'Choose a topic and challenge your knowledge.',
        icon: '🛡️',
        color: 'purple',
        onClick: () => this.selectMode('Topics Quiz'),
      },
      {
        title: 'Bible Quiz',
        description: 'Answer questions from across the Scriptures.',
        icon: '📖',
        color: 'green',
        onClick: () => this.selectMode('Bible Quiz'),
      },
      {
        title: 'Book Quiz',
        description: 'Test your knowledge of a specific book of the Bible.',
        icon: '📜',
        color: 'blue-dark',
        onClick: () => this.selectMode('Book Quiz'),
      },
    ];
  }

  get scopeCards(): MenuCardConfig[] {
    if (this.selection.mode === 'Topics Quiz') {
      return [
        this.scopeCard('Bible Characters', 'Heroes, prophets, kings, and disciples.', '👑', 'purple'),
        this.scopeCard('Miracles', 'Challenge your knowledge of signs and wonders.', '✨', 'green'),
        this.scopeCard('Memory Verses', 'Identify and complete key verses.', '📜', 'brown'),
      ];
    }

    if (this.selection.mode === 'Book Quiz') {
      return [
        this.scopeCard('Genesis', 'Creation, patriarchs, and covenant beginnings.', '🌄', 'brown'),
        this.scopeCard('Psalms', 'Songs, prayers, and worship wisdom.', '🎵', 'purple'),
        this.scopeCard('John', 'The Word, signs, and life in Christ.', '📖', 'blue-dark'),
      ];
    }

    return [
      this.scopeCard('Full Bible', 'Questions from Genesis through Revelation.', '📚', 'green'),
      this.scopeCard('Old Testament', 'Law, history, poetry, and prophets.', '🪨', 'brown'),
      this.scopeCard('New Testament', 'Gospels, church, letters, and Revelation.', '✝️', 'blue-dark'),
    ];
  }

  get difficultyCards(): MenuCardConfig[] {
    return [
      this.difficultyCard('Beginner', 'A lighter challenge with familiar passages.', '🟢', 'green'),
      this.difficultyCard('Disciple', 'Balanced questions for steady growth.', '🛡️', 'blue-dark'),
      this.difficultyCard('Scholar', 'Deeper details for a serious challenge.', '👑', 'purple'),
    ];
  }

  get readyCards(): MenuCardConfig[] {
    return [
      {
        title: 'Start Quiz',
        description: `${this.setupSummary || 'Your quiz'} is configured and ready.`,
        icon: '▶️',
        color: 'green',
        onClick: () => undefined,
      },
      {
        title: 'Change Difficulty',
        description: 'Pick a different challenge level.',
        icon: '🛡️',
        color: 'blue-dark',
        onClick: () => {
          this.setupStep = 'difficulty';
          delete this.selection.difficulty;
        },
      },
      {
        title: 'Choose Different Quiz',
        description: 'Return to quiz type selection.',
        icon: '📜',
        color: 'brown',
        onClick: () => this.resetSetup(),
      },
    ];
  }

  selectMode(mode: string): void {
    this.selection = { mode };
    this.setupStep = 'scope';
  }

  selectScope(scope: string): void {
    this.selection = { ...this.selection, scope };
    this.setupStep = 'difficulty';
  }

  selectDifficulty(difficulty: string): void {
    this.selection = { ...this.selection, difficulty };
    this.setupStep = 'ready';
  }

  goBack(): void {
    if (this.setupStep === 'ready') {
      this.setupStep = 'difficulty';
      delete this.selection.difficulty;
      return;
    }

    if (this.setupStep === 'difficulty') {
      this.setupStep = 'scope';
      delete this.selection.scope;
      return;
    }

    if (this.setupStep === 'scope') {
      this.resetSetup();
      return;
    }

    this.goHome();
  }

  resetSetup(): void {
    this.selection = {};
    this.setupStep = 'mode';
  }

  goHome(): void {
    this.router.navigate(['/multiplayer']);
  }

  trackCard(_: number, card: MenuCardConfig): string {
    return card.title;
  }

  private scopeCard(
    title: string,
    description: string,
    icon: string,
    color: MenuCardConfig['color'],
  ): MenuCardConfig {
    return {
      title,
      description,
      icon,
      color,
      onClick: () => this.selectScope(title),
    };
  }

  private difficultyCard(
    title: string,
    description: string,
    icon: string,
    color: MenuCardConfig['color'],
  ): MenuCardConfig {
    return {
      title,
      description,
      icon,
      color,
      onClick: () => this.selectDifficulty(title),
    };
  }
}
