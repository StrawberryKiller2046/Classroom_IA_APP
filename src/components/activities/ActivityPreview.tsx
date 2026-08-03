import { useState } from "react"
import { Code2, Eye, EyeOff, FileCheck2, FileText, Loader2, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import type { Activity } from "@/types/database"
import { cn } from "@/lib/utils"
import { updateActivity } from "@/lib/api"
import { activityToMarkdown, markdownToActivity } from "@/lib/activity-markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { exportActivityPdf, exportAnswerKeyPdf } from "@/lib/pdf"
import ExerciseList from "@/components/activities/ExerciseList"

export default function ActivityPreview({
  activity,
  loading,
  onActivityChange,
}: {
  activity: Activity | null
  loading: boolean
  onActivityChange?: (activity: Activity) => void
}) {
  const [showAnswers, setShowAnswers] = useState(false)
  const [editingText, setEditingText] = useState(false)
  const [draft, setDraft] = useState("")
  const [applying, setApplying] = useState(false)

  const startEditing = () => {
    if (!activity) return
    setDraft(activityToMarkdown(activity))
    setEditingText(true)
  }

  const cancelEditing = () => setEditingText(false)

  const applyEditing = async () => {
    if (!activity) return
    const parsed = markdownToActivity(draft, activity.exam_name)
    if ("error" in parsed) {
      toast.error(parsed.error)
      return
    }
    const answer_key = Object.fromEntries(parsed.exercises.map((e) => [e.id, e.correct_answer]))
    setApplying(true)
    try {
      const updated = await updateActivity(activity.id, {
        exam_name: parsed.exam_name,
        exercises: parsed.exercises,
        answer_key,
        num_exercises: parsed.exercises.length,
      })
      onActivityChange?.(updated)
      setEditingText(false)
      toast.success("Sheet updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes")
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <WorksheetGhost
        icon={<Loader2 className="size-6 animate-spin" />}
        text="Generating your activity..."
        pulse
      />
    )
  }

  if (!activity) {
    return (
      <WorksheetGhost
        icon={<Sparkles className="size-6" />}
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
          {editingText ? (
            <>
              <Button variant="outline" size="sm" onClick={cancelEditing} disabled={applying}>
                <X />
                Cancel
              </Button>
              <Button size="sm" onClick={applyEditing} disabled={applying}>
                {applying ? <Loader2 className="animate-spin" /> : <FileText />}
                Back to sheet
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Code2 />
                Edit as text
              </Button>
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
            </>
          )}
        </div>
      </div>

      {editingText ? (
        <Card className="flex-1 gap-3 overflow-hidden py-4">
          <p className="px-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">#</span> title ·{" "}
            <span className="font-medium text-foreground">##</span> question · mark the right choice with{" "}
            <span className="font-mono text-foreground">[x]</span> · or write{" "}
            <span className="font-mono text-foreground">Answer: ...</span> for true/false or short answer
          </p>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[420px] flex-1 resize-none rounded-none border-0 border-t px-4 py-3 font-mono text-sm shadow-none focus-visible:ring-0"
            spellCheck={false}
          />
        </Card>
      ) : (
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
      )}
    </div>
  )
}

/** Renders the same worksheet shape (name/teacher/date, title, a few
 * question blocks) in muted skeleton form, with a message overlaid — so the
 * idle and loading states preview the page layout instead of showing a
 * generic empty box. */
function WorksheetGhost({ icon, text, pulse }: { icon: React.ReactNode; text: string; pulse?: boolean }) {
  return (
    <Card className="relative min-h-96 gap-0 overflow-hidden py-0">
      <div className={cn("p-6 sm:p-8", pulse && "animate-pulse")}>
        <div className="mb-6 grid grid-cols-3 gap-6 border-b pb-5">
          <div className="h-2 w-10 rounded-full bg-muted" />
          <div className="h-2 w-12 rounded-full bg-muted" />
          <div className="h-2 w-8 rounded-full bg-muted" />
        </div>
        <div className="mb-8 h-5 w-2/3 rounded-full bg-muted" />
        <div className="grid gap-6">
          {[100, 70, 85, 55].map((width, i) => (
            <div key={i} className="grid gap-2">
              <div className="h-2.5 rounded-full bg-muted" style={{ width: `${width}%` }} />
              <div className="h-2.5 w-2/5 rounded-full bg-muted/70" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-transparent via-card/90 to-card px-8 text-center">
        <div className="text-muted-foreground">{icon}</div>
        <p className="max-w-64 text-sm text-muted-foreground">{text}</p>
      </div>
    </Card>
  )
}
