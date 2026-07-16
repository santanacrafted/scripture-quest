import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ImportRow, ImportService } from './import.service';
import { QuestionRepository } from './question.repository';
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `<header>
      <div>
        <p>BULK CONTENT</p>
        <h1>Import questions</h1>
        <span>CSV, JSON, or pasted spreadsheet content</span>
      </div>
      <a routerLink="/admin/questions">Question library</a>
    </header>
    <section class="source">
      <div class="format">
        <button [class.on]="format === 'csv'" (click)="format = 'csv'">
          CSV / Spreadsheet</button
        ><button [class.on]="format === 'json'" (click)="format = 'json'">
          JSON</button
        ><label
          >Choose file<input
            type="file"
            accept=".csv,.json,text/csv,application/json"
            (change)="file($event)"
        /></label>
      </div>
      <textarea
        [(ngModel)]="input"
        rows="10"
        [placeholder]="placeholder"
      ></textarea>
      <div class="source-actions">
        <button type="button" class="clear" [disabled]="!input && !rows.length" (click)="clearInput()">Clear</button>
        <button type="button" class="paste" (click)="pasteFromClipboard()">Paste from clipboard</button>
        <button class="parse" (click)="parse()">Parse and validate</button>
      </div>
    </section>
    <div *ngIf="message" class="import-message" [class.error]="messageKind === 'error'" role="status" aria-live="polite">
      <b>{{ messageKind === 'error' ? 'Import did not complete' : 'Import complete' }}</b>
      <span>{{ message }}</span>
      <small *ngIf="messageKind === 'error'">Your parsed questions are still selected below. Correct the listed issues and try again.</small>
    </div>
    <section *ngIf="rows.length" class="results">
      <div class="summary">
        <b>{{ validCount }} ready</b
        ><span>{{ errorCount }} errors · {{ warningCount }} warnings</span
        ><button [disabled]="!validCount || busy" (click)="import(false)">{{ busyAction === 'draft' ? 'Importing drafts…' : 'Import as drafts' }}</button>
        <button [disabled]="!validCount || busy" (click)="import(true)">{{ busyAction === 'publish' ? 'Importing and publishing…' : 'Import and publish' }}</button>
      </div>
      <div class="rows">
        <article *ngFor="let row of rows" [class.bad]="hasErrors(row)">
          <input
            type="checkbox"
            [(ngModel)]="row.included"
            [disabled]="hasErrors(row)"
          /><b>Row {{ row.row }}</b
          ><span>{{ row.question?.prompt || 'Could not create question' }}</span
          ><small
            *ngFor="let issue of row.issues"
            [class.error]="issue.severity === 'error'"
            >{{ issue.severity }}: {{ issue.message }}</small
          >
        </article>
      </div>
    </section>
    <aside>
      <b>Expected CSV columns</b
      ><code
        >language, category, question_type, difficulty, scope, supported_modes, question, option_a,
        option_b, option_c, option_d, correct_answer, accepted_answers,
        explanation, scripture_reference, testament, scope_definition, topics, tags,
        media_storage_path, media_download_url, media_mime_type, media_alt_text</code
      >
      <p>
        <code>scope</code> is required and must be chapter, book, multi_book, or whole_bible.
        <code>supported_modes</code> is required and accepts quiz, battle, or quiz|battle.
        Use <code>scope_definition</code> like <code>Daniel:2,5; Revelation:2-3</code>.
        JSON imports must provide a structured <code>passages</code> array. Complex answers can use <code>answer_data_json</code>. Every imported
        verse completion, who said it, emoji challenge, odd one out, what happens next,
        and pictionary questions must have four multiple-choice options. Pictionary also requires image media with
        <code>storagePath</code>, <code>downloadUrl</code>, and <code>altText</code>.
      </p>
    </aside>`,
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
        font-size: 0.68rem;
        font-weight: 900;
        letter-spacing: 0.15em;
      }
      h1 {
        margin: 0.2rem 0;
        font: 900 2.1rem Georgia;
      }
      header span {
        color: #677973;
      }
      header a {
        color: #26705f;
      }
      .source,
      .results,
      aside {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        margin-top: 1rem;
        padding: 1.1rem;
        border: 1px solid #d9e2de;
        border-radius: 12px;
        background: #fff;
      }
      .import-message { display:grid; gap:.25rem; margin-top:1rem; padding:.9rem 1rem; border:1px solid #8fc5ae; border-left:5px solid #26705f; border-radius:9px; background:#e9f7f0; color:#185b48; }
      .import-message.error { border-color:#e2aaa3; border-left-color:#b54131; background:#fff1ef; color:#8c3027; }
      .import-message span { font-size:.88rem; }
      .import-message small { opacity:.85; }
      .format {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .format button,
      .format label,
      .parse,
      .summary button {
        padding: 0.65rem 0.8rem;
        border: 1px solid #b9c7c1;
        border-radius: 7px;
        background: #fff;
        font-weight: 800;
      }
      .source-actions { display:flex;justify-content:flex-end;gap:.55rem; }
      .source-actions button { min-height:42px;padding:.65rem .8rem;border:1px solid #b9c7c1;border-radius:7px;background:#fff;color:#245a4d;font-weight:800; }
      .source-actions .clear { color:#9d3027; }
      .source-actions button:disabled { opacity:.45; }
      .format .on,
      .parse,
      .summary button {
        background: #1d6958;
        color: white;
      }
      .format label {
        margin-left: auto;
      }
      .format input {
        display: none;
      }
      textarea {
        width: 100%;
        box-sizing: border-box;
        margin: 1rem 0;
        padding: 0.8rem;
        border: 1px solid #cbd7d2;
        border-radius: 8px;
        font: 12px monospace;
      }
      .summary {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .summary b {
        color: #1d6958;
      }
      .summary button {
        margin-left: auto;
      }
      .rows {
        max-height: 45vh;
        overflow: auto;
        margin-top: 1rem;
      }
      .rows article {
        display: grid;
        grid-template-columns: auto auto 1fr;
        gap: 0.35rem 0.7rem;
        padding: 0.7rem;
        border-top: 1px solid #e5ebe8;
      }
      .rows article > span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .rows small {
        grid-column: 3;
        color: #a06922;
      }
      .rows .error {
        color: #b13c31;
      }
      .rows .bad {
        background: #fff6f4;
      }
      aside code {
        display: block;
        margin: 0.6rem 0;
        padding: 0.7rem;
        background: #eef3f1;
        white-space: normal;
        font-size: 0.72rem;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      aside p {
        color: #61726d;
        font-size: 0.8rem;
      }
      @media (max-width: 900px) {
        header,
        .summary {
          align-items: flex-start;
          flex-direction: column;
        }
        .summary button {
          margin: 0;
        }
        .format {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        header {
          gap: 0.6rem;
        }
        header h1 {
          font-size: 1.75rem;
          line-height: 1.05;
        }
        header a {
          padding: 0.5rem 0;
        }
        .format > * {
          min-height: 48px;
          box-sizing: border-box;
          text-align: center;
        }
        .format label {
          grid-column: 1/-1;
          margin: 0;
          display: grid;
          place-items: center;
        }
        .source,
        .results,
        aside {
          padding: 0.85rem;
        }
        textarea {
          min-height: 230px;
          margin: 0.8rem 0;
          font-size: 16px;
          resize: vertical;
        }
        .parse {
          width: 100%;
          min-height: 48px;
        }
        .source-actions { display:grid;grid-template-columns:1fr 1fr; }
        .source-actions .parse { grid-column:1/-1; }
        .summary {
          gap: 0.45rem;
        }
        .summary button {
          width: 100%;
          min-height: 48px;
        }
        .rows {
          max-height: none;
          overflow: visible;
        }
        .rows article {
          grid-template-columns: auto 1fr;
        }
        .rows article > b {
          grid-column: 2;
        }
        .rows article > span {
          grid-column: 1/-1;
          white-space: normal;
          overflow-wrap: anywhere;
        }
        .rows small {
          grid-column: 1/-1;
          overflow-wrap: anywhere;
        }
        aside p,
        aside code {
          max-width: 100%;
          overflow-wrap: anywhere;
        }
      }
    `,
  ],
})
export class AdminImportPage {
  format: 'csv' | 'json' = 'csv';
  input = '';
  rows: ImportRow[] = [];
  busy = false;
  busyAction: '' | 'draft' | 'publish' = '';
  message = '';
  messageKind: 'success' | 'error' = 'success';
  constructor(
    private parser: ImportService,
    private repo: QuestionRepository
  ) {}
  get placeholder() {
    return this.format === 'csv'
      ? 'Paste CSV including its header row…'
      : 'Paste a JSON array of question records…';
  }
  clearInput() {
    this.input = '';
    this.rows = [];
    this.message = '';
  }
  async pasteFromClipboard() {
    this.message = '';
    try {
      if (!navigator.clipboard?.readText) throw new Error('Clipboard access is unavailable.');
      this.input = await navigator.clipboard.readText();
      if (!this.input) throw new Error('The clipboard is empty.');
      const trimmed = this.input.trim();
      this.format = trimmed.startsWith('[') || trimmed.startsWith('{') ? 'json' : 'csv';
      this.rows = [];
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Clipboard access was denied. Paste into the field manually.';
      this.messageKind = 'error';
    }
  }
  parse() {
    this.message = '';
    const trimmed = this.input.trim();
    const detectedFormat: 'csv' | 'json' =
      trimmed.startsWith('[') || trimmed.startsWith('{') ? 'json' : 'csv';
    this.format = detectedFormat;
    this.rows = this.parser.parse(this.input, detectedFormat);
    void this.checkDuplicates();
  }
  async checkDuplicates() {
    const existing = await this.repo.list();
    for (const row of this.rows) {
      if (
        row.question &&
        this.repo.findDuplicates(row.question, existing).length
      ) {
        row.issues.push({
          severity: 'warning',
          message: 'Potential duplicate of an existing question.',
        });
      }
    }
  }
  get validCount() {
    return this.rows.filter((x) => x.included && !this.hasErrors(x)).length;
  }
  get errorCount() {
    return this.rows
      .flatMap((x) => x.issues)
      .filter((x) => x.severity === 'error').length;
  }
  get warningCount() {
    return this.rows
      .flatMap((x) => x.issues)
      .filter((x) => x.severity === 'warning').length;
  }
  hasErrors(r: ImportRow) {
    return r.issues.some((x) => x.severity === 'error');
  }
  async file(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) {
      this.input = await f.text();
      const trimmed = this.input.trim();
      this.format =
        f.name.toLowerCase().endsWith('.json') ||
        trimmed.startsWith('[') ||
        trimmed.startsWith('{')
          ? 'json'
          : 'csv';
    }
  }
  async import(publish: boolean) {
    if (this.busy) return;
    this.busy = true;
    this.busyAction = publish ? 'publish' : 'draft';
    this.message = '';
    try {
      const valid = this.rows
        .filter((x) => x.included && !this.hasErrors(x))
        .map((x) => x.question!);
      const imported = await this.repo.importQuestions(valid, publish);
      this.rows = [];
      this.input = '';
      this.message = `${imported} question${imported === 1 ? '' : 's'} imported${publish ? ' and published for gameplay.' : ' as drafts.'}`;
      this.messageKind = 'success';
    } catch (error: any) {
      const details = error?.details || error?.customData?.details;
      const failures = Array.isArray(details?.failures) ? details.failures : [];
      const submittedRows = this.rows.filter(row => row.included && !this.hasErrors(row));
      for (const failure of failures) {
        const row = submittedRows[Number(failure.index)];
        for (const issue of failure.errors || []) {
          if (row && !row.issues.some(existing => existing.message === String(issue)))
            row.issues.push({ severity: 'error', message: String(issue) });
        }
      }
      this.message = this.importError(error, failures.length);
      this.messageKind = 'error';
    } finally {
      this.busy = false;
      this.busyAction = '';
    }
  }
  private importError(error: any, failureCount: number) {
    if (failureCount) return `${failureCount} question${failureCount === 1 ? '' : 's'} failed server validation. Details are shown on the affected rows.`;
    const code = String(error?.code || '');
    if (code.endsWith('permission-denied')) return 'Your administrator session is not authorized to import. Sign out and back in to refresh your admin access, then try again.';
    if (code.endsWith('unauthenticated')) return 'Your session expired. Sign in again and retry the import.';
    if (code.endsWith('already-exists')) return 'The file contains duplicate external IDs. Each externalId must be unique.';
    if (code.endsWith('not-found') || code.endsWith('unimplemented')) return 'The import service is not available in the deployed Firebase Functions. Deploy the latest Functions and retry.';
    let message = String(error?.message || 'The server rejected the import.').replace(/^FirebaseError:\s*/, '').replace(/^functions\/[a-z-]+:\s*/, '');
    if (/internal/i.test(message)) message = 'The server encountered an internal error. Check the Firebase Functions logs for bulkImportQuestions and confirm the latest Functions are deployed.';
    return message;
  }
}
