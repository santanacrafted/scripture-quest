import { BiblicalPassage } from './admin.models';

export function bookSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Studio syntax: "Daniel:2,5; Revelation:2-3". A book without chapters
// means the question is eligible for any quiz covering that entire book.
export function parseBiblicalScope(value: string): BiblicalPassage[] {
  if (!value.trim()) return [];
  return value.split(';').map(entry => {
    const [rawBook, rawChapters = ''] = entry.split(':');
    const bookName = rawBook.trim();
    if (!bookName) throw new Error('Each scope entry needs a Bible book.');
    const chapterRanges = rawChapters.split(',').map(x => x.trim()).filter(Boolean);
    if (!chapterRanges.length) return { bookId: bookSlug(bookName), bookName };
    const chapters = chapterRanges.map(range => {
      const [startText, endText = startText] = range.split('-').map(x => x.trim());
      const chapterStart = Number(startText), chapterEnd = Number(endText);
      if (!Number.isInteger(chapterStart) || !Number.isInteger(chapterEnd) || chapterStart < 1 || chapterEnd < chapterStart) {
        throw new Error(`Invalid chapter range “${range}” for ${bookName}.`);
      }
      return { bookId: bookSlug(bookName), bookName, chapterStart, chapterEnd };
    });
    return chapters;
  }).flat();
}

export function scopeTokens(passages: BiblicalPassage[], testament?: 'old' | 'new'): string[] {
  const tokens = new Set<string>(['bible']);
  if (testament) tokens.add(`testament:${testament}`);
  for (const passage of passages) {
    tokens.add(`book:${passage.bookId}`);
    if (passage.chapterStart && passage.chapterEnd) {
      for (let chapter = passage.chapterStart; chapter <= passage.chapterEnd; chapter++) tokens.add(`chapter:${passage.bookId}:${chapter}`);
    }
  }
  return [...tokens];
}

export function formatBiblicalScope(passages: BiblicalPassage[]): string {
  return passages.map(p => p.chapterStart ? `${p.bookName}:${p.chapterStart}${p.chapterEnd !== p.chapterStart ? `-${p.chapterEnd}` : ''}` : p.bookName).join('; ');
}
