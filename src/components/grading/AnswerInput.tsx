import { cn } from "@/lib/utils"
import type { Exercise } from "@/types/database"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const isNumericAnswer = (answer: string) => /^-?\d+([.,]\d+)?$/.test(answer.trim())

export default function AnswerInput({
  exercise,
  value,
  onChange,
}: {
  exercise: Exercise
  value: string
  onChange: (value: string) => void
}) {
  if (exercise.type === "mc" && exercise.options?.length) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {exercise.options.map((option, i) => {
          const letter = String.fromCharCode(65 + i)
          const selected = value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border-2 px-3 py-4 text-center transition-colors",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <span className="text-lg font-bold">{letter}</span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{option}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (exercise.type === "tf") {
    const options = [
      { value: "True", label: "Verdadero" },
      { value: "False", label: "Falso" },
    ]
    return (
      <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
          const selected = value === option.value
          return (
            <Button
              key={option.value}
              type="button"
              variant={selected ? "default" : "outline"}
              size="lg"
              className="h-16 text-base"
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          )
        })}
      </div>
    )
  }

  const numeric = isNumericAnswer(exercise.correct_answer)
  return (
    <Input
      autoFocus
      inputMode={numeric ? "decimal" : "text"}
      placeholder={numeric ? "Ingresa un número" : "Ingresa la respuesta del estudiante"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-14 text-base"
    />
  )
}
