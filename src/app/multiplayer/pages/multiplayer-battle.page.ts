import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppUser } from '../../auth/auth.models';
import { AuthService } from '../../auth/auth.service';
import {
  MenuCardComponent,
  MenuCardConfig,
} from '../../components/menu-card.component';
import { ActiveMatchesListComponent } from '../components/active-matches-list.component';
import { MultiplayerService } from '../multiplayer.service';

@Component({
  selector: 'app-multiplayer-battle-page',
  standalone: true,
  imports: [CommonModule, MenuCardComponent, ActiveMatchesListComponent],
  template: `
    <main
      class="route-page relative min-h-screen overflow-hidden bg-quest-dark text-white"
      [style.backgroundImage]="'url(multiplayer-page.png)'"
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

      <div class="flex min-h-screen w-full flex-col justify-center px-4 py-12 pb-36 relative z-10">
        <div class="battle-panel mx-auto flex w-full max-w-[560px] translate-y-[30px] flex-col gap-2">
          <app-menu-card
            *ngFor="let card of battleCards"
            [config]="card"
          ></app-menu-card>
          <app-active-matches-list></app-active-matches-list>
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

      .battle-panel {
        max-height: calc(100svh - 8rem);
        overflow: auto;
        padding: 0.2rem;
      }
    `,
  ],
})
export class MultiplayerBattlePage implements OnInit {
  currentUser: AppUser | null = null;

  battleCards: MenuCardConfig[] = [
    {
      title: 'Quick Match',
      description: 'Find a random opponent and start battling.',
      icon: '⚔️',
      color: 'green',
      onClick: () => this.startQuickMatch(),
    },
    {
      title: 'Friend Battle',
      description: 'Challenge a friend to a Bible battle.',
      icon: '👥',
      color: 'blue-dark',
      onClick: () => this.navigateTo('/friends'),
    },
    {
      title: 'Battle History',
      description: 'Review your past battles and stats.',
      icon: '📜',
      color: 'teal',
      onClick: () => this.navigateTo('/matches'),
    },
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly multiplayerService: MultiplayerService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  startQuickMatch(): void {
    const match = this.multiplayerService.createRandomMatch(
      this.currentUser?.uid ?? 'player-1',
      this.currentUser?.displayName ?? 'You',
    );
    this.router.navigate(['/multiplayer/board', match.id]);
  }

  goHome(): void {
    this.router.navigate(['/multiplayer']);
  }
}
