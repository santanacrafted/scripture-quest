import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { BackgroundMusicService } from './audio/background-music.service';
import { AccountSideMenuComponent } from './components/account-side-menu.component';
import { ConnectivityService } from './connectivity/connectivity.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, AccountSideMenuComponent],
  template: `
    <main class="route-shell">
      <router-outlet />
    </main>
    <app-account-side-menu *ngIf="showAppMenu"></app-account-side-menu>
    <div *ngIf="connectivity.state$ | async as connection">
      <section *ngIf="connection.visible" class="connection-overlay" role="alert" aria-live="assertive">
        <div class="connection-card">
          <span class="connection-spark" aria-hidden="true">✦</span>
          <strong>{{ connection.message }}</strong>
          <p>Keeping your game safe while we restore the connection.</p>
          <i aria-hidden="true"></i>
        </div>
      </section>
    </div>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'scripture-quest';

  constructor(
    backgroundMusic: BackgroundMusicService,
    private readonly router: Router,
    readonly connectivity: ConnectivityService,
  ) {
    backgroundMusic.start();
  }

  get showAppMenu(): boolean {
    const url = this.router.url;
    return (
      url !== '/' &&
      !url.startsWith('/admin') &&
      ![
        '/login',
        '/register',
        '/bible-ready',
        '/multiplayer/quick-match',
        '/multiplayer/lobby',
        '/multiplayer/board',
        '/multiplayer/play',
        '/multiplayer/admin-test',
        '/multiplayer/result',
      ].some((route) => url.startsWith(route))
    );
  }
}
