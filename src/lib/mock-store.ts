// Local, browser-only stand-in for Supabase so the app is fully clickable
// before a real project is connected. Persists to localStorage so a refresh
// doesn't lose whatever the user adds. Swapped out automatically by api.ts
// once VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set (isSupabaseConfigured).
import type {
  Activity,
  AnswerKey,
  Classroom,
  Exercise,
  GradingResult,
  Student,
} from "@/types/database"
import type { GenerateActivityInput } from "@/lib/api"

const STORAGE_KEY = "classroom-ai-demo-v2"

interface Store {
  classrooms: Classroom[]
  students: Student[]
  activities: Activity[]
  gradingResults: GradingResult[]
}

function seed(): Store {
  const now = new Date().toISOString()
  const classroomId = "demo-classroom-1"
  const activityId = "demo-activity-1"
  const studentIds = ["demo-student-1", "demo-student-2", "demo-student-3"]

  const exercises: Exercise[] = [
    {
      id: "q1",
      type: "mc",
      question: "What is the powerhouse of the cell?",
      options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
      correct_answer: "Mitochondria",
    },
    {
      id: "q2",
      type: "tf",
      question: "Plants release oxygen during photosynthesis.",
      correct_answer: "True",
    },
    {
      id: "q3",
      type: "short",
      question: "What gas do humans exhale that plants use for photosynthesis?",
      correct_answer: "Carbon dioxide",
    },
    {
      id: "q4",
      type: "mc",
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correct_answer: "Mars",
    },
    {
      id: "q5",
      type: "short",
      question: "How many legs does an insect have?",
      correct_answer: "6",
    },
  ]
  const answer_key: AnswerKey = Object.fromEntries(exercises.map((e) => [e.id, e.correct_answer]))

  const mathExercises: Exercise[] = [
    { id: "m1", type: "short", question: "What is 3/4 + 1/4?", correct_answer: "1" },
    { id: "m2", type: "tf", question: "A square has four equal sides.", correct_answer: "True" },
    { id: "m3", type: "mc", question: "What is 12 x 4?", options: ["36", "48", "44", "52"], correct_answer: "48" },
  ]
  const mathActivityId = "demo-activity-2"

  return {
    // A classroom is just a grade-level group now — no subject attached, so
    // one roster can have activities from several subjects (demoed below).
    classrooms: [
      { id: classroomId, user_id: "demo", name: "5A", grade: "5th Grade", created_at: now },
    ],
    students: [
      { id: studentIds[0], classroom_id: classroomId, name: "Ava Martinez", notes: null, created_at: now },
      { id: studentIds[1], classroom_id: classroomId, name: "Liam Chen", notes: null, created_at: now },
      { id: studentIds[2], classroom_id: classroomId, name: "Noor Ahmed", notes: "Needs extra time", created_at: now },
    ],
    activities: [
      {
        id: activityId,
        user_id: "demo",
        exam_name: "Science - 5th Grade - Sample Quiz",
        subject: "Science",
        country: "United States",
        education_level: "Primary",
        grade: "5th Grade",
        topic: "Cells & the Solar System",
        exercise_type: "mixed",
        difficulty: "Medium",
        num_exercises: exercises.length,
        exercises,
        answer_key,
        pdf_url: null,
        classroom_id: classroomId,
        created_at: now,
      },
      {
        id: mathActivityId,
        user_id: "demo",
        exam_name: "Mathematics - 5th Grade - Sample Quiz",
        subject: "Mathematics",
        country: "United States",
        education_level: "Primary",
        grade: "5th Grade",
        topic: "Fractions & Multiplication",
        exercise_type: "mixed",
        difficulty: "Medium",
        num_exercises: mathExercises.length,
        exercises: mathExercises,
        answer_key: Object.fromEntries(mathExercises.map((e) => [e.id, e.correct_answer])),
        pdf_url: null,
        classroom_id: classroomId,
        created_at: now,
      },
    ],
    gradingResults: [
      {
        id: "demo-result-1",
        student_id: studentIds[0],
        activity_id: activityId,
        answers: { q1: "Mitochondria", q2: "True", q3: "Carbon dioxide", q4: "Mars", q5: "6" },
        score: 100,
        graded_at: now,
      },
      {
        id: "demo-result-2",
        student_id: studentIds[1],
        activity_id: activityId,
        answers: { q1: "Nucleus", q2: "True", q3: "Carbon dioxide", q4: "Mars", q5: "8" },
        score: 60,
        graded_at: now,
      },
      {
        id: "demo-result-3",
        student_id: studentIds[0],
        activity_id: mathActivityId,
        answers: { m1: "1", m2: "True", m3: "48" },
        score: 100,
        graded_at: now,
      },
      {
        id: "demo-result-4",
        student_id: studentIds[1],
        activity_id: mathActivityId,
        answers: { m1: "1/2", m2: "True", m3: "44" },
        score: 33,
        graded_at: now,
      },
    ],
  }
}

function load(): Store {
  if (typeof localStorage === "undefined") return seed()
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const initial = seed()
    save(initial)
    return initial
  }
  try {
    return JSON.parse(raw) as Store
  } catch {
    const initial = seed()
    save(initial)
    return initial
  }
}

function save(store: Store) {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))
const uid = () => crypto.randomUUID()

