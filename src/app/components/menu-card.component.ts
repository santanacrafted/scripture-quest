import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MenuCardConfig {
  title: string;
  description: string;
  icon: string;
  color: 'green' | 'blue-dark' | 'purple' | 'teal' | 'brown';
  onClick: () => void;
}

@Component({
  selector: 'app-menu-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      [ngClass]="getColorClasses()"
      [class.is-pressed]="isPressed"
      class="quest-menu-card group relative flex w-full flex-col justify-center overflow-hidden rounded-quest-lg py-[10px] pl-[11px] pr-1.5 text-left transition-all duration-200"
      (pointerdown)="pressStart()"
      (pointerup)="pressEnd()"
      (pointercancel)="pressCancel()"
      (pointerleave)="pressCancel()"
      (touchend)="handleTouch($event)"
      (click)="handleClick()"
    >
      <div class="flex min-w-0 items-center gap-2">
        <div class="flex-shrink-0">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full border border-quest-card-border bg-black/20 text-2xl shadow-inner"
          >
            {{ config.icon }}
          </div>
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="font-serif text-xs font-bold uppercase text-white leading-tight">
            {{ config.title }}
          </h3>
          <p class="mt-1 line-clamp-3 text-[10px] font-normal text-amber-50 leading-tight">{{ config.description }}</p>
        </div>
        <div
          class="flex-shrink-0 self-center text-quest-gold transition-transform duration-300 group-hover:translate-x-1 text-4xl leading-none"
        >
          ›
        </div>
      </div>
      <div
        class="absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-10"
        [ngClass]="getBgClass()"
      ></div>
    </button>
  `,
  styles: [
    `
      .quest-menu-card {
        border: 1px solid #332415;
        transform: translate3d(0, 0, 0);
        touch-action: manipulation;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        box-shadow:
          inset 0 1px 0 rgba(255, 244, 196, 0.24),
          inset 0 0 0 1px rgba(245, 197, 93, 0.76),
          inset 0 0 0 3px rgba(20, 13, 7, 0.48),
          0 1px 0 rgba(27, 18, 8, 0.72),
          0 3px 0 rgba(48, 31, 16, 0.38),
          0 12px 20px rgba(0, 0, 0, 0.34),
          0 0 18px rgba(245, 197, 93, 0.16);
        animation: quest-card-float 4.8s ease-in-out infinite;
        will-change: transform, box-shadow;
      }

      .quest-menu-card:hover {
        transform: translate3d(0, -3px, 0);
        box-shadow:
          inset 0 1px 0 rgba(255, 244, 196, 0.3),
          inset 0 0 0 1px rgba(255, 210, 107, 0.9),
          inset 0 0 0 3px rgba(20, 13, 7, 0.44),
          0 1px 0 rgba(27, 18, 8, 0.72),
          0 4px 0 rgba(48, 31, 16, 0.34),
          0 18px 24px rgba(0, 0, 0, 0.4),
          0 0 24px rgba(245, 197, 93, 0.22);
      }

      .quest-menu-card:active {
        transform: translate3d(0, 5px, 0) scale(0.985);
      }

      .quest-menu-card.is-pressed {
        animation: none;
        transform: translate3d(0, 5px, 0) scale(0.985);
        box-shadow:
          inset 0 3px 8px rgba(0, 0, 0, 0.38),
          inset 0 0 0 1px rgba(245, 197, 93, 0.72),
          inset 0 0 0 3px rgba(20, 13, 7, 0.58),
          0 1px 0 rgba(27, 18, 8, 0.62),
          0 1px 0 rgba(48, 31, 16, 0.46),
          0 8px 14px rgba(0, 0, 0, 0.36);
        transition-duration: 80ms;
      }

      .quest-menu-card::before {
        content: '';
        position: absolute;
        inset: 4px;
        border: 1px solid rgba(255, 218, 128, 0.32);
        border-radius: 12px;
        pointer-events: none;
      }

      .quest-menu-card::after {
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

      @keyframes quest-card-float {
        0%,
        100% {
          transform: translate3d(0, 0, 0);
        }
        50% {
          transform: translate3d(0, -2px, 0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .quest-menu-card {
          animation: none;
        }
      }
    `,
  ],
})
export class MenuCardComponent implements OnDestroy {
  @Input() config!: MenuCardConfig;
  isPressed = false;
  private releaseTimer: ReturnType<typeof setTimeout> | null = null;

  getColorClasses(): string {
    const colorMap: Record<string, string> = {
      green: 'bg-quest-green',
      'blue-dark': 'bg-quest-blue-dark',
      purple: 'bg-quest-purple',
      teal: 'bg-quest-teal',
      brown: 'bg-quest-brown',
    };
    return colorMap[this.config.color] || colorMap['green'];
  }

  getBgClass(): string {
    const bgMap: Record<string, string> = {
      green: 'bg-quest-green',
      'blue-dark': 'bg-quest-blue-dark',
      purple: 'bg-quest-purple',
      teal: 'bg-quest-teal',
      brown: 'bg-quest-brown',
    };
    return bgMap[this.config.color] || bgMap['green'];
  }

  pressStart(): void {
    this.clearReleaseTimer();
    this.isPressed = true;
  }

  pressEnd(): void {
    this.releaseTimer = setTimeout(() => {
      this.isPressed = false;
    }, 120);
  }

  pressCancel(): void {
    this.clearReleaseTimer();
    this.isPressed = false;
  }

  handleClick(): void {
    this.config.onClick();
  }

  handleTouch(event: TouchEvent): void {
    event.preventDefault();
    this.isPressed = false;
    this.config.onClick();
  }

  ngOnDestroy(): void {
    this.clearReleaseTimer();
  }

  private clearReleaseTimer(): void {
    if (this.releaseTimer) {
      clearTimeout(this.releaseTimer);
      this.releaseTimer = null;
    }
  }
}
