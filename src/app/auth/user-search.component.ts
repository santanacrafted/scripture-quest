import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from './user.service';
import { AppUser } from './auth.models';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-800">Add a friend</p>
          <p class="text-sm text-slate-500">Search by username and add them for future matches.</p>
        </div>
      </div>

      <form class="mt-4 flex gap-2" (ngSubmit)="search()">
        <input
          class="min-w-0 flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-cyan-500"
          placeholder="Username"
          [(ngModel)]="searchTerm"
          name="searchTerm"
        />
        <button class="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Search</button>
      </form>

      <div *ngIf="errorMessage" class="mt-3 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{{ errorMessage }}</div>

      <div *ngIf="results.length" class="mt-4 space-y-3">
        <div *ngFor="let user of results" class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-semibold text-slate-900">{{ user.username }}</p>
              <p class="text-xs text-slate-500">{{ user.email }}</p>
            </div>
            <button class="rounded-full bg-cyan-600 px-3 py-2 text-sm font-semibold text-white" (click)="addFriend(user)">Add</button>
          </div>
        </div>
      </div>
    </section>
  `
})
export class UserSearchComponent {
  searchTerm = '';
  results: AppUser[] = [];
  errorMessage = '';

  @Output() friendAdded = new EventEmitter<AppUser>();

  constructor(private readonly userService: UserService) {}

  async search(): Promise<void> {
    this.errorMessage = '';
    try {
      this.results = await this.userService.searchUsersByUsername(this.searchTerm.trim());
    } catch (error) {
      this.errorMessage = 'Search failed. Please try again.';
    }
  }

  async addFriend(user: AppUser): Promise<void> {
    this.friendAdded.emit(user);
  }
}
