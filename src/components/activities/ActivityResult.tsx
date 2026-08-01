import { useState } from "react"
import { CheckCircle2, Download, Eye, EyeOff } from "lucide-react"
import type { Activity } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { exportActivityToPdf } from "@/lib/pdf"
import ExerciseList from "@/components/activities/ExerciseList"

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
      <CardContent className="p-0">
        <ExerciseList activity={activity} showAnswers={showAnswers} />
      </CardContent>
    </Card>
  )
}
