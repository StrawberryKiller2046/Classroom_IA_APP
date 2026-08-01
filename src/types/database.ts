export type ExerciseType = "mc" | "tf" | "short"

export interface Exercise {
  id: string
  question: string
  type: ExerciseType
  options?: string[]
  correct_answer: string
}

export interface AnswerKey {
  [exerciseId: string]: string
}

export interface Activity {
  id: string
  user_id: string
  exam_name: string
  subject: string
  country: string
  education_level: string
  grade: string
  topic: string | null
  exercise_type: string
  difficulty: string
  num_exercises: number
  include_answer_sheet: boolean
  exercises: Exercise[]
  answer_key: AnswerKey | null
  pdf_url: string | null
  classroom_id: string | null
  created_at: string
}

export interface Classroom {
  id: string
  user_id: string
  name: string
  grade: string
  subject: string
  created_at: string
}

export interface Student {
  id: string
  classroom_id: string
  name: string
  notes: string | null
  created_at: string
}

export interface GradingAnswer {
  [exerciseId: string]: string
}

export interface GradingResult {
  id: string
  student_id: string
  activity_id: string
  answers: GradingAnswer
  score: number
  graded_at: string
}

export interface UsageCounter {
  user_id: string
  month: string
  generations_used: number
}

export interface Purchase {
  id: string
  user_id: string
  hotmart_transaction_id: string
  plan: string
  status: "active" | "pending" | "cancelled" | "refunded"
  created_at: string
}

export const EDUCATION_LEVELS = [
  "Primary",
  "Lower Secondary",
  "Upper Secondary",
  "Higher Education",
] as const

export const DIFFICULTIES = ["Easy", "Medium", "Hard", "Mixed"] as const

export const EXERCISE_TYPES = [
  { value: "mc", label: "Multiple Choice" },
  { value: "tf", label: "True / False" },
  { value: "short", label: "Short Answer" },
  { value: "mixed", label: "Mixed" },
] as const
