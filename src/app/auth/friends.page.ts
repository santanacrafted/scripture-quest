import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { MultiplayerService } from '../multiplayer/multiplayer.service';
import { AppUser } from './auth.models';

@Component({
  selector: 'app-friends-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="min-h-screen bg-slate-100 px-4 py-8 text-slate-900">
      <div class="mx-auto w-full max-w-4xl space-y-4">
        <section class="rounded-[32px] border border-slate-200 bg-white p-6 shadow-lg">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600">Friends</p>
              <h1 class="text-3xl font-semibold">Play with your people</h1>
            </div>
            <button class="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white" (click)="goBack()">
              Back
            </button>
          </div>

          <p class="mt-3 text-sm text-slate-600">Select a friend to start a match or keep exploring random battles.</p>

          <div *ngIf="friends.length === 0" class="mt-6 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
            No friends yet. Search by username from the home screen and add a friend to play.
          </div>

          <div class="mt-6 space-y-4">
            <article *ngFor="let friend of friends" class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-lg font-semibold text-slate-900">{{ friend.username }}</p>
                  <p class="text-sm text-slate-500">{{ friend.email }}</p>
                </div>
                <button class="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white" (click)="challengeFriend(friend)">
                  Challenge
                </button>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  `,
})
export class FriendsPage implements OnInit {
  currentUser: AppUser | null = null;
  friends: AppUser[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly multiplayerService: MultiplayerService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(async (user) => {
      this.currentUser = user;
      if (user) {
        this.friends = await this.userService.getFriends(user.uid);
      }
    });
  }

  async challengeFriend(friend: AppUser): Promise<void> {
    if (!this.currentUser) {
      return;
    }

    const match = this.multiplayerService.createFriendMatch(this.currentUser.uid, friend.uid);
    this.router.navigate(['/multiplayer/lobby', match.id]);
  }

  goBack(): void {
    this.router.navigate(['/multiplayer']);
  }
}
