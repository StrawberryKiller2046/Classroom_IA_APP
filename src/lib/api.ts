import { isSupabaseConfigured, supabase } from "@/lib/supabase"
import { mockApi } from "@/lib/mock-store"
import type { Activity, Classroom, GradingResult, Student } from "@/types/database"

export interface GenerateActivityInput {
  country: string
  education_level: string
  grade: string
  subject: string
  topic?: string
  exercise_type: string
  difficulty: string
  num_exercises: number
  exam_name: string
  include_answer_sheet: boolean
  classroom_id?: string | null
  // When true, the AI-suggested title (based on the actual exam content)
  // replaces exam_name instead of the client's placeholder.
  use_ai_title?: boolean
}

export async function generateActivity(input: GenerateActivityInput): Promise<Activity> {
  if (!isSupabaseConfigured) return mockApi.generateActivity(input)

  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error("Not authenticated")

  const { data, error } = await supabase.functions.invoke("generate-activity", {
    body: input,
    headers: { Authorization: `Bearer ${token}` },
  })

  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data.activity as Activity
}

export async function listActivities(): Promise<Activity[]> {
  if (!isSupabaseConfigured) return mockApi.listActivities()
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as Activity[]
}

export async function getActivity(id: string): Promise<Activity> {
  if (!isSupabaseConfigured) return mockApi.getActivity(id)
  const { data, error } = await supabase.from("activities").select("*").eq("id", id).single()
  if (error) throw error
  return data as Activity
}

export async function listClassrooms(): Promise<Classroom[]> {
  if (!isSupabaseConfigured) return mockApi.listClassrooms()
  const { data, error } = await supabase
    .from("classrooms")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as Classroom[]
}

export async function createClassroom(input: Pick<Classroom, "name" | "grade" | "subject">) {
  if (!isSupabaseConfigured) return mockApi.createClassroom(input)
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error("Not authenticated")
  const { data, error } = await supabase
    .from("classrooms")
    .insert({ ...input, user_id: userData.user.id })
    .select()
    .single()
  if (error) throw error
  return data as Classroom
}

export async function updateClassroom(id: string, input: Partial<Pick<Classroom, "name" | "grade" | "subject">>) {
  if (!isSupabaseConfigured) return mockApi.updateClassroom(id, input)
  const { data, error } = await supabase.from("classrooms").update(input).eq("id", id).select().single()
  if (error) throw error
  return data as Classroom
}

export async function deleteClassroom(id: string) {
  if (!isSupabaseConfigured) return mockApi.deleteClassroom(id)
  const { error } = await supabase.from("classrooms").delete().eq("id", id)
  if (error) throw error
}

export async function listStudents(classroomId: string): Promise<Student[]> {
  if (!isSupabaseConfigured) return mockApi.listStudents(classroomId)
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("classroom_id", classroomId)
    .order("name", { ascending: true })
  if (error) throw error
  return data as Student[]
}

export async function createStudent(input: Pick<Student, "classroom_id" | "name" | "notes">) {
  if (!isSupabaseConfigured) return mockApi.createStudent(input)
  const { data, error } = await supabase.from("students").insert(input).select().single()
  if (error) throw error
  return data as Student
}

export async function deleteStudent(id: string) {
  if (!isSupabaseConfigured) return mockApi.deleteStudent(id)
  const { error } = await supabase.from("students").delete().eq("id", id)
  if (error) throw error
}

export async function listActivitiesForClassroom(classroomId: string): Promise<Activity[]> {
  if (!isSupabaseConfigured) return mockApi.listActivitiesForClassroom(classroomId)
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("classroom_id", classroomId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as Activity[]
}

export async function saveGradingResult(input: {
  student_id: string
  activity_id: string
  answers: Record<string, string>
  score: number
}): Promise<GradingResult> {
  if (!isSupabaseConfigured) return mockApi.saveGradingResult(input)
  const { data, error } = await supabase
    .from("grading_results")
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data as GradingResult
}

export async function listGradingResultsForActivity(activityId: string): Promise<GradingResult[]> {
  if (!isSupabaseConfigured) return mockApi.listGradingResultsForActivity(activityId)
  const { data, error } = await supabase
    .from("grading_results")
    .select("*")
    .eq("activity_id", activityId)
  if (error) throw error
  return data as GradingResult[]
}

export async function listGradingResultsForClassroom(classroomId: string): Promise<GradingResult[]> {
  if (!isSupabaseConfigured) return mockApi.listGradingResultsForClassroom(classroomId)
  const { data, error } = await supabase
    .from("grading_results")
    .select("*, students!inner(classroom_id)")
    .eq("students.classroom_id", classroomId)
  if (error) throw error
  return data as GradingResult[]
}

export async function getUsage(): Promise<{ generations_used: number; month: string }> {
  if (!isSupabaseConfigured) return mockApi.getUsage()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error("Not authenticated")
  const month = new Date().toISOString().slice(0, 7)
  const { data, error } = await supabase
    .from("usage_counters")
    .select("generations_used, month")
    .eq("user_id", userData.user.id)
    .eq("month", month)
    .maybeSingle()
  if (error) throw error
  return data ?? { generations_used: 0, month }
}
