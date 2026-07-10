import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoryProgressComponent } from '../components/category-progress.component';
import { Match } from '../multiplayer.models';
import { MultiplayerService } from '../multiplayer.service';

@Component({
  selector: 'app-match-result-page',
  standalone: true,
  imports: [CommonModule, RouterLink, CategoryProgressComponent],
  template: `
    <main
      class="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#f8fafc_60%)] px-4 py-6 text-slate-800"
    >
      <div class="mx-auto flex max-w-3xl flex-col gap-4">
        <section
          class="rounded-[32px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur"
        >
          <p
            class="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600"
          >
            Match complete
          </p>
          <h1 class="mt-2 text-3xl font-semibold">
            {{ match?.winnerId ? 'Victory!' : 'Match summary' }}
          </h1>
          <p class="mt-2 text-sm text-slate-600">
            The result screen is ready for future achievements, seasons, and
            richer celebration moments.
          </p>

          <div *ngIf="match" class="mt-5 space-y-4">
            <div class="rounded-3xl bg-slate-50 p-4">
              <p class="text-sm text-slate-500">Winner</p>
              <p class="text-xl font-semibold text-slate-900">
                {{ match.winnerId ?? 'In progress' }}
              </p>
            </div>

            <app-category-progress
              [progress]="getPlayerProgress()"
              label="Player 1"
            ></app-category-progress>

            <div
              class="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm"
            >
              <p class="text-sm font-semibold text-slate-800">
                Last turn summary
              </p>
              <p class="mt-2 text-sm text-slate-600">
                {{ match.lastTurnSummary ?? 'No turns yet.' }}
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <button
                class="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                (click)="rematch()"
              >
                Request rematch
              </button>
              <button
                class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                [routerLink]="['/multiplayer']"
              >
                Back to home
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  `,
})
export class MatchResultPage implements OnInit {
  match: Match | undefined;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly multiplayerService: MultiplayerService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/multiplayer']);
      return;
    }

    this.match = this.multiplayerService.getMatchById(id);
  }

  rematch(): void {
    if (!this.match) {
      return;
    }

    this.match = this.multiplayerService.requestRematch(
      this.match.id,
      'player-1',
    );
  }

  getPlayerProgress(): Record<string, { current: number; target: number; completed: boolean }> {
    return this.match?.categoryProgress['player-1'] ?? {};
  }
}
