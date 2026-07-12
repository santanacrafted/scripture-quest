import { Injectable } from '@angular/core';
import {
  Difficulty,
  MatchCategory,
  MULTIPLAYER_CATEGORIES,
  Question,
} from './multiplayer.models';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { firebaseDb } from '../firebase';
@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly questions: Question[] = [
    [
      'c1',
      'characters',
      'who_am_i',
      'easy',
      'I built an ark to survive a great flood. Who am I?',
      ['Moses', 'Noah', 'Abraham', 'David'],
      'Noah',
      'Genesis 6–9',
      'Noah obeyed God and built the ark.',
    ],
    [
      'c2',
      'characters',
      'who_said_it',
      'hard',
      'Who said, “Here am I; send me”?',
      ['Isaiah', 'Jeremiah', 'Samuel', 'Elijah'],
      'Isaiah',
      'Isaiah 6:8',
      'Isaiah answered God’s call.',
    ],
    [
      'c3',
      'characters',
      'multiple_choice',
      'medium',
      'Who interpreted Pharaoh’s dreams?',
      ['Daniel', 'Joseph', 'Moses', 'Aaron'],
      'Joseph',
      'Genesis 41',
      'Joseph explained the coming years of plenty and famine.',
    ],
    [
      's1',
      'scripture',
      'verse_completion',
      'easy',
      'Complete the verse: “The Lord is my shepherd; I shall not ___.”',
      ['fear', 'wander', 'want', 'fall'],
      'want',
      'Psalm 23:1',
      'David describes God’s faithful provision.',
    ],
    [
      's2',
      'scripture',
      'reference_match',
      'hard',
      'Where is “I can do all things through Christ” found?',
      ['Romans 8:28', 'Philippians 4:13', 'John 3:16', 'Psalm 46:1'],
      'Philippians 4:13',
      'Philippians 4:13',
      'Paul speaks of contentment and strength in Christ.',
    ],
    [
      's3',
      'scripture',
      'arrange_the_verse',
      'expert',
      'Which is the correct opening of John 1:1?',
      [
        'In the beginning was the Word',
        'The Word became the beginning',
        'Before the world came light',
        'The beginning spoke the Word',
      ],
      'In the beginning was the Word',
      'John 1:1',
      'John identifies Christ as the eternal Word.',
    ],
    [
      'e1',
      'stories',
      'sequence',
      'medium',
      'What happened after David struck Goliath with the stone?',
      [
        'Israel fled',
        'Goliath fell face down',
        'Saul became king',
        'David hid in a cave',
      ],
      'Goliath fell face down',
      '1 Samuel 17:49',
      'The stone sank into Goliath’s forehead and he fell.',
    ],
    [
      'e2',
      'stories',
      'what_happens_next',
      'hard',
      'After the Israelites crossed the Red Sea, what happened to Pharaoh’s army?',
      [
        'They crossed safely',
        'They turned back',
        'The waters covered them',
        'Fire stopped them',
      ],
      'The waters covered them',
      'Exodus 14',
      'The returning waters covered the pursuing army.',
    ],
    [
      'e3',
      'stories',
      'emoji_challenge',
      'easy',
      'Which story do these emojis describe? 🐟 🍞 👥',
      ['The Last Supper', 'Feeding the five thousand', 'Jonah', 'The Passover'],
      'Feeding the five thousand',
      'Matthew 14:13–21',
      'Jesus multiplied loaves and fish for the crowd.',
    ],
    [
      'p1',
      'places',
      'map_challenge',
      'easy',
      'In which town was Jesus born?',
      ['Nazareth', 'Jerusalem', 'Bethlehem', 'Capernaum'],
      'Bethlehem',
      'Luke 2:4–7',
      'Joseph and Mary traveled to Bethlehem.',
    ],
    [
      'p2',
      'places',
      'multiple_choice',
      'hard',
      'On which mountain did Moses receive the Ten Commandments?',
      ['Carmel', 'Sinai', 'Ararat', 'Zion'],
      'Sinai',
      'Exodus 19–20',
      'God met Moses at Mount Sinai.',
    ],
    [
      'p3',
      'places',
      'odd_one_out',
      'expert',
      'Which place is not associated with Paul’s missionary journeys?',
      ['Corinth', 'Ephesus', 'Philippi', 'Bethlehem'],
      'Bethlehem',
      'Acts',
      'The other cities were major stops in Paul’s journeys.',
    ],
    [
      'k1',
      'knowledge',
      'true_false',
      'easy',
      'The Bible has 66 books in the common Protestant canon.',
      ['True', 'False', 'Only in Greek', 'Not recorded'],
      'True',
      'Bible canon',
      'The Protestant Bible contains 39 Old and 27 New Testament books.',
    ],
    [
      'k2',
      'knowledge',
      'multiple_choice',
      'medium',
      'What object did David use to defeat Goliath?',
      ['A spear', 'A sling', 'A sword', 'A bow'],
      'A sling',
      '1 Samuel 17',
      'David chose five stones and used his sling.',
    ],
    [
      'k3',
      'knowledge',
      'odd_one_out',
      'hard',
      'Which is not a fruit of the Spirit listed in Galatians 5?',
      ['Patience', 'Kindness', 'Courage', 'Self-control'],
      'Courage',
      'Galatians 5:22–23',
      'Courage is biblical, but is not in this specific list.',
    ],
  ].map(
    (x) =>
      ({
        id: x[0],
        category: x[1],
        questionType: x[2],
        difficulty: x[3],
        text: x[4],
        choices: x[5],
        correctAnswer: x[6],
        reference: x[7],
        explanation: x[8],
      } as Question)
  );
  constructor() {
    void this.loadPublishedQuestions();
  }
  private async loadPublishedQuestions() {
    try {
      const snapshot = await getDocs(
        query(
          collection(firebaseDb, 'questions'),
          where('status', '==', 'published'),
          where('isActive', '==', true),
          limit(300)
        )
      );
      const remote = snapshot.docs
        .map((doc) => this.fromStudio(doc.id, doc.data()))
        .filter((q): q is Question => !!q);
      if (remote.length)
        this.questions.splice(0, this.questions.length, ...remote);
    } catch (error) {
      console.warn(
        '[Questions] Published library unavailable; using bundled fallback.',
        error
      );
    }
  }
  private fromStudio(id: string, data: any): Question | null {
    const category =
      data.category === 'bible_knowledge' ? 'knowledge' : data.category;
    if (!MULTIPLAYER_CATEGORIES.includes(category)) return null;
    const answer = data.answerData || {};
    let choices: string[] = [],
      correct = '';
    if (answer.type === 'multiple_choice') {
      choices = (answer.options || []).map((x: any) => x.text);
      correct =
        (answer.options || []).find((x: any) =>
          (answer.correctOptionIds || []).includes(x.id)
        )?.text || '';
    } else if (answer.type === 'true_false') {
      choices = ['True', 'False'];
      correct = answer.correctValue ? 'True' : 'False';
    } else if (answer.type === 'text') {
      correct = answer.primaryAnswer;
      choices = [correct, ...(answer.distractors || [])];
    } else return null;
    choices = [...new Map(choices.filter(Boolean).map((choice:string)=>[choice.trim().toLowerCase(),choice.trim()])).values()] as string[];
    if (choices.length < 4) {
      const fillers = ['Moses', 'Jerusalem', 'Genesis', 'None of these'].filter(
        (x) => x !== correct && !choices.includes(x)
      );
      choices = [...choices, ...fillers].slice(0, 4);
    }
    return {
      id,
      category,
      questionType:
        data.questionType === 'arrange_verse'
          ? 'arrange_the_verse'
          : data.questionType,
      difficulty: data.difficulty,
      text: data.prompt,
      choices,
      correctAnswer: correct,
      reference: data.scriptureReference || '',
      explanation: data.explanation || '',
    } as Question;
  }
  getQuestionById(id: string) {
    return this.questions.find((q) => q.id === id);
  }
  getRandomQuestionByCategory(category: MatchCategory, hardOnly = false) {
    const pool = this.questions.filter(
      (q) =>
        q.category === category &&
        (!hardOnly || ['hard', 'expert'].includes(q.difficulty))
    );
    return {
      ...(pool[Math.floor(Math.random() * pool.length)] ||
        this.questions.find((q) => q.category === category)!),
    };
  }
  rollDifficulty(): Difficulty {
    const n = Math.random() * 100;
    return n < 40 ? 'easy' : n < 70 ? 'medium' : n < 95 ? 'hard' : 'expert';
  }
  getCategories() {
    return [...MULTIPLAYER_CATEGORIES];
  }
}
