import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { BackgroundMusicService } from './audio/background-music.service';
import { AccountSideMenuComponent } from './components/account-side-menu.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, AccountSideMenuComponent],
  template: `
    <main class="route-shell">
      <router-outlet />
    </main>
    <app-account-side-menu *ngIf="showAppMenu"></app-account-side-menu>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'scripture-quest';

  constructor(
    backgroundMusic: BackgroundMusicService,
    private readonly router: Router
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
