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
          <img class="brand-icon" src="/Lightbearer.png" alt="" aria-hidden="true" />
          <h1>LIGHTBEARER</h1>
          <p class="brand-line">Learn <span>•</span> Play <span>•</span> Shine</p>
        </header>

        <blockquote class="game-verse">
          <p>“Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.”</p>
          <cite>Matthew 5:16 · NIV</cite>
        </blockquote>

        <div class="primary-actions">
          <a class="quick-match primary-color" routerLink="/multiplayer-battle">
            <span aria-hidden="true">⚔️</span>
            <div><b>Play Online</b><small>Challenge another player</small></div>
            <i aria-hidden="true">›</i>
          </a>

          <a class="quick-match primary-color practice-color" routerLink="/quiz-mode">
            <span aria-hidden="true">🎯</span>
            <div><b>Practice</b><small>Grow your knowledge of the Word</small></div>
            <i aria-hidden="true">›</i>
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
      position: relative;
      margin-bottom: .85rem;
      color: #18130e;
      text-align: center;
      animation: brand-float 6.5s ease-in-out infinite;
    }

    header::before {
      content: '';
      position: absolute;
      z-index: 0;
      top: -1.25rem;
      left: 50%;
      width: min(72vw, 23rem);
      height: 13rem;
      transform: translateX(-50%);
      border-radius: 50%;
      background: radial-gradient(ellipse, rgba(245, 190, 55, .23), rgba(245, 190, 55, .07) 42%, transparent 72%);
      filter: blur(3px);
      pointer-events: none;
    }

    header::after {
      content: '';
      position: absolute;
      z-index: 0;
      top: .15rem;
      left: 50%;
      width: 13.5rem;
      height: 13.5rem;
      transform: translateX(-50%);
      border-radius: 50%;
      background:
        radial-gradient(circle at 50% 25%, rgba(255, 151, 31, .58), transparent 42%),
        radial-gradient(circle at 30% 58%, rgba(164, 66, 224, .48), transparent 45%),
        radial-gradient(circle at 51% 74%, rgba(37, 144, 255, .52), transparent 42%),
        radial-gradient(circle at 72% 58%, rgba(93, 201, 75, .42), transparent 44%);
      filter: blur(15px);
      opacity: .68;
      animation: shine-pulse 5.5s ease-in-out infinite;
      pointer-events: none;
    }

    .brand-icon {
      display: block;
      width: clamp(12rem, 46vw, 16rem);
      height: clamp(12rem, 46vw, 16rem);
      margin: -3.2rem auto .35rem;
      object-fit: contain;
      filter: drop-shadow(0 15px 16px rgba(63, 42, 9, .38));
      position: relative;
      z-index: 1;
    }

    h1 {
      margin: 0;
      font: 900 clamp(2rem, 9vw, 2.8rem) Georgia, serif;
      letter-spacing: .02em;
      text-shadow:
        0 2px 0 #fffdf5,
        0 5px 0 #c8bfae,
        0 13px 18px rgba(55, 42, 18, .34);
      position: relative;
      z-index: 1;
    }

    .brand-line {
      position: relative;
      z-index: 1;
      margin: .55rem 0 0;
      color: #806921;
      font-size: .62rem;
      font-weight: 900;
      letter-spacing: .22em;
      text-transform: uppercase;
    }

    .brand-line span {
      margin: 0 .22rem;
      color: #bd8d1e;
    }

    .game-verse {
      position: relative;
      margin: 0 0 .85rem;
      padding: .75rem 1rem;
      border: 1px solid #c8a44e;
      border-radius: 14px;
      background: linear-gradient(180deg, #fffdf8, #eee9dc);
      box-shadow: inset 0 0 0 3px #8e743522, 0 7px 16px #4b3a1924;
      color: #3d3528;
      text-align: center;
    }

    .game-verse p {
      margin: 0;
      font: 700 .78rem/1.35 Georgia, serif;
    }

    .game-verse cite {
      display: block;
      margin-top: .35rem;
      color: #806a27;
      font-size: .58rem;
      font-style: normal;
      font-weight: 900;
      letter-spacing: .13em;
      text-transform: uppercase;
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
      animation: button-float 6s ease-in-out infinite;
      -webkit-tap-highlight-color: transparent;
    }

    .primary-actions .quick-match:nth-child(2) { animation-delay: -.9s; }
    .secondary-actions .quick-match:first-child { animation-delay: -1.8s; }
    .secondary-actions .quick-match:nth-child(2) { animation-delay: -2.7s; }

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

    .primary-color {
      grid-template-columns: 2.8rem minmax(0, 1fr) auto;
      gap: .7rem;
      place-items: initial;
      text-align: left;
    }

    .primary-color span {
      position: relative;
      z-index: 1;
      display: grid;
      width: 2.6rem;
      height: 2.6rem;
      place-items: center;
      border: 2px solid #c8a44e;
      border-radius: 50%;
      background: #3b294f;
      box-shadow: inset 0 0 0 2px #1c1227;
      font-size: 1.3rem;
    }

    .primary-color div,
    .primary-color i {
      position: relative;
      z-index: 1;
      align-self: center;
    }

    .primary-color b,
    .primary-color small {
      display: block;
    }

    .primary-color small {
      margin-top: .08rem;
      color: #fff;
      font-size: .7rem;
    }

    .primary-color i {
      color: #e5c542;
      font: 900 1.8rem Georgia, serif;
      font-style: normal;
    }

    .practice-color {
      background: linear-gradient(135deg, #17375f, #244f7d);
    }

    .practice-color span {
      background: #1b416b;
      box-shadow: inset 0 0 0 2px #0d263f;
    }

    .practice-color:hover {
      background: linear-gradient(135deg, #204a79, #2e6092);
    }

    .practice-color:active {
      background: linear-gradient(135deg, #132f51, #1c426b);
    }

    .quick-match b {
      font: 900 1rem Georgia, serif;
      letter-spacing: .03em;
      text-transform: uppercase;
    }

    .quick-match:hover {
      animation: none;
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
      animation: none;
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

    @keyframes brand-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }

    @keyframes button-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-1.5px); }
    }

    @keyframes shine-pulse {
      0%, 100% { opacity: .58; scale: .97; }
      50% { opacity: .72; scale: 1.03; }
    }

    @media (prefers-reduced-motion: reduce) {
      header,
      header,
      .quick-match,
      header::after { animation: none; }
    }

  `],
})
export class MultiplayerHomePage {}
