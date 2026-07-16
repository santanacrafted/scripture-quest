import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { filter, Subscription, take } from 'rxjs';
import { AdminAuthService } from '../admin/admin-auth.service';
import { AppUser } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { FriendBattleService } from '../friend-battle/friend-battle.service';

interface MenuItem { label:string; icon:string; route:string; badge?:number }

@Component({
  selector:'app-account-side-menu', standalone:true, imports:[CommonModule],
  template:`
    <button class="avatar-trigger" type="button" (click)="openMenu()" [attr.aria-label]="'Open menu for ' + displayName">{{ initial }}</button>
    <div *ngIf="open" class="menu-backdrop" (click)="closeMenu()" aria-hidden="true"></div>
    <aside class="side-menu" [class.open]="open" [attr.aria-hidden]="!open">
      <header><div class="large-avatar">{{initial}}</div><div><strong>{{displayName}}</strong><small>{{user?.email}}</small></div><button type="button" (click)="closeMenu()" aria-label="Close menu">×</button></header>
      <nav aria-label="Main navigation"><button *ngFor="let item of items" type="button" (click)="go(item.route)"><span>{{item.icon}}</span><b>{{item.label}}</b><i *ngIf="item.badge">{{item.badge!>9?'9+':item.badge}}</i><em>›</em></button></nav>
      <footer><button type="button" (click)="signOut()"><span>↪</span><b>Sign out</b></button></footer>
    </aside>`,
  styles:[`
    .avatar-trigger{position:fixed;z-index:40;top:calc(max(env(safe-area-inset-top),1.5rem) + .75rem);right:calc(env(safe-area-inset-right) + 1rem);display:grid;width:46px;height:46px;place-items:center;border:2px solid #f5d36e;border-radius:50%;background:linear-gradient(#326f62,#193e43);color:#fff8df;font:900 1.25rem Georgia;box-shadow:inset 0 0 0 2px #0e1715,0 7px 18px #0007}
    .menu-backdrop{position:fixed;z-index:80;inset:0;background:#020908a8;backdrop-filter:blur(3px)}
    .side-menu{position:fixed;z-index:81;top:0;right:0;display:grid;grid-template-rows:auto 1fr auto;width:min(88vw,360px);height:100svh;padding:calc(env(safe-area-inset-top) + 1rem) 1rem calc(env(safe-area-inset-bottom) + 1rem);background:linear-gradient(125deg,#123d43 0%,#1b6458 48%,#244f7d 100%);color:#fff8df;box-shadow:-18px 0 45px #0009;transform:translateX(105%);transition:transform 240ms cubic-bezier(.2,.8,.2,1);pointer-events:none}.side-menu.open{transform:none;pointer-events:auto}
    header{display:grid;grid-template-columns:54px 1fr 42px;align-items:center;gap:.7rem;padding-bottom:1rem;border-bottom:1px solid #b8944b66}.large-avatar{display:grid;width:52px;height:52px;place-items:center;border:2px solid #f5d36e;border-radius:50%;background:#1f5b50;font:900 1.4rem Georgia}header strong,header small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}header small{margin-top:.2rem;color:#bad0c9;font-size:.72rem}header button{width:40px;height:40px;border:1px solid #a88a4d;border-radius:50%;background:#0b1d19;color:#f5d36e;font-size:1.5rem}
    nav{display:grid;align-content:start;gap:.35rem;padding:1rem 0;overflow:auto}nav button,footer button{display:grid;grid-template-columns:2.2rem 1fr auto auto;min-height:54px;align-items:center;gap:.55rem;padding:.55rem .7rem;border:1px solid transparent;border-radius:10px;background:transparent;color:#fff8df;text-align:left}nav button:hover,nav button:focus-visible{border-color:#b8944b;background:#214f45}nav span,footer span{font-size:1.35rem;text-align:center}nav i{display:grid;min-width:1.35rem;height:1.35rem;place-items:center;border-radius:1rem;background:#a92720;color:#fff;font:900 .65rem sans-serif}nav em{color:#f5d36e;font-size:1.4rem;font-style:normal}footer{padding-top:.7rem;border-top:1px solid #b8944b66}footer button{width:100%;grid-template-columns:2.2rem 1fr;color:#ffc0b9}button{cursor:pointer}
  `]
})
export class AccountSideMenuComponent implements OnInit,OnDestroy{
  open=false;user:AppUser|null=null;pending=0;isAdmin=false;private sub=new Subscription();private oldOverflow='';
  constructor(private router:Router,private auth:AuthService,private battles:FriendBattleService,private admin:AdminAuthService){}
  ngOnInit(){this.sub.add(this.auth.currentUser$.subscribe(user=>{this.user=user;if(user)void this.checkAdmin()}));this.sub.add(this.auth.authReady$.pipe(filter(Boolean),take(1)).subscribe(()=>void this.checkAdmin()));this.sub.add(this.battles.observeIncomingInvitations().subscribe({next:x=>this.pending=x.filter(i=>i.status==='pending').length,error:()=>this.pending=0}));}
  ngOnDestroy(){this.sub.unsubscribe();this.unlock()}
  get displayName(){return this.user?.displayName||this.user?.username||'Explorer'} get initial(){return this.displayName.trim().charAt(0).toUpperCase()||'E'}
  get items():MenuItem[]{const items:MenuItem[]=[{label:'Home',icon:'✦',route:'/multiplayer'},{label:'Profile',icon:'👤',route:'/profile'},{label:'Matches',icon:'⚔️',route:'/matches',badge:this.pending},{label:'Friends',icon:'👥',route:'/friends'},{label:'Church',icon:'⛪',route:'/church'},{label:'Settings',icon:'⚙️',route:'/settings'}];if(this.isAdmin)items.push({label:'Content Studio',icon:'✦',route:'/admin'});return items}
  openMenu(){this.oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';this.open=true} closeMenu(){this.open=false;this.unlock()} private unlock(){document.body.style.overflow=this.oldOverflow}
  go(route:string){this.closeMenu();void this.router.navigate([route])} signOut(){this.closeMenu();this.auth.signOut().subscribe(()=>void this.router.navigate(['/']))}
  private async checkAdmin(){this.isAdmin=!!this.user&&await this.admin.ensureAdmin()}
}
