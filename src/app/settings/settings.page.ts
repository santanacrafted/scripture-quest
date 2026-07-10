import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { BackgroundMusicService } from '../audio/background-music.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main
      class="route-page relative min-h-screen overflow-hidden bg-quest-dark px-5 pb-32 pt-[calc(env(safe-area-inset-top)+4.25rem)] text-white"
      [style.backgroundImage]="'linear-gradient(rgba(8, 11, 9, 0.66), rgba(8, 11, 9, 0.82)), url(home-page.png)'"
      [style.backgroundSize]="'cover'"
      [style.backgroundPosition]="'center'"
    >
      <button
        class="quest-back-button absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-quest-dark/95 font-serif text-2xl font-bold text-quest-gold"
        type="button"
        (click)="goHome()"
      >
        ‹
      </button>

      <section class="mx-auto flex max-w-md flex-col gap-5">
        <header class="text-center">
          <p class="font-serif text-xs font-bold uppercase tracking-[0.24em] text-quest-gold">
            Scripture Quest
          </p>
          <h1 class="mt-2 font-serif text-4xl font-bold uppercase text-amber-50">
            Settings
          </h1>
        </header>

        <section class="quest-settings-panel rounded-quest-lg bg-quest-dark/95 p-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="font-serif text-xl font-bold uppercase text-amber-50">
                Music
              </h2>
              <p class="mt-1 text-xs text-amber-100/80">Background theme volume</p>
            </div>
            <label class="quest-toggle">
              <input
                type="checkbox"
                [checked]="musicStopped"
                (change)="setMusicStopped($any($event.target).checked)"
              />
              <span></span>
            </label>
          </div>

          <div class="mt-5">
            <div class="mb-2 flex items-center justify-between text-xs font-bold uppercase text-quest-gold">
              <span>Volume</span>
              <span>{{ musicVolume }}%</span>
            </div>
            <input
              class="quest-range"
              type="range"
              min="0"
              max="100"
              step="1"
              [value]="musicVolume"
              (input)="setMusicVolume($any($event.target).valueAsNumber)"
            />
          </div>
        </section>

        <section class="quest-settings-panel rounded-quest-lg bg-quest-dark/95 p-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="font-serif text-xl font-bold uppercase text-amber-50">
                Action Sounds
              </h2>
              <p class="mt-1 text-xs text-amber-100/80">Button taps and game effects</p>
            </div>
            <label class="quest-toggle">
              <input
                type="checkbox"
                [checked]="actionMuted"
                (change)="setActionMuted($any($event.target).checked)"
              />
              <span></span>
            </label>
          </div>

          <div class="mt-5">
            <div class="mb-2 flex items-center justify-between text-xs font-bold uppercase text-quest-gold">
              <span>Volume</span>
              <span>{{ actionVolume }}%</span>
            </div>
            <input
              class="quest-range"
              type="range"
              min="0"
              max="100"
              step="1"
              [value]="actionVolume"
              (input)="setActionVolume($any($event.target).valueAsNumber)"
            />
          </div>
        </section>

        <button
          class="quest-sign-out rounded-quest-lg bg-red-700 px-4 py-3 text-sm font-bold uppercase text-white"
          (click)="signOut()"
        >
          Sign Out
        </button>
      </section>
    </main>
  `,
  styles: [
    `
      .quest-settings-panel,
      .quest-sign-out,
      .quest-back-button {
        border: 1px solid #332415;
        box-shadow:
          inset 0 1px 0 rgba(255, 244, 196, 0.22),
          inset 0 0 0 1px rgba(245, 197, 93, 0.72),
          inset 0 0 0 3px rgba(20, 13, 7, 0.56),
          0 12px 22px rgba(0, 0, 0, 0.36);
      }

      .quest-toggle {
        position: relative;
        display: inline-flex;
        height: 32px;
        width: 58px;
        flex-shrink: 0;
      }

      .quest-toggle input {
        position: absolute;
        opacity: 0;
      }

      .quest-toggle span {
        position: absolute;
        inset: 0;
        border: 1px solid rgba(245, 197, 93, 0.72);
        border-radius: 999px;
        background: #2d5a3d;
        box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.38);
        transition: background 160ms ease;
      }

      .quest-toggle span::after {
        content: '';
        position: absolute;
        left: 4px;
        top: 4px;
        height: 22px;
        width: 22px;
        border-radius: 999px;
        background: #f5c55d;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.42);
        transition: transform 160ms ease;
      }

      .quest-toggle input:checked + span {
        background: #5a2d2d;
      }

      .quest-toggle input:checked + span::after {
        transform: translateX(26px);
      }

      .quest-range {
        width: 100%;
        accent-color: #d4af37;
      }
    `,
  ],
})
export class SettingsPage {
  private readonly actionMutedKey = 'scriptureQuest.actionMuted';
  private readonly actionVolumeKey = 'scriptureQuest.actionVolume';

  musicStopped = false;
  musicVolume = 50;
  actionMuted = localStorage.getItem(this.actionMutedKey) === 'true';
  actionVolume = this.getSavedActionVolume();

  constructor(
    private readonly backgroundMusic: BackgroundMusicService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {
    this.musicStopped = this.backgroundMusic.isMuted();
    this.musicVolume = this.backgroundMusic.getVolume();
  }

  setMusicStopped(stopped: boolean): void {
    this.musicStopped = stopped;
    this.backgroundMusic.setMuted(stopped);
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = volume;
    this.backgroundMusic.setVolume(volume);
  }

  setActionMuted(muted: boolean): void {
    this.actionMuted = muted;
    localStorage.setItem(this.actionMutedKey, String(muted));
  }

  setActionVolume(volume: number): void {
    this.actionVolume = volume;
    localStorage.setItem(this.actionVolumeKey, String(volume));
  }

  async signOut(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }

  goHome(): void {
    this.router.navigate(['/multiplayer']);
  }

  private getSavedActionVolume(): number {
    const saved = Number(localStorage.getItem(this.actionVolumeKey));
    return Number.isNaN(saved) ? 70 : Math.max(0, Math.min(100, saved));
  }
}
