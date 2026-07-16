import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription, filter, take } from 'rxjs';
import { AuthService } from './auth.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="auth-page route-page">
      <img class="background-image" src="/login-page.png" alt="" aria-hidden="true" />
      <section class="auth-panel" aria-label="Account access">
        <div class="auth-content">
          <div class="mode-switch" role="tablist" aria-label="Account mode">
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="mode === 'login'"
              [class.active]="mode === 'login'"
              (click)="setMode('login')"
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="mode === 'register'"
              [class.active]="mode === 'register'"
              (click)="setMode('register')"
            >
              Create account
            </button>
          </div>

          <header class="auth-header">
            <img class="brand-icon" src="/Lightbearer.png" alt="" aria-hidden="true" />
            <p class="eyebrow">Lightbearer</p>
            <h1>{{ mode === 'login' ? 'Welcome back' : 'Begin your quest' }}</h1>
            <p>
              {{ mode === 'login'
                ? 'Sign in to continue your battles, quests, and progress.'
                : 'Create your player profile to unlock multiplayer and quests.' }}
            </p>
          </header>

          <form class="auth-form" (ngSubmit)="submit()" #authForm="ngForm">
            <label *ngIf="mode === 'register'">
              <span>Display Name</span>
              <input
                type="text"
                name="displayName"
                autocomplete="name"
                required
                minlength="2"
                [(ngModel)]="displayName"
                [disabled]="isSubmitting"
              />
            </label>

            <label *ngIf="mode === 'register'">
              <span>Username</span>
              <input
                type="text"
                name="username"
                autocomplete="username"
                required
                minlength="3"
                [(ngModel)]="username"
                [disabled]="isSubmitting"
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                email
                name="email"
                autocomplete="email"
                required
                [(ngModel)]="email"
                [disabled]="isSubmitting"
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                name="password"
                [autocomplete]="mode === 'login' ? 'current-password' : 'new-password'"
                required
                minlength="6"
                [(ngModel)]="password"
                [disabled]="isSubmitting"
              />
            </label>

            <p *ngIf="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

            <button class="submit-button" type="submit" [disabled]="authForm.invalid || isSubmitting">
              {{ isSubmitting
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                : (mode === 'login' ? 'Sign in and play' : 'Create account') }}
            </button>
          </form>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #05070d;
      color: #f8fafc;
    }

    .auth-page {
      position: relative;
      display: flex;
      min-height: 100svh;
      align-items: flex-end;
      justify-content: center;
      overflow: hidden;
      isolation: isolate;
      padding: 1rem;
    }

    .background-image {
      position: absolute;
      inset: 0;
      z-index: -2;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center center;
    }

    .auth-page::before {
      position: absolute;
      inset: 0;
      z-index: -1;
      content: '';
      background:
        linear-gradient(180deg, rgba(5, 7, 13, 0) 0%, rgba(5, 7, 13, 0.12) 40%, rgba(5, 7, 13, 0.56) 100%),
        linear-gradient(90deg, rgba(5, 7, 13, 0.1) 0%, rgba(5, 7, 13, 0) 48%, rgba(5, 7, 13, 0.18) 100%);
      pointer-events: none;
    }

    .auth-panel {
      display: flex;
      width: 100%;
      max-width: 28rem;
      align-items: flex-end;
      justify-content: center;
      padding: 0 0 max(0.35rem, env(safe-area-inset-bottom));
    }

    .auth-content {
      width: 100%;
    }

    .mode-switch {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.4rem;
      border: 2px solid #d8b15f;
      border-radius: 8px;
      background: rgba(14, 17, 18, 0.78);
      box-shadow:
        inset 0 0 0 2px rgba(36, 24, 10, 0.8),
        inset 0 0 0 4px rgba(255, 232, 166, 0.12),
        0 0.9rem 2rem rgba(0, 0, 0, 0.36);
      padding: 0.3rem;
      backdrop-filter: blur(6px);
    }

    .mode-switch button {
      min-height: 2.75rem;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: rgba(255, 252, 228, 0.82);
      font: inherit;
      font-size: 0.86rem;
      font-weight: 900;
      cursor: pointer;
      text-transform: uppercase;
      text-shadow: 0 2px 0 rgba(0, 0, 0, 0.45);
      transition: background 180ms ease, color 180ms ease, box-shadow 180ms ease;
    }

    .mode-switch button.active {
      background: linear-gradient(180deg, rgba(53, 99, 66, 0.98), rgba(35, 75, 58, 0.98));
      color: #ffffff;
      box-shadow:
        inset 0 0 0 1px rgba(255, 232, 166, 0.52),
        0 0.45rem 1rem rgba(0, 0, 0, 0.24);
      text-shadow: 0 2px 0 rgba(0, 0, 0, 0.48);
    }

    .auth-header {
      padding: 1.05rem 0 0.7rem;
      text-align: center;
      text-shadow:
        0 2px 0 rgba(32, 21, 7, 0.72),
        0 0.25rem 1rem rgba(0, 0, 0, 0.58);
    }

    .brand-icon {
      width: 72px;
      height: 72px;
      margin: 0 auto .2rem;
      object-fit: contain;
      filter: drop-shadow(0 7px 10px rgba(0, 0, 0, .55));
    }

    .eyebrow {
      margin: 0 0 0.45rem;
      color: #f5d36e;
      font-size: 0.78rem;
      font-weight: 900;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      color: #ffffff;
      font-size: clamp(1.95rem, 8vw, 2.8rem);
      line-height: 1;
      letter-spacing: 0;
      font-family: Georgia, 'Times New Roman', serif;
      text-transform: uppercase;
    }

    .auth-header p:last-child {
      margin: 0.65rem auto 0;
      max-width: 23rem;
      color: rgba(255, 255, 255, 0.92);
      font-size: 0.9rem;
      font-weight: 800;
      line-height: 1.35;
    }

    .auth-form {
      display: grid;
      gap: 0.72rem;
      padding-bottom: 0.2rem;
    }

    label {
      display: grid;
      gap: 0.45rem;
      color: #fff6d5;
      font-size: 0.78rem;
      font-weight: 900;
      text-transform: uppercase;
      text-shadow:
        0 2px 0 rgba(0, 0, 0, 0.62),
        0 0.4rem 0.9rem rgba(0, 0, 0, 0.55);
    }

    input {
      width: 100%;
      min-height: 3.55rem;
      box-sizing: border-box;
      border: 2px solid #d8b15f;
      border-radius: 8px;
      background:
        linear-gradient(180deg, rgba(39, 91, 80, 0.93), rgba(28, 70, 74, 0.93));
      color: #ffffff;
      font: inherit;
      font-size: 1.02rem;
      font-weight: 800;
      outline: none;
      padding: 0 1rem;
      box-shadow:
        inset 0 0 0 2px rgba(22, 27, 33, 0.62),
        inset 0 0 0 4px rgba(255, 232, 166, 0.08),
        0 0.65rem 1.4rem rgba(0, 0, 0, 0.34);
      text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
    }

    input:focus {
      border-color: #ffe28a;
      background:
        linear-gradient(180deg, rgba(50, 110, 84, 0.96), rgba(33, 78, 86, 0.96));
      box-shadow:
        inset 0 0 0 2px rgba(22, 27, 33, 0.48),
        inset 0 0 0 4px rgba(255, 232, 166, 0.12),
        0 0 0 3px rgba(255, 226, 138, 0.22),
        0 0.8rem 1.6rem rgba(0, 0, 0, 0.38);
    }

    input:disabled {
      opacity: 0.68;
    }

    .error-message {
      margin: 0;
      border: 2px solid rgba(255, 193, 122, 0.7);
      border-radius: 8px;
      background: rgba(83, 27, 27, 0.8);
      color: #ffe1d6;
      font-size: 0.9rem;
      line-height: 1.4;
      padding: 0.8rem 0.9rem;
    }

    .submit-button {
      min-height: 3.55rem;
      border: 2px solid #ffe28a;
      border-radius: 8px;
      background:
        linear-gradient(180deg, #fce6a6 0%, #e8bb49 48%, #b8761d 100%);
      color: #201407;
      font: inherit;
      font-weight: 900;
      cursor: pointer;
      text-transform: uppercase;
      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.32);
      box-shadow:
        inset 0 0 0 2px rgba(92, 54, 13, 0.4),
        0 0.85rem 1.8rem rgba(56, 34, 9, 0.42);
      transition: transform 180ms ease, opacity 180ms ease;
    }

    .submit-button:active {
      transform: translateY(1px);
    }

    .submit-button:disabled {
      cursor: default;
      opacity: 0.58;
      transform: none;
    }

    @media (min-width: 860px) {
      .auth-page {
        align-items: center;
        justify-content: flex-end;
        padding: 2rem clamp(2rem, 8vw, 6rem);
      }

      .auth-page::before {
        background:
          linear-gradient(90deg, rgba(5, 7, 13, 0) 0%, rgba(5, 7, 13, 0.08) 44%, rgba(5, 7, 13, 0.56) 100%),
          linear-gradient(180deg, rgba(5, 7, 13, 0) 0%, rgba(5, 7, 13, 0.26) 100%);
      }

      .auth-panel {
        max-width: 30rem;
        padding: 0;
      }
    }
  `],
})
export class LoginPage implements OnInit, OnDestroy {
  mode: AuthMode = 'login';
  displayName = '';
  username = '';
  email = '';
  password = '';
  errorMessage = '';
  isSubmitting = false;

  private routeSubscription?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.syncModeFromRoute();
    this.routeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.syncModeFromRoute());

    this.authService.authReady$.pipe(filter(Boolean), take(1)).subscribe(() => {
      if (this.authService.getCurrentUser()) {
        void this.router.navigate(['/multiplayer'], { replaceUrl: true });
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  setMode(mode: AuthMode): void {
    if (this.mode === mode) {
      return;
    }

    this.errorMessage = '';
    void this.router.navigate([mode === 'login' ? '/login' : '/register']);
  }

  submit(): void {
    this.errorMessage = '';

    const email = this.email.trim().toLowerCase();
    const username = this.username.trim();
    const displayName = this.displayName.trim();

    const validationMessage = this.validateForm(email, username, displayName);
    if (validationMessage) {
      this.errorMessage = validationMessage;
      return;
    }

    this.isSubmitting = true;

    const request = this.mode === 'login'
      ? this.authService.signIn(email, this.password)
      : this.authService.signUp(
          email,
          this.password,
          username,
          displayName,
        );

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        void this.router.navigate(['/multiplayer'], { replaceUrl: true });
      },
      error: (err: unknown) => {
        this.isSubmitting = false;
        this.errorMessage = this.readableError(err);
      },
    });
  }

  private syncModeFromRoute(): void {
    this.mode = this.route.snapshot.data['mode'] === 'register' ? 'register' : 'login';
    this.errorMessage = '';
  }

  private readableError(error: unknown): string {
    const code = this.getErrorCode(error);
    const messageMap: Record<string, string> = {
      'auth/email-already-in-use': 'That email already has an account. Try signing in.',
      'auth/invalid-email': 'Enter a valid email address, including @.',
      'auth/invalid-credential': 'Email or password is incorrect.',
      'auth/user-not-found': 'No account was found for that email.',
      'auth/wrong-password': 'Email or password is incorrect.',
      'auth/weak-password': 'Password must be at least 6 characters.',
    };

    if (code && messageMap[code]) {
      return messageMap[code];
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return this.mode === 'login'
      ? 'Unable to sign in. Check your email and password.'
      : 'Unable to create your account. Please try again.';
  }

  private validateForm(email: string, username: string, displayName: string): string {
    if (!this.isValidEmail(email)) {
      return 'Enter a valid email address, including @.';
    }

    if (this.password.length < 6) {
      return 'Password must be at least 6 characters.';
    }

    if (this.mode === 'register' && displayName.length < 2) {
      return 'Display name must be at least 2 characters.';
    }

    if (this.mode === 'register' && username.length < 3) {
      return 'Username must be at least 3 characters.';
    }

    return '';
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private getErrorCode(error: unknown): string {
    if (typeof error === 'object' && error && 'code' in error) {
      const code = (error as { code?: unknown }).code;
      return typeof code === 'string' ? code : '';
    }

    return '';
  }
}
