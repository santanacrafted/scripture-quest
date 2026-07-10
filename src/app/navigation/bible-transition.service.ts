import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BibleTransitionService {
  private hasPlayedThisLaunch = false;

  get hasPlayed(): boolean {
    return this.hasPlayedThisLaunch;
  }

  markPlayed(): void {
    this.hasPlayedThisLaunch = true;
  }
}
