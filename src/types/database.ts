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

export interface LessonPlanPeriod {
  id: string
  time_label: string
  monday: string
  tuesday: string
  wednesday: string
  thursday: string
  friday: string
}

export interface LessonPlan {
  id: string
  user_id: string
  name: string
  grade: string | null
  notes: string | null
  periods: LessonPlanPeriod[]
  created_at: string
  updated_at: string
}

// Mirrors MONTHLY_GENERATION_LIMIT in supabase/functions/generate-activity —
// the server is the real source of truth; this is only for the client-side
// usage indicator so the display can't drift from what actually gets enforced.
export const GENERATION_LIMIT = 30

export const WEEKDAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
] as const

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

// Matches the Spanish-speaking system's three stages (Primaria / Secundaria /
// Bachillerato), in English. Grades are currently capped at Primary (see
// GRADES below), but the field stays editable in case that changes later.
export const EDUCATION_LEVELS = ["Primary", "Secondary", "Baccalaureate"] as const

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
  "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade", "6th Grade",
] as const

/** Best-guess education level for a grade, so the field can be pre-filled
 * instead of asking twice for overlapping information. Always shown and
 * editable, never applied silently. */
export function inferEducationLevel(grade: string): (typeof EDUCATION_LEVELS)[number] | null {
  const index = GRADES.indexOf(grade as (typeof GRADES)[number])
  if (index === -1) return null
  return "Primary"
}

// Subjects actually taught up through 6th grade — no split sciences
// (biology/chemistry/physics), civics, economics, or philosophy yet.
export const SUBJECTS = [
  "Mathematics", "Science", "English / Language Arts",
  "Native Language / Literature", "History", "Geography", "Social Studies",
  "Art", "Music", "Physical Education", "Foreign Language",
  "Environmental Science", "Health",
] as const
