import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div class="mx-auto w-full max-w-md rounded-[32px] bg-white p-8 shadow-lg">
        <h1 class="text-3xl font-semibold text-slate-900">Create your account</h1>
        <p class="mt-2 text-sm text-slate-600">Join Scripture Quest and play with friends or random Bible quiz opponents.</p>

        <form class="mt-8 space-y-4" (ngSubmit)="signUp()">
          <label class="block text-sm font-semibold text-slate-700">
            Username
            <input type="text" required [(ngModel)]="username" name="username" class="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500" />
          </label>
          <label class="block text-sm font-semibold text-slate-700">
            Email
            <input type="email" required [(ngModel)]="email" name="email" class="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500" />
          </label>
          <label class="block text-sm font-semibold text-slate-700">
            Password
            <input type="password" required [(ngModel)]="password" name="password" class="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-cyan-500" />
          </label>

          <button type="submit" class="w-full rounded-3xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white">Sign up</button>

          <p class="text-center text-sm text-slate-500">
            Already have an account?
            <a class="font-semibold text-cyan-600 hover:text-cyan-800" (click)="goToLogin()">Sign in</a>
          </p>

          <p *ngIf="errorMessage" class="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{{ errorMessage }}</p>
        </form>
      </div>
    </main>
  `
})
export class RegisterPage {
  username = '';
  email = '';
  password = '';
  errorMessage = '';

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  signUp(): void {
    this.errorMessage = '';
    this.authService.signUp(this.email, this.password, this.username).subscribe({
      next: () => this.router.navigate(['/multiplayer']),
      error: (err) => this.errorMessage = err.message || 'Unable to create account.'
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
