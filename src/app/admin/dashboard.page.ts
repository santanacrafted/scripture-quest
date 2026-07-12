import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuestionRepository } from './question.repository';
import { StudioQuestion, CATEGORIES, QuestionStats } from './admin.models';
import { AdminOperationsService } from './admin-operations.service';
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `<header>
      <div>
        <p>CONTENT STUDIO</p>
        <h1>Dashboard</h1>
        <span>Build a healthy, game-ready Bible question library.</span>
      </div>
      <a routerLink="/admin/questions/new">＋ Create question</a>
    </header>
    <div class="stats">
      <article>
        <b>{{ questions.length }}</b
        ><span>Total questions</span>
      </article>
      <article>
        <b>{{ count('published') }}</b
        ><span>Published</span>
      </article>
      <article>
        <b>{{ count('draft') }}</b
        ><span>Drafts</span>
      </article>
      <article>
        <b>{{ hard }}</b
        ><span>Hard + Expert</span>
      </article>
    </div>
    <h2>Content coverage</h2>
    <section class="coverage">
      <article *ngFor="let c of categories">
        <strong>{{ c[1] }}</strong
        ><b>{{ categoryCount(c[0]) }}</b
        ><small [class.warn]="categoryHard(c[0]) < 5"
          >{{ categoryHard(c[0]) }} challenge-ready
          {{ categoryHard(c[0]) < 5 ? '· Low coverage' : '' }}</small
        >
      </article>
    </section>
    <h2>Performance alerts</h2>
    <section class="alerts">
      <article *ngFor="let item of accuracyAlerts">
        <b>{{ item.question.prompt }}</b>
        <span
          >{{ item.question.difficulty }} ·
          {{ item.stats.accuracyRate | percent : '1.0-0' }} correct after
          {{ item.stats.timesServed }} plays</span
        >
        <a [routerLink]="['/admin/questions', item.question.id]">Review</a>
      </article>
      <p *ngIf="!accuracyAlerts.length">
        No difficulty conflicts detected from current gameplay data.
      </p>
    </section>`,
  styles: [
    `
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }
      *,
      *::before,
      *::after {
        box-sizing: border-box;
        min-width: 0;
      }
      header p {
        margin: 0;
        color: #26705f;
        font-size: 0.7rem;
        font-weight: 900;
        letter-spacing: 0.16em;
      }
      h1 {
        margin: 0.2rem 0;
        font: 900 2.2rem Georgia;
      }
      header span {
        color: #64756f;
      }
      header a {
        padding: 0.8rem 1rem;
        border-radius: 8px;
        background: #1d6958;
        color: white;
        text-decoration: none;
        font-weight: 800;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 1rem;
        margin: 2rem 0;
      }
      .stats article,
      .coverage article {
        padding: 1.2rem;
        border: 1px solid #dce4e0;
        border-radius: 12px;
        background: white;
        box-shadow: 0 3px 12px #173d3310;
      }
      .stats b {
        display: block;
        font-size: 2rem;
        color: #1d6958;
      }
      .stats span {
        color: #64756f;
        font-size: 0.8rem;
      }
      .coverage {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.8rem;
      }
      .coverage article > * {
        display: block;
      }
      .coverage article > b {
        font-size: 1.6rem;
        margin: 0.5rem 0;
      }
      .coverage small {
        color: #42816f;
      }
      .coverage .warn {
        color: #b56723;
      }
      .alerts {
        display: grid;
        gap: 0.6rem;
      }
      .alerts article {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 1rem;
        padding: 0.85rem;
        border-left: 4px solid #d48c30;
        background: white;
      }
      .alerts span {
        color: #765c35;
      }
      .alerts a {
        color: #1d6958;
      }
      .alerts p {
        color: #687973;
      }
      @media (max-width: 900px) {
        .stats {
          grid-template-columns: minmax(0, 1fr);
        }
        .coverage {
          grid-template-columns: 1fr;
        }
        header {
          align-items: flex-start;
          flex-direction: column;
        }
        .stats article,
        .coverage article {
          min-width: 0;
          overflow: hidden;
        }
        .stats span,
        .coverage small {
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .alerts article {
          grid-template-columns: 1fr;
        }
        .alerts article > * {
          min-width: 0;
        }
      }
    `,
  ],
})
export class AdminDashboardPage implements OnInit {
  questions: StudioQuestion[] = [];
  stats: QuestionStats[] = [];
  categories = CATEGORIES;
  constructor(
    private repo: QuestionRepository,
    private operations: AdminOperationsService
  ) {}
  async ngOnInit() {
    this.questions = await this.repo.list();
    this.stats = await this.operations.stats();
  }
  count(s: string) {
    return this.questions.filter((q) => q.status === s).length;
  }
  get hard() {
    return this.questions.filter(
      (q) =>
        ['hard', 'expert'].includes(q.difficulty) && q.status === 'published'
    ).length;
  }
  categoryCount(c: string) {
    return this.questions.filter((q) => q.category === c).length;
  }
  categoryHard(c: string) {
    return this.questions.filter(
      (q) =>
        q.category === c &&
        ['hard', 'expert'].includes(q.difficulty) &&
        q.status === 'published'
    ).length;
  }
  get accuracyAlerts() {
    return this.stats
      .map((stats) => ({
        stats,
        question: this.questions.find((q) => q.id === stats.questionId),
      }))
      .filter(
        (item): item is { stats: QuestionStats; question: StudioQuestion } =>
          !!item.question &&
          item.stats.timesServed >= 10 &&
          ((item.question.difficulty === 'easy' &&
            item.stats.accuracyRate < 0.45) ||
            (item.question.difficulty === 'expert' &&
              item.stats.accuracyRate > 0.8))
      );
  }
}
