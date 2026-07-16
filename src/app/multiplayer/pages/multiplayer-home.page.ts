import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-multiplayer-home-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="home-page">
      <section class="home-menu" aria-label="Main menu">
        <header>
          <p>Welcome to</p>
          <h1>Lightbearer</h1>
        </header>

        <div class="primary-actions">
          <a class="quick-match primary-color" routerLink="/multiplayer-battle">
            <b>Play Online</b>
          </a>

          <a class="quick-match primary-color" routerLink="/quiz-mode">
            <b>Practice</b>
          </a>
        </div>

        <div class="divider" aria-hidden="true"></div>

        <nav class="secondary-actions" aria-label="Player progress">
          <a class="quick-match progress-color" routerLink="/leaderboards">
            <b>Leaderboards</b>
          </a>

          <a class="quick-match progress-color" routerLink="/achievements">
            <b>Achievements</b>
          </a>
        </nav>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100svh;
      background: #0b0c12;
      color: #f7f7fb;
    }

    .home-page {
      display: grid;
      min-height: 100svh;
      box-sizing: border-box;
      place-items: center;
      padding: calc(env(safe-area-inset-top) + 5rem) 1.25rem calc(env(safe-area-inset-bottom) + 1.5rem);
      background:
        radial-gradient(circle at 50% 18rem, #fffdf8 0, #f1eee5 42%, #e3ded2 100%);
    }

    .home-menu {
      width: min(100%, 34rem);
    }

    header {
      margin-bottom: 1rem;
      color: #18130e;
      text-align: center;
    }

    header p {
      margin: 0 0 .25rem;
      color: #78652b;
      font-size: .72rem;
      font-weight: 900;
      letter-spacing: .22em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font: 900 clamp(2rem, 9vw, 3.1rem) Georgia, serif;
      letter-spacing: .02em;
    }

    .primary-actions,
    .secondary-actions {
      display: grid;
      gap: .85rem;
    }

    .quick-match {
      position: relative;
      display: grid;
      grid-template-columns: 1fr;
      box-sizing: border-box;
      align-items: center;
      width: 100%;
      min-height: 58px;
      place-items: center;
      padding: .55rem 1rem;
      overflow: hidden;
      border: 1px solid #332415;
      border-radius: 16px;
      background: linear-gradient(180deg, #513372 0%, #40265e 55%, #34204d 100%);
      box-shadow:
        inset 0 1px 0 rgba(255, 244, 196, .24),
        inset 0 0 0 1px rgba(245, 197, 93, .76),
        inset 0 0 0 3px rgba(20, 13, 7, .48),
        0 1px 0 rgba(27, 18, 8, .72),
        0 3px 0 rgba(48, 31, 16, .38),
        0 12px 20px rgba(0, 0, 0, .34),
        0 0 18px rgba(245, 197, 93, .16);
      color: #fff;
      text-align: center;
      text-decoration: none;
      transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
      -webkit-tap-highlight-color: transparent;
    }

    .quick-match::before {
      content: '';
      position: absolute;
      inset: 4px;
      border: 1px solid rgba(255, 218, 128, .32);
      border-radius: 12px;
      pointer-events: none;
    }

    .quick-match::after {
      content: '';
      position: absolute;
      inset: 5px;
      border-radius: 10px;
      background:
        linear-gradient(#f1c663, #f1c663) left top / 18px 1px no-repeat,
        linear-gradient(#f1c663, #f1c663) left top / 1px 18px no-repeat,
        linear-gradient(#f1c663, #f1c663) right top / 18px 1px no-repeat,
        linear-gradient(#f1c663, #f1c663) right top / 1px 18px no-repeat,
        linear-gradient(#f1c663, #f1c663) left bottom / 18px 1px no-repeat,
        linear-gradient(#f1c663, #f1c663) left bottom / 1px 18px no-repeat,
        linear-gradient(#f1c663, #f1c663) right bottom / 18px 1px no-repeat,
        linear-gradient(#f1c663, #f1c663) right bottom / 1px 18px no-repeat;
      opacity: .72;
      pointer-events: none;
    }

    .quick-match b {
      position: relative;
      z-index: 1;
    }

    .quick-match b {
      font: 900 1rem Georgia, serif;
      letter-spacing: .03em;
      text-transform: uppercase;
    }

    .quick-match:hover {
      background: linear-gradient(180deg, #604082, #49306a 55%, #3b2657);
      box-shadow:
        inset 0 1px 0 rgba(255, 244, 196, .3),
        inset 0 0 0 1px rgba(255, 210, 107, .9),
        inset 0 0 0 3px rgba(20, 13, 7, .44),
        0 1px 0 rgba(27, 18, 8, .72),
        0 4px 0 rgba(48, 31, 16, .34),
        0 18px 24px rgba(0, 0, 0, .4),
        0 0 24px rgba(245, 197, 93, .22);
    }

    .quick-match:active {
      transform: translateY(1px);
      background: linear-gradient(180deg, #40275e, #321d4a);
    }

    .quick-match:focus-visible {
      outline: 3px solid #9a7621;
      outline-offset: 3px;
    }

    .progress-color {
      background: linear-gradient(180deg, #fffdf8 0%, #eee9dc 58%, #ddd5c3 100%);
      color: #282219;
      box-shadow:
        inset 0 1px 0 #fff,
        inset 0 0 0 1px rgba(168, 135, 53, .72),
        inset 0 0 0 3px rgba(80, 62, 25, .18),
        0 1px 0 rgba(66, 49, 19, .45),
        0 3px 0 rgba(91, 70, 29, .22),
        0 12px 20px rgba(70, 55, 25, .2),
        0 0 18px rgba(183, 143, 42, .12);
    }

    .progress-color:hover {
      background: linear-gradient(180deg, #fff 0%, #f6f1e6 58%, #e5ddca 100%);
      box-shadow:
        inset 0 1px 0 #fff,
        inset 0 0 0 1px rgba(184, 145, 49, .9),
        inset 0 0 0 3px rgba(80, 62, 25, .16),
        0 1px 0 rgba(66, 49, 19, .45),
        0 4px 0 rgba(91, 70, 29, .2),
        0 18px 24px rgba(70, 55, 25, .24),
        0 0 24px rgba(183, 143, 42, .16);
    }

    .progress-color:active {
      background: linear-gradient(180deg, #e9e2d2, #d8cfbc);
    }

    .divider {
      height: 1px;
      margin: 1rem 0;
      background: linear-gradient(90deg, transparent, #ad995f, transparent);
    }

  `],
})
export class MultiplayerHomePage {}
