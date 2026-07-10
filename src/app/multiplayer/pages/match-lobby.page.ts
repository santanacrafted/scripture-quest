import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Match } from '../multiplayer.models';
import { MultiplayerService } from '../multiplayer.service';

@Component({
  selector: 'app-match-lobby-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
            Match lobby
          </p>
          <h1 class="mt-2 text-3xl font-semibold">
            {{
              match?.status === 'waiting_for_opponent'
                ? 'Waiting for a challenger'
                : 'Match ready'
            }}
          </h1>
          <p class="mt-2 text-sm text-slate-600">
            This MVP uses a simple invite code and turn flow so future real-time
            features can be added later.
          </p>

          <div *ngIf="match" class="mt-5 rounded-3xl bg-slate-50 p-4">
            <p class="text-sm text-slate-500">Invite code</p>
            <p
              class="mt-1 text-3xl font-semibold tracking-[0.2em] text-slate-900"
            >
              {{ match.inviteCode ?? 'N/A' }}
            </p>
            <div class="mt-4 flex flex-wrap gap-3">
              <button
                class="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                (click)="startMatch()"
              >
                {{
                  match.status === 'waiting_for_opponent'
                    ? 'Start match'
                    : 'Continue match'
                }}
              </button>
              <button
                class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                [routerLink]="['/multiplayer']"
              >
                Back home
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  `,
})
export class MatchLobbyPage implements OnInit {
  match: Match | undefined;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly multiplayerService: MultiplayerService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/multiplayer']);
      return;
    }

    this.match = this.multiplayerService.getMatchById(id);
  }

  startMatch(): void {
    if (!this.match) {
      return;
    }

    this.router.navigate(['/multiplayer/play', this.match.id]);
  }
}
