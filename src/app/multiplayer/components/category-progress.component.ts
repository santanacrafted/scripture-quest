import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  CategoryProgress,
  MatchCategoryProgressMap,
  MatchCategory,
  CATEGORY_LABELS,
} from '../multiplayer.models';

@Component({
  selector: 'app-category-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm"
    >
      <div class="mb-3 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-slate-800">Category progress</p>
          <p class="text-sm text-slate-500">
            Every correct answer grows a Bible learning streak.
          </p>
        </div>
      </div>

      <div class="space-y-3">
        <article
          *ngFor="let category of categories"
          class="rounded-2xl bg-slate-50 p-3"
        >
          <div class="mb-1 flex items-center justify-between text-sm">
            <span class="font-semibold text-slate-700">{{
              labels[category]
            }}</span>
            <span class="text-slate-500"
              >{{ getProgress(category).current }}/{{
                getProgress(category).target
              }}</span
            >
          </div>
          <div class="h-2 rounded-full bg-slate-200">
            <div
              class="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 transition-all"
              [style.width.%]="getPercent(category)"
            ></div>
          </div>
        </article>
      </div>
    </section>
  `,
})
export class CategoryProgressComponent {
  @Input() progress: MatchCategoryProgressMap = {};
  @Input() label = 'Player';

  readonly labels = CATEGORY_LABELS;
  readonly categories: MatchCategory[] = [
    'old_testament',
    'new_testament',
    'jesus_and_gospels',
    'bible_characters',
    'prophets_and_kings',
    'memory_verses',
  ];

  getPercent(category: MatchCategory): number {
    const item = this.getProgress(category);
    return Math.min(100, Math.round((item.current / item.target) * 100));
  }

  getProgress(category: MatchCategory): CategoryProgress {
    return this.progress[category] ?? { current: 0, target: 2, completed: false };
  }
}
