import { Injectable } from '@angular/core';
import {
  CATEGORIES,
  ContentCategory,
  ContentDifficulty,
  ContentQuestionType,
  QuestionAnswerData,
  StudioQuestion,
  TYPES,
  QUESTION_SCOPES,
  QuestionScope,
  QUESTION_SUPPORTED_MODES,
  QuestionSupportedMode,
} from './admin.models';
import { parseBiblicalScope, scopeTokens } from './biblical-scope';
export interface ImportIssue {
  severity: 'error' | 'warning';
  message: string;
}
export interface ImportRow {
  row: number;
  included: boolean;
  raw: Record<string, string>;
  question?: Partial<StudioQuestion>;
  issues: ImportIssue[];
}
@Injectable({ providedIn: 'root' })
export class ImportService {
  parse(input: string, format: 'csv' | 'json'): ImportRow[] {
    try {
      const records = format === 'json' ? JSON.parse(input) : this.csv(input);
      if (!Array.isArray(records)) throw Error('Expected a list of records.');
      return records.map((raw, i) => this.normalize(raw, i + 2));
    } catch (e: any) {
      return [
        {
          row: 1,
          included: false,
          raw: {},
          issues: [
            {
              severity: 'error',
              message: e?.message || 'Could not parse data.',
            },
          ],
        },
      ];
    }
  }
  private normalize(source: any, row: number): ImportRow {
    const nestedPassages = Array.isArray(source?.passages) ? source.passages : null;
    const raw = Object.fromEntries(
      Object.entries(source).map(([k, v]) => [
        k.trim().toLowerCase(),
        String(v ?? '').trim(),
      ])
    );
    const issues: ImportIssue[] = [];
    const category = raw['category'] as ContentCategory,
      type = (source.questionType || raw['question_type'] || raw['questiontype']) as ContentQuestionType,
      difficulty = (source.difficulty || raw['difficulty']) as ContentDifficulty,
      questionScope = (source.scope || raw['scope']) as QuestionScope,
      supportedModes = (Array.isArray(source.supportedModes)
        ? source.supportedModes
        : this.list(raw['supported_modes'] || raw['supportedmodes'])) as QuestionSupportedMode[],
      language = source.language || raw['language'],
      prompt = source.prompt || raw['question'] || raw['prompt'];
    if (!CATEGORIES.some((x) => x[0] === category))
      issues.push({
        severity: 'error',
        message:
          raw['category'] === 'random'
            ? 'Random cannot be stored as a category.'
            : 'Unsupported category.',
      });
    if (!TYPES.some((x) => x[0] === type))
      issues.push({ severity: 'error', message: 'Unsupported question type.' });
    if (!['easy', 'medium', 'hard', 'expert'].includes(difficulty))
      issues.push({ severity: 'error', message: 'Unsupported difficulty.' });
    if (!QUESTION_SCOPES.some(([scope]) => scope === questionScope))
      issues.push({ severity: 'error', message: 'Scope must be chapter, book, multi_book, or whole_bible.' });
    if (!supportedModes.length || supportedModes.some(mode => !QUESTION_SUPPORTED_MODES.some(([allowed]) => allowed === mode)))
      issues.push({ severity: 'error', message: 'Supported modes must include quiz, battle, or both.' });
    if (new Set(supportedModes).size !== supportedModes.length)
      issues.push({ severity: 'error', message: 'Supported modes must not contain duplicates.' });
    if (['pictionary', 'map_challenge', 'emoji_challenge'].includes(type) &&
        (supportedModes.length !== 1 || supportedModes[0] !== 'battle'))
      issues.push({ severity: 'error', message: 'Pictionary, Map Challenge, and Emoji Challenge must be battle-only.' });
    if (!['en', 'es'].includes(language))
      issues.push({ severity: 'error', message: 'Language must be en or es.' });
    if (!prompt || prompt.length < 10)
      issues.push({
        severity: 'error',
        message: 'Prompt must be at least 10 characters.',
      });
    const scriptureReference = source.scriptureReference || raw['scripture_reference'];
    if (!scriptureReference)
      issues.push({
        severity: 'error',
        message: 'Scripture reference is missing.',
      });
    let passages = nestedPassages;
    if (!passages && raw['scope_definition']) {
      try { passages = parseBiblicalScope(raw['scope_definition']); }
      catch (error) { issues.push({ severity: 'error', message: error instanceof Error ? error.message : 'Invalid biblical coverage.' }); }
    }
    if (!passages?.length) issues.push({ severity: 'error', message: 'Structured passages are required.' });
    const testament = (raw['testament'] || source?.testament || undefined) as 'old' | 'new' | undefined;
    const answer = source.answerData?.type ? source.answerData as QuestionAnswerData : this.answer(raw, type, issues);
    const media = source.media?.downloadUrl || source.media?.storagePath
      ? source.media
      : raw['media_download_url'] || raw['media_storage_path']
      ? {
          downloadUrl: raw['media_download_url'],
          storagePath: raw['media_storage_path'],
          mimeType: raw['media_mime_type'] || 'image/jpeg',
          altText: raw['media_alt_text'],
        }
      : undefined;
    const multipleChoiceTypes: ContentQuestionType[] = ['multiple_choice', 'pictionary', 'verse_completion', 'reference_match', 'who_am_i', 'who_said_it', 'emoji_challenge', 'odd_one_out', 'what_happens_next'];
    if (multipleChoiceTypes.includes(type) && answer.type !== 'multiple_choice')
      issues.push({ severity: 'error', message: 'This question type requires multiple-choice answerData.' });
    if (
      multipleChoiceTypes.includes(type) &&
      answer.type === 'multiple_choice'
    ) {
      if (answer.options.length !== 4)
        issues.push({ severity: 'error', message: 'Four answer options are required.' });
      if (answer.correctOptionIds.length !== 1)
        issues.push({ severity: 'error', message: 'Exactly one correct option is required.' });
      if (!answer.correctOptionIds.every((id) => answer.options.some((option) => option.id === id)))
        issues.push({ severity: 'error', message: 'The correct option ID must match an answer option.' });
    }
    if (type === 'pictionary' && (!media?.downloadUrl || !media?.storagePath))
      issues.push({ severity: 'error', message: 'Pictionary requires media with storagePath and downloadUrl.' });
    if (type === 'pictionary' && !media?.altText)
      issues.push({ severity: 'error', message: 'Pictionary image alt text is required.' });
    const question: Partial<StudioQuestion> = {
      externalId: source.externalId || raw['external_id'] || undefined,
      translationGroupId: source.translationGroupId || raw['translation_group_id'] || undefined,
      contentConceptId: source.contentConceptId || raw['content_concept_id'] || undefined,
      language: language as 'en' | 'es',
      category,
      questionType: type,
      difficulty,
      scope: questionScope,
      supportedModes,
      prompt,
      explanation: source.explanation || raw['explanation'],
      scriptureReference,
      testament,
      passages: passages || [],
      scopeTokens: scopeTokens(passages || [], testament),
      topics: Array.isArray(source.topics) ? source.topics : this.list(raw['topics']),
      tags: Array.isArray(source.tags) ? source.tags : this.list(raw['tags']),
      answerData: answer,
      media,
      status: 'draft',
      isActive: false,
    };
    return {
      row,
      included: !issues.some((x) => x.severity === 'error'),
      raw,
      question,
      issues,
    };
  }
  private answer(
    r: Record<string, string>,
    type: ContentQuestionType,
    issues: ImportIssue[]
  ): QuestionAnswerData {
    if (r['answer_data_json']) {
      try {
        return JSON.parse(r['answer_data_json']);
      } catch {
        issues.push({
          severity: 'error',
          message: 'answer_data_json is invalid JSON.',
        });
      }
    }
    if (['multiple_choice', 'pictionary', 'verse_completion', 'reference_match', 'who_am_i', 'who_said_it', 'emoji_challenge', 'odd_one_out', 'what_happens_next'].includes(type)) {
      const values = ['option_a', 'option_b', 'option_c', 'option_d'].map(
        (k) => r[k] || ''
      );
      if (values.some((x) => !x))
        issues.push({
          severity: 'error',
          message: 'Multiple choice requires exactly four options.',
        });
      if (new Set(values.map((x) => x.toLowerCase())).size !== values.length)
        issues.push({
          severity: 'error',
          message: 'Option text must be unique.',
        });
      const index = values.findIndex(
        (x) => x.toLowerCase() === (r['correct_answer'] || '').toLowerCase()
      );
      if (index < 0)
        issues.push({
          severity: 'error',
          message: 'Correct answer is not one of the options.',
        });
      return {
        type: 'multiple_choice',
        options: values.map((text, i) => ({ id: `o${i}`, text })),
        correctOptionIds: index < 0 ? [] : [`o${index}`],
      };
    }
    if (type === 'true_false')
      return {
        type: 'true_false',
        correctValue: r['correct_answer']?.toLowerCase() === 'true',
      };
    if (type === 'sequence' || type === 'arrange_verse') {
      const items = (r['correct_answer'] || '')
        .split('|')
        .filter(Boolean)
        .map((text, i) => ({
          id: `s${i}`,
          text: text.trim(),
          correctPosition: i,
        }));
      return type === 'sequence'
        ? { type: 'sequence', items }
        : { type: 'arrange_verse', segments: items };
    }
    if (type === 'match_pairs') {
      return {
        type: 'match_pairs',
        pairs: (r['correct_answer'] || '')
          .split(';')
          .filter(Boolean)
          .map((x, i) => {
            const [left, right] = x.split('|');
            return {
              id: `p${i}`,
              left: left?.trim() || '',
              right: right?.trim() || '',
            };
          }),
      };
    }
    if (type === 'map_challenge')
      return { type: 'map', correctRegionId: r['correct_answer'] || '' };
    if (!r['correct_answer'])
      issues.push({
        severity: 'error',
        message: 'Correct answer is required.',
      });
    return {
      type: 'text',
      primaryAnswer: r['correct_answer'] || '',
      acceptedAnswers: this.list(r['accepted_answers']).filter(answer=>answer.toLowerCase()!==(r['correct_answer']||'').toLowerCase()),
      distractors: ['option_a','option_b','option_c','option_d'].map(key=>r[key]).filter(value=>!!value&&value.toLowerCase()!==(r['correct_answer']||'').toLowerCase()),
      caseSensitive: false,
    };
  }
  private list(v = '') {
    return v
      .split(/[,|]/)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  private csv(text: string) {
    const lines = text
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter(Boolean);
    if (lines.length < 2)
      throw Error('CSV needs a header and at least one row.');
    const parse = (line: string) => {
      const out: string[] = [];
      let value = '',
        quoted = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"' && line[i + 1] === '"') {
          value += '"';
          i++;
        } else if (c === '"') quoted = !quoted;
        else if (c === ',' && !quoted) {
          out.push(value);
          value = '';
        } else value += c;
      }
      out.push(value);
      return out;
    };
    const headers = parse(lines[0]);
    return lines
      .slice(1)
      .map((line) =>
        Object.fromEntries(parse(line).map((v, i) => [headers[i], v]))
      );
  }
}
