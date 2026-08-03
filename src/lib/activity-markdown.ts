import type { Activity, Exercise } from "@/types/database"

/** Turns an activity into plain-text markdown a teacher can freely retype:
 * "#" for the exam title, "##" per question, a checklist for multiple
 * choice (mark the right one with "[x]"), and "Answer: ..." for
 * true/false or short answer questions. */
export function activityToMarkdown(activity: Activity): string {
  const lines: string[] = [`# ${activity.exam_name}`, ""]

  activity.exercises.forEach((exercise, index) => {
    lines.push(`## ${index + 1}. ${exercise.question}`)
    if (exercise.type === "mc" && exercise.options?.length) {
      for (const option of exercise.options) {
        const checked = option === exercise.correct_answer ? "x" : " "
        lines.push(`- [${checked}] ${option}`)
      }
    } else {
      lines.push(`Answer: ${exercise.correct_answer}`)
    }
    lines.push("")
  })

  return lines.join("\n").trim()
}

export interface ParsedActivity {
  exam_name: string
  exercises: Exercise[]
}

interface Block {
  question: string
  options: { text: string; correct: boolean }[]
  answer: string | null
}

/** Parses markdown back into exercises. Forgiving about stray text and
 * missing brackets, but requires every question to resolve to a clear
 * answer — returns an error message instead of guessing wrong. */
export function markdownToActivity(markdown: string, fallbackExamName: string): ParsedActivity | { error: string } {
  let examName = fallbackExamName
  let sawTitle = false
  const blocks: Block[] = []
  let current: Block | null = null

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim()
    if (!line) continue

    if (!sawTitle && line.startsWith("# ")) {
      examName = line.slice(2).trim() || fallbackExamName
      sawTitle = true
      continue
    }

    if (line.startsWith("## ")) {
      if (current) blocks.push(current)
      const heading = line.slice(3).trim().replace(/^\d+\.\s*/, "")
      current = { question: heading, options: [], answer: null }
      continue
    }

    if (!current) continue

    const checklistMatch = line.match(/^-\s*\[( |x|X)?\]\s*(.+)$/)
    if (checklistMatch) {
      current.options.push({ text: checklistMatch[2].trim(), correct: checklistMatch[1]?.toLowerCase() === "x" })
      continue
    }
    const plainBulletMatch = line.match(/^-\s+(.+)$/)
    if (plainBulletMatch) {
      current.options.push({ text: plainBulletMatch[1].trim(), correct: false })
      continue
    }
    const answerMatch = line.match(/^answer:\s*(.+)$/i)
    if (answerMatch) {
      current.answer = answerMatch[1].trim()
      continue
    }
    // Anything else (stray notes, blank formatting) is ignored on purpose,
    // so a small typo never blocks switching back to the sheet.
  }
  if (current) blocks.push(current)

  if (blocks.length === 0) {
    return { error: 'Add at least one question, starting the line with "## ".' }
  }

  const exercises: Exercise[] = []
  for (const [index, block] of blocks.entries()) {
    const n = index + 1
    if (!block.question) {
      return { error: `Question ${n} is missing its text after "## ".` }
    }
    if (block.options.length > 0) {
      const correct = block.options.find((o) => o.correct)
      if (!correct) {
        return { error: `Question ${n} needs a correct option marked with "[x]".` }
      }
      exercises.push({
        id: `q${n}`,
        type: "mc",
        question: block.question,
        options: block.options.map((o) => o.text),
        correct_answer: correct.text,
      })
    } else if (block.answer) {
      const normalized = block.answer.toLowerCase()
      const isBoolean = normalized === "true" || normalized === "false"
      exercises.push({
        id: `q${n}`,
        type: isBoolean ? "tf" : "short",
        question: block.question,
        correct_answer: isBoolean ? (normalized === "true" ? "True" : "False") : block.answer,
      })
    } else {
      return { error: `Question ${n} needs either options (mark the correct one with "[x]") or an "Answer:" line.` }
    }
  }

  return { exam_name: examName, exercises }
}
