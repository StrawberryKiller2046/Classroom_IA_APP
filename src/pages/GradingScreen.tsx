import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getActivity, listStudents, saveGradingResult } from "@/lib/api"
import { isCorrectAnswer } from "@/lib/normalize"
import type { Activity, Student } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import AnswerInput from "@/components/grading/AnswerInput"

export default function GradingScreen() {
  const { classroomId, activityId, studentId } = useParams()
  const navigate = useNavigate()

  const [activity, setActivity] = useState<Activity | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!activityId || !classroomId) return
    getActivity(activityId).then(setActivity).catch(() => toast.error("Activity not found"))
    listStudents(classroomId).then(setStudents).catch(() => {})
  }, [activityId, classroomId])

  useEffect(() => {
    setAnswers({})
    setStep(0)
  }, [studentId])

  const student = students.find((s) => s.id === studentId)
  const exercise = activity?.exercises[step]
  const total = activity?.exercises.length ?? 0

  const score = useMemo(() => {
    if (!activity) return 0
    let correct = 0
    for (const ex of activity.exercises) {
      const given = answers[ex.id]
      const correctAnswer = activity.answer_key?.[ex.id] ?? ex.correct_answer
      if (given && isCorrectAnswer(given, correctAnswer, ex.type)) correct++
    }
    return activity.exercises.length ? (correct / activity.exercises.length) * 100 : 0
  }, [answers, activity])

  if (!activity || !student) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isLastStep = step === total - 1
  const isReview = step === total

  const goNext = () => setStep((s) => Math.min(s + 1, total))
  const goPrev = () => setStep((s) => Math.max(s - 1, 0))

  const finishAndSave = async () => {
    setSaving(true)
    try {
      await saveGradingResult({
        student_id: student.id,
        activity_id: activity.id,
        answers,
        score,
      })
      toast.success(`Saved: ${student.name} scored ${score.toFixed(0)}%`)
      navigate(`/classrooms/${classroomId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save result")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-xl gap-6">
      <div className="flex items-center justify-between">
        <Link
          to={`/classrooms/${classroomId}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to classroom
        </Link>
        <span className="text-sm font-medium text-muted-foreground">
          {isReview ? "Review" : `Question ${step + 1} of ${total}`}
        </span>
      </div>

      <Progress value={((isReview ? total : step) / total) * 100} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal text-muted-foreground">
            Grading <span className="font-semibold text-foreground">{student.name}</span>
            <span className="mx-1.5 text-muted-foreground/40">/</span>
            {activity.exam_name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isReview && exercise && (
            <div className="grid gap-5">
              <p className="text-lg font-medium">{exercise.question}</p>
              <AnswerInput
                exercise={exercise}
                value={answers[exercise.id] ?? ""}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [exercise.id]: v }))}
              />
            </div>
          )}

          {isReview && (
            <div className="grid gap-4">
              <div className="rounded-lg border bg-muted/40 p-4 text-center">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-3xl font-bold">{score.toFixed(0)}%</p>
              </div>
              <div className="grid gap-2">
                {activity.exercises.map((ex, i) => {
                  const given = answers[ex.id] || "No answer"
                  const correctAnswer = activity.answer_key?.[ex.id] ?? ex.correct_answer
                  const correct = answers[ex.id] && isCorrectAnswer(answers[ex.id], correctAnswer, ex.type)
                  return (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="text-muted-foreground">
                        {i + 1}. {ex.question}
                      </span>
                      <span className={correct ? "font-medium text-success" : "font-medium text-destructive"}>
                        {given}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={goPrev} disabled={step === 0}>
          <ArrowLeft />
          Previous
        </Button>
        {!isReview ? (
          <Button onClick={goNext}>
            {isLastStep ? "Review" : "Next"}
            <ArrowRight />
          </Button>
        ) : (
          <Button onClick={finishAndSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Check />}
            Save result
          </Button>
        )}
      </div>
    </div>
  )
}
