import { Injectable } from '@angular/core';
import {
  MatchCategory,
  MULTIPLAYER_CATEGORIES,
  Question,
} from './multiplayer.models';

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private readonly questions: Question[] = [
    {
      id: 'q-ot-1',
      category: 'old_testament',
      difficulty: 'easy',
      text: "Who built the ark that saved Noah's family?",
      choices: ['Moses', 'Noah', 'Abraham', 'Joseph'],
      correctAnswer: 'Noah',
      reference: 'Genesis 6:13-22',
      explanation:
        'Noah obeyed God and built the ark to protect his family from the flood.',
    },
    {
      id: 'q-ot-2',
      category: 'old_testament',
      difficulty: 'easy',
      text: 'Which young shepherd defeated Goliath?',
      choices: ['Saul', 'David', 'Samuel', 'Elijah'],
      correctAnswer: 'David',
      reference: '1 Samuel 17',
      explanation:
        'David trusted God and defeated the giant with a sling and a stone.',
    },
    {
      id: 'q-nt-1',
      category: 'new_testament',
      difficulty: 'easy',
      text: 'Who was the angel that told Mary she would give birth to Jesus?',
      choices: ['Gabriel', 'Michael', 'Raphael', 'Uriel'],
      correctAnswer: 'Gabriel',
      reference: 'Luke 1:26-38',
      explanation: 'The angel Gabriel announced the birth of Jesus to Mary.',
    },
    {
      id: 'q-nt-2',
      category: 'new_testament',
      difficulty: 'medium',
      text: 'What miracle did Jesus perform at the wedding in Cana?',
      choices: [
        'Healed a blind man',
        'Walked on water',
        'Turned water into wine',
        'Raised Lazarus',
      ],
      correctAnswer: 'Turned water into wine',
      reference: 'John 2:1-11',
      explanation:
        'Jesus performed his first public miracle by turning water into wine.',
    },
    {
      id: 'q-gospel-1',
      category: 'jesus_and_gospels',
      difficulty: 'easy',
      text: 'Which gospel begins with the words “In the beginning was the Word”?',
      choices: ['Matthew', 'Mark', 'Luke', 'John'],
      correctAnswer: 'John',
      reference: 'John 1:1',
      explanation:
        'The Gospel of John opens with a beautiful description of Jesus as the Word.',
    },
    {
      id: 'q-char-1',
      category: 'bible_characters',
      difficulty: 'easy',
      text: 'Who was known for having a coat of many colors?',
      choices: ['Isaac', 'Joseph', 'Jacob', 'Esau'],
      correctAnswer: 'Joseph',
      reference: 'Genesis 37',
      explanation:
        'Joseph was loved by Jacob and received a special coat of many colors.',
    },
    {
      id: 'q-prop-1',
      category: 'prophets_and_kings',
      difficulty: 'medium',
      text: 'Which king was known for writing many Psalms?',
      choices: ['Solomon', 'Saul', 'David', 'Hezekiah'],
      correctAnswer: 'David',
      reference: 'Psalm 23',
      explanation:
        'David wrote many of the Psalms and is remembered as a shepherd king.',
    },
    {
      id: 'q-mem-1',
      category: 'memory_verses',
      difficulty: 'easy',
      text: 'Which verse says, “For God so loved the world”?',
      choices: ['John 3:16', 'Romans 8:28', 'Philippians 4:13', 'Proverbs 3:5'],
      correctAnswer: 'John 3:16',
      reference: 'John 3:16',
      explanation: "This beloved verse reminds us of God's love for the world.",
    },
  ];

  getRandomQuestionByCategory(category: MatchCategory): Question {
    const options = this.questions.filter(
      (question) => question.category === category,
    );
    const pick =
      options[Math.floor(Math.random() * options.length)] ?? this.questions[0];
    return { ...pick };
  }

  getQuestionById(id: string): Question | undefined {
    return this.questions.find((question) => question.id === id);
  }

  getCategories(): MatchCategory[] {
    return [...MULTIPLAYER_CATEGORIES];
  }
}
