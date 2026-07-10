import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { filter, map, Observable, take } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.authReady$.pipe(
      filter(Boolean),
      take(1),
      map(() => {
        const user = this.authService.getCurrentUser();
        return user ? true : this.router.createUrlTree(['/login']);
      }),
    );
  }
}
