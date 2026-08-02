import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { generateActivity, getUsage, listClassrooms } from "@/lib/api"
import type { Activity, Classroom } from "@/types/database"
import {
  COUNTRIES,
  DIFFICULTIES,
  EDUCATION_LEVELS,
  EXERCISE_TYPES,
  GRADES,
  SUBJECTS,
  inferEducationLevel,
} from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ActivityPreview from "@/components/activities/ActivityPreview"

const formSchema = z.object({
  country: z.string().min(1, "Required"),
  education_level: z.string().min(1, "Required"),
  grade: z.string().min(1, "Required"),
  subject: z.string().min(1, "Required"),
  topic: z.string().optional(),
  exercise_type: z.string().min(1, "Required"),
  difficulty: z.string().min(1, "Required"),
  num_exercises: z.number().int().min(1).max(50),
  exam_name: z.string().min(1, "Required"),
  classroom_id: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

function defaultExamName(subject: string, grade: string) {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  const s = subject || "Subject"
  const g = grade || "Grade"
  return `${s} - ${g} - ${date}`
}

export default function ActivityGenerator() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [result, setResult] = useState<Activity | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [usage, setUsage] = useState<{ generations_used: number } | null>(null)
  const [examNameTouched, setExamNameTouched] = useState(false)
  const [educationLevelTouched, setEducationLevelTouched] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      country: "",
      education_level: "",
      grade: "",
      subject: "",
      topic: "",
      // Pre-selected to a sensible, visible value instead of an empty
      // placeholder — still a normal dropdown, just one fewer forced choice.
      exercise_type: "mixed",
      difficulty: "Medium",
      num_exercises: 20,
      exam_name: "",
      classroom_id: "",
    },
  })

  const subject = form.watch("subject")
  const grade = form.watch("grade")
  const numExercises = form.watch("num_exercises")

  useEffect(() => {
    if (!examNameTouched) {
      form.setValue("exam_name", defaultExamName(subject, grade))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, grade, examNameTouched])

  useEffect(() => {
    if (educationLevelTouched) return
    const inferred = inferEducationLevel(grade)
    if (inferred) form.setValue("education_level", inferred, { shouldValidate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, educationLevelTouched])

  useEffect(() => {
    listClassrooms().then(setClassrooms).catch(() => {})
    getUsage().then(setUsage).catch(() => {})
  }, [])

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    setResult(null)
    try {
      const activity = await generateActivity({
        ...values,
        classroom_id: values.classroom_id || null,
        // Only let Gemini pick the exam's real title when the teacher hasn't
        // typed their own — an explicit edit always wins.
        use_ai_title: !examNameTouched,
      })
      setResult(activity)
      if (!examNameTouched) form.setValue("exam_name", activity.exam_name)
      toast.success("Activity generated")
      getUsage().then(setUsage).catch(() => {})
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate activity")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr] lg:items-start lg:gap-8">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Activity Generator</h1>
            <p className="text-muted-foreground">
              Describe the exam you need and let AI draft it in seconds.
            </p>
          </div>
          {usage && (
            <span className="rounded-full border bg-muted/40 px-3 py-1 font-mono text-xs text-muted-foreground">
              {usage.generations_used} generations this month
            </span>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8">
          <FormSection title="Curriculum">
            <Field label="Country / curriculum region" error={form.formState.errors.country?.message}>
              <Select
                value={form.watch("country")}
                onValueChange={(v) => form.setValue("country", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Grade / year" error={form.formState.errors.grade?.message}>
              <Select
                value={form.watch("grade")}
                onValueChange={(v) => form.setValue("grade", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Education level"
              error={form.formState.errors.education_level?.message}
              hint={!educationLevelTouched ? "Filled in from the grade above — change it if that's wrong" : undefined}
            >
              <Select
                value={form.watch("education_level")}
                onValueChange={(v) => {
                  setEducationLevelTouched(true)
                  form.setValue("education_level", v, { shouldValidate: true })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a level" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FormSection>

          <FormSection title="Exam content">
            <Field label="Subject" error={form.formState.errors.subject?.message}>
              <Select
                value={form.watch("subject")}
                onValueChange={(v) => form.setValue("subject", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Specific topic (optional)">
              <Input placeholder="e.g. Fractions, Photosynthesis" {...form.register("topic")} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Exercise type" error={form.formState.errors.exercise_type?.message}>
                <Select
                  value={form.watch("exercise_type")}
                  onValueChange={(v) => form.setValue("exercise_type", v, { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXERCISE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Difficulty" error={form.formState.errors.difficulty?.message}>
                <Select
                  value={form.watch("difficulty")}
                  onValueChange={(v) => form.setValue("difficulty", v, { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FormSection>

          <FormSection title="Options">
            <Field
              label={`Number of exercises: ${numExercises}`}
              error={form.formState.errors.num_exercises?.message}
            >
              <Slider
                className="mt-2.5"
                min={1}
                max={50}
                step={1}
                value={[numExercises]}
                onValueChange={([v]) => form.setValue("num_exercises", v, { shouldValidate: true })}
              />
            </Field>

            <Field label="Link to classroom (optional)">
              <Select
                value={form.watch("classroom_id")}
                onValueChange={(v) => form.setValue("classroom_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No classroom" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Exam name"
              error={form.formState.errors.exam_name?.message}
              hint={!examNameTouched ? "AI will suggest a title based on the topic" : undefined}
            >
              <Input
                {...form.register("exam_name", {
                  onChange: () => setExamNameTouched(true),
                })}
              />
            </Field>
          </FormSection>

          <Button type="submit" size="lg" disabled={submitting} className="justify-self-start">
            {submitting ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {submitting ? "Generating..." : "Generate activity"}
          </Button>
        </form>
      </div>

      <div className="lg:sticky lg:top-8">
        <ActivityPreview activity={result} loading={submitting} />
      </div>
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
      <div className="grid gap-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  error,
  hint,
  className,
  children,
}: {
  label: string
  error?: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
