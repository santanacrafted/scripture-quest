import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Match } from '../multiplayer.models';
import { MultiplayerService } from '../multiplayer.service';

@Component({
  selector: 'app-active-matches-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section
      class="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur"
    >
      <div class="mb-3 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-800">Active matches</p>
          <p class="text-sm text-slate-500">
            Continue a battle or join a waiting room.
          </p>
        </div>
      </div>

      <div
        *ngIf="matches.length === 0; else matchList"
        class="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500"
      >
        No matches yet. Start a new one to begin the journey.
      </div>

      <ng-template #matchList>
        <div class="space-y-3">
          <article
            *ngFor="let match of matches"
            class="rounded-2xl border border-slate-200 bg-slate-50 p-3"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-semibold text-slate-800">
                  Match {{ match.id.slice(-4) }}
                </p>
                <p class="text-xs text-slate-500">Status: {{ match.status }}</p>
              </div>
              <span
                class="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
              >
                {{
                  match.status === 'waiting_for_opponent' ? 'Waiting' : 'Live'
                }}
              </span>
            </div>
            <div class="mt-3 flex items-center justify-between">
              <p class="text-xs text-slate-500">
                Players: {{ match.playerIds.length }}/2
              </p>
              <button
                class="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white"
                [routerLink]="
                  match.status === 'completed'
                    ? ['/multiplayer/result', match.id]
                    : ['/multiplayer/lobby', match.id]
                "
              >
                {{ match.status === 'completed' ? 'View result' : 'Open' }}
              </button>
            </div>
          </article>
        </div>
      </ng-template>
    </section>
  `,
})
export class ActiveMatchesListComponent implements OnInit {
  matches: Match[] = [];

  constructor(
    private readonly multiplayerService: MultiplayerService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.matches = this.multiplayerService.getActiveMatches();
  }
}
