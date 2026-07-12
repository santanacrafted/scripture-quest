import { Injectable } from '@angular/core';
import {
  CATEGORIES,
  ContentCategory,
  ContentDifficulty,
  ContentQuestionType,
  QuestionAnswerData,
  StudioQuestion,
  TYPES,
} from './admin.models';
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
    const raw = Object.fromEntries(
      Object.entries(source).map(([k, v]) => [
        k.trim().toLowerCase(),
        String(v ?? '').trim(),
      ])
    );
    const issues: ImportIssue[] = [];
    const category = raw['category'] as ContentCategory,
      type = (raw['question_type'] ||
        raw['questiontype']) as ContentQuestionType,
      difficulty = raw['difficulty'] as ContentDifficulty,
      language = raw['language'],
      prompt = raw['question'] || raw['prompt'];
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
    if (!['en', 'es'].includes(language))
      issues.push({ severity: 'error', message: 'Language must be en or es.' });
    if (!prompt || prompt.length < 10)
      issues.push({
        severity: 'error',
        message: 'Prompt must be at least 10 characters.',
      });
    if (!raw['scripture_reference'])
      issues.push({
        severity: 'warning',
        message: 'Scripture reference is missing.',
      });
    const answer = this.answer(raw, type, issues);
    const question: Partial<StudioQuestion> = {
      externalId: raw['external_id'] || undefined,
      translationGroupId: raw['translation_group_id'] || undefined,
      contentConceptId: raw['content_concept_id'] || undefined,
      language: language as 'en' | 'es',
      category,
      questionType: type,
      difficulty,
      prompt,
      explanation: raw['explanation'],
      scriptureReference: raw['scripture_reference'],
      testament: (raw['testament'] || undefined) as any,
      book: raw['book'],
      topics: this.list(raw['topics']),
      tags: this.list(raw['tags']),
      answerData: answer,
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
    if (type === 'multiple_choice') {
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
      acceptedAnswers: this.list(r['accepted_answers']),
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
