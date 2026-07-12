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
      ></textarea
      ><button class="parse" (click)="parse()">Parse and validate</button>
    </section>
    <section *ngIf="rows.length" class="results">
      <div class="summary">
        <b>{{ validCount }} ready</b
        ><span>{{ errorCount }} errors · {{ warningCount }} warnings</span
        ><button [disabled]="!validCount || busy" (click)="import()">
          {{ busy ? 'Importing…' : 'Import valid rows as drafts' }}
        </button>
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
        >language, category, question_type, difficulty, question, option_a,
        option_b, option_c, option_d, correct_answer, accepted_answers,
        explanation, scripture_reference, testament, book, topics, tags</code
      >
      <p>
        Complex answers can use <code>answer_data_json</code>. Every imported
        row is saved as an inactive Draft and must be reviewed before
        publishing.
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
  message = '';
  constructor(
    private parser: ImportService,
    private repo: QuestionRepository
  ) {}
  get placeholder() {
    return this.format === 'csv'
      ? 'Paste CSV including its header row…'
      : 'Paste a JSON array of question records…';
  }
  parse() {
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
  async import() {
    this.busy = true;
    try {
      const valid = this.rows
        .filter((x) => x.included && !this.hasErrors(x))
        .map((x) => x.question!);
      await this.repo.importDrafts(valid);
      this.rows = [];
      this.input = '';
      alert(`${valid.length} questions imported as drafts.`);
    } finally {
      this.busy = false;
    }
  }
}
