import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';
export const adminGuard: CanActivateFn = async () =>
  (await inject(AdminAuthService).ensureAdmin()) ||
  inject(Router).createUrlTree(['/multiplayer']);
