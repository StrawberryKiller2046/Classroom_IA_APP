import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Download, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { createLessonPlan, getLessonPlan, updateLessonPlan } from "@/lib/api"
import { downloadExcel } from "@/lib/excel"
import type { LessonPlanPeriod } from "@/types/database"
import { GRADES, WEEKDAYS } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const emptyPeriod = (): LessonPlanPeriod => ({
  id: crypto.randomUUID(),
  time_label: "",
  monday: "",
  tuesday: "",
  wednesday: "",
  thursday: "",
  friday: "",
})

export default function PlannerEditor() {
  const { planId } = useParams()
  const isNew = !planId || planId === "new"
  const navigate = useNavigate()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [grade, setGrade] = useState("")
  const [notes, setNotes] = useState("")
  const [periods, setPeriods] = useState<LessonPlanPeriod[]>([emptyPeriod(), emptyPeriod()])

  useEffect(() => {
    if (isNew) {
      setName("")
      setGrade("")
      setNotes("")
      setPeriods([emptyPeriod(), emptyPeriod()])
      return
    }
    setLoading(true)
    getLessonPlan(planId!)
      .then((plan) => {
        setName(plan.name)
        setGrade(plan.grade ?? "")
        setNotes(plan.notes ?? "")
        setPeriods(plan.periods.length ? plan.periods : [emptyPeriod()])
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load lesson plan")
        navigate("/planner")
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId])

  const updatePeriod = (id: string, field: keyof LessonPlanPeriod, value: string) => {
    setPeriods((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const addPeriod = () => setPeriods((prev) => [...prev, emptyPeriod()])
  const removePeriod = (id: string) => setPeriods((prev) => prev.filter((p) => p.id !== id))

  const onSave = async () => {
    if (!name.trim()) {
      toast.error("Give the plan a name first")
      return
    }
    setSaving(true)
    try {
      const input = { name, grade: grade || null, notes: notes || null, periods }
      if (isNew) {
        const created = await createLessonPlan(input)
        toast.success("Lesson plan saved")
        navigate(`/planner/${created.id}`)
      } else {
        await updateLessonPlan(planId!, input)
        toast.success("Lesson plan saved")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save lesson plan")
    } finally {
      setSaving(false)
    }
  }

  const onDownload = () => {
    downloadExcel(
      periods,
      [
        { header: "Time", cell: (p) => p.time_label },
        ...WEEKDAYS.map((day) => ({
          header: day.label,
          cell: (p: LessonPlanPeriod) => p[day.key],
        })),
      ],
      name || "lesson-plan"
    )
  }

  if (loading) return null

  return (
    <div className="grid gap-6">
      <div>
        <Link
          to="/planner"
          className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All lesson plans
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isNew ? "New lesson plan" : "Edit lesson plan"}
        </h1>
        <p className="text-muted-foreground">Fill in the schedule, then save or download it as a spreadsheet.</p>
      </div>

      <Card>
        <CardContent className="grid gap-4 py-6 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Plan name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 5th Grade - Week 1" />
          </div>
          <div className="grid gap-1.5">
            <Label>Grade (optional)</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No grade selected" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardContent className="min-w-0 py-6">
          {/* Desktop/tablet: a real table, one row per period. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="w-40 border-b px-2 pb-2 text-left text-xs font-medium text-muted-foreground">
                    Time
                  </th>
                  {WEEKDAYS.map((day) => (
                    <th
                      key={day.key}
                      className="border-b px-2 pb-2 text-left text-xs font-medium text-muted-foreground"
                    >
                      {day.label}
                    </th>
                  ))}
                  <th className="w-10 border-b" />
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => (
                  <tr key={period.id}>
                    <td className="border-b py-2 pr-2 align-top">
                      <Input
                        value={period.time_label}
                        onChange={(e) => updatePeriod(period.id, "time_label", e.target.value)}
                        placeholder="8:00 - 8:45"
                      />
                    </td>
                    {WEEKDAYS.map((day) => (
                      <td key={day.key} className="border-b px-2 py-2 align-top">
                        <Input
                          value={period[day.key]}
                          onChange={(e) => updatePeriod(period.id, day.key, e.target.value)}
                          placeholder="Subject"
                        />
                      </td>
                    ))}
                    <td className="border-b py-2 pl-2 align-top">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove period"
                        onClick={() => removePeriod(period.id)}
                        disabled={periods.length <= 1}
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: each period stacks its 5 weekdays vertically, so every
             day is visible at once instead of requiring a sideways scroll. */}
          <div className="divide-y md:hidden">
            {periods.map((period) => (
              <div key={period.id} className="grid gap-3 py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <Input
                    value={period.time_label}
                    onChange={(e) => updatePeriod(period.id, "time_label", e.target.value)}
                    placeholder="8:00 - 8:45"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove period"
                    onClick={() => removePeriod(period.id)}
                    disabled={periods.length <= 1}
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="grid gap-2">
                  {WEEKDAYS.map((day) => (
                    <div key={day.key} className="grid grid-cols-[3rem_1fr] items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {day.label.slice(0, 3)}
                      </span>
                      <Input
                        value={period[day.key]}
                        onChange={(e) => updatePeriod(period.id, day.key, e.target.value)}
                        placeholder="Subject"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" className="mt-4" onClick={addPeriod}>
            <Plus />
            Add period
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDownload}>
          <Download />
          Download Excel
        </Button>
        <Button onClick={onSave} disabled={saving}>
          <Save />
          {isNew ? "Save plan" : "Save changes"}
        </Button>
      </div>
    </div>
  )
}
