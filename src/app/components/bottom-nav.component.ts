import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  onClick?: () => void;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav
      class="quest-bottom-nav fixed bottom-5 left-4 right-4 z-20 rounded-quest-lg bg-quest-dark shadow-lg"
    >
      <div class="mx-auto flex max-w-5xl justify-around divide-x divide-quest-card-border/60 px-1 py-2">
        <button
          *ngFor="let item of navItems"
          class="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-1 text-quest-gold transition-all duration-300 hover:bg-quest-gold/10"
          (click)="handleClick(item)"
        >
          <div class="text-3xl leading-none">{{ item.icon }}</div>
          <span
            class="max-w-full break-words text-center text-[8px] font-bold uppercase leading-tight text-amber-100"
          >
            {{ item.label }}
          </span>
        </button>
      </div>
    </nav>
  `,
  styles: [
    `
      .quest-bottom-nav {
        border: 1px solid #332415;
        box-shadow:
          inset 0 0 0 1px rgba(245, 197, 93, 0.76),
          inset 0 0 0 3px rgba(20, 13, 7, 0.7),
          0 8px 18px rgba(0, 0, 0, 0.42);
      }

      .quest-bottom-nav::before {
        content: '';
        position: absolute;
        inset: 4px;
        border: 1px solid rgba(255, 218, 128, 0.28);
        border-radius: 12px;
        pointer-events: none;
      }

      .quest-bottom-nav::after {
        content: '';
        position: absolute;
        inset: 5px;
        border-radius: 10px;
        pointer-events: none;
        background:
          linear-gradient(#f1c663, #f1c663) left top / 22px 1px no-repeat,
          linear-gradient(#f1c663, #f1c663) left top / 1px 22px no-repeat,
          linear-gradient(#f1c663, #f1c663) right top / 22px 1px no-repeat,
          linear-gradient(#f1c663, #f1c663) right top / 1px 22px no-repeat,
          linear-gradient(#f1c663, #f1c663) left bottom / 22px 1px no-repeat,
          linear-gradient(#f1c663, #f1c663) left bottom / 1px 22px no-repeat,
          linear-gradient(#f1c663, #f1c663) right bottom / 22px 1px no-repeat,
          linear-gradient(#f1c663, #f1c663) right bottom / 1px 22px no-repeat;
        opacity: 0.72;
      }
    `,
  ],
})
export class BottomNavComponent {
  navItems: NavItem[] = [
    { label: 'Profile', icon: '👤', route: '/profile' },
    { label: 'Leaderboards', icon: '👑', route: '/leaderboards' },
    { label: 'Friends', icon: '👥', route: '/friends' },
    { label: 'Church', icon: '⛪', route: '/church' },
    { label: 'Settings', icon: '⚙️', route: '/settings' },
  ];

  constructor(private router: Router) {}

  handleClick(item: NavItem): void {
    if (item.onClick) {
      item.onClick();
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
  }
}