export const mockApi = {
  async generateActivity(input: GenerateActivityInput): Promise<Activity> {
    await delay(600)
    const store = load()
    const count = Math.max(1, Math.min(input.num_exercises, 20))
    const types: Exercise["type"][] =
      input.exercise_type === "mc"
        ? ["mc"]
        : input.exercise_type === "tf"
          ? ["tf"]
          : input.exercise_type === "short"
            ? ["short"]
            : ["mc", "tf", "short"]

    const exercises: Exercise[] = Array.from({ length: count }, (_, i) => {
      const type = types[i % types.length]
      const topic = input.topic || input.subject
      if (type === "mc") {
        return {
          id: `q${i + 1}`,
          type,
          question: `[Demo] Sample ${input.difficulty.toLowerCase()} question about ${topic} (#${i + 1})`,
          options: ["Option A (correct)", "Option B", "Option C", "Option D"],
          correct_answer: "Option A (correct)",
        }
      }
      if (type === "tf") {
        return {
          id: `q${i + 1}`,
          type,
          question: `[Demo] True or false: this is a sample statement about ${topic} (#${i + 1}).`,
          correct_answer: "True",
        }
      }
      return {
        id: `q${i + 1}`,
        type,
        question: `[Demo] Short-answer sample question about ${topic} (#${i + 1})`,
        correct_answer: "Sample answer",
      }
    })

    const suggestedTitle = input.topic
      ? `[Demo] ${input.topic} in ${input.subject}`
      : `[Demo] ${input.subject} Practice Exam`

    const activity: Activity = {
      id: uid(),
      user_id: "demo",
      exam_name: input.use_ai_title ? suggestedTitle : input.exam_name,
      subject: input.subject,
      country: input.country,
      education_level: input.education_level,
      grade: input.grade,
      topic: input.topic ?? null,
      exercise_type: input.exercise_type,
      difficulty: input.difficulty,
      num_exercises: exercises.length,
      exercises,
      answer_key: Object.fromEntries(exercises.map((e) => [e.id, e.correct_answer])),
      pdf_url: null,
      classroom_id: input.classroom_id ?? null,
      created_at: new Date().toISOString(),
    }

    store.activities.unshift(activity)
    save(store)
    return activity
  },

  async listActivities(): Promise<Activity[]> {
    await delay()
    return load().activities.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  async getActivity(id: string): Promise<Activity> {
    await delay()
    const activity = load().activities.find((a) => a.id === id)
    if (!activity) throw new Error("Activity not found")
    return activity
  },

  async listClassrooms(): Promise<Classroom[]> {
    await delay()
    return load().classrooms.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  async createClassroom(input: Pick<Classroom, "name" | "grade">): Promise<Classroom> {
    await delay()
    const store = load()
    const classroom: Classroom = { id: uid(), user_id: "demo", created_at: new Date().toISOString(), ...input }
    store.classrooms.unshift(classroom)
    save(store)
    return classroom
  },

  async updateClassroom(id: string, input: Partial<Pick<Classroom, "name" | "grade">>): Promise<Classroom> {
    await delay()
    const store = load()
    const classroom = store.classrooms.find((c) => c.id === id)
    if (!classroom) throw new Error("Classroom not found")
    Object.assign(classroom, input)
    save(store)
    return classroom
  },

  async deleteClassroom(id: string): Promise<void> {
    await delay()
    const store = load()
    store.classrooms = store.classrooms.filter((c) => c.id !== id)
    save(store)
  },

  async listStudents(classroomId: string): Promise<Student[]> {
    await delay()
    return load()
      .students.filter((s) => s.classroom_id === classroomId)
      .sort((a, b) => a.name.localeCompare(b.name))
  },

  async createStudent(input: Pick<Student, "classroom_id" | "name" | "notes">): Promise<Student> {
    await delay()
    const store = load()
    const student: Student = { id: uid(), created_at: new Date().toISOString(), ...input }
    store.students.push(student)
    save(store)
    return student
  },

  async deleteStudent(id: string): Promise<void> {
    await delay()
    const store = load()
    store.students = store.students.filter((s) => s.id !== id)
    save(store)
  },

  async listActivitiesForClassroom(classroomId: string): Promise<Activity[]> {
    await delay()
    return load()
      .activities.filter((a) => a.classroom_id === classroomId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },

  async saveGradingResult(input: {
    student_id: string
    activity_id: string
    answers: Record<string, string>
    score: number
  }): Promise<GradingResult> {
    await delay()
    const store = load()
    // Regrading a student replaces their previous result for this activity
    // instead of adding a second row that would skew averages.
    const existing = store.gradingResults.find(
      (r) => r.student_id === input.student_id && r.activity_id === input.activity_id
    )
    const result: GradingResult = {
      id: existing?.id ?? uid(),
      graded_at: new Date().toISOString(),
      ...input,
    }
    if (existing) {
      Object.assign(existing, result)
    } else {
      store.gradingResults.push(result)
    }
    save(store)
    return result
  },

  async getGradingResult(studentId: string, activityId: string): Promise<GradingResult | null> {
    await delay(100)
    const result = load().gradingResults.find(
      (r) => r.student_id === studentId && r.activity_id === activityId
    )
    return result ?? null
  },

  async listGradingResultsForActivity(activityId: string): Promise<GradingResult[]> {
    await delay()
    return load().gradingResults.filter((r) => r.activity_id === activityId)
  },

  async listGradingResultsForClassroom(classroomId: string): Promise<GradingResult[]> {
    await delay()
    const store = load()
    const studentIds = new Set(store.students.filter((s) => s.classroom_id === classroomId).map((s) => s.id))
    return store.gradingResults.filter((r) => studentIds.has(r.student_id))
  },

  async getUsage(): Promise<{ generations_used: number; month: string }> {
    await delay(100)
    const month = new Date().toISOString().slice(0, 7)
    return { generations_used: load().activities.length, month }
  },
}
