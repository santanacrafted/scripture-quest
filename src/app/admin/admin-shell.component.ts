import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `<main>
    <aside>
      <a class="brand" routerLink="/admin"
        ><b>✦</b><span>Scripture Quest<small>Content Studio</small></span></a
      >
      <nav>
        <a
          routerLink="/admin"
          routerLinkActive="on"
          [routerLinkActiveOptions]="{ exact: true }"
          >▦ Dashboard</a
        ><a routerLink="/admin/questions" routerLinkActive="on">☷ Questions</a
        ><a routerLink="/admin/questions/new" routerLinkActive="on"
          >＋ New Question</a
        ><a routerLink="/admin/import" routerLinkActive="on">⇧ Import</a
        ><a routerLink="/admin/review" routerLinkActive="on">✓ Review Queue</a
        ><a routerLink="/admin/reports" routerLinkActive="on">⚑ Reports</a>
      </nav>
      <a class="game" routerLink="/multiplayer">← Back to game</a>
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
          grid-template-columns: 1fr;
          width: 100%;
          overflow-x: hidden;
        }
        aside {
          position: sticky;
          z-index: 20;
          top: 0;
          height: auto;
          padding: max(0.65rem, env(safe-area-inset-top)) 0.75rem 0.6rem;
        }
        nav {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-top: 0.7rem;
        }
        nav a {
          min-width: 0;
          text-align: center;
          font-size: 0.68rem;
          padding: 0.55rem 0.65rem;
          white-space: normal;
        }
        .game {
          display: block;
          order: 3;
          margin: 0.45rem 0 0;
          padding: 0.55rem;
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
export class AdminShellComponent {}
