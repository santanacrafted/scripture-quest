import { ImportService } from './import.service';

describe('ImportService', () => {
  const validQuestion = {
    externalId: 'test-1',
    language: 'en',
    category: 'characters',
    questionType: 'true_false',
    difficulty: 'easy',
    scope: 'chapter',
    supportedModes: ['quiz'],
    prompt: 'This prompt is long enough.',
    scriptureReference: 'Exodus 1:1',
    passages: [{ bookId: 'exodus', bookName: 'Exodus', chapterStart: 1, chapterEnd: 1 }],
    answerData: { type: 'true_false', correctValue: true },
  };

  it('reports the unsupported category and all accepted values', () => {
    const [row] = new ImportService().parse(
      JSON.stringify([{ ...validQuestion, category: 'bible_knowledge' }]),
      'json'
    );

    expect(row.issues.map(issue => issue.message)).toContain(
      'Unsupported category "bible_knowledge". Choose one of: characters, scripture, stories, places, teachings.'
    );
  });

  it('identifies a missing category', () => {
    const { category: _category, ...question } = validQuestion;
    const [row] = new ImportService().parse(JSON.stringify([question]), 'json');

    expect(row.issues.map(issue => issue.message)).toContain(
      'Unsupported category (missing). Choose one of: characters, scripture, stories, places, teachings.'
    );
  });
});
