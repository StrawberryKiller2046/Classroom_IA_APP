import { useEffect, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, ClipboardCheck, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import {
  createStudent,
  deleteStudent,
  listActivitiesForClassroom,
  listClassrooms,
  listGradingResultsForClassroom,
  listStudents,
} from "@/lib/api"
import type { Activity, Classroom, GradingResult, Student } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function ClassroomDetail() {
  const { classroomId } = useParams()
  const navigate = useNavigate()

  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [results, setResults] = useState<GradingResult[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const refresh = async () => {
    if (!classroomId) return
    setLoading(true)
    try {
      const [all, studentList, activityList, resultList] = await Promise.all([
        listClassrooms(),
        listStudents(classroomId),
        listActivitiesForClassroom(classroomId),
        listGradingResultsForClassroom(classroomId),
      ])
      const found = all.find((c) => c.id === classroomId) ?? null
      if (!found) {
        setNotFound(true)
      } else {
        setClassroom(found)
      }
      setStudents(studentList)
      setActivities(activityList)
      setResults(resultList)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId])

  if (notFound) return <Navigate to="/classrooms" replace />
  if (loading || !classroom) return null

  return (
    <div className="grid gap-6">
      <div>
        <Link
          to="/classrooms"
          className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All classrooms
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{classroom.name}</h1>
        <p className="text-muted-foreground">
          {classroom.subject} · {classroom.grade}
        </p>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <StudentsPanel
            classroomId={classroom.id}
            students={students}
            onChanged={refresh}
          />
        </TabsContent>

        <TabsContent value="activities" className="mt-4">
          <ActivitiesPanel
            activities={activities}
            students={students}
            onGrade={(activityId, studentId) =>
              navigate(`/classrooms/${classroom.id}/grade/${activityId}/${studentId}`)
            }
          />
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <ResultsPanel activities={activities} students={students} results={results} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StudentsPanel({
  classroomId,
  students,
  onChanged,
}: {
  classroomId: string
  students: Student[]
  onChanged: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const onAdd = async () => {
    if (!name) return
    setSubmitting(true)
    try {
      await createStudent({ classroom_id: classroomId, name, notes: notes || null })
      setName("")
      setNotes("")
      setOpen(false)
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add student")
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (id: string) => {
    try {
      await deleteStudent(id)
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove student")
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus />
              Add student
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add student</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Student name" />
              </div>
              <div className="grid gap-1.5">
                <Label>Notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={onAdd} disabled={submitting}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {students.length === 0 ? (
        <EmptyState icon={Users} text="No students yet. Add your first one." />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {students.map((student) => (
              <div key={student.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{student.name}</p>
                  {student.notes && <p className="text-sm text-muted-foreground">{student.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => onDelete(student.id)} aria-label="Remove student">
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ActivitiesPanel({
  activities,
  students,
  onGrade,
}: {
  activities: Activity[]
  students: Student[]
  onGrade: (activityId: string, studentId: string) => void
}) {
  if (activities.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        text="No activities linked yet. Generate one from the Generator screen and select this classroom."
      />
    )
  }

  return (
    <div className="grid gap-4">
      {activities.map((activity) => (
        <Card key={activity.id}>
          <CardHeader>
            <CardTitle className="text-base">{activity.exam_name}</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add students to start grading this activity.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {students.map((student) => (
                  <Button
                    key={student.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onGrade(activity.id, student.id)}
                  >
                    Grade {student.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ResultsPanel({
  activities,
  students,
  results,
}: {
  activities: Activity[]
  students: Student[]
  results: GradingResult[]
}) {
  if (results.length === 0) {
    return <EmptyState icon={ClipboardCheck} text="No graded results yet." />
  }

  const average = results.reduce((sum, r) => sum + Number(r.score), 0) / results.length

  const missCounts: Record<string, { question: string; misses: number }> = {}
  for (const result of results) {
    const activity = activities.find((a) => a.id === result.activity_id)
    if (!activity) continue
    for (const exercise of activity.exercises) {
      const given = result.answers[exercise.id]
      const correctAnswer = activity.answer_key?.[exercise.id] ?? exercise.correct_answer
      const correct = given && given.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      if (!correct) {
        missCounts[exercise.id] ??= { question: exercise.question, misses: 0 }
        missCounts[exercise.id].misses++
      }
    }
  }
  const mostMissed = Object.values(missCounts)
    .sort((a, b) => b.misses - a.misses)
    .slice(0, 5)

  const byStudent = students
    .map((student) => {
      const studentResults = results.filter((r) => r.student_id === student.id)
      const avg = studentResults.length
        ? studentResults.reduce((sum, r) => sum + Number(r.score), 0) / studentResults.length
        : null
      return { student, avg, count: studentResults.length }
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Average score" value={`${average.toFixed(0)}%`} />
        <StatCard label="Graded submissions" value={String(results.length)} />
        <StatCard label="Students graded" value={String(byStudent.length)} />
      </div>

      {mostMissed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most missed questions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {mostMissed.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.question}</span>
                <Badge variant="destructive">{item.misses} missed</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-student breakdown</CardTitle>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {byStudent.map(({ student, avg, count }) => (
            <div key={student.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium">{student.name}</span>
              <span className="text-muted-foreground">
                {avg?.toFixed(0)}% avg · {count} graded
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

function EmptyState({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <Icon className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}
