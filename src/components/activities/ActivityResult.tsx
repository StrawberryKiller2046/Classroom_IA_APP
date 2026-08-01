import { useState } from "react"
import { Check, CheckCircle2, Circle, CircleCheck, Download, Eye, EyeOff } from "lucide-react"
import type { Activity } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { exportActivityToPdf } from "@/lib/pdf"

export default function ActivityResult({ activity }: { activity: Activity }) {
  const [showAnswers, setShowAnswers] = useState(false)

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="size-4" />
            Generated successfully
          </div>
          <CardTitle className="text-xl">{activity.exam_name}</CardTitle>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary">{activity.subject}</Badge>
            <Badge variant="secondary">{activity.grade}</Badge>
            <Badge variant="secondary">{activity.difficulty}</Badge>
            <Badge variant="secondary">{activity.exercises.length} exercises</Badge>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {activity.answer_key && (
            <Button variant="outline" size="sm" onClick={() => setShowAnswers((v) => !v)}>
              {showAnswers ? <EyeOff /> : <Eye />}
              {showAnswers ? "Hide answers" : "Show answers"}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => exportActivityToPdf(activity, { includeAnswerKey: activity.include_answer_sheet })}
          >
            <Download />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="divide-y p-0 [&>*]:px-6 [&>*]:py-5">
        {activity.exercises.map((exercise, index) => (
          <div key={exercise.id}>
            <p className="flex gap-2.5 font-medium">
              <span className="font-mono text-sm text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              {exercise.question}
            </p>
            {exercise.type === "mc" && exercise.options && (
              <ul className="mt-3 grid gap-1.5 pl-8 text-sm text-muted-foreground">
                {exercise.options.map((option) => {
                  const isCorrect = showAnswers && option === exercise.correct_answer
                  return (
                    <li
                      key={option}
                      className={
                        isCorrect
                          ? "flex items-center gap-2 font-medium text-success"
                          : "flex items-center gap-2"
                      }
                    >
                      {isCorrect ? (
                        <CircleCheck className="size-4 shrink-0" />
                      ) : (
                        <Circle className="size-4 shrink-0" />
                      )}
                      {option}
                    </li>
                  )
                })}
              </ul>
            )}
            {exercise.type === "tf" && (
              <div className="mt-3 flex gap-5 pl-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Circle className="size-4" /> True
                </span>
                <span className="flex items-center gap-2">
                  <Circle className="size-4" /> False
                </span>
              </div>
            )}
            {exercise.type === "short" && (
              <div className="mt-3 ml-8 h-px w-2/3 bg-border" />
            )}
            {showAnswers && exercise.type !== "mc" && (
              <p className="mt-3 flex items-center gap-2 pl-8 text-sm font-medium text-success">
                <Check className="size-4" />
                {exercise.correct_answer}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
