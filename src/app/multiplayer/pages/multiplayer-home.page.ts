import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MultiplayerService } from '../multiplayer.service';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../auth/user.service';
import { AppUser } from '../../auth/auth.models';
import { BibleTransitionService } from '../../navigation/bible-transition.service';
import {
  MenuCardComponent,
  MenuCardConfig,
} from '../../components/menu-card.component';

@Component({
  selector: 'app-multiplayer-home-page',
  standalone: true,
  imports: [CommonModule, MenuCardComponent],
  template: `
    <main class="route-page relative min-h-screen overflow-hidden text-white" [style.backgroundImage]="'url(home-page.png)'" [style.backgroundSize]="'cover'" [style.backgroundPosition]="'center'" [style.backgroundAttachment]="'fixed'">
      <!-- Menu Cards Section - Right Side 45% Width -->
      <div
        class="home-menu-shell ml-auto flex w-[64%] flex-col justify-center pl-4 pr-4 py-12 pb-36 relative z-10 min-h-screen"
        [class.is-transitioning]="isBibleTransitionPlaying"
      >
        <!-- Menu Cards Stack - Fixed Width -->
        <div class="ml-auto flex w-[50vw] max-w-full flex-col gap-2 translate-y-[72px]">
          <app-menu-card
            *ngFor="let card of menuCards"
            [config]="card"
          ></app-menu-card>
        </div>
      </div>

      <div
        class="bible-transition fixed inset-0 z-50 bg-black"
        [class.is-visible]="isBibleTransitionPlaying"
        aria-hidden="true"
      >
        <video
          #bibleTransitionVideo
          class="h-full w-full object-cover"
          src="bible-page-transition-vid.mp4"
          playsinline
          preload="auto"
          (loadeddata)="startPendingBibleTransition()"
          (loadedmetadata)="syncTransitionFallback($event)"
          (ended)="finishBibleTransition()"
          (error)="finishBibleTransition()"
        ></video>
      </div>
    </main>

  `,
  styles: [
    `
      :host {
        display: block;
        background: #0f0f0f;
      }

      .bible-transition {
        pointer-events: none;
        visibility: hidden;
      }

      .bible-transition.is-visible {
        visibility: visible;
      }

      .home-menu-shell {
        transition:
          opacity 460ms ease,
          transform 520ms ease,
          filter 520ms ease;
        will-change: opacity, transform, filter;
      }

      .home-menu-shell.is-transitioning {
        opacity: 0;
        pointer-events: none;
        transform: translate3d(0, 18px, 0) scale(0.985);
        filter: blur(2px);
        z-index: 60;
      }
    `,
  ],
})
export class MultiplayerHomePage implements OnDestroy, OnInit {
  @ViewChild('bibleTransitionVideo') bibleTransitionVideo?: ElementRef<HTMLVideoElement>;

  currentUser: AppUser | null = null;
  isBibleTransitionPlaying = false;
  private shouldStartBibleTransition = false;
  private transitionFallbackTimer: ReturnType<typeof setTimeout> | null = null;

  menuCards: MenuCardConfig[] = [
    {
      title: 'Bible Ready',
      description: 'Read, study, and grow in the Word of God.',
      icon: '📖',
      color: 'green',
      onClick: () => this.playBibleTransition(),
    },
    {
      title: 'Multiplayer Bible Game',
      description: 'Play friends or other players in an epic Bible game.',
      icon: '⚔️',
      color: 'blue-dark',
      onClick: () => this.navigateTo('/multiplayer-battle'),
    },
    {
      title: 'Daily Quest',
      description: 'Complete daily challenges and earn rewards.',
      icon: '🛡️',
      color: 'purple',
      onClick: () => this.navigateTo('/daily-quest'),
    },
    {
      title: 'Journey Mode',
      description: 'Explore the Bible from Genesis to Revelation.',
      icon: '📜',
      color: 'brown',
      onClick: () => this.navigateTo('/journey-mode'),
    },
    {
      title: 'Quiz Mode',
      description: 'Test your knowledge and level up!',
      icon: '🎯',
      color: 'teal',
      onClick: () => this.navigateTo('/quiz-mode'),
    },
    {
      title: 'Achievements',
      description: 'Unlock badges, earn XP, and grow your legacy.',
      icon: '📦',
      color: 'blue-dark',
      onClick: () => this.navigateTo('/achievements'),
    },
  ];

  constructor(
    private readonly multiplayerService: MultiplayerService,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly bibleTransitionService: BibleTransitionService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  startRandomMatch(): void {
    const playerId = this.currentUser?.uid ?? 'player-1';
    const match = this.multiplayerService.createRandomMatch(playerId);
    this.router.navigate(['/multiplayer/lobby', match.id]);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  playBibleTransition(): void {
    if (this.bibleTransitionService.hasPlayed) {
      this.router.navigate(['/bible-ready']);
      return;
    }

    if (this.isBibleTransitionPlaying) {
      return;
    }

    const video = this.bibleTransitionVideo?.nativeElement;
    if (!video) {
      this.finishBibleTransition();
      return;
    }

    this.shouldStartBibleTransition = true;
    this.bibleTransitionService.markPlayed();
    video.pause();
    video.currentTime = 0;

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.startPendingBibleTransition();
    } else {
      video.load();
    }
  }

  startPendingBibleTransition(): void {
    if (!this.shouldStartBibleTransition) {
      return;
    }

    const video = this.bibleTransitionVideo?.nativeElement;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    this.shouldStartBibleTransition = false;
    this.isBibleTransitionPlaying = true;
    this.setTransitionFallback(45000);

    requestAnimationFrame(() => {
      video.play().catch(() => this.finishBibleTransition());
    });
  }

  syncTransitionFallback(event: Event): void {
    const video = event.target as HTMLVideoElement;
    if (Number.isFinite(video.duration) && video.duration > 0) {
      this.setTransitionFallback(video.duration * 1000 + 1500);
    }
  }

  finishBibleTransition(): void {
    if (!this.isBibleTransitionPlaying) {
      return;
    }

    this.isBibleTransitionPlaying = false;
    this.shouldStartBibleTransition = false;
    this.clearTransitionFallbackTimer();
    this.router.navigate(['/bible-ready']);
  }

  ngOnDestroy(): void {
    this.clearTransitionFallbackTimer();
  }

  private setTransitionFallback(delay: number): void {
    this.clearTransitionFallbackTimer();
    this.transitionFallbackTimer = setTimeout(() => this.finishBibleTransition(), delay);
  }

  private clearTransitionFallbackTimer(): void {
    if (this.transitionFallbackTimer) {
      clearTimeout(this.transitionFallbackTimer);
      this.transitionFallbackTimer = null;
    }
  }
}
