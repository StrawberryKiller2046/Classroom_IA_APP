import { Check, Circle, CircleCheck } from "lucide-react"
import type { Activity } from "@/types/database"

export default function ExerciseList({
  activity,
  showAnswers,
}: {
  activity: Activity
  showAnswers: boolean
}) {
  return (
    <div className="divide-y [&>*]:px-6 [&>*]:py-5">
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
                <Circle className="size-4" /> Verdadero
              </span>
              <span className="flex items-center gap-2">
                <Circle className="size-4" /> Falso
              </span>
            </div>
          )}
          {exercise.type === "short" && <div className="mt-3 ml-8 h-px w-2/3 bg-border" />}
          {showAnswers && exercise.type !== "mc" && (
            <p className="mt-3 flex items-center gap-2 pl-8 text-sm font-medium text-success">
              <Check className="size-4" />
              {exercise.type === "tf"
                ? exercise.correct_answer === "True"
                  ? "Verdadero"
                  : "Falso"
                : exercise.correct_answer}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
