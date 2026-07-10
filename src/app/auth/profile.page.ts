import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppUser } from './auth.models';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="profile-page route-page">
      <img class="background-image" src="/home-page.png" alt="" aria-hidden="true" />
      <button class="back-button" type="button" aria-label="Back to home" (click)="goBack()">‹</button>

      <section class="profile-panel" aria-labelledby="profile-title">
        <p class="eyebrow">Explorer Profile</p>
        <h1 id="profile-title">My Profile</h1>

        <div *ngIf="user; else loading" class="profile-content">
          <div class="avatar" aria-hidden="true">{{ initial }}</div>
          <p class="account-note">Your private Scripture Quest account details</p>

          <dl class="details">
            <div class="detail-card">
              <dt>Display Name</dt>
              <dd>{{ user.displayName || 'Not set' }}</dd>
            </div>
            <div class="detail-card">
              <dt>Username</dt>
              <dd>{{ user.username || 'Not set' }}</dd>
            </div>
            <div class="detail-card">
              <dt>Email</dt>
              <dd class="email">{{ user.email || 'Not set' }}</dd>
            </div>
          </dl>

          <p class="privacy-note">Your email is visible only to you.</p>
        </div>

        <ng-template #loading>
          <p class="loading" role="status">Loading your explorer profile…</p>
        </ng-template>
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:100vh; background:#070a12; color:#fff8df; }
    .profile-page { position:relative; display:flex; min-height:100svh; align-items:center; justify-content:center; overflow:hidden; isolation:isolate; padding:max(4.75rem,calc(env(safe-area-inset-top) + 4rem)) 1rem max(7.5rem,calc(env(safe-area-inset-bottom) + 7rem)); }
    .background-image { position:absolute; inset:0; z-index:-2; width:100%; height:100%; object-fit:cover; object-position:center; }
    .profile-page::before { position:absolute; inset:0; z-index:-1; content:''; background:linear-gradient(180deg,rgba(7,10,18,.18),rgba(7,10,18,.78)),linear-gradient(90deg,rgba(7,10,18,.28),transparent,rgba(7,10,18,.35)); }
    .back-button { position:fixed; top:calc(env(safe-area-inset-top) + 1rem); left:1rem; z-index:2; width:2.75rem; height:2.75rem; border:2px solid #d8b15f; border-radius:999px; background:rgba(14,17,18,.9); color:#f8d36c; font-size:2rem; font-weight:900; line-height:1; box-shadow:0 .8rem 1.4rem rgba(0,0,0,.34); }
    .profile-panel { width:min(100%,32rem); border:2px solid #d8b15f; border-radius:10px; background:rgba(14,17,18,.9); box-shadow:inset 0 0 0 2px rgba(36,24,10,.8),inset 0 0 0 4px rgba(255,232,166,.1),0 1rem 2.6rem rgba(0,0,0,.5); padding:1.2rem; backdrop-filter:blur(7px); }
    .eyebrow { margin:0 0 .35rem; color:#f5d36e; font-size:.8rem; font-weight:900; text-align:center; text-transform:uppercase; }
    h1 { margin:0; color:#fff; font-family:Georgia,'Times New Roman',serif; font-size:clamp(2.2rem,10vw,3.4rem); line-height:1; text-align:center; text-transform:uppercase; text-shadow:0 2px 0 rgba(32,21,7,.72),0 .25rem 1rem rgba(0,0,0,.58); }
    .profile-content { margin-top:1.15rem; }
    .avatar { display:grid; width:5.25rem; height:5.25rem; margin:0 auto; place-items:center; border:3px solid #f5d36e; border-radius:999px; background:linear-gradient(180deg,#326f62,#193e43); color:#fff8df; font:900 2.25rem Georgia,serif; box-shadow:inset 0 0 0 3px rgba(14,17,18,.7),0 .7rem 1.3rem rgba(0,0,0,.35); }
    .account-note,.privacy-note,.loading { text-align:center; }
    .account-note { margin:.75rem 0 1rem; color:rgba(255,248,223,.82); font-size:.88rem; font-weight:700; }
    .details { display:grid; gap:.75rem; margin:0; }
    .detail-card { border:2px solid #d8b15f; border-radius:8px; background:linear-gradient(180deg,rgba(39,91,80,.96),rgba(28,70,74,.96)); box-shadow:inset 0 0 0 2px rgba(22,27,33,.62); padding:.8rem 1rem; }
    dt { color:#f5d36e; font-size:.72rem; font-weight:900; text-transform:uppercase; }
    dd { margin:.2rem 0 0; color:#fff; font-size:1.05rem; font-weight:900; overflow-wrap:anywhere; }
    .email { font-size:.95rem; }
    .privacy-note { margin:1rem 0 0; color:rgba(255,248,223,.7); font-size:.75rem; }
    .loading { margin:2rem 0; color:#fff8df; font-weight:800; }
  `],
})
export class ProfilePage implements OnInit, OnDestroy {
  user: AppUser | null = null;
  private subscription?: Subscription;

  constructor(private readonly authService: AuthService, private readonly router: Router) {}

  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe(user => this.user = user);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get initial(): string {
    return (this.user?.displayName || this.user?.username || 'E').trim().charAt(0).toUpperCase();
  }

  goBack(): void {
    void this.router.navigate(['/multiplayer']);
  }
}
