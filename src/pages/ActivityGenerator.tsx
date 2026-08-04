import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { generateActivity, getUsage, listClassrooms } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { Activity, Classroom } from "@/types/database"
import {
  COUNTRIES,
  DIFFICULTIES,
  EDUCATION_LEVELS,
  EXERCISE_TYPES,
  GENERATION_LIMIT,
  GRADES,
  SUBJECTS,
  inferEducationLevel,
} from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ActivityPreview from "@/components/activities/ActivityPreview"

const formSchema = z.object({
  country: z.string().min(1, "Requerido"),
  education_level: z.string().min(1, "Requerido"),
  grade: z.string().min(1, "Requerido"),
  subject: z.string().min(1, "Requerido"),
  topic: z.string().optional(),
  exercise_type: z.string().min(1, "Requerido"),
  difficulty: z.string().min(1, "Requerido"),
  num_exercises: z.number().int().min(1).max(50),
  exam_name: z.string().min(1, "Requerido"),
  classroom_id: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

function defaultExamName(subject: string, grade: string) {
  const date = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })
  const s = subject || "Materia"
  const g = grade || "Grado"
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
      difficulty: "Medio",
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
      toast.success("Actividad generada")
      getUsage().then(setUsage).catch(() => {})
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo generar la actividad")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr] lg:items-start lg:gap-8">
      <div className="grid gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Generador de Actividades</h1>
            <p className="text-muted-foreground">
              Describe el examen que necesitas y deja que la IA lo redacte en segundos.
            </p>
          </div>
          {usage && <GenerationQuota used={usage.generations_used} />}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
          <FormSection title="Currículo">
            <Field label="País / región curricular" error={form.formState.errors.country?.message}>
              <Select
                value={form.watch("country")}
                onValueChange={(v) => form.setValue("country", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un país" />
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

            <Field label="Grado" error={form.formState.errors.grade?.message}>
              <Select
                value={form.watch("grade")}
                onValueChange={(v) => form.setValue("grade", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un grado" />
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
              label="Nivel educativo"
              error={form.formState.errors.education_level?.message}
              hint={!educationLevelTouched ? "Se llenó según el grado de arriba — cámbialo si no es correcto" : undefined}
            >
              <Select
                value={form.watch("education_level")}
                onValueChange={(v) => {
                  setEducationLevelTouched(true)
                  form.setValue("education_level", v, { shouldValidate: true })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un nivel" />
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

          <FormSection title="Contenido del examen">
            <Field label="Materia" error={form.formState.errors.subject?.message}>
              <Select
                value={form.watch("subject")}
                onValueChange={(v) => form.setValue("subject", v, { shouldValidate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una materia" />
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

            <Field label="Tema específico (opcional)" optional>
              <Input placeholder="ej. Fracciones, Fotosíntesis" {...form.register("topic")} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Tipo de ejercicio" error={form.formState.errors.exercise_type?.message}>
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

              <Field label="Dificultad" error={form.formState.errors.difficulty?.message}>
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

          <FormSection title="Opciones">
            <Field
              label={`Número de ejercicios: ${numExercises}`}
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

            <Field label="Vincular a un salón (opcional)" optional>
              <Select
                value={form.watch("classroom_id")}
                onValueChange={(v) => form.setValue("classroom_id", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin salón" />
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
              label="Nombre del examen"
              error={form.formState.errors.exam_name?.message}
              hint={!examNameTouched ? "La IA sugerirá un título según el tema" : undefined}
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
            {submitting ? "Generando..." : "Generar actividad"}
          </Button>
        </form>
      </div>

      <div className="lg:sticky lg:top-8">
        <ActivityPreview activity={result} loading={submitting} onActivityChange={setResult} />
      </div>
    </div>
  )
}

function GenerationQuota({ used }: { used: number }) {
  const remaining = Math.max(GENERATION_LIMIT - used, 0)
  const percentUsed = Math.min((used / GENERATION_LIMIT) * 100, 100)
  const low = remaining <= 3

  return (
    <div className="w-full max-w-56 shrink-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("text-xs font-medium", low ? "text-warning-foreground" : "text-foreground")}>
          <span className="font-mono tabular-nums">{remaining}</span> de{" "}
          <span className="font-mono tabular-nums">{GENERATION_LIMIT}</span> restantes
        </span>
        <span className="text-xs text-muted-foreground">este mes</span>
      </div>
      <Progress
        value={percentUsed}
        className={cn(
          "mt-1.5 h-1.5",
          low && "bg-warning/20 [&>[data-slot=progress-indicator]]:bg-warning"
        )}
      />
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 rounded-xl bg-card p-5 shadow-md">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}

function Field({
  label,
  error,
  hint,
  optional,
  className,
  children,
}: {
  label: string
  error?: string
  hint?: string
  optional?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label className={optional ? "font-normal text-muted-foreground" : undefined}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
