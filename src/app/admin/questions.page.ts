import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuestionRepository } from './question.repository';
import { CATEGORIES, QUESTION_SCOPES, QUESTION_SUPPORTED_MODES, StudioQuestion, TYPES } from './admin.models';
import { QuestionEditorPage } from './question-editor.page';
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, QuestionEditorPage],
  template: `<header>
      <div>
        <p>QUESTION LIBRARY</p>
        <h1>Questions</h1>
      </div>
      <a routerLink="/admin/questions/new">＋ New question</a>
    </header>
    <section class="filter-bar">
      <button type="button" class="open-filters" (click)="openFilters()">☰ Filters <b *ngIf="activeFilterCount">{{ activeFilterCount }}</b></button>
      <span>{{ activeFilterCount ? activeFilterCount + ' filters applied' : 'Showing all questions' }}</span>
      <button *ngIf="activeFilterCount" type="button" class="clear-link" (click)="clearFilters()">Clear filters</button>
    </section>
    <div class="filter-modal" *ngIf="filtersOpen" role="dialog" aria-modal="true" aria-label="Question filters" (click)="cancelFilters()">
      <section class="filter-panel" (click)="$event.stopPropagation()">
        <header><div><p>QUESTION LIBRARY</p><h2>Filter questions</h2></div><button type="button" class="modal-close" (click)="cancelFilters()" aria-label="Close">×</button></header>
        <div class="filters">
      <label class="search-filter">Search<input [(ngModel)]="draftFilters.search" placeholder="Search prompts or references…" /></label>
      <label>Status<select [(ngModel)]="draftFilters.status">
        <option value="">All statuses</option>
        <option *ngFor="let s of statuses">{{ s }}</option></select
      ></label><label>Activity<select [(ngModel)]="draftFilters.active">
        <option value="">All activity</option>
        <option value="active">Active</option>
        <option value="inactive">Not active</option>
      </select></label><label>Category<select [(ngModel)]="draftFilters.category">
        <option value="">All categories</option>
        <option *ngFor="let c of categories" [value]="c[0]">{{ c[1] }}</option>
      </select></label
      ><label>Question type<select [(ngModel)]="draftFilters.questionType">
        <option value="">All question types</option>
        <option *ngFor="let type of types" [value]="type[0]">
          {{ type[1] }}
        </option>
      </select></label><label>Scope<select [(ngModel)]="draftFilters.scope">
        <option value="">All scopes</option>
        <option *ngFor="let item of scopes" [value]="item[0]">{{ item[1] }}</option>
      </select></label><label>Game mode<select [(ngModel)]="draftFilters.supportedMode">
        <option value="">All modes</option>
        <option *ngFor="let item of supportedModes" [value]="item[0]">{{ item[1] }}</option>
      </select></label><label>Book<select [(ngModel)]="draftFilters.book" (ngModelChange)="draftFilters.chapter = ''">
        <option value="">All books</option>
        <option *ngFor="let item of books" [value]="item.id">{{ item.name }}</option>
      </select></label><label>Chapter<select [(ngModel)]="draftFilters.chapter" [disabled]="!draftFilters.book">
        <option value="">All chapters</option>
        <option *ngFor="let item of draftChapters" [value]="item">Chapter {{ item }}</option>
      </select></label>
        </div>
        <footer><button type="button" class="clear-modal" (click)="clearDraftFilters()">Clear all</button><span></span><button type="button" (click)="cancelFilters()">Cancel</button><button type="button" class="apply-filters" (click)="applyFilters()">Apply filters</button></footer>
      </section>
    </div>
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
      <button type="button" (click)="downloadJson()">Download filtered JSON</button>
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
            <th>Modes</th>
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
            <td data-label="Modes">{{ modeNames(q.supportedModes) }}</td>
            <td class="prompt" data-label="Prompt">{{ q.prompt }}</td>
            <td data-label="Reference">{{ q.scriptureReference || '—' }}</td>
            <td class="action-cell">
              <button class="edit" type="button" (click)="openEditor(q.id)">Edit</button>
              <button class="delete" (click)="deleteOne(q)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="empty" *ngIf="!filtered.length">
        No questions match these filters. Create your first question to begin.
      </p>
    </div>
    <div class="editor-modal" *ngIf="editingQuestionId" role="dialog" aria-modal="true" aria-label="Edit question" (click)="closeEditor(false)">
      <section class="editor-panel" (click)="$event.stopPropagation()">
        <app-question-editor-page [questionId]="editingQuestionId" [modal]="true" (closed)="closeEditor($event)"></app-question-editor-page>
      </section>
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
        grid-template-columns: 1fr 1fr;
        gap: 0.7rem;
        margin: 1rem 0;
      }
      .filters label { display:grid; gap:.35rem; color:#43544f; font-size:.75rem; font-weight:900; }
      .filters input,.filters select {
        height: 44px;
        padding: 0 0.7rem;
        border: 1px solid #cfdad5;
        border-radius: 8px;
        background: white;
      }
      .search-filter { grid-column:1/-1; }
      .filter-bar { display:flex; align-items:center; gap:.7rem; margin:1.4rem 0 1rem; }
      .filter-bar>span { color:#60736c; font-size:.8rem; font-weight:800; }
      .open-filters,.clear-link { min-height:42px; padding:.55rem .8rem; border:1px solid #afc1ba; border-radius:8px; background:#fff; color:#245a4d; font-weight:900; }
      .open-filters b { display:inline-grid; min-width:1.35rem; height:1.35rem; place-items:center; margin-left:.3rem; border-radius:50%; background:#1d6958; color:#fff; font-size:.7rem; }
      .clear-link { border:0; background:transparent; text-decoration:underline; }
      .filter-modal { position:fixed; z-index:1000; inset:0; display:grid; place-items:center; overflow:auto; padding:1rem; background:#071612b8; backdrop-filter:blur(4px); }
      .filter-panel { width:min(100%,720px); max-height:calc(100svh - 2rem); overflow:auto; padding:1.2rem; border:1px solid #c9d7d1; border-radius:14px; background:#f7f9f8; box-shadow:0 24px 70px #001b1380; }
      .filter-panel header { margin:0; }
      .filter-panel h2 { margin:.1rem 0; font:900 1.5rem Georgia; }
      .modal-close { width:40px; height:40px; border:1px solid #b7c8c1; border-radius:50%; background:#fff; color:#216450; font-size:1.5rem; }
      .filter-panel footer { display:grid; grid-template-columns:auto 1fr auto auto; gap:.6rem; position:sticky; bottom:-1.2rem; margin:1rem -1.2rem -1.2rem; padding:1rem 1.2rem; border-top:1px solid #d6e0dc; background:#f7f9f8f5; }
      .filter-panel footer button { min-height:42px; padding:.55rem .8rem; border:1px solid #afc1ba; border-radius:8px; background:#fff; color:#245a4d; font-weight:900; }
      .filter-panel footer .apply-filters { background:#1d6958; color:#fff; }
      .filter-panel footer .clear-modal { color:#a13a30; }
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
      .action-cell .edit { padding:.7rem 1rem; border:0; border-radius:8px; background:#1d6958; color:#fff; font-weight:800; }
      .editor-modal { position:fixed;z-index:1100;inset:0;overflow:auto;padding:clamp(.5rem,2vw,1.25rem);background:#071612c7;backdrop-filter:blur(5px); }
      .editor-panel { width:min(100%,1100px);min-height:calc(100svh - 2.5rem);margin:auto;padding:clamp(.75rem,2vw,1.5rem);border-radius:16px;background:#f7f9f8;box-shadow:0 24px 80px #00150f99; }
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
        .search-filter { grid-column:auto; }
        .filter-panel { padding:.9rem; }
        .filter-panel footer { grid-template-columns:1fr 1fr; margin:1rem -.9rem -.9rem; padding:.8rem .9rem; }
        .filter-panel footer span { display:none; }
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
  private readonly filterStorageKey = 'scripture-quest.studio.question-filters';
  questions: StudioQuestion[] = [];
  search = '';
  status = '';
  active = '';
  category = '';
  questionType = '';
  scope = '';
  supportedMode = '';
  book = '';
  chapter = '';
  filtersOpen = false;
  draftFilters = this.emptyFilters();
  private modalBodyOverflow = '';
  statuses = ['draft', 'review', 'published', 'rejected', 'archived'];
  categories = CATEGORIES;
  types = TYPES;
  scopes = QUESTION_SCOPES;
  supportedModes = QUESTION_SUPPORTED_MODES;
  selected = new Set<string>();
  bulkBusy = false;
  notice = '';
  noticeKind: 'success' | 'error' = 'success';
  editingQuestionId = '';
  constructor(private repo: QuestionRepository, private route: ActivatedRoute, private router: Router) {}
  async ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    let saved: any = {};
    try { saved = JSON.parse(localStorage.getItem(this.filterStorageKey) || '{}'); } catch { saved = {}; }
    const source = params.keys.some(key => ['search','status','active','category','type','scope','mode','book','chapter'].includes(key))
      ? { search:params.get('search'),status:params.get('status'),active:params.get('active'),category:params.get('category'),questionType:params.get('type'),scope:params.get('scope'),supportedMode:params.get('mode'),book:params.get('book'),chapter:params.get('chapter') }
      : saved;
    this.setAppliedFilters(source);
    this.questions = await this.repo.list();
    if (!params.keys.length && this.activeFilterCount) this.filtersChanged();
  }
  openEditor(id: string) {
    this.modalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.editingQuestionId = id;
  }
  async closeEditor(saved: boolean) {
    this.editingQuestionId = '';
    document.body.style.overflow = this.modalBodyOverflow;
    if (saved) {
      this.questions = await this.repo.list();
      this.notice = 'Question saved.';
      this.noticeKind = 'success';
    }
  }
  get books() {
    const values = new Map<string, string>();
    this.questions.flatMap(q => q.passages || []).forEach(p => values.set(p.bookId, p.bookName));
    return [...values].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }
  get chapters() {
    return this.chaptersFor(this.book);
  }
  get draftChapters() { return this.chaptersFor(this.draftFilters.book); }
  private chaptersFor(book: string) {
    const values = new Set<number>();
    this.questions.flatMap(q => q.passages || []).filter(p => p.bookId === book).forEach(p => {
      if (p.chapterStart && p.chapterEnd) for (let n = p.chapterStart; n <= p.chapterEnd; n++) values.add(n);
    });
    return [...values].sort((a, b) => a - b);
  }
  get filterParams() {
    return { search: this.search || null, status: this.status || null, active: this.active || null,
      category: this.category || null, type: this.questionType || null, scope: this.scope || null,
      mode: this.supportedMode || null, book: this.book || null, chapter: this.chapter || null };
  }
  filtersChanged() {
    localStorage.setItem(this.filterStorageKey, JSON.stringify(this.currentFilters()));
    void this.router.navigate([], { relativeTo: this.route, queryParams: this.filterParams, replaceUrl: true });
  }
  get activeFilterCount() { return Object.values(this.currentFilters()).filter(Boolean).length; }
  openFilters() {
    this.draftFilters = { ...this.currentFilters() };
    this.modalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.filtersOpen = true;
  }
  cancelFilters() { this.filtersOpen = false; document.body.style.overflow = this.modalBodyOverflow; }
  applyFilters() { this.setAppliedFilters(this.draftFilters); this.filtersChanged(); this.cancelFilters(); }
  clearDraftFilters() { this.draftFilters = this.emptyFilters(); }
  clearFilters() { this.setAppliedFilters(this.emptyFilters()); this.filtersChanged(); }
  private currentFilters() { return { search:this.search,status:this.status,active:this.active,category:this.category,questionType:this.questionType,scope:this.scope,supportedMode:this.supportedMode,book:this.book,chapter:this.chapter }; }
  private emptyFilters() { return { search:'',status:'',active:'',category:'',questionType:'',scope:'',supportedMode:'',book:'',chapter:'' }; }
  private setAppliedFilters(value: any) {
    this.search=value?.search||'';this.status=value?.status||'';this.active=value?.active||'';this.category=value?.category||'';this.questionType=value?.questionType||'';this.scope=value?.scope||'';this.supportedMode=value?.supportedMode||'';this.book=value?.book||'';this.chapter=value?.chapter||'';
  }
  get filtered() {
    const s = this.search.toLowerCase();
    return this.questions.filter(
      (q) =>
        (!s ||
          `${q.prompt} ${q.scriptureReference} ${q.scope} ${q.supportedModes.join(' ')}`.toLowerCase().includes(s)) &&
        (!this.status || q.status === this.status) &&
        (!this.active || q.isActive === (this.active === 'active')) &&
        (!this.category || q.category === this.category) &&
        (!this.questionType || q.questionType === this.questionType) &&
        (!this.scope || q.scope === this.scope) &&
        (!this.supportedMode || q.supportedModes.includes(this.supportedMode as any)) &&
        (!this.book || (q.passages || []).some(p => p.bookId === this.book && (!this.chapter ||
          (!!p.chapterStart && !!p.chapterEnd && +this.chapter >= p.chapterStart && +this.chapter <= p.chapterEnd))))
    );
  }
  downloadJson() {
    const clean = this.filtered.map(q => JSON.parse(JSON.stringify(q, (_key, value) =>
      value && typeof value === 'object' && typeof value.toDate === 'function' ? value.toDate().toISOString() : value
    )));
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url;
    link.download = `scripture-quest-questions-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
  modeNames(modes: string[]) {
    return modes.map(mode => this.supportedModes.find(x => x[0] === mode)?.[1] || mode).join(', ');
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
