import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QuestionReport, StudioQuestion } from './admin.models';
import { AdminOperationsService } from './admin-operations.service';
import { QuestionRepository } from './question.repository';
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<header>
      <div>
        <p>PLAYER FEEDBACK</p>
        <h1>Question reports</h1>
      </div>
      <select [(ngModel)]="filter" (change)="load()">
        <option value="">All reports</option>
        <option value="open">Open</option>
        <option value="reviewing">Reviewing</option>
        <option value="resolved">Resolved</option>
        <option value="dismissed">Dismissed</option>
      </select>
    </header>
    <div class="list">
      <article *ngFor="let r of reports">
        <div class="top">
          <span [class]="r.status">{{ r.status }}</span
          ><b>{{ label(r.reason) }}</b
          ><small>{{ date(r) }}</small>
        </div>
        <h2>
          {{ questions[r.questionId]?.prompt || 'Question ' + r.questionId }}
        </h2>
        <p>{{ r.details || 'No additional details were provided.' }}</p>
        <textarea #notes placeholder="Resolution notes…">{{
          r.resolutionNotes
        }}</textarea>
        <footer>
          <a [routerLink]="['/admin/questions', r.questionId]">Open question</a
          ><button (click)="act(r, 'reviewing', notes.value)">Reviewing</button
          ><button (click)="unpublish(r)">Unpublish</button
          ><button (click)="act(r, 'dismissed', notes.value)">Dismiss</button
          ><button class="resolve" (click)="act(r, 'resolved', notes.value)">
            Resolve
          </button>
        </footer>
      </article>
      <div class="empty" *ngIf="!reports.length">
        No question reports in this section.
      </div>
    </div>`,
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
      select {
        padding: 0.7rem;
        border: 1px solid #c7d4cf;
        border-radius: 8px;
      }
      .list {
        display: grid;
        gap: 0.8rem;
        margin-top: 1.5rem;
      }
      article {
        padding: 1.1rem;
        border: 1px solid #d8e1dd;
        border-radius: 12px;
        background: #fff;
      }
      .top {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        text-transform: capitalize;
      }
      .top span {
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        background: #ffedd1;
        color: #8b5c13;
        font-size: 0.7rem;
      }
      .top .resolved {
        background: #d9f3e8;
        color: #176449;
      }
      .top small {
        margin-left: auto;
        color: #75847f;
      }
      h2 {
        font: 900 1.2rem Georgia;
      }
      article p {
        color: #5e706a;
      }
      textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 0.6rem;
        border: 1px solid #ccd7d3;
        border-radius: 7px;
      }
      footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.4rem;
        margin-top: 0.7rem;
      }
      footer > * {
        padding: 0.55rem 0.7rem;
        border: 1px solid #b7c5bf;
        border-radius: 7px;
        background: #fff;
        color: #25594d;
        text-decoration: none;
        font-weight: 800;
      }
      .resolve {
        background: #1d6958;
        color: white;
      }
      .empty {
        text-align: center;
        padding: 4rem;
        color: #687a74;
      }
      @media (max-width: 700px) {
        footer {
          flex-wrap: wrap;
        }
        header {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class AdminReportsPage implements OnInit {
  reports: QuestionReport[] = [];
  questions: Record<string, StudioQuestion> = {};
  filter = 'open';
  constructor(
    private operations: AdminOperationsService,
    private repo: QuestionRepository
  ) {}
  async ngOnInit() {
    await this.load();
  }
  async load() {
    this.reports = await this.operations.reports(this.filter);
    for (const r of this.reports) {
      if (!this.questions[r.questionId]) {
        const q = await this.repo.get(r.questionId);
        if (q) this.questions[r.questionId] = q;
      }
    }
  }
  label(v: string) {
    return v.replaceAll('_', ' ');
  }
  date(r: QuestionReport) {
    return r.createdAt?.toDate?.().toLocaleDateString() || '';
  }
  async act(
    r: QuestionReport,
    status: 'reviewing' | 'resolved' | 'dismissed',
    notes = ''
  ) {
    await this.operations.resolveReport(r.id, status, notes);
    r.status = status;
  }
  async unpublish(r: QuestionReport) {
    await this.repo.bulkUpdate([r.questionId], {
      isActive: false,
      status: 'draft',
    });
    await this.act(r, 'reviewing', 'Question unpublished for correction.');
  }
}
