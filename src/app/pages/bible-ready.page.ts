import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideHistory,
  LucideHouse,
  LucideMoreHorizontal,
  LucidePlay,
  LucideVolume2,
  LucideX,
} from '@lucide/angular';

interface BibleBook {
  name: string;
  testament: 'Old' | 'New';
  chapters: number;
}

const BIBLE_BOOKS: BibleBook[] = [
  { name: 'Genesis', testament: 'Old', chapters: 50 },
  { name: 'Exodus', testament: 'Old', chapters: 40 },
  { name: 'Leviticus', testament: 'Old', chapters: 27 },
  { name: 'Numbers', testament: 'Old', chapters: 36 },
  { name: 'Deuteronomy', testament: 'Old', chapters: 34 },
  { name: 'Joshua', testament: 'Old', chapters: 24 },
  { name: 'Judges', testament: 'Old', chapters: 21 },
  { name: 'Ruth', testament: 'Old', chapters: 4 },
  { name: '1 Samuel', testament: 'Old', chapters: 31 },
  { name: '2 Samuel', testament: 'Old', chapters: 24 },
  { name: '1 Kings', testament: 'Old', chapters: 22 },
  { name: '2 Kings', testament: 'Old', chapters: 25 },
  { name: '1 Chronicles', testament: 'Old', chapters: 29 },
  { name: '2 Chronicles', testament: 'Old', chapters: 36 },
  { name: 'Ezra', testament: 'Old', chapters: 10 },
  { name: 'Nehemiah', testament: 'Old', chapters: 13 },
  { name: 'Esther', testament: 'Old', chapters: 10 },
  { name: 'Job', testament: 'Old', chapters: 42 },
  { name: 'Psalms', testament: 'Old', chapters: 150 },
  { name: 'Proverbs', testament: 'Old', chapters: 31 },
  { name: 'Ecclesiastes', testament: 'Old', chapters: 12 },
  { name: 'Song of Solomon', testament: 'Old', chapters: 8 },
  { name: 'Isaiah', testament: 'Old', chapters: 66 },
  { name: 'Jeremiah', testament: 'Old', chapters: 52 },
  { name: 'Lamentations', testament: 'Old', chapters: 5 },
  { name: 'Ezekiel', testament: 'Old', chapters: 48 },
  { name: 'Daniel', testament: 'Old', chapters: 12 },
  { name: 'Hosea', testament: 'Old', chapters: 14 },
  { name: 'Joel', testament: 'Old', chapters: 3 },
  { name: 'Amos', testament: 'Old', chapters: 9 },
  { name: 'Obadiah', testament: 'Old', chapters: 1 },
  { name: 'Jonah', testament: 'Old', chapters: 4 },
  { name: 'Micah', testament: 'Old', chapters: 7 },
  { name: 'Nahum', testament: 'Old', chapters: 3 },
  { name: 'Habakkuk', testament: 'Old', chapters: 3 },
  { name: 'Zephaniah', testament: 'Old', chapters: 3 },
  { name: 'Haggai', testament: 'Old', chapters: 2 },
  { name: 'Zechariah', testament: 'Old', chapters: 14 },
  { name: 'Malachi', testament: 'Old', chapters: 4 },
  { name: 'Matthew', testament: 'New', chapters: 28 },
  { name: 'Mark', testament: 'New', chapters: 16 },
  { name: 'Luke', testament: 'New', chapters: 24 },
  { name: 'John', testament: 'New', chapters: 21 },
  { name: 'Acts', testament: 'New', chapters: 28 },
  { name: 'Romans', testament: 'New', chapters: 16 },
  { name: '1 Corinthians', testament: 'New', chapters: 16 },
  { name: '2 Corinthians', testament: 'New', chapters: 13 },
  { name: 'Galatians', testament: 'New', chapters: 6 },
  { name: 'Ephesians', testament: 'New', chapters: 6 },
  { name: 'Philippians', testament: 'New', chapters: 4 },
  { name: 'Colossians', testament: 'New', chapters: 4 },
  { name: '1 Thessalonians', testament: 'New', chapters: 5 },
  { name: '2 Thessalonians', testament: 'New', chapters: 3 },
  { name: '1 Timothy', testament: 'New', chapters: 6 },
  { name: '2 Timothy', testament: 'New', chapters: 4 },
  { name: 'Titus', testament: 'New', chapters: 3 },
  { name: 'Philemon', testament: 'New', chapters: 1 },
  { name: 'Hebrews', testament: 'New', chapters: 13 },
  { name: 'James', testament: 'New', chapters: 5 },
  { name: '1 Peter', testament: 'New', chapters: 5 },
  { name: '2 Peter', testament: 'New', chapters: 3 },
  { name: '1 John', testament: 'New', chapters: 5 },
  { name: '2 John', testament: 'New', chapters: 1 },
  { name: '3 John', testament: 'New', chapters: 1 },
  { name: 'Jude', testament: 'New', chapters: 1 },
  { name: 'Revelation', testament: 'New', chapters: 22 },
];

