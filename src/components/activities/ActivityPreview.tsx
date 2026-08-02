import { useState } from "react"
import { Eye, EyeOff, FileCheck2, FileText, Loader2, Sparkles } from "lucide-react"
import type { Activity } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { exportActivityPdf, exportAnswerKeyPdf } from "@/lib/pdf"
import ExerciseList from "@/components/activities/ExerciseList"

export default function ActivityPreview({
  activity,
  loading,
}: {
  activity: Activity | null
  loading: boolean
}) {
  const [showAnswers, setShowAnswers] = useState(false)

  if (loading) {
    return (
      <EmptyPanel icon={<Loader2 className="size-7 animate-spin" />} text="Generating your activity..." />
    )
  }

  if (!activity) {
    return (
      <EmptyPanel
        icon={<Sparkles className="size-7" />}
        text="Fill out the form and generate an activity to preview it here."
      />
    )
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{activity.subject}</Badge>
          <Badge variant="secondary">{activity.grade}</Badge>
          <Badge variant="secondary">{activity.difficulty}</Badge>
          <Badge variant="secondary">{activity.exercises.length} exercises</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAnswers((v) => !v)}>
            {showAnswers ? <EyeOff /> : <Eye />}
            {showAnswers ? "Hide answers" : "Show answers"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportActivityPdf(activity)}>
            <FileText />
            Activity PDF
          </Button>
          <Button size="sm" onClick={() => exportAnswerKeyPdf(activity)}>
            <FileCheck2 />
            Answer key PDF
          </Button>
        </div>
      </div>

      <Card className="flex-1 gap-0 overflow-hidden py-0">
        <div className="border-b p-6 sm:p-8">
          <div className="mb-6 grid grid-cols-3 gap-6 border-b pb-5 text-xs tracking-wide text-muted-foreground uppercase">
            <span>
              Name
              <span className="mt-4 block h-px bg-border" />
            </span>
            <span>
              Teacher
              <span className="mt-4 block h-px bg-border" />
            </span>
            <span>
              Date
              <span className="mt-4 block h-px bg-border" />
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">{activity.exam_name}</h2>
        </div>
        <ExerciseList activity={activity} showAnswers={showAnswers} />
      </Card>
    </div>
  )
}

function EmptyPanel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Card className="flex h-full min-h-80 flex-col items-center justify-center gap-3 border-dashed p-8 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="max-w-xs text-sm text-muted-foreground">{text}</p>
    </Card>
  )
}
