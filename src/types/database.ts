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

export const COUNTRIES = [
  "Argentina", "Australia", "Austria", "Belgium", "Bolivia", "Brazil",
  "Canada", "Chile", "China", "Colombia", "Costa Rica", "Cuba",
  "Czech Republic", "Denmark", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Finland", "France", "Germany", "Greece", "Guatemala",
  "Honduras", "Hong Kong", "Hungary", "India", "Indonesia", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Kenya", "Malaysia", "Mexico",
  "Morocco", "Netherlands", "New Zealand", "Nicaragua", "Nigeria",
  "Norway", "Panama", "Paraguay", "Peru", "Philippines", "Poland",
  "Portugal", "Puerto Rico", "Romania", "Russia", "Saudi Arabia",
  "Singapore", "South Africa", "South Korea", "Spain", "Sweden",
  "Switzerland", "Thailand", "Turkey", "Ukraine", "United Arab Emirates",
  "United Kingdom", "United States", "Uruguay", "Venezuela", "Vietnam",
] as const

export const GRADES = [
  "Kindergarten",
  "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade",
  "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade",
  "11th Grade", "12th Grade",
  "1st Year (University)", "2nd Year (University)",
  "3rd Year (University)", "4th Year (University)",
] as const

export const SUBJECTS = [
  "Mathematics", "Science", "Biology", "Chemistry", "Physics",
  "English / Language Arts", "Native Language / Literature", "History",
  "Geography", "Social Studies", "Civics", "Economics",
  "Computer Science", "Art", "Music", "Physical Education",
  "Foreign Language", "Philosophy", "Environmental Science", "Health",
] as const