const FEATURED_VERSES: Record<string, string> = {
  'Genesis 1:1': 'In the beginning God created the heaven and the earth.',
  'Psalms 23:1': 'The Lord is my shepherd; I shall not want.',
  'Proverbs 3:5': 'Trust in the Lord with all thine heart; and lean not unto thine own understanding.',
  'John 1:1': 'In the beginning was the Word, and the Word was with God, and the Word was God.',
  'John 3:16': 'For God so loved the world, that he gave his only begotten Son.',
  'Romans 8:28': 'All things work together for good to them that love God.',
  'Philippians 4:13': 'I can do all things through Christ which strengtheneth me.',
  'Revelation 21:4': 'God shall wipe away all tears from their eyes.',
};

@Component({
  selector: 'app-bible-ready-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideChevronLeft,
    LucideChevronRight,
    LucideHistory,
    LucideHouse,
    LucideMoreHorizontal,
    LucidePlay,
    LucideVolume2,
    LucideX,
  ],
  template: `
    <main class="route-page bible-page min-h-screen text-[#2c1a08]">
      <header class="reader-topbar">
        <div class="flex min-w-0 items-center gap-4">
          <button class="toolbar-home-button" type="button" aria-label="Home" (click)="goHome()">
            <svg lucideHouse [size]="30" [strokeWidth]="2.8"></svg>
          </button>
          <div class="flex min-w-0 items-center gap-1">
            <button class="reader-chip" type="button" (click)="openBookPicker()">
              {{ selectedBook.name }} {{ selectedChapter }}
            </button>
            <button class="reader-chip reader-chip-version" type="button">NIV</button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button class="reader-icon-button" type="button" aria-label="Audio">
            <svg lucideVolume2 [size]="25" [strokeWidth]="2.7"></svg>
          </button>
          <button class="reader-icon-button" type="button" aria-label="More">
            <svg lucideMoreHorizontal [size]="28" [strokeWidth]="2.9"></svg>
          </button>
        </div>
      </header>

      <section class="reader-page">
        <p class="chapter-kicker">{{ selectedBook.testament }} Testament</p>
        <h1 class="chapter-title">{{ selectedBook.name }} {{ selectedChapter }}</h1>
        <h2 class="section-title">{{ chapterHeading }}</h2>

        <article class="reader-copy">
          <p>
            <sup>1</sup>{{ selectedVerseText }}
            <sup>2</sup> Scripture text will appear here once the Bible translation data is connected.
            <span class="jesus-words">This reader is ready for book and chapter navigation.</span>
            <sup>3</sup> Use the pill at the top to change books in the new dropdown sheet.
          </p>
        </article>

        <div class="reader-controls">
          <button class="float-nav" type="button" aria-label="Previous verse" (click)="previousVerse()">
            <svg lucideChevronLeft [size]="34" [strokeWidth]="3"></svg>
          </button>
          <button class="play-button" type="button" aria-label="Play audio">
            <svg lucidePlay [size]="42" [strokeWidth]="2.6"></svg>
          </button>
          <button class="float-nav" type="button" aria-label="Next verse" (click)="nextVerse()">
            <svg lucideChevronRight [size]="34" [strokeWidth]="3"></svg>
          </button>
        </div>
      </section>

      <div
        *ngIf="isBookPickerOpen"
        class="book-picker-backdrop"
        role="presentation"
        (click)="closeBookPicker()"
      ></div>

      <section
        *ngIf="isBookPickerOpen"
        class="book-picker-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Books"
      >
        <header class="picker-header">
          <button class="picker-round-button" type="button" aria-label="Close books" (click)="closeBookPicker()">
            <svg lucideX [size]="34" [strokeWidth]="2.7"></svg>
          </button>
          <h2>Books</h2>
          <button class="picker-round-button" type="button" aria-label="Recent books">
            <svg lucideHistory [size]="32" [strokeWidth]="2.6"></svg>
          </button>
        </header>

        <div class="picker-list">
          <ng-container *ngFor="let book of pickerBooks; trackBy: trackBook">
            <button
              class="picker-book-row"
              type="button"
              [class.is-active]="book.name === selectedBook.name"
              (click)="selectBook(book)"
            >
              {{ book.name }}
            </button>

            <div *ngIf="book.name === selectedBook.name" class="picker-chapter-grid">
              <button class="chapter-info-button" type="button" aria-label="Book information">ⓘ</button>
              <button
                *ngFor="let chapter of chapters; trackBy: trackNumber"
                class="picker-chapter-button"
                type="button"
                [class.is-active]="chapter === selectedChapter"
                (click)="selectChapterFromPicker(chapter)"
              >
                {{ chapter }}
              </button>
            </div>
          </ng-container>
        </div>

        <div class="picker-sort">
          <button
            type="button"
            [class.is-active]="bookSort === 'traditional'"
            (click)="setBookSort('traditional')"
          >
            Traditional
          </button>
          <button
            type="button"
            [class.is-active]="bookSort === 'alphabetical'"
            (click)="setBookSort('alphabetical')"
          >
            Alphabetical
          </button>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .bible-page {
        position: relative;
        background: #e7e4dc;
      }

      .reader-topbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 5;
        display: flex;
        min-height: calc(env(safe-area-inset-top) + 4.25rem);
        align-items: end;
        justify-content: space-between;
        gap: 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(231, 228, 220, 0.94);
        padding: calc(env(safe-area-inset-top) + 0.85rem) 1.25rem 0.85rem;
        backdrop-filter: blur(14px);
      }

      .toolbar-home-button {
        display: grid;
        min-height: 3.25rem;
        width: 3.25rem;
        flex: 0 0 auto;
        place-items: center;
        border-radius: 999px;
        color: rgba(44, 26, 8, 0.78);
        font-weight: 900;
      }

      .reader-chip {
        min-height: 2.6rem;
        border: 0;
        background: #d4d2cd;
        color: #171717;
        font-size: clamp(0.88rem, 3.4vw, 1rem);
        font-weight: 800;
        padding: 0 clamp(0.8rem, 3vw, 1.15rem);
        white-space: nowrap;
      }

      .reader-chip:first-child {
        border-radius: 999px 0 0 999px;
      }

      .reader-chip-version {
        border-left: 2px solid rgba(255, 255, 255, 0.74);
        border-radius: 0 999px 999px 0;
      }

      .reader-icon-button {
        display: grid;
        height: 3.25rem;
        width: 3.25rem;
        place-items: center;
        border-radius: 999px;
        color: #111;
        font-weight: 800;
      }

      .reader-icon-button svg,
      .toolbar-home-button svg {
        display: block;
      }

      .reader-page {
        position: relative;
        min-height: 100vh;
        padding: calc(env(safe-area-inset-top) + 6.75rem) clamp(1.55rem, 6vw, 4.75rem) calc(env(safe-area-inset-bottom) + 8.25rem);
        background:
          radial-gradient(circle at 12% 8%, rgba(255, 250, 222, 0.76), transparent 17rem),
          linear-gradient(90deg, rgba(110, 73, 30, 0.08) 0 1px, transparent 1px 100%),
          linear-gradient(180deg, rgba(110, 73, 30, 0.07) 0 1px, transparent 1px 100%),
          linear-gradient(180deg, #f0e4c8 0%, #e1c48e 52%, #cf9f57 100%);
        background-size: auto, 34px 100%, 100% 32px, auto;
      }

      .reader-page::before,
      .reader-page::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .reader-page::before {
        background:
          linear-gradient(90deg, rgba(57, 30, 7, 0.38), transparent 9%, transparent 91%, rgba(57, 30, 7, 0.36)),
          linear-gradient(180deg, rgba(57, 30, 7, 0.28), transparent 12%, transparent 88%, rgba(57, 30, 7, 0.3));
        mix-blend-mode: multiply;
      }

      .reader-page::after {
        opacity: 0.2;
        background-image:
          repeating-linear-gradient(8deg, rgba(54, 31, 9, 0.16) 0 1px, transparent 1px 12px),
          repeating-linear-gradient(96deg, rgba(255, 246, 210, 0.18) 0 1px, transparent 1px 16px);
      }

      .reader-page > * {
        position: relative;
        z-index: 1;
      }

      .chapter-kicker {
        color: rgba(106, 70, 25, 0.72);
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }

      .chapter-title {
        margin-top: 0.35rem;
        font-size: clamp(2.5rem, 11vw, 5rem);
        font-weight: 900;
        letter-spacing: 0;
        line-height: 0.95;
      }

      .section-title {
        margin-top: 2.25rem;
        color: rgba(49, 42, 34, 0.78);
        font-size: clamp(1.7rem, 7vw, 3.2rem);
        font-style: italic;
        font-weight: 400;
        line-height: 1.15;
      }

      .reader-copy {
        margin-top: 1.75rem;
        color: rgba(49, 44, 37, 0.84);
        font-size: clamp(1.35rem, 5.2vw, 2.45rem);
        font-weight: 400;
        line-height: 1.58;
      }

      .reader-copy sup {
        margin-right: 0.5rem;
        color: rgba(49, 44, 37, 0.76);
        font-size: 0.44em;
        font-weight: 700;
        vertical-align: super;
      }

      .jesus-words {
        color: #ff4055;
      }

      .reader-controls {
        position: fixed !important;
        top: auto;
        bottom: max(1rem, env(safe-area-inset-bottom));
        left: 50%;
        display: grid;
        width: min(33rem, calc(100vw - 1.5rem));
        grid-template-columns: 4rem 1fr 4rem;
        align-items: center;
        justify-items: center;
        pointer-events: none;
        transform: translateX(-50%);
        z-index: 10;
      }

      .float-nav,
      .play-button {
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18);
        color: #121212;
        pointer-events: auto;
      }

      .float-nav {
        height: 3.85rem;
        width: 3.85rem;
        font-size: 3rem;
        line-height: 1;
      }

      .play-button {
        height: 5.4rem;
        width: 5.4rem;
        font-size: 2.4rem;
        padding-left: 0.3rem;
      }

      .book-picker-backdrop {
        position: fixed;
        inset: 0;
        z-index: 20;
        background: rgba(20, 22, 18, 0.34);
        backdrop-filter: blur(2px);
      }

      .book-picker-sheet {
        position: fixed;
        inset: auto 0 0;
        z-index: 21;
        display: flex;
        max-height: min(90vh, 52rem);
        min-height: min(82vh, 48rem);
        flex-direction: column;
        overflow: hidden;
        border-radius: 34px 34px 0 0;
        background: rgba(255, 255, 255, 0.96);
        color: #101010;
        box-shadow: 0 -18px 60px rgba(0, 0, 0, 0.22);
      }

      .picker-header {
        position: sticky;
        top: 0;
        z-index: 1;
        display: grid;
        grid-template-columns: 4.2rem 1fr 4.2rem;
        align-items: center;
        gap: 0.75rem;
        padding: 1.9rem 1.5rem 1.25rem;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
      }

      .picker-header h2 {
        text-align: center;
        font-size: 1.35rem;
        font-weight: 900;
      }

      .picker-round-button {
        display: grid;
        height: 3.4rem;
        width: 3.4rem;
        place-items: center;
        border-radius: 999px;
        background: #f8f8f8;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        font-size: 2.4rem;
        font-weight: 800;
      }

      .picker-list {
        flex: 1;
        overflow: auto;
        padding: 1.2rem 0 6.5rem;
      }

      .picker-book-row {
        display: block;
        width: 100%;
        min-height: 4.8rem;
        padding: 0 1.7rem;
        text-align: left;
        font-size: 1.9rem;
        font-weight: 700;
      }

      .picker-book-row.is-active {
        background: #f1ebeb;
      }

      .picker-chapter-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 0.45rem;
        padding: 0.25rem 1.45rem 1.25rem;
        background: #fff;
      }

      .picker-chapter-button,
      .chapter-info-button {
        aspect-ratio: 1;
        border-radius: 12px;
        background: #eceaea;
        color: #101010;
        font-size: 1.35rem;
        font-weight: 900;
      }

      .picker-chapter-button.is-active {
        background: #101010;
        color: #fff;
      }

      .picker-sort {
        position: absolute;
        bottom: calc(env(safe-area-inset-bottom) + 1.2rem);
        left: 1.35rem;
        right: 1.35rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        border-radius: 999px;
        background: #ebebeb;
        padding: 0.25rem;
      }

      .picker-sort button {
        min-height: 2.8rem;
        border-radius: 999px;
        font-size: 1rem;
        font-weight: 800;
      }

      .picker-sort button.is-active {
        background: #fff;
        box-shadow: 0 1px 7px rgba(0, 0, 0, 0.08);
      }

      @media (min-width: 720px) {
        .book-picker-sheet {
          left: 50%;
          width: min(42rem, calc(100vw - 2rem));
          transform: translateX(-50%);
          border-radius: 34px;
          bottom: 1rem;
        }
      }
    `,
  ],
})
export class BibleReadyPage {
  readonly books = BIBLE_BOOKS;
  activeTestament: 'Old' | 'New' = 'Old';
  selectedBook = BIBLE_BOOKS.find((book) => book.name === 'Luke') ?? BIBLE_BOOKS[0];
  selectedChapter = 14;
  selectedVerse = 1;
  isBookPickerOpen = false;
  bookSort: 'traditional' | 'alphabetical' = 'traditional';

