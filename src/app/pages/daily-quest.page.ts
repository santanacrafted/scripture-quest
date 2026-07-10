import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface DailyQuestCard {
  title: string;
  description: string;
  icon: string;
  color: 'green' | 'purple' | 'brown';
  progress: number;
  total: number;
  reward: number;
  route: string;
}

@Component({
  selector: 'app-daily-quest-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main
      class="route-page relative min-h-screen overflow-hidden bg-quest-dark text-white"
      [style.backgroundImage]="'url(quest-page.png)'"
      [style.backgroundSize]="'cover'"
      [style.backgroundPosition]="'center'"
      [style.backgroundAttachment]="'fixed'"
    >
      <button
        class="quest-back-button absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-20 flex h-10 w-10 items-center justify-center rounded-full bg-quest-dark/95 font-serif text-2xl font-bold text-quest-gold"
        type="button"
        aria-label="Back to home"
        (click)="goHome()"
      >
        ‹
      </button>

      <div class="ml-auto flex min-h-screen w-[64%] flex-col justify-center py-12 pb-36 pl-4 pr-4 relative z-10">
        <div class="ml-auto flex w-[50vw] max-w-full translate-y-[94px] flex-col gap-3">
          <button
            *ngFor="let quest of dailyQuests"
            class="daily-quest-card group relative overflow-hidden rounded-quest-lg p-3 text-left"
            [class.quest-green]="quest.color === 'green'"
            [class.quest-purple]="quest.color === 'purple'"
            [class.quest-brown]="quest.color === 'brown'"
            type="button"
            (click)="navigateTo(quest.route)"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div class="quest-icon flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-3xl">
                {{ quest.icon }}
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-start gap-2">
                  <div class="min-w-0 flex-1">
                    <h2 class="font-serif text-sm font-bold uppercase leading-tight text-white">
                      {{ quest.title }}
                    </h2>
                    <p class="mt-1 text-[11px] leading-tight text-amber-50">
                      {{ quest.description }}
                    </p>
                  </div>
                  <span class="quest-arrow text-4xl leading-none text-quest-gold transition-transform duration-300 group-hover:translate-x-1">
                    ›
                  </span>
                </div>

                <div class="mt-3 flex items-center gap-2">
                  <div class="quest-progress h-2 flex-1 overflow-hidden rounded-full bg-black/45">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-amber-500 to-quest-gold"
                      [style.width.%]="progressPercent(quest)"
                    ></div>
                  </div>
                  <span class="w-8 text-right text-xs font-bold text-white">
                    {{ quest.progress }}/{{ quest.total }}
                  </span>
                  <span class="quest-reward flex items-center gap-1 text-sm font-bold text-amber-100">
                    <span class="coin">✦</span>{{ quest.reward }}
                  </span>
                </div>
              </div>
            </div>
          </button>
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

      .quest-back-button,
      .daily-quest-card {
        border: 1px solid #332415;
        box-shadow:
          inset 0 1px 0 rgba(255, 244, 196, 0.24),
          inset 0 0 0 1px rgba(245, 197, 93, 0.76),
          inset 0 0 0 3px rgba(20, 13, 7, 0.48),
          0 12px 20px rgba(0, 0, 0, 0.34),
          0 0 18px rgba(245, 197, 93, 0.16);
      }

      .daily-quest-card {
        touch-action: manipulation;
        transition:
          transform 180ms ease,
          box-shadow 180ms ease;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }

      .daily-quest-card:hover {
        transform: translate3d(0, -3px, 0);
        box-shadow:
          inset 0 1px 0 rgba(255, 244, 196, 0.3),
          inset 0 0 0 1px rgba(255, 210, 107, 0.9),
          inset 0 0 0 3px rgba(20, 13, 7, 0.44),
          0 18px 24px rgba(0, 0, 0, 0.4),
          0 0 24px rgba(245, 197, 93, 0.22);
      }

      .daily-quest-card:active {
        transform: translate3d(0, 5px, 0) scale(0.985);
      }

      .daily-quest-card::before {
        content: '';
        position: absolute;
        inset: 5px;
        border-radius: 10px;
        pointer-events: none;
        background:
          linear-gradient(#f1c663, #f1c663) left top / 18px 1px no-repeat,
          linear-gradient(#f1c663, #f1c663) left top / 1px 18px no-repeat,
          linear-gradient(#f1c663, #f1c663) right top / 18px 1px no-repeat,
          linear-gradient(#f1c663, #f1c663) right top / 1px 18px no-repeat,
          linear-gradient(#f1c663, #f1c663) left bottom / 18px 1px no-repeat,
          linear-gradient(#f1c663, #f1c663) left bottom / 1px 18px no-repeat,
          linear-gradient(#f1c663, #f1c663) right bottom / 18px 1px no-repeat,
          linear-gradient(#f1c663, #f1c663) right bottom / 1px 18px no-repeat;
        opacity: 0.72;
      }

      .quest-green {
        background: linear-gradient(180deg, #0f4f2d, #062416);
      }

      .quest-purple {
        background: linear-gradient(180deg, #34204d, #171025);
      }

      .quest-brown {
        background: linear-gradient(180deg, #4f3412, #211305);
      }

      .quest-icon {
        border: 1px solid rgba(245, 197, 93, 0.58);
        background: rgba(0, 0, 0, 0.26);
        box-shadow: inset 0 0 12px rgba(245, 197, 93, 0.18);
      }

      .quest-progress {
        border: 1px solid rgba(245, 197, 93, 0.28);
        box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.42);
      }

      .coin {
        display: grid;
        height: 1.25rem;
        width: 1.25rem;
        place-items: center;
        border-radius: 999px;
        background: linear-gradient(180deg, #ffd66b, #9c6517);
        color: #3a2106;
        font-size: 0.72rem;
      }
    `,
  ],
})
export class DailyQuestPage {
  readonly dailyQuests: DailyQuestCard[] = [
    {
      title: 'Read the Word',
      description: 'Read 2 chapters from the Bible.',
      icon: '📖',
      color: 'green',
      progress: 1,
      total: 2,
      reward: 50,
      route: '/bible-ready',
    },
    {
      title: 'Memorize Verse',
      description: "Memorize today's key verse.",
      icon: '🙏',
      color: 'purple',
      progress: 0,
      total: 1,
      reward: 50,
      route: '/quiz-mode',
    },
    {
      title: 'Share the Word',
      description: 'Share a verse or encouragement.',
      icon: '👥',
      color: 'brown',
      progress: 0,
      total: 1,
      reward: 35,
      route: '/friends',
    },
  ];

  constructor(private readonly router: Router) {}

  progressPercent(quest: DailyQuestCard): number {
    return Math.min(100, (quest.progress / quest.total) * 100);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  goHome(): void {
    this.router.navigate(['/multiplayer']);
  }
}
