import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudioQuestion } from './admin.models';
import { QuestionRepository } from './question.repository';
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `<header>
      <div>
        <p>EDITORIAL WORKFLOW</p>
        <h1>Review queue</h1>
      </div>
      <span>{{ queue.length }} awaiting review</span>
    </header>
    <article *ngIf="current; else empty">
      <div class="meta">
        <b>{{ current.category }}</b
        ><span
          >{{ current.language.toUpperCase() }} · {{ current.difficulty }} ·
          {{ current.questionType.replaceAll('_', ' ') }}</span
        >
      </div>
      <h2>{{ current.prompt }}</h2>
      <section>
        <b>Correct answer</b>
        <p>{{ answer }}</p>
      </section>
      <section>
        <b>Explanation</b>
        <p>{{ current.explanation || 'No explanation provided.' }}</p>
        <small>{{
          current.scriptureReference || 'No Scripture reference'
        }}</small>
      </section>
      <div class="checks">
        <label *ngFor="let c of checks"
          ><input type="checkbox" /> {{ c }}</label
        >
      </div>
      <textarea
        #notes
        placeholder="Review notes or rejection reason…"
      ></textarea>
      <footer>
        <a [routerLink]="['/admin/questions', current.id]">Edit question</a
        ><button (click)="decide('draft')">Return to draft</button
        ><button class="reject" (click)="decide('rejected', notes.value)">
          Reject</button
        ><button class="publish" (click)="publish()">Publish</button>
      </footer>
    </article>
    <ng-template #empty
      ><div class="empty">
        <b>✓ Review queue is clear</b>
        <p>Questions submitted for review will appear here.</p>
        <a routerLink="/admin/questions">Open question library</a>
      </div></ng-template
    >`,
  styles: [
    `
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      header p {
        margin: 0;
        color: #26705f;
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.15em;
      }
      h1 {
        margin: 0.2rem 0;
        font: 900 2.1rem Georgia;
      }
      header > span {
        padding: 0.4rem 0.7rem;
        border-radius: 1rem;
        background: #dce9ff;
        color: #23569d;
      }
      article {
        max-width: 760px;
        margin: 1.5rem auto;
        padding: 1.5rem;
        border: 1px solid #d8e2dd;
        border-radius: 14px;
        background: white;
      }
      .meta {
        display: flex;
        justify-content: space-between;
        color: #587069;
        text-transform: capitalize;
        font-size: 0.75rem;
      }
      h2 {
        font: 900 1.7rem Georgia;
        line-height: 1.25;
      }
      section {
        padding: 1rem;
        margin: 0.7rem 0;
        border-radius: 8px;
        background: #f3f7f5;
      }
      section p {
        margin: 0.3rem 0;
      }
      .checks {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin: 1rem 0;
        font-size: 0.8rem;
      }
      textarea {
        width: 100%;
        box-sizing: border-box;
        min-height: 80px;
        padding: 0.7rem;
        border: 1px solid #c8d5d0;
        border-radius: 7px;
      }
      footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      footer > * {
        padding: 0.65rem 0.8rem;
        border: 1px solid #b7c5bf;
        border-radius: 7px;
        background: #fff;
        color: #234d43;
        text-decoration: none;
        font-weight: 800;
      }
      .reject {
        color: #a13c30;
      }
      .publish {
        background: #1d6958;
        color: #fff;
      }
      .empty {
        text-align: center;
        padding: 5rem 1rem;
        color: #61736d;
      }
      .empty b {
        font: 900 1.5rem Georgia;
        color: #21705d;
      }
      @media (max-width: 650px) {
        .checks {
          grid-template-columns: 1fr;
        }
        footer {
          flex-wrap: wrap;
        }
      }
    `,
  ],
})
export class AdminReviewPage implements OnInit {
  queue: StudioQuestion[] = [];
  checks = [
    'Answer verified',
    'Scripture reference checked',
    'Theological clarity',
    'Spelling and grammar',
    'Difficulty is appropriate',
    'Translation status checked',
  ];
  constructor(private repo: QuestionRepository) {}
  async ngOnInit() {
    this.queue = await this.repo.list('review');
  }
  get current() {
    return this.queue[0];
  }
  get answer() {
    const a = this.current?.answerData;
    if (!a) return '';
    if (a.type === 'multiple_choice')
      return a.options
        .filter((x) => a.correctOptionIds.includes(x.id))
        .map((x) => x.text)
        .join(', ');
    if (a.type === 'true_false') return String(a.correctValue);
    if (a.type === 'text') return a.primaryAnswer;
    if (a.type === 'map') return a.correctRegionId;
    return 'Ordered/paired answer configured';
  }
  async decide(status: 'draft' | 'rejected', reason = '') {
    if (!this.current) return;
    await this.repo.updateStatus(this.current.id, status, reason);
    this.queue.shift();
  }
  async publish() {
    if (!this.current) return;
    await this.repo.publish(this.current.id, this.current);
    this.queue.shift();
  }
}