  constructor(private readonly router: Router) {}

  get visibleBooks(): BibleBook[] {
    return this.books.filter((book) => book.testament === this.activeTestament);
  }

  get pickerBooks(): BibleBook[] {
    if (this.bookSort === 'alphabetical') {
      return [...this.books].sort((first, second) => first.name.localeCompare(second.name));
    }

    return this.books;
  }

  get chapters(): number[] {
    return this.range(this.selectedBook.chapters);
  }

  get verses(): number[] {
    return this.range(this.verseCount);
  }

  get currentReference(): string {
    return `${this.selectedBook.name} ${this.selectedChapter}:${this.selectedVerse}`;
  }

  get chapterHeading(): string {
    if (this.selectedBook.name === 'Luke' && this.selectedChapter === 14) {
      return "Jesus at a Pharisee's House";
    }

    return `${this.selectedBook.name} Chapter ${this.selectedChapter}`;
  }

  get selectedVerseText(): string {
    return (
      FEATURED_VERSES[this.currentReference] ??
      'Scripture text will appear here once the Bible translation data is connected. This reader is ready for book, chapter, and verse navigation.'
    );
  }

  get verseCount(): number {
    if (this.selectedBook.name === 'Psalms' && this.selectedChapter === 119) {
      return 176;
    }

    if (['Obadiah', 'Philemon', '2 John', '3 John', 'Jude'].includes(this.selectedBook.name)) {
      return this.selectedBook.name === 'Obadiah' ? 21 : 25;
    }

    return this.selectedBook.testament === 'Old' ? 31 : 28;
  }

