import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Question } from '../multiplayer.models';

@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm"
    >
      <div
        class="mb-4 flex items-center justify-between text-sm text-slate-500"
      >
        <span
          class="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700"
          >{{ question?.category }}</span
        >
        <span class="font-semibold text-slate-700">{{
          question?.difficulty
        }}</span>
      </div>

      <h2 class="text-xl font-semibold text-slate-900">{{ question?.text }}</h2>

      <div class="mt-5 space-y-3">
        <button
          *ngFor="let choice of question?.choices ?? []"
          class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left font-medium text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50"
          (click)="selectAnswer(choice)"
        >
          {{ choice }}
        </button>
      </div>
    </section>
  `,
})
export class QuestionCardComponent {
  @Input() question: Question | null = null;
  @Output() answerSelected = new EventEmitter<string>();

  selectAnswer(answer: string): void {
    this.answerSelected.emit(answer);
  }
}
