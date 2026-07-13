import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QuestionRepository } from './question.repository';
import { CATEGORIES, QUESTION_SCOPES, StudioQuestion, TYPES } from './admin.models';
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<header>
      <div>
        <p>QUESTION LIBRARY</p>
        <h1>Questions</h1>
      </div>
      <a routerLink="/admin/questions/new">＋ New question</a>
    </header>
    <section class="filters">
      <input
        [(ngModel)]="search"
        placeholder="Search prompts or references…"
      /><select [(ngModel)]="status">
        <option value="">All statuses</option>
        <option *ngFor="let s of statuses">{{ s }}</option></select
      ><select [(ngModel)]="category">
        <option value="">All categories</option>
        <option *ngFor="let c of categories" [value]="c[0]">{{ c[1] }}</option>
      </select
      ><select [(ngModel)]="questionType">
        <option value="">All question types</option>
        <option *ngFor="let type of types" [value]="type[0]">
          {{ type[1] }}
        </option>
      </select><select [(ngModel)]="scope">
        <option value="">All scopes</option>
        <option *ngFor="let item of scopes" [value]="item[0]">{{ item[1] }}</option>
      </select>
    </section>
    <section class="selection-tools" *ngIf="filtered.length">
      <span>{{
        selected.size
          ? selected.size + ' selected'
          : filtered.length + ' questions shown'
      }}</span>
      <button
        type="button"
        (click)="selectAllVisible()"
        [disabled]="selected.size === filtered.length"
      >
        Select all
      </button>
      <button
        type="button"
        (click)="clearSelection()"
        [disabled]="!selected.size"
      >
        Clear selection
      </button>
    </section>
    <section class="bulk" *ngIf="selected.size">
      <b>{{ selected.size }} selected</b>
      <button [disabled]="bulkBusy" (click)="publishSelected()">Publish</button>
      <button
        [disabled]="bulkBusy"
        (click)="bulk({ status: 'review', isActive: false })"
      >
        Move to review
      </button>
      <button [disabled]="bulkBusy" (click)="bulk({ isActive: true })">
        Activate
      </button>
      <button [disabled]="bulkBusy" (click)="bulk({ isActive: false })">
        Deactivate
      </button>
      <button
        [disabled]="bulkBusy"
        (click)="bulk({ status: 'archived', isActive: false })"
      >
        Archive
      </button>
      <button [disabled]="bulkBusy" class="danger" (click)="deleteSelected()">
        Delete
      </button>
    </section>
    <p class="notice" [class.error]="noticeKind === 'error'" *ngIf="notice">
      {{ notice }}
    </p>
    <div class="table">
      <table>
        <thead>
          <tr>
            <th><input type="checkbox" (change)="selectAll($event)" /></th>
            <th>Status</th>
            <th>Language</th>
            <th>Category</th>
            <th>Type</th>
            <th>Difficulty</th>
            <th>Scope</th>
            <th>Prompt</th>
            <th>Reference</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let q of filtered">
            <td class="select-cell">
              <input
                type="checkbox"
                [checked]="selected.has(q.id)"
                (change)="toggle(q.id)"
              />
            </td>
            <td data-label="Status">
              <span class="status" [class]="q.status">{{ q.status }}</span>
            </td>
            <td data-label="Language">{{ q.language.toUpperCase() }}</td>
            <td data-label="Category">{{ categoryName(q.category) }}</td>
            <td data-label="Type">{{ typeName(q.questionType) }}</td>
            <td data-label="Difficulty">
              <b>{{ q.difficulty }}</b>
            </td>
            <td data-label="Scope">{{ scopeName(q.scope) }}</td>
            <td class="prompt" data-label="Prompt">{{ q.prompt }}</td>
            <td data-label="Reference">{{ q.scriptureReference || '—' }}</td>
            <td class="action-cell">
              <a [routerLink]="['/admin/questions', q.id]">Edit</a>
              <button class="delete" (click)="deleteOne(q)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="empty" *ngIf="!filtered.length">
        No questions match these filters. Create your first question to begin.
      </p>
    </div>`,
  styles: [
    `
      header {
        display: flex;
        justify-content: space-between;
        align-items: center;
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
      header > a,
      td a {
        padding: 0.7rem 1rem;
        border-radius: 8px;
        background: #1d6958;
        color: #fff;
        text-decoration: none;
        font-weight: 800;
      }
      .filters {
        display: grid;
        grid-template-columns: 2fr repeat(4, 1fr);
        gap: 0.7rem;
        margin: 1.5rem 0;
      }
      .filters > * {
        height: 44px;
        padding: 0 0.7rem;
        border: 1px solid #cfdad5;
        border-radius: 8px;
        background: white;
      }
      .table {
        overflow: auto;
        border: 1px solid #dce4e0;
        border-radius: 12px;
        background: white;
      }
      .selection-tools {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
        margin: -0.7rem 0 1rem;
      }
      .selection-tools span {
        margin-right: auto;
        color: #60736c;
        font-size: 0.78rem;
        font-weight: 800;
      }
      .selection-tools button {
        padding: 0.5rem 0.7rem;
        border: 1px solid #b7c6c0;
        border-radius: 7px;
        background: #fff;
        color: #245a4d;
        font-weight: 800;
      }
      .selection-tools button:disabled {
        opacity: 0.45;
      }
      .bulk {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: -0.8rem 0 0.8rem;
        padding: 0.65rem;
        border-radius: 8px;
        background: #dfece7;
      }
      .bulk button {
        padding: 0.45rem 0.6rem;
        border: 1px solid #aebeb7;
        border-radius: 6px;
        background: #fff;
        color: #254f44;
        font-weight: 800;
      }
      .bulk button:disabled {
        opacity: 0.5;
      }
      .bulk .danger,
      .delete {
        color: #9d3027;
        border-color: #d8aaa5;
      }
      .notice {
        margin: 0 0 0.8rem;
        padding: 0.7rem;
        border-radius: 8px;
        background: #e2f3eb;
        color: #1e654f;
        font-weight: 800;
      }
      .notice.error {
        background: #fff0ed;
        color: #a13930;
      }
      .action-cell {
        display: flex;
        gap: 0.35rem;
      }
      .action-cell .delete {
        padding: 0.7rem 1rem;
        border: 1px solid #d8aaa5;
        border-radius: 8px;
        background: #fff;
        font-weight: 800;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        white-space: nowrap;
      }
      th,
      td {
        padding: 0.8rem;
        text-align: left;
        border-bottom: 1px solid #e8eeeb;
        font-size: 0.78rem;
      }
      th {
        background: #f7f9f8;
        color: #60716b;
        text-transform: uppercase;
        font-size: 0.65rem;
      }
      .prompt {
        max-width: 320px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .status {
        padding: 0.25rem 0.45rem;
        border-radius: 10px;
        background: #e7ecea;
        text-transform: capitalize;
      }
      .published {
        background: #d9f4e8;
        color: #176548;
      }
      .draft {
        background: #fff0c8;
        color: #805d09;
      }
      .review {
        background: #dce9ff;
        color: #23569d;
      }
      .empty {
        text-align: center;
        padding: 3rem;
        color: #6c7e78;
      }
      @media (max-width: 900px) {
        .filters {
          grid-template-columns: 1fr;
        }
        header {
          align-items: flex-start;
          gap: 1rem;
          flex-wrap: wrap;
        }
        header > div {
          min-width: 0;
        }
        header > a {
          padding: 0.6rem 0.75rem;
        }
        .bulk {
          flex-wrap: wrap;
          margin: 0 0 0.8rem;
        }
        .selection-tools {
          margin: -0.5rem 0 0.8rem;
          flex-wrap: wrap;
        }
        .selection-tools span {
          flex: 1 0 100%;
        }
        .selection-tools button {
          flex: 1;
          min-height: 44px;
        }
        .table {
          border: 0;
          background: transparent;
          overflow: visible;
        }
        table,
        tbody {
          display: block;
          width: 100%;
        }
        thead {
          display: none;
        }
        tr {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.65rem 0.8rem;
          margin: 0 0 0.75rem;
          padding: 1rem;
          border: 1px solid #dce4e0;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 3px 10px #173d330c;
          width: 100%;
          box-sizing: border-box;
        }
        td {
          display: block;
          min-width: 0;
          padding: 0;
          border: 0;
          white-space: normal;
          overflow-wrap: anywhere;
        }
        td::before {
          content: attr(data-label);
          display: block;
          margin-bottom: 0.18rem;
          color: #667871;
          font-size: 0.62rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .select-cell {
          position: absolute;
          right: 0.8rem;
          top: 0.8rem;
        }
        .select-cell::before,
        .action-cell::before {
          display: none;
        }
        .prompt {
          grid-column: 1/-1;
          max-width: none;
          font-weight: 800;
          font-size: 0.92rem;
          line-height: 1.35;
        }
        .action-cell {
          grid-column: 1/-1;
        }
        .action-cell a,
        .action-cell button {
          display: block;
          flex: 1;
          text-align: center;
          padding: 0.7rem;
        }
        .status {
          display: inline-block;
        }
        .empty {
          background: #fff;
          border-radius: 12px;
        }
      }
    `,
  ],
})
export class AdminQuestionsPage implements OnInit {
  questions: StudioQuestion[] = [];
  search = '';
  status = '';
  category = '';
  questionType = '';
  scope = '';
  statuses = ['draft', 'review', 'published', 'rejected', 'archived'];
  categories = CATEGORIES;
  types = TYPES;
  scopes = QUESTION_SCOPES;
  selected = new Set<string>();
  bulkBusy = false;
  notice = '';
  noticeKind: 'success' | 'error' = 'success';
  constructor(private repo: QuestionRepository) {}
  async ngOnInit() {
    this.questions = await this.repo.list();
  }
  get filtered() {
    const s = this.search.toLowerCase();
    return this.questions.filter(
      (q) =>
        (!s ||
          `${q.prompt} ${q.scriptureReference} ${q.scope}`.toLowerCase().includes(s)) &&
        (!this.status || q.status === this.status) &&
        (!this.category || q.category === this.category) &&
        (!this.questionType || q.questionType === this.questionType) &&
        (!this.scope || q.scope === this.scope)
    );
  }
  categoryName(v: string) {
    return this.categories.find((x) => x[0] === v)?.[1] || v;
  }
  typeName(v: string) {
    return this.types.find((x) => x[0] === v)?.[1] || v;
  }
  scopeName(v: string) {
    return this.scopes.find((x) => x[0] === v)?.[1] || v;
  }
  toggle(id: string) {
    this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id);
  }
  selectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.selected = checked
      ? new Set(this.filtered.map((q) => q.id))
      : new Set();
  }
  selectAllVisible() {
    this.selected = new Set(this.filtered.map((q) => q.id));
  }
  clearSelection() {
    this.selected.clear();
    this.selected = new Set(this.selected);
  }
  async bulk(changes: Partial<StudioQuestion>) {
    if (this.bulkBusy) return;
    this.bulkBusy = true;
    this.notice = '';
    try {
      const ids = [...this.selected];
      await this.repo.bulkUpdate(ids, changes);
      this.questions = this.questions.map((q) =>
        this.selected.has(q.id) ? { ...q, ...changes } : q
      );
      this.notice = `Updated ${ids.length} questions.`;
      this.noticeKind = 'success';
      this.selected.clear();
    } catch (error: any) {
      this.notice = this.errorText(error);
      this.noticeKind = 'error';
    } finally {
      this.bulkBusy = false;
    }
  }
  async publishSelected() {
    if (this.bulkBusy) return;
    this.bulkBusy = true;
    this.notice = 'Publishing selected questions…';
    const ids = [...this.selected];
    try {
      const result = await this.repo.bulkPublish(ids);
      this.questions = this.questions.map((q) =>
        ids.includes(q.id) && !result.failures.some((x) => x.id === q.id)
          ? { ...q, status: 'published', isActive: true }
          : q
      );
      this.notice = result.failures.length
        ? `${result.published} published. ${
            result.failures.length
          } failed: ${result.failures.map((x) => x.message).join(' ')}`
        : `Published ${result.published} questions.`;
      this.noticeKind = result.failures.length ? 'error' : 'success';
      if (!result.failures.length) this.selected.clear();
    } finally {
      this.bulkBusy = false;
    }
  }
  async deleteSelected() {
    const ids = [...this.selected];
    if (
      !ids.length ||
      !confirm(
        `Permanently delete ${ids.length} selected questions? This cannot be undone.`
      )
    )
      return;
    this.bulkBusy = true;
    try {
      await this.repo.bulkDelete(ids);
      this.questions = this.questions.filter((q) => !ids.includes(q.id));
      this.selected.clear();
      this.notice = `Deleted ${ids.length} questions.`;
      this.noticeKind = 'success';
    } catch (error: any) {
      this.notice = this.errorText(error);
      this.noticeKind = 'error';
    } finally {
      this.bulkBusy = false;
    }
  }
  async deleteOne(question: StudioQuestion) {
    if (!confirm(`Permanently delete “${question.prompt}”?`)) return;
    try {
      await this.repo.deleteQuestion(question.id);
      this.questions = this.questions.filter((q) => q.id !== question.id);
      this.selected.delete(question.id);
      this.notice = 'Question deleted.';
      this.noticeKind = 'success';
    } catch (error: any) {
      this.notice = this.errorText(error);
      this.noticeKind = 'error';
    }
  }
  private errorText(error: any) {
    return String(
      error?.message || 'The action could not be completed.'
    ).replace(/^FirebaseError:\s*/, '');
  }
}
