import { useEffect, useState } from "react"
import { ChevronDown, Download, History as HistoryIcon } from "lucide-react"
import { listActivities, listClassrooms } from "@/lib/api"
import type { Activity, Classroom } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { exportActivityToPdf } from "@/lib/pdf"
import ExerciseList from "@/components/activities/ExerciseList"

export default function ActivityHistory() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listActivities(), listClassrooms()])
      .then(([a, c]) => {
        setActivities(a)
        setClassrooms(c)
      })
      .finally(() => setLoading(false))
  }, [])

  const classroomName = (id: string | null) => classrooms.find((c) => c.id === id)?.name

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-muted-foreground">Every activity you've generated, in one place.</p>
      </div>

      {!loading && activities.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <HistoryIcon className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No activities yet</p>
              <p className="text-sm text-muted-foreground">
                Generate one from the Generator screen and it'll show up here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {activities.map((activity) => {
          const expanded = expandedId === activity.id
          return (
            <Card key={activity.id} className="overflow-hidden py-0">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(expanded ? null : activity.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setExpandedId(expanded ? null : activity.id)
                  }
                }}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/30"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{activity.exam_name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{activity.subject}</Badge>
                    <Badge variant="secondary">{activity.grade}</Badge>
                    <Badge variant="secondary">{activity.exercises.length} exercises</Badge>
                    {classroomName(activity.classroom_id) && (
                      <Badge variant="outline">{classroomName(activity.classroom_id)}</Badge>
                    )}
                    <span className="font-mono text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Export PDF"
                    onClick={(e) => {
                      e.stopPropagation()
                      exportActivityToPdf(activity, { includeAnswerKey: activity.include_answer_sheet })
                    }}
                  >
                    <Download className="size-4" />
                  </Button>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                </div>
              </div>
              {expanded && (
                <div className="border-t bg-muted/20">
                  <ExerciseList activity={activity} showAnswers />
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
