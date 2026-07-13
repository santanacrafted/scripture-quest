import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CATEGORIES,
  ContentQuestionType,
  QuestionAnswerData,
  StudioQuestion,
  TYPES,
} from './admin.models';
import { QuestionRepository } from './question.repository';
import { MediaService } from './media.service';
import { formatBiblicalScope, parseBiblicalScope, scopeTokens } from './biblical-scope';
@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `<header>
      <div>
        <p>{{ id ? 'EDIT QUESTION' : 'NEW QUESTION' }}</p>
        <h1>{{ id ? 'Edit question' : 'Create question' }}</h1>
      </div>
      <span
        class="status-pill"
        [class.error]="messageKind === 'error'"
        [class.success]="messageKind === 'success'"
        *ngIf="message"
        >{{ message }}</span
      >
    </header>
    <div class="error-panel" *ngIf="validationErrors.length" role="alert">
      <b
        >Please fix {{ validationErrors.length }}
        {{ validationErrors.length === 1 ? 'item' : 'items' }}:</b
      >
      <ul>
        <li *ngFor="let error of validationErrors">{{ error }}</li>
      </ul>
    </div>
    <form [formGroup]="form" (ngSubmit)="save(false)">
      <div class="workspace">
        <div class="fields">
          <section>
            <h2>Basic information</h2>
            <div class="grid">
              <label
                >Language<select formControlName="language">
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                </select></label
              ><label
                >Category<select formControlName="category">
                  <option *ngFor="let c of categories" [value]="c[0]">
                    {{ c[1] }}
                  </option>
                </select></label
              ><label
                >Question type<select
                  formControlName="questionType"
                  (change)="resetAnswers()"
                >
                  <option *ngFor="let t of types" [value]="t[0]">
                    {{ t[1] }}
                  </option>
                </select></label
              ><label
                >Difficulty<select formControlName="difficulty">
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                  <option value="expert">👑 Expert</option>
                </select></label
              >
            </div>
            <div class="grid">
              <label
                >Translation group
                <input
                  formControlName="translationGroupId"
                  placeholder="noah_ark_builder"
                />
              </label>
              <label
                >Content concept ID
                <input
                  formControlName="contentConceptId"
                  placeholder="noah_builds_ark"
                />
              </label>
            </div>
            <label
              >Question prompt<textarea
                formControlName="prompt"
                rows="3"
                placeholder="Write a clear question…"
              ></textarea
              ><small
                >{{ form.value.prompt?.length || 0 }} characters</small
              ></label
            >
            <div class="grid">
              <label
                >Scripture reference<input
                  formControlName="scriptureReference"
                  placeholder="Genesis 6–9" /></label
              >
            </div>
            <label>Biblical quiz scope
              <input formControlName="scopeDefinition" placeholder="Daniel:2,5; Revelation:2-3" />
              <small>Use semicolons between books, commas between chapters, and hyphens for ranges.</small>
            </label>
            <label
              >Explanation<textarea
                formControlName="explanation"
                rows="3"
                placeholder="Explain why the answer is correct…"
              ></textarea>
            </label>
          </section>
          <section>
            <h2>Answer configuration</h2>
            <ng-container [ngSwitch]="answerKind"
              ><div *ngSwitchCase="'multiple_choice'" formArrayName="options">
                <label *ngFor="let control of options.controls; let i = index"
                  >Option {{ letters[i] }}
                  <span
                    ><input [formControlName]="i" /><input
                      type="radio"
                      [formControl]="form.controls.correctIndex"
                      [value]="i"
                      (change)="setCorrect(i)"
                    />
                    Correct</span
                  ></label
                >
              </div>
              <label *ngSwitchCase="'true_false'"
                >Correct answer<select formControlName="trueAnswer">
                  <option [ngValue]="true">True</option>
                  <option [ngValue]="false">False</option>
                </select></label
              ><label *ngSwitchCase="'map'"
                >Correct region ID<input
                  formControlName="primaryAnswer"
                  placeholder="bethlehem" /></label
              ><ng-container *ngSwitchCase="'sequence'"
                ><label
                  >Items in correct order<textarea
                    formControlName="primaryAnswer"
                    rows="6"
                    placeholder="One item per line"
                  ></textarea></label></ng-container
              ><ng-container *ngSwitchCase="'match_pairs'"
                ><label
                  >Pairs<textarea
                    formControlName="primaryAnswer"
                    rows="6"
                    placeholder="Moses | Sinai&#10;Jesus | Bethlehem"
                  ></textarea></label></ng-container
              ><ng-container *ngSwitchDefault
                ><label
                  >Primary answer<input
                    formControlName="primaryAnswer" /></label
                ><label
                  >Accepted alternate answers<input
                    formControlName="acceptedAnswers"
                    placeholder="Separate with commas" /></label
                ><label class="check"
                  ><input type="checkbox" formControlName="caseSensitive" />
                  Case sensitive</label
                ></ng-container
              ></ng-container
            >
          </section>
          <section>
            <h2>Biblical metadata</h2>
            <div class="grid">
              <label
                >Testament<select formControlName="testament">
                  <option value="">Not set</option>
                  <option value="old">Old Testament</option>
                  <option value="new">New Testament</option>
                </select></label
              ><label
                >Tags<input
                  formControlName="tags"
                  placeholder="Noah, Ark, Faith"
              /></label>
            </div>
          </section>
          <section>
            <h2>Question media</h2>
            <label
              >Upload illustration or map<input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                (change)="uploadMedia($event)"
            /></label>
            <div *ngIf="media" class="media-preview">
              <img [src]="media.downloadUrl" [alt]="media.altText" /><button
                type="button"
                (click)="removeMedia()"
              >
                Remove image
              </button>
            </div>
            <label *ngIf="media"
              >Image alt text<input
                formControlName="mediaAltText"
                placeholder="Describe the image for accessibility"
            /></label>
            <small *ngIf="form.value.questionType === 'pictionary'">
              Pictionary displays this image above four multiple-choice answers.
            </small>
          </section>
        </div>
        <aside>
          <h2>Mobile preview</h2>
          <div class="phone">
            <div class="timer">{{ categoryLabel }} <b>20s</b></div>
            <small>{{ difficultyLabel }}</small>
            <h3>
              {{ form.value.prompt || 'Your question prompt appears here.' }}
            </h3>
            <img
              *ngIf="form.value.questionType === 'pictionary' && media"
              class="phone-pictionary"
              [src]="media.downloadUrl"
              [alt]="form.value.mediaAltText || media.altText"
            />
            <button *ngFor="let answer of previewAnswers; let i = index">
              <i>{{ answerKind === 'sequence' ? i + 1 : letters[i] }}</i
              >{{ answer || 'Answer option' }}
            </button>
            <p *ngIf="form.value.scriptureReference">
              {{ form.value.scriptureReference }}
            </p>
          </div>
          <div class="validation">
            <b>Publishing checklist</b
            ><span [class.ok]="(form.value.prompt || '').length >= 10"
              >{{ (form.value.prompt || '').length >= 10 ? '✓' : '○' }} Clear
              prompt</span
            ><span [class.ok]="hasAnswer"
              >{{ hasAnswer ? '✓' : '○' }} Complete answer</span
            ><span [class.ok]="!!form.value.scriptureReference"
              >{{ form.value.scriptureReference ? '✓' : '○' }} Scripture
              reference</span
            >
          </div>
        </aside>
      </div>
      <footer>
        <button
          *ngIf="id"
          type="button"
          [disabled]="!!busyAction"
          (click)="duplicateTranslation()"
        >
          Create
          {{ form.value.language === 'en' ? 'Spanish' : 'English' }} draft
        </button>
        <button type="button" [disabled]="!!busyAction" (click)="save(false)">
          {{ busyAction === 'draft' ? 'Saving…' : 'Save draft' }}</button
        ><button
          type="button"
          [disabled]="!!busyAction"
          class="review"
          (click)="save(false, 'review')"
        >
          {{
            busyAction === 'review' ? 'Submitting…' : 'Submit for review'
          }}</button
        ><button
          type="button"
          [disabled]="!!busyAction"
          class="publish"
          (click)="save(true)"
        >
          {{ busyAction === 'publish' ? 'Publishing…' : 'Publish' }}
        </button>
      </footer>
    </form>`,
  styles: [
    `
      :host {
        display: block;
      }
      *,
      *::before,
      *::after {
        box-sizing: border-box;
        min-width: 0;
      }
      header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      header > a {
        color: #276b5b;
        text-decoration: none;
      }
      header div {
        flex: 1;
      }
      header p {
        margin: 0;
        color: #26705f;
        font-size: 0.65rem;
        font-weight: 900;
        letter-spacing: 0.14em;
      }
      h1 {
        margin: 0.15rem 0;
        font: 900 2rem Georgia;
      }
      header span {
        color: #27705e;
      }
      .error {
        color: #b54131 !important;
      }
      .status-pill {
        max-width: 20rem;
        padding: 0.5rem 0.7rem;
        border-radius: 8px;
        background: #e7f4ef;
        color: #216450;
        font-size: 0.78rem;
        font-weight: 800;
      }
      .status-pill.error {
        background: #fff0ed;
        color: #ae3d31;
      }
      .status-pill.success {
        background: #dff5e9;
        color: #176348;
      }
      .error-panel {
        margin: 0 0 1rem;
        padding: 0.85rem 1rem;
        border: 1px solid #e4a39a;
        border-left: 5px solid #c54b3c;
        border-radius: 8px;
        background: #fff3f1;
        color: #852f26;
      }
      .error-panel ul {
        margin: 0.4rem 0 0;
        padding-left: 1.2rem;
      }
      .error-panel li {
        margin: 0.2rem 0;
        font-size: 0.82rem;
      }
      .workspace {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 340px;
        gap: 1rem;
      }
      .fields {
        display: grid;
        gap: 1rem;
      }
      .fields section,
      aside {
        padding: 1.2rem;
        border: 1px solid #dce4e0;
        border-radius: 12px;
        background: #fff;
      }
      .fields h2,
      aside h2 {
        margin: 0 0 1rem;
        font: 900 1.15rem Georgia;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.8rem;
      }
      label {
        display: grid;
        gap: 0.35rem;
        margin: 0.7rem 0;
        color: #43544f;
        font-size: 0.75rem;
        font-weight: 800;
      }
      input,
      select,
      textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 0.7rem;
        border: 1px solid #cbd8d2;
        border-radius: 7px;
        background: #fbfcfb;
        font: inherit;
        font-size: 0.85rem;
      }
      label span {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 0.5rem;
      }
      label span input[type='radio'] {
        width: auto;
      }
      .check {
        display: flex;
      }
      .media-preview {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
      }
      .media-preview img {
        width: 180px;
        max-height: 140px;
        object-fit: cover;
        border-radius: 8px;
      }
      .media-preview button {
        padding: 0.5rem;
        border: 1px solid #c6d2cd;
        border-radius: 6px;
        background: white;
      }
      .check input {
        width: auto;
      }
      aside {
        align-self: start;
        position: sticky;
        top: 1rem;
      }
      .phone {
        padding: 1rem;
        border: 8px solid #17221f;
        border-radius: 28px;
        background: radial-gradient(circle at top, #285e53, #081311 70%);
        color: #fff;
        min-height: 390px;
        text-align: center;
      }
      .timer {
        display: flex;
        justify-content: space-between;
        color: #f4d777;
        font-size: 0.65rem;
      }
      .phone > small {
        text-transform: uppercase;
        color: #a8c7be;
      }
      .phone h3 {
        font: 900 1.25rem Georgia;
        margin: 2rem 0 1rem;
      }
      .phone-pictionary {
        display: block;
        width: 100%;
        height: 150px;
        margin-top: 0.75rem;
        border: 2px solid #e5c56b;
        border-radius: 10px;
        object-fit: contain;
        background: #0d211d;
      }
      .phone button {
        display: flex;
        width: 100%;
        align-items: center;
        gap: 0.5rem;
        margin: 0.45rem 0;
        padding: 0.65rem;
        border: 1px solid #8f7743;
        border-radius: 7px;
        background: #142a26;
        color: #fff;
        text-align: left;
      }
      .phone i {
        display: grid;
        place-items: center;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #286054;
        color: #f6d878;
        font-style: normal;
      }
      .phone p {
        color: #f1d276;
        font-size: 0.7rem;
      }
      .validation {
        display: grid;
        gap: 0.4rem;
        margin-top: 1rem;
      }
      .validation span {
        font-size: 0.75rem;
        color: #947832;
      }
      .validation .ok {
        color: #24705e;
      }
      footer {
        position: sticky;
        bottom: 0;
        display: flex;
        justify-content: flex-end;
        gap: 0.6rem;
        margin-top: 1rem;
        padding: 1rem;
        border-top: 1px solid #d7e0dc;
        background: #f3f5f3ee;
      }
      footer button {
        padding: 0.75rem 1rem;
        border: 1px solid #aebcb6;
        border-radius: 8px;
        background: #fff;
        font-weight: 800;
      }
      footer button:disabled {
        cursor: wait;
        opacity: 0.55;
        filter: grayscale(0.35);
      }
      footer button:not(:disabled):active {
        transform: translateY(1px);
        filter: brightness(0.92);
      }
      .review {
        color: #245c91;
      }
      .publish {
        background: #1d6958 !important;
        color: #fff;
      }
      @media (max-width: 1100px) {
        .workspace {
          grid-template-columns: 1fr;
        }
        aside {
          position: static;
        }
      }
      @media (max-width: 900px) {
        :host {
          display: block;
          width: 100%;
          overflow: hidden;
        }
        header {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
          margin-bottom: 0.7rem;
        }
        header > div {
          min-width: 0;
        }
        header h1 {
          font-size: 1.6rem;
        }
        .status-pill {
          grid-column: 1/-1;
          max-width: none;
        }
        .fields section,
        aside {
          padding: 0.9rem;
          border-radius: 10px;
        }
        .workspace {
          display: block;
        }
        .fields {
          gap: 0.7rem;
        }
        .phone {
          min-height: 300px;
          border-width: 5px;
        }
        aside {
          margin-top: 0.7rem;
        }
        input,
        select,
        textarea {
          min-height: 46px;
          font-size: 16px;
        }
        textarea {
          min-height: 90px;
        }
        .grid {
          grid-template-columns: 1fr;
        }
        footer {
          position: sticky;
          z-index: 15;
          bottom: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.45rem;
          margin: 1rem -0.85rem -0.85rem;
          padding: 0.7rem 0.85rem calc(0.7rem + env(safe-area-inset-bottom));
          box-shadow: 0 -8px 20px #173d3318;
        }
        footer button {
          min-height: 48px;
          padding: 0.6rem;
          font-size: 0.78rem;
        }
        .media-preview {
          flex-direction: column;
        }
        .media-preview img {
          width: 100%;
          height: auto;
          max-height: 220px;
        }
      }
    `,
  ],
})
export class QuestionEditorPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  id = '';
  message = '';
  messageKind: 'info' | 'success' | 'error' = 'info';
  validationErrors: string[] = [];
  busyAction: '' | 'draft' | 'review' | 'publish' | 'translation' | 'media' =
    '';
  categories = CATEGORIES;
  types = TYPES;
  letters = ['A', 'B', 'C', 'D'];
  form = this.fb.group({
    language: ['en', Validators.required],
    category: ['characters', Validators.required],
    questionType: ['multiple_choice', Validators.required],
    difficulty: ['easy', Validators.required],
    prompt: ['', [Validators.required, Validators.minLength(10)]],
    scriptureReference: [''],
    scopeDefinition: [''],
    explanation: [''],
    testament: [''],
    tags: [''],
    translationGroupId: [''],
    contentConceptId: [''],
    mediaAltText: [''],
    primaryAnswer: [''],
    acceptedAnswers: [''],
    caseSensitive: [false],
    trueAnswer: [true],
    correctIndex: [0],
    options: this.fb.array(
      ['', '', '', ''].map((x) => this.fb.control(x, Validators.required))
    ),
  });
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private repo: QuestionRepository,
    private mediaService: MediaService
  ) {}
  media: StudioQuestion['media'];
  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('questionId') || '';
    if (this.id) {
      const q = await this.repo.get(this.id);
      if (q) {
        this.media = q.media;
        this.form.patchValue({
          ...q,
          scopeDefinition: formatBiblicalScope(q.passages || []),
          tags: q.tags.join(','),
          primaryAnswer: this.primary(q.answerData),
          acceptedAnswers:
            q.answerData.type === 'text'
              ? q.answerData.acceptedAnswers.join(',')
              : '',
          trueAnswer:
            q.answerData.type === 'true_false'
              ? q.answerData.correctValue
              : true,
          mediaAltText: q.media?.altText || '',
        });
        if (q.answerData.type === 'multiple_choice') {
          q.answerData.options.forEach((o, i) =>
            this.options.at(i).setValue(o.text)
          );
          this.form.patchValue({
            correctIndex:
              Number(q.answerData.correctOptionIds[0]?.replace('o', '')) || 0,
          });
        }
      }
    }
  }
  get options() {
    return this.form.controls.options;
  }
  get answerKind() {
    const t = this.form.value.questionType as ContentQuestionType;
    if (t === 'multiple_choice' || t === 'pictionary')
      return 'multiple_choice';
    if (t === 'true_false') return t;
    if (t === 'sequence' || t === 'arrange_verse') return 'sequence';
    if (t === 'match_pairs') return t;
    if (t === 'map_challenge') return 'map';
    return 'text';
  }
  get categoryLabel() {
    return (
      this.categories.find((x) => x[0] === this.form.value.category)?.[1] || ''
    );
  }
  get difficultyLabel() {
    return this.form.value.difficulty;
  }
  get previewAnswers() {
    return this.answerKind === 'match_pairs'
      ? (this.form.value.primaryAnswer || '')
          .split('\n')
          .map((item) => item.trim().replace('|', ' → '))
          .filter(Boolean)
      : this.answerKind === 'sequence'
      ? (this.form.value.primaryAnswer || '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean)
      : this.answerKind === 'multiple_choice'
      ? this.options.value
      : this.answerKind === 'true_false'
      ? ['True', 'False']
      : ['Type your answer…'];
  }
  get hasAnswer() {
    return this.answerKind === 'multiple_choice'
      ? this.options.value.every(Boolean)
      : this.answerKind === 'true_false' || !!this.form.value.primaryAnswer;
  }
  setCorrect(i: number) {
    this.form.controls.correctIndex.setValue(i);
  }
  resetAnswers() {
    this.message = 'Answer fields updated for the selected type.';
    this.messageKind = 'info';
    this.validationErrors = [];
  }
  primary(a: QuestionAnswerData) {
    if (a.type === 'text') return a.primaryAnswer;
    if (a.type === 'map') return a.correctRegionId;
    if (a.type === 'sequence') return a.items.map((x) => x.text).join('\n');
    if (a.type === 'arrange_verse')
      return a.segments.map((x) => x.text).join('\n');
    if (a.type === 'match_pairs')
      return a.pairs.map((x) => `${x.left} | ${x.right}`).join('\n');
    return '';
  }
  buildAnswer(): QuestionAnswerData {
    const v = this.form.getRawValue();
    if (this.answerKind === 'multiple_choice')
      return {
        type: 'multiple_choice',
        options: v.options.map((text, i) => ({
          id: `o${i}`,
          text: text || '',
        })),
        correctOptionIds: [`o${v.correctIndex || 0}`],
      };
    if (this.answerKind === 'true_false')
      return { type: 'true_false', correctValue: !!v.trueAnswer };
    if (this.answerKind === 'map')
      return { type: 'map', correctRegionId: v.primaryAnswer || '' };
    const lines = (v.primaryAnswer || '').split('\n').filter(Boolean);
    if (this.answerKind === 'sequence')
      return v.questionType === 'arrange_verse'
        ? {
            type: 'arrange_verse',
            segments: lines.map((text, i) => ({
              id: `s${i}`,
              text,
              correctPosition: i,
            })),
          }
        : {
            type: 'sequence',
            items: lines.map((text, i) => ({
              id: `s${i}`,
              text,
              correctPosition: i,
            })),
          };
    if (this.answerKind === 'match_pairs')
      return {
        type: 'match_pairs',
        pairs: lines.map((line, i) => {
          const [left, right] = line.split('|');
          return {
            id: `p${i}`,
            left: left?.trim() || '',
            right: right?.trim() || '',
          };
        }),
      };
    return {
      type: 'text',
      primaryAnswer: v.primaryAnswer || '',
      acceptedAnswers: (v.acceptedAnswers || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      caseSensitive: !!v.caseSensitive,
    };
  }
  async save(publish: boolean, status = 'draft') {
    if (this.busyAction) return;
    this.validationErrors = this.validateQuestion(
      publish || status === 'review'
    );
    if (this.validationErrors.length) {
      this.message = `We found ${this.validationErrors.length} ${
        this.validationErrors.length === 1 ? 'issue' : 'issues'
      }.`;
      this.messageKind = 'error';
      this.form.markAllAsTouched();
      requestAnimationFrame(() =>
        document
          .querySelector('.error-panel')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      );
      return;
    }
    this.busyAction = publish
      ? 'publish'
      : status === 'review'
      ? 'review'
      : 'draft';
    this.message = publish
      ? 'Validating and publishing…'
      : status === 'review'
      ? 'Submitting for review…'
      : 'Saving draft…';
    this.messageKind = 'info';
    try {
      const v = this.form.getRawValue();
      const passages = parseBiblicalScope(v.scopeDefinition || '');
      const payload = {
        translationGroupId: v.translationGroupId || undefined,
        contentConceptId: v.contentConceptId || undefined,
        media: this.media
          ? {
              ...this.media,
              altText: v.mediaAltText || '',
            }
          : undefined,
        language: v.language as 'en' | 'es',
        category: v.category as any,
        questionType: v.questionType as any,
        difficulty: v.difficulty as any,
        prompt: v.prompt || '',
        scriptureReference: v.scriptureReference || '',
        passages,
        scopeTokens: scopeTokens(passages, (v.testament || undefined) as 'old' | 'new' | undefined),
        explanation: v.explanation || '',
        testament: (v.testament || undefined) as any,
        tags: (v.tags || '')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        topics: [],
        answerData: this.buildAnswer(),
        status: status as any,
        isActive: publish,
      };
      this.id = await this.repo.save(payload, this.id || undefined);
      if (publish) await this.repo.publish(this.id, payload);
      this.message = publish
        ? 'Published successfully.'
        : status === 'review'
        ? 'Submitted for review.'
        : 'Draft saved.';
      this.messageKind = 'success';
      if (!this.route.snapshot.paramMap.get('questionId'))
        await this.router.navigate(['/admin/questions', this.id]);
    } catch (e: any) {
      this.validationErrors = this.firebaseErrors(e);
      this.message = this.validationErrors.length
        ? 'The question could not be saved.'
        : 'Could not reach Firebase. Check your connection and try again.';
      this.messageKind = 'error';
    } finally {
      this.busyAction = '';
    }
  }
  async duplicateTranslation() {
    if (!this.id || this.busyAction) return;
    this.busyAction = 'translation';
    this.message = 'Creating translation draft…';
    this.messageKind = 'info';
    try {
      const question = await this.repo.get(this.id);
      if (!question) throw Error('The original question could not be found.');
      const id = await this.repo.duplicateTranslation(question);
      await this.router.navigate(['/admin/questions', id]);
    } catch (e: any) {
      this.validationErrors = this.firebaseErrors(e);
      this.message = 'Translation draft could not be created.';
      this.messageKind = 'error';
    } finally {
      this.busyAction = '';
    }
  }
  async uploadMedia(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      this.busyAction = 'media';
      this.message = 'Uploading image…';
      this.media = await this.mediaService.upload(file, this.id || 'draft');
      this.form.controls.mediaAltText.setValue('');
      this.message = 'Image uploaded.';
      this.messageKind = 'success';
    } catch (e: any) {
      this.message = e?.message || 'Image upload failed.';
      this.messageKind = 'error';
    } finally {
      this.busyAction = '';
    }
  }
  async removeMedia() {
    if (!this.media) return;
    await this.mediaService.remove(this.media.storagePath);
    this.media = undefined;
    this.form.controls.mediaAltText.setValue('');
  }
  private validateQuestion(forReviewOrPublish: boolean): string[] {
    const v = this.form.getRawValue(),
      errors: string[] = [];
    if (!(v.prompt || '').trim()) errors.push('Question prompt is required.');
    else if ((v.prompt || '').trim().length < 10)
      errors.push('Question prompt must be at least 10 characters.');
    if (this.answerKind === 'multiple_choice') {
      const options = v.options.map((x) => (x || '').trim());
      options.forEach((x, i) => {
        if (!x) errors.push(`Answer option ${this.letters[i]} is required.`);
      });
      if (new Set(options.map((x) => x.toLowerCase())).size !== options.length)
        errors.push('Multiple-choice options must all be different.');
    } else if (this.answerKind === 'sequence') {
      const count = (v.primaryAnswer || '')
        .split('\n')
        .filter((x) => x.trim()).length;
      if (count < 2)
        errors.push(
          'Sequence and Arrange the Verse questions need at least two ordered items, one per line.'
        );
    } else if (this.answerKind === 'match_pairs') {
      const lines = (v.primaryAnswer || '').split('\n').filter((x) => x.trim());
      if (lines.length < 2)
        errors.push('Match Pairs needs at least two pairs.');
      if (
        lines.some(
          (x) => !x.includes('|') || x.split('|').some((part) => !part.trim())
        )
      )
        errors.push(
          'Each match pair must use “Left | Right” with both sides filled in.'
        );
    } else if (
      this.answerKind !== 'true_false' &&
      !(v.primaryAnswer || '').trim()
    )
      errors.push(
        this.answerKind === 'map'
          ? 'Correct region ID is required.'
          : 'Primary answer is required.'
      );
    if (forReviewOrPublish && !(v.scriptureReference || '').trim())
      errors.push(
        'Scripture reference is required before review or publishing.'
      );
    if (forReviewOrPublish && !v.scopeDefinition?.trim())
      errors.push('At least one structured biblical quiz scope is required before review or publishing.');
    if (v.scopeDefinition) {
      try { parseBiblicalScope(v.scopeDefinition); }
      catch (error) { errors.push(error instanceof Error ? error.message : 'Biblical quiz scope is invalid.'); }
    }
    const visual = ['pictionary', 'map_challenge'].includes(
      v.questionType || ''
    );
    if (forReviewOrPublish && visual && !this.media)
      errors.push(
        `${this.typeLabel(v.questionType || '')} requires an uploaded image.`
      );
    if (forReviewOrPublish && this.media && !(v.mediaAltText || '').trim())
      errors.push('Image alt text is required before review or publishing.');
    return errors;
  }
  private typeLabel(type: string) {
    return (
      this.types.find((x) => x[0] === type)?.[1] || type.replaceAll('_', ' ')
    );
  }
  private firebaseErrors(error: any): string[] {
    const details = error?.details || error?.customData?.details;
    const errors =
      details?.errors || details?.failures?.flatMap((x: any) => x.errors) || [];
    if (Array.isArray(errors) && errors.length) return errors.map(String);
    let message = String(error?.message || '')
      .replace(/^FirebaseError:\s*/, '')
      .replace(/^functions\/[a-z-]+:\s*/, '')
      .trim();
    if (message.includes('INTERNAL'))
      message =
        'The server could not complete this request. Confirm the latest Firebase Functions are deployed.';
    return message ? [message] : [];
  }
}
