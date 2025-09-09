export enum QuestionType {
  MultipleChoice = 'multiple-choice',
  ShortAnswer = 'short-answer',
}

export interface QuizQuestion {
  question: string;
  type: QuestionType;
  options?: string[];
  answer: string;
}

export interface VocabularyTerm {
  term: string;
  definition: string;
}

export interface GeneratedContent {
  summary: string;
  keyTakeaways: string[];
  vocabulary: VocabularyTerm[];
  quiz: QuizQuestion[];
}

export interface UserAnswer {
  [questionIndex: number]: string;
}

export interface QuizResult {
  score: number;
  total: number;
  results: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

export interface CodeAnalysisResult {
    recognizedCode: string;
    timeComplexity: string;
    explanation: string;
    recommendations: string;
    optimizedCode?: string;
}

export interface ClarifiedConcept {
  title: string;
  simplifiedExplanation: string;
  analogy: string;
}