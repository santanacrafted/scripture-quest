import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS, MatchCategory,
  MULTIPLAYER_CATEGORIES, Question,
} from '../multiplayer.models';
import { QuestionService } from '../question.service';

type TestScreen = 'wheel' | 'transition' | 'question';

@Component({
  selector: 'app-admin-wheel-test-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main *ngIf="screen === 'wheel'" class="board">
      <header><button aria-label="Back" (click)="back()">‹</button><div><small>ADMIN ONLY</small><h1>Wheel Test Arena</h1></div><span>🧪</span></header>
      <section class="arena">
        <p class="verse">“Let your light so shine before men...” <b>Matthew 5:16</b></p>
        <div class="wheel-wrap"><div class="marker">▼</div>
          <div class="wheel" [class.spinning]="spinning" [style.transform]="'rotate(' + rotation + 'deg)'">
            <button *ngFor="let category of categories; let i = index" [style.--i]="i" [attr.aria-label]="'Test ' + label(category)" (click)="chooseCategory(category, $event)"><span>{{ icon(category) }}</span></button>
            <div class="hub">✦</div>
          </div>
        </div>
        <h2>{{ spinning ? 'THE WHEEL IS TURNING' : 'TEST YOUR KNOWLEDGE' }}</h2>
        <p class="help">Spin normally, or tap a wheel category to choose it.</p>
        <button class="gold" [disabled]="spinning" (click)="spinWheel()">{{ spinning ? 'Spinning…' : 'Spin test wheel' }}</button>
      </section>
      <section class="controls">
        <h3>Manual challenge</h3>
        <label>Category</label>
        <select [value]="manualCategory" (change)="selectManualCategory($event)"><option *ngFor="let category of categories" [value]="category">{{ icon(category) }} {{ label(category) }}</option></select>
        <label>Question type</label>
        <select [value]="selectedType" (change)="selectedType = $any($event.target).value"><option value="">Any available type</option><option *ngFor="let type of manualTypes" [value]="type">{{ formatType(type) }}</option></select>
        <button class="gold" (click)="startManualChallenge()">Start chosen challenge</button>
      </section>
    </main>

    <main *ngIf="screen === 'transition' && selectedCategory" class="transition" [style.--category]="color(selectedCategory)">
      <div class="glow"></div><div class="emblem">{{ icon(selectedCategory) }}</div>
      <p>{{ label(selectedCategory) }}</p><h2>Choosing your challenge</h2>
      <div class="roulette" [class.landed]="rouletteLanded"><div class="ring"><span *ngFor="let item of rouletteTypes; let i = index" [style.--slot]="i">{{ item.icon }}</span></div><div class="pointer">▼</div><strong>{{ displayedType }}</strong></div>
      <small>{{ rouletteLanded ? 'Challenge selected' : 'Searching the battle scrolls…' }}</small>
    </main>

    <main *ngIf="screen === 'question' && question" class="question-screen">
      <header class="question-header"><span>{{ icon(question.category) }} {{ label(question.category) }}</span><b>TEST MODE</b><span>∞ NO TIMER</span></header>
      <section class="question-card"><p class="type">{{ formatType(question.questionType) }}</p><h1>{{ question.text }}</h1>
        <button class="edit-question" type="button" (click)="editQuestion()">Edit this question in Studio</button>
        <figure *ngIf="question.questionType === 'pictionary'" class="pictionary-frame">
          <img *ngIf="question.media; else missingPictionaryImage" [src]="question.media.downloadUrl" [alt]="question.media.altText" />
          <ng-template #missingPictionaryImage><span>Image unavailable</span></ng-template>
        </figure>
        <div class="answers"><button *ngFor="let choice of question.choices; let i = index" [disabled]="answered" [class.correct]="answered && choice === question.correctAnswer" [class.wrong]="answered && selectedAnswer === choice && choice !== question.correctAnswer" (click)="answer(choice)"><i>{{ letters[i] }}</i>{{ choice }}</button></div>
        <button *ngIf="!answered" class="reveal" (click)="revealAnswer()">Reveal answer</button>
        <article *ngIf="answered"><strong>{{ selectedAnswer === question.correctAnswer ? 'A LIGHT SPARK!' : 'KEEP SEEKING' }}</strong><p *ngIf="selectedAnswer !== question.correctAnswer">Correct answer: {{ question.correctAnswer }}</p><p>{{ question.explanation }}</p><small>{{ question.reference }}</small><button class="continue" (click)="returnToWheel()">Return to wheel</button></article>
      </section>
    </main>
  `,
  styles: [`
    :host{display:block;min-height:100%;background:#07100f;color:#fff}main{box-sizing:border-box;min-height:100svh}.board{padding:calc(env(safe-area-inset-top) + .65rem) 1rem calc(env(safe-area-inset-bottom) + 1rem);background:radial-gradient(circle at 50% 42%,#276356,#122c29 38%,#07100f 78%)}header{display:grid;grid-template-columns:3rem 1fr 3rem;align-items:center;max-width:40rem;margin:auto;text-align:center}header button{width:42px;height:42px;border:1px solid #9e8143;border-radius:50%;background:#101817;color:#f5d36e;font-size:1.7rem}header small{color:#f5d36e;font-weight:900;letter-spacing:.16em}header h1{margin:.08rem;font:900 1.3rem Georgia}.arena{display:flex;flex-direction:column;align-items:center;text-align:center}.verse{font:italic .75rem Georgia;color:#d5c58f}.verse b{display:block}.wheel-wrap{position:relative;width:min(62vw,270px);margin:1.6rem auto .8rem}.marker{position:absolute;z-index:4;left:50%;top:-1.45rem;transform:translateX(-50%);color:#ffe078;font-size:2.2rem}.wheel{position:relative;aspect-ratio:1;border:8px solid #d8b15f;border-radius:50%;background:conic-gradient(#f59e4a 0 72deg,#4dd6a7 72deg 144deg,#b978ed 144deg 216deg,#4aa9f5 216deg 288deg,#f0c94a 288deg);box-shadow:0 0 0 5px #352711,0 18px 45px #000b;transition:transform 2.2s cubic-bezier(.12,.72,.18,1)}.wheel.spinning{pointer-events:none}.wheel button{position:absolute;inset:0;width:100%;height:100%;transform:rotate(calc(var(--i) * 72deg + 36deg));border:0;background:transparent;pointer-events:none}.wheel button span{position:absolute;left:50%;top:2%;padding:.4rem;transform:translateX(-50%) rotate(calc(var(--i) * -72deg - 36deg));border-radius:50%;font-size:1.9rem;pointer-events:auto}.hub{position:absolute;inset:38%;display:grid;place-items:center;border:4px solid #ecd17f;border-radius:50%;background:#173f39;color:#ffd970;font-size:2rem;pointer-events:none}.arena h2{margin:.3rem 0 0;font:900 1.2rem Georgia}.help{margin:.3rem;color:#b9cdc7;font-size:.78rem}.gold{min-height:46px;padding:.65rem 1.2rem;border:2px solid #ffe39a;border-radius:10px;background:linear-gradient(#ffe9a4,#d89e2f);color:#201707;font-weight:1000;text-transform:uppercase}.gold:disabled{opacity:.55}.controls{width:min(100%,34rem);box-sizing:border-box;margin:.9rem auto 0;padding:.85rem;border:1px solid #8b713b;border-radius:14px;background:#0d1817e8}.controls h3{margin:0 0 .6rem;color:#f5d36e;font:900 1rem Georgia;text-transform:uppercase}.controls label{display:block;margin:.5rem 0 .25rem;color:#c5d8d2;font-size:.72rem;font-weight:900;text-transform:uppercase}.controls select{box-sizing:border-box;width:100%;min-height:43px;padding:.55rem;border:1px solid #9e8143;border-radius:8px;background:#142a26;color:#fff}.controls .gold{width:100%;margin-top:.7rem}
    .transition{--category:#4dd6a7;position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;padding:1rem;background:radial-gradient(circle at center,color-mix(in srgb,var(--category) 72%,white 10%),color-mix(in srgb,var(--category) 45%,#06100e 55%) 48%,#06100e);text-align:center}.glow{position:absolute;width:70vmin;aspect-ratio:1;border-radius:50%;background:var(--category);filter:blur(70px);opacity:.3}.emblem{position:relative;display:grid;width:6rem;aspect-ratio:1;place-items:center;border:3px solid #ffe59a;border-radius:50%;background:#09201dd9;box-shadow:0 0 35px var(--category);font-size:3rem}.transition>p{position:relative;margin:.8rem 0 .15rem;color:#ffe48c;font-weight:900;letter-spacing:.16em;text-transform:uppercase}.transition>h2{position:relative;margin:0 0 1rem;font:900 clamp(1.55rem,7vw,2.5rem) Georgia;text-transform:uppercase}.roulette{position:relative;display:grid;width:min(76vw,19rem);aspect-ratio:1;place-items:center}.ring{position:absolute;inset:0;border:4px solid #f6d474;border-radius:50%;background:#071311dd;box-shadow:0 1rem 2.5rem #0008,inset 0 0 30px var(--category);animation:type-spin .72s linear infinite}.roulette.landed .ring{animation:none}.ring span{position:absolute;left:50%;top:50%;font-size:1.5rem;transform:rotate(calc(var(--slot) * 45deg)) translateY(-7.5rem) rotate(calc(var(--slot) * -45deg));transform-origin:0 0}.pointer{position:absolute;z-index:2;top:-.35rem;color:#ffe078;font-size:1.7rem}.roulette strong{position:relative;max-width:11rem;color:#fff;font:900 1.3rem Georgia;text-transform:uppercase}.transition>small{position:relative;color:#cce0da}@keyframes type-spin{to{transform:rotate(360deg)}}
    .question-screen{padding:calc(env(safe-area-inset-top) + .75rem) 1rem calc(env(safe-area-inset-bottom) + 1.25rem);background:radial-gradient(circle at top,#275e52,#081311 60%)}.question-header{display:flex;justify-content:space-between;color:#f3d675;font-size:.72rem;font-weight:900;text-transform:uppercase}.question-header b{color:#c2d8d1}.question-card{max-width:42rem;margin:clamp(1.25rem,5vh,3rem) auto 0;text-align:center}.type{color:#f5d36e;font-weight:900;letter-spacing:.18em;text-transform:uppercase}.question-card h1{margin:.65rem 0;font:900 clamp(1.45rem,6vw,2.65rem) Georgia;line-height:1.08;text-shadow:0 3px 10px #000}.question-card>img{width:100%;max-height:22rem;object-fit:contain;border:3px solid #e5c56b;border-radius:18px}.answers{display:grid;grid-template-columns:1fr 1fr;gap:.7rem;margin-top:1.3rem}.answers button{display:flex;min-height:56px;align-items:center;gap:.7rem;padding:.65rem;border:2px solid #8d7746;border-radius:12px;background:#122724;color:#fff;text-align:left;font-weight:800}.answers i{display:grid;min-width:30px;height:30px;place-items:center;border-radius:50%;background:#295d54;color:#f8da78;font-style:normal}.answers .correct{background:#17694f;border-color:#65e0a2}.answers .wrong{background:#7a2828;border-color:#f98c86}.reveal{margin-top:.75rem;border:0;background:none;color:#f5d36e;font-weight:900}.question-card article{margin-top:1rem;padding:1rem;border:1px solid #8d7746;border-radius:12px;background:#10241f}.question-card article>strong{color:#f5d36e;font:900 1.2rem Georgia}.question-card article p{color:#cbd9d5}.continue{display:block;width:100%;min-height:48px;margin-top:1rem;border:2px solid #ffe39a;border-radius:10px;background:linear-gradient(#ffe9a4,#d89e2f);color:#201707;font-weight:1000;text-transform:uppercase}
    .pictionary-frame{display:grid;width:100%;aspect-ratio:16/9;place-items:center;margin:.9rem 0 1rem;overflow:hidden;border:3px solid #e5c56b;border-radius:16px;background:#0d211d;box-shadow:0 12px 30px #0008,0 0 24px #e5c56b33}.pictionary-frame img{display:block;width:100%;height:100%;object-fit:contain}.pictionary-frame span{color:#d9c98f;font-weight:800}
    .edit-question{margin:.35rem 0 .6rem;padding:.55rem .8rem;border:1px solid #dfc16c;border-radius:8px;background:#10241f;color:#f5d36e;font-weight:900}
  `],
})
export class AdminWheelTestPage implements OnDestroy {
  readonly categories = MULTIPLAYER_CATEGORIES;
  readonly letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  readonly rouletteTypes = [{icon:'❓'},{icon:'📜'},{icon:'👤'},{icon:'🧩'},{icon:'🗺️'},{icon:'💬'},{icon:'🔀'},{icon:'✅'}];
  screen: TestScreen = 'wheel';
  manualCategory: MatchCategory = 'characters';
  selectedCategory: MatchCategory | null = null;
  selectedType = '';
  question: Question | undefined;
  selectedAnswer = '';
  answered = false;
  spinning = false;
  rouletteLanded = false;
  displayedType = 'Mystery challenge';
  rotation = 0;
  private timers: number[] = [];

  constructor(private readonly questions: QuestionService, private readonly router: Router) {}
  get manualTypes() { return this.questions.getBattleQuestionTypes(); }
  chooseCategory(category: MatchCategory, event: Event) { event.stopPropagation(); if (!this.spinning) this.beginTransition(category, ''); }
  selectManualCategory(event: Event) { this.manualCategory = (event.target as HTMLSelectElement).value as MatchCategory; this.selectedType = ''; }
  startManualChallenge() { this.beginTransition(this.manualCategory, this.selectedType); }
  spinWheel() {
    if (this.spinning) return;
    this.spinning = true;
    const index = Math.floor(Math.random() * this.categories.length);
    const target = this.categories[index];
    const current = ((this.rotation % 360) + 360) % 360;
    const targetRotation = (360 - (index * 72 + 36)) % 360;
    this.rotation += 1440 + ((targetRotation - current + 360) % 360);
    this.addTimer(() => { this.spinning = false; this.beginTransition(target, ''); }, 2250);
  }
  private beginTransition(category: MatchCategory, requestedType: string) {
    this.selectedCategory = category;
    this.screen = 'transition';
    this.rouletteLanded = false;
    let index = 0;
    const types = this.questions.getQuestionTypesForCategory(category);
    const interval = window.setInterval(() => { this.displayedType = this.formatType(types[index++ % types.length] || 'Mystery challenge'); }, 120);
    this.timers.push(interval);
    this.addTimer(() => {
      window.clearInterval(interval);
      const type = requestedType;
      this.question = type ? this.questions.getRandomQuestionByCategoryAndType(category, type) : this.questions.getRandomQuestionByCategory(category);
      this.displayedType = this.formatType(this.question?.questionType || type || 'Mystery challenge');
      this.rouletteLanded = true;
      this.addTimer(() => { this.answered = false; this.selectedAnswer = ''; this.screen = 'question'; }, 1000);
    }, 2000);
  }
  answer(choice: string) { this.selectedAnswer = choice; this.answered = true; }
  revealAnswer() { if (this.question) { this.selectedAnswer = ''; this.answered = true; } }
  editQuestion() { if (this.question) void this.router.navigate(['/admin/questions', this.question.id]); }
  returnToWheel() { this.question = undefined; this.answered = false; this.selectedAnswer = ''; this.screen = 'wheel'; }
  label(category: MatchCategory) { return CATEGORY_LABELS[category]; }
  icon(category: MatchCategory) { return CATEGORY_ICONS[category]; }
  color(category: MatchCategory) { return CATEGORY_COLORS[category]; }
  formatType(type: string) { return type.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase()); }
  back() { void this.router.navigate(['/multiplayer-battle']); }
  ngOnDestroy() { this.timers.forEach(timer => window.clearTimeout(timer)); }
  private addTimer(callback: () => void, delay: number) { this.timers.push(window.setTimeout(callback, delay)); }
}
