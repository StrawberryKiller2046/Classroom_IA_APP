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
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
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

// Matches the Spanish-speaking system's three stages. Grades are currently
// capped at Primaria (see GRADES below), but the field stays editable in
// case that changes later.
export const EDUCATION_LEVELS = ["Primaria", "Secundaria", "Bachillerato"] as const

export const DIFFICULTIES = ["Fácil", "Medio", "Difícil", "Mixto"] as const

export const EXERCISE_TYPES = [
  { value: "mc", label: "Opción múltiple" },
  { value: "tf", label: "Verdadero / Falso" },
  { value: "short", label: "Respuesta corta" },
  { value: "mixed", label: "Mixto" },
] as const

export const COUNTRIES = [
  "Argentina", "Australia", "Austria", "Bélgica", "Bolivia", "Brasil",
  "Canadá", "Chile", "China", "Colombia", "Costa Rica", "Cuba",
  "República Checa", "Dinamarca", "República Dominicana", "Ecuador", "Egipto",
  "El Salvador", "Finlandia", "Francia", "Alemania", "Grecia", "Guatemala",
  "Honduras", "Hong Kong", "Hungría", "India", "Indonesia", "Irlanda",
  "Israel", "Italia", "Jamaica", "Japón", "Kenia", "Malasia", "México",
  "Marruecos", "Países Bajos", "Nueva Zelanda", "Nicaragua", "Nigeria",
  "Noruega", "Panamá", "Paraguay", "Perú", "Filipinas", "Polonia",
  "Portugal", "Puerto Rico", "Rumania", "Rusia", "Arabia Saudita",
  "Singapur", "Sudáfrica", "Corea del Sur", "España", "Suecia",
  "Suiza", "Tailandia", "Turquía", "Ucrania", "Emiratos Árabes Unidos",
  "Reino Unido", "Estados Unidos", "Uruguay", "Venezuela", "Vietnam",
] as const

export const GRADES = [
  "Preescolar",
  "1er Grado", "2do Grado", "3er Grado", "4to Grado", "5to Grado", "6to Grado",
] as const

/** Best-guess education level for a grade, so the field can be pre-filled
 * instead of asking twice for overlapping information. Always shown and
 * editable, never applied silently. */
export function inferEducationLevel(grade: string): (typeof EDUCATION_LEVELS)[number] | null {
  const index = GRADES.indexOf(grade as (typeof GRADES)[number])
  if (index === -1) return null
  return "Primaria"
}

// Subjects actually taught up through 6th grade — no split sciences
// (biology/chemistry/physics), civics, economics, or philosophy yet.
export const SUBJECTS = [
  "Matemáticas", "Ciencias", "Inglés / Lengua",
  "Lengua Materna / Literatura", "Historia", "Geografía", "Estudios Sociales",
  "Arte", "Música", "Educación Física", "Idioma Extranjero",
  "Ciencias Ambientales", "Salud",
] as const
