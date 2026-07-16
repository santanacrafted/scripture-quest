import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `<main>
    <header class="mobile-header">
      <a class="brand" routerLink="/admin"><b>✦</b><span>Lightbearer<small>Content Studio</small></span></a>
      <button type="button" class="menu-button" (click)="openMenu()" aria-label="Open Studio navigation" [attr.aria-expanded]="menuOpen">☰</button>
    </header>
    <button class="drawer-backdrop" [class.open]="menuOpen" type="button" (click)="closeMenu()" aria-label="Close Studio navigation"></button>
    <aside [class.open]="menuOpen">
      <button type="button" class="drawer-close" (click)="closeMenu()" aria-label="Close Studio navigation">×</button>
      <a class="brand" routerLink="/admin"
        ><b>✦</b><span>Lightbearer<small>Content Studio</small></span></a
      >
      <nav>
        <a
          routerLink="/admin"
          routerLinkActive="on"
          [routerLinkActiveOptions]="{ exact: true }"
          (click)="closeMenu()">▦ Dashboard</a
        ><a routerLink="/admin/questions" routerLinkActive="on" (click)="closeMenu()">☷ Questions</a
        ><a routerLink="/admin/questions/new" routerLinkActive="on"
          (click)="closeMenu()">＋ New Question</a
        ><a routerLink="/admin/import" routerLinkActive="on" (click)="closeMenu()">⇧ Import</a
        ><a routerLink="/admin/review" routerLinkActive="on" (click)="closeMenu()">✓ Review Queue</a
        ><a routerLink="/admin/reports" routerLinkActive="on" (click)="closeMenu()">⚑ Reports</a>
      </nav>
      <a class="game" routerLink="/multiplayer" (click)="closeMenu()">← Back to game</a>
    </aside>
    <section><router-outlet /></section>
  </main>`,
  styles: [
    `
      :host {
        display: block;
        background: #f3f5f3;
        color: #16211e;
        font-family: Inter, Arial, sans-serif;
      }
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }
      main {
        min-height: 100svh;
        display: grid;
        grid-template-columns: 240px 1fr;
      }
      .mobile-header,.drawer-close,.drawer-backdrop { display:none; }
      aside {
        position: sticky;
        top: 0;
        height: 100svh;
        display: flex;
        flex-direction: column;
        padding: 1.3rem;
        background: #0e2722;
        color: white;
      }
      .brand {
        display: flex;
        gap: 0.7rem;
        align-items: center;
        color: white;
        text-decoration: none;
        font-weight: 900;
      }
      .brand b {
        font-size: 2rem;
        color: #f0ca62;
      }
      .brand small {
        display: block;
        color: #9cc0b6;
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      nav {
        display: grid;
        gap: 0.35rem;
        margin-top: 2rem;
      }
      nav a,
      .game {
        padding: 0.8rem;
        border-radius: 8px;
        color: #bed1cb;
        text-decoration: none;
        font-weight: 700;
      }
      .on {
        background: #245348;
        color: #fff !important;
      }
      .game {
        margin-top: auto;
      }
      section {
        min-width: 0;
        padding: 2rem;
      }
      @media (max-width: 900px) {
        :host {
          overflow-x: hidden;
        }
        main {
          display:block;
          width: 100%;
          overflow-x: hidden;
        }
        .mobile-header { position:sticky;z-index:30;top:0;display:flex;align-items:center;justify-content:space-between;min-height:72px;padding:max(.65rem,env(safe-area-inset-top)) 1rem .65rem;background:#0e2722;color:#fff;box-shadow:0 4px 18px #06130f33; }
        .mobile-header .brand { font-size:.95rem; }
        .mobile-header .brand b { font-size:1.65rem; }
        .menu-button { display:grid;width:44px;height:44px;place-items:center;border:1px solid #55766e;border-radius:10px;background:#173b33;color:#fff;font-size:1.35rem; }
        .drawer-backdrop { position:fixed;z-index:39;inset:0;display:block;border:0;background:#06110ed1;opacity:0;pointer-events:none;transition:opacity .22s ease; }
        .drawer-backdrop.open { opacity:1;pointer-events:auto; }
        aside {
          position:fixed;
          z-index:40;
          top: 0;
          bottom:0;
          left:0;
          width:min(84vw,320px);
          height:100svh;
          padding:calc(max(1rem,env(safe-area-inset-top)) + 2.6rem) 1rem max(1rem,env(safe-area-inset-bottom));
          transform:translateX(-105%);
          box-shadow:16px 0 50px #0007;
          transition:transform .25s cubic-bezier(.2,.75,.2,1);
          overflow-y:auto;
        }
        aside.open { transform:translateX(0); }
        .drawer-close { position:absolute;top:max(.75rem,env(safe-area-inset-top));right:.8rem;display:grid;width:42px;height:42px;place-items:center;border:1px solid #55766e;border-radius:50%;background:#173b33;color:#fff;font-size:1.65rem; }
        nav {
          grid-template-columns:1fr;
          margin-top:1.5rem;
        }
        nav a {
          min-height:48px;
          padding:.8rem;
          text-align:left;
          font-size:.9rem;
        }
        .game {
          display: block;
          margin-top:auto;
          padding:.8rem;
          border: 1px solid rgba(190, 209, 203, 0.35);
          text-align: center;
          font-size: 0.72rem;
        }
        section {
          width: 100%;
          box-sizing: border-box;
          padding: 0.85rem;
          overflow-x: hidden;
        }
      }
    `,
  ],
})
export class AdminShellComponent implements OnDestroy {
  menuOpen = false;
  private readonly routeSubscription: Subscription;
  private previousBodyOverflow = '';

  constructor(router: Router) {
    this.routeSubscription = router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.closeMenu());
  }

  openMenu() {
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.menuOpen = true;
  }

  closeMenu() {
    if (!this.menuOpen) return;
    this.menuOpen = false;
    document.body.style.overflow = this.previousBodyOverflow;
  }

  ngOnDestroy() {
    this.routeSubscription.unsubscribe();
    if (this.menuOpen) document.body.style.overflow = this.previousBodyOverflow;
  }
}
