import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div class="mx-auto w-full max-w-md rounded-[32px] bg-white p-8 shadow-lg">
        <h1 class="text-3xl font-semibold text-slate-900">Welcome back</h1>
        <p class="mt-2 text-sm text-slate-600">Sign in and challenge a friend or play a random match.</p>

        <form class="mt-8 space-y-4" (ngSubmit)="signIn()">
          <label class="block text-sm font-semibold text-slate-700">
            Email
            <input type="email" required [(ngModel)]="email" name="email" class="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500" />
          </label>
          <label class="block text-sm font-semibold text-slate-700">
            Password
            <input type="password" required [(ngModel)]="password" name="password" class="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500" />
          </label>

          <button type="submit" class="w-full rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Sign in</button>

          <p class="text-center text-sm text-slate-500">
            New here?
            <a class="font-semibold text-cyan-600 hover:text-cyan-800" (click)="goToRegister()">Create an account</a>
          </p>

          <p *ngIf="errorMessage" class="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{{ errorMessage }}</p>
        </form>
      </div>
    </main>
  `
})
export class LoginPage {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  signIn(): void {
    this.errorMessage = '';
    console.log('LoginPage.signIn called', this.email);
    this.authService.signIn(this.email, this.password).subscribe({
      next: () => {
        console.log('LoginPage.signIn success');
        this.router.navigate(['/multiplayer']);
      },
      error: (err) => {
        console.error('LoginPage.signIn error', err);
        this.errorMessage = err?.message || 'Unable to sign in.';
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
