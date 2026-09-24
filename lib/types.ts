export interface Question {
  id: string;
  prompt: string;
  maxMarks: number;
  markingGuide?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  totalMarks: number;
  maxAiContentPercent: number;
  questions: Question[];
  createdAt: string;
}

export interface InlineComment {
  id: string;
  text: string;
  position: number;
  length: number;
  type: 'tick' | 'warning' | 'cross' | 'comment';
}

export interface QuestionMark {
  questionId: string;
  score: number;
  maxScore: number;
  alignmentScore: number;
  criteriaMarks?: { criterion: string; marks: number; maxMarks: number; comment: string }[];
  inlineComments: InlineComment[];
  generalComment: string;
}

export interface MarkingResult {
  id: string;
  assignmentId: string;
  studentName: string;
  submittedAt: string;
  aiContentPercent: number;
  aiRationale: string;
  recommendRedo: boolean;
  questionMarks: QuestionMark[];
  totalScore: number;
  totalMaxScore: number;
  answers: { questionId: string; text: string }[];
}
