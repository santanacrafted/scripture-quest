import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoryProgressComponent } from '../components/category-progress.component';
import { firebaseAuth } from '../../firebase';
import { FirestoreQuickMatch } from '../quick-match.models';
import { QuickMatchService } from '../quick-match.service';

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
            {{ match?.winnerId === myId ? 'Victory!' : 'Match complete' }}
          </h1>
          <p class="mt-2 text-sm text-slate-600">
            {{ match?.completionReason === 'forfeit' ? (match?.winnerId === myId ? 'Your opponent forfeited. Victory awarded.' : 'You forfeited this match.') : 'The battle has ended.' }}
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
  match: FirestoreQuickMatch | undefined;
  myId = firebaseAuth.currentUser?.uid || '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly quickMatchService: QuickMatchService,
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/multiplayer']);
      return;
    }

    this.match = (await this.quickMatchService.observeMatch(id)) ?? undefined;
  }

  rematch(): void {
    if (!this.match) {
      return;
    }

    void this.router.navigate(['/multiplayer/quick-match'], { state: { startNewMatch: true } });
  }

  getPlayerProgress(): Record<string, { current: number; target: number; completed: boolean }> {
    if (!this.match) return {};
    return Object.fromEntries((this.match.players[this.myId]?.lights || []).map(light => [light, {current:1,target:1,completed:true}]));
  }
}