  setTestament(testament: 'Old' | 'New'): void {
    this.activeTestament = testament;
    const firstBook = this.visibleBooks[0];
    if (firstBook) {
      this.selectBook(firstBook);
    }
  }

  selectBook(book: BibleBook): void {
    this.selectedBook = book;
    this.selectedChapter = 1;
    this.selectedVerse = 1;
  }

  selectChapter(chapter: number): void {
    this.selectedChapter = chapter;
    this.selectedVerse = 1;
  }

  selectChapterFromPicker(chapter: number): void {
    this.selectChapter(chapter);
    this.closeBookPicker();
  }

  selectVerse(verse: number): void {
    this.selectedVerse = verse;
  }

  openBookPicker(): void {
    this.isBookPickerOpen = true;
  }

  closeBookPicker(): void {
    this.isBookPickerOpen = false;
  }

  setBookSort(sort: 'traditional' | 'alphabetical'): void {
    this.bookSort = sort;
  }

  previousVerse(): void {
    if (this.selectedVerse > 1) {
      this.selectedVerse -= 1;
      return;
    }

    if (this.selectedChapter > 1) {
      this.selectedChapter -= 1;
      this.selectedVerse = this.verseCount;
    }
  }

  nextVerse(): void {
    if (this.selectedVerse < this.verseCount) {
      this.selectedVerse += 1;
      return;
    }

    if (this.selectedChapter < this.selectedBook.chapters) {
      this.selectedChapter += 1;
      this.selectedVerse = 1;
    }
  }

  goHome(): void {
    this.router.navigate(['/multiplayer']);
  }

  trackBook(_: number, book: BibleBook): string {
    return book.name;
  }

  trackNumber(_: number, value: number): number {
    return value;
  }

  private range(count: number): number[] {
    return Array.from({ length: count }, (_, index) => index + 1);
  }
}
