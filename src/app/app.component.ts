import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { BackgroundMusicService } from './audio/background-music.service';
import { BottomNavComponent } from './components/bottom-nav.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, BottomNavComponent],
  template: `
    <main class="route-shell">
      <router-outlet />
    </main>
    <app-bottom-nav *ngIf="showBottomNav"></app-bottom-nav>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'scripture-quest';

  constructor(
    backgroundMusic: BackgroundMusicService,
    private readonly router: Router,
  ) {
    backgroundMusic.start();
  }

  get showBottomNav(): boolean {
    const url = this.router.url;
    return url !== '/' && !['/login', '/register', '/bible-ready'].some((route) => url.startsWith(route));
  }
}
