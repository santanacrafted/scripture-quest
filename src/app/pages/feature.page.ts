import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface FeaturePageData {
  title: string;
  subtitle: string;
  background: string;
}

@Component({
  selector: 'app-feature-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main
      class="route-page relative min-h-screen overflow-hidden bg-quest-dark text-white"
      [style.backgroundImage]="backgroundImage"
      [style.backgroundSize]="'cover'"
      [style.backgroundPosition]="'center'"
    >
      <button
        class="quest-back-button absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-quest-dark/95 font-serif text-2xl font-bold text-quest-gold"
        type="button"
        aria-label="Go back"
        (click)="goBack()"
      >
        ‹
      </button>

    </main>
  `,
  styles: [
    `
      .quest-back-button {
        border: 1px solid #332415;
        box-shadow:
          inset 0 1px 0 rgba(255, 244, 196, 0.22),
          inset 0 0 0 1px rgba(245, 197, 93, 0.72),
          inset 0 0 0 3px rgba(20, 13, 7, 0.56),
          0 12px 22px rgba(0, 0, 0, 0.36);
      }
    `,
  ],
})
export class FeaturePage {
  readonly page: FeaturePageData;
  readonly backgroundImage: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
  ) {
    this.page = this.route.snapshot.data as FeaturePageData;
    this.backgroundImage = `url(${this.page.background})`;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/multiplayer']);
  }
}
