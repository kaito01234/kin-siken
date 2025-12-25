export interface Choice {
  label: string
  text: string
  helpUrl: string
  textReference: string
}

export interface Question {
  id: number
  category: string
  content: string
  choices: Choice[]
  correctAnswer: string
  isMultiple: boolean
  exam: string
}

export interface QuizConfig {
  categories: string[]
  questionCount: number | 'all'
  shuffleQuestions: boolean
  shuffleChoices: boolean
}

export interface AnswerRecord {
  questionId: number
  selectedAnswers: string[]
  isCorrect: boolean
}

export interface QuizResult {
  answers: AnswerRecord[]
  totalQuestions: number
  correctCount: number
  startTime: Date
  endTime: Date
  config: QuizConfig
}

export interface HistoryEntry {
  date: string
  correctRate: number
  totalQuestions: number
  categories: string[]
}
