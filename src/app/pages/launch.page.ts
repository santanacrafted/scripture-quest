import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';
import { combineLatest, merge, timer } from 'rxjs';
import { filter, mapTo, take } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-launch-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="launch-screen" aria-label="Scripture Quest launch screen">
      <img class="launch-art" src="/app-launch.png" alt="Scripture Quest" />
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #05070d;
    }

    .launch-screen {
      display: grid;
      min-height: 100vh;
      place-items: center;
      overflow: hidden;
      background: #05070d;
    }

    .launch-art {
      width: 100%;
      height: 100vh;
      object-fit: cover;
      animation: launch-in 700ms ease-out both;
    }

    @media (min-width: 768px) {
      .launch-art {
        width: min(100vw, 540px);
        height: 100vh;
        object-fit: cover;
      }
    }

    @keyframes launch-in {
      from {
        opacity: 0;
        transform: scale(1.02);
      }

      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `],
})
export class LaunchPage implements OnInit {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    void SplashScreen.hide();

    combineLatest([
      merge(
        this.authService.authReady$.pipe(filter(Boolean), take(1), mapTo(true)),
        timer(3200).pipe(mapTo(true)),
      ).pipe(take(1)),
      timer(1700),
    ]).subscribe(() => {
      const nextRoute = this.authService.getCurrentUser() ? '/multiplayer' : '/login';
      void this.router.navigateByUrl(nextRoute, { replaceUrl: true });
    });
  }
}
