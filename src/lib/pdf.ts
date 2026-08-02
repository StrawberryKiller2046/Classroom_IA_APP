import jsPDF from "jspdf"
import type { Activity } from "@/types/database"

function fileName(examName: string, suffix: string) {
  return `${examName.replace(/[^a-z0-9]+/gi, "-")}-${suffix}.pdf`
}

function newDoc() {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const marginX = 48
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const maxWidth = pageWidth - marginX * 2
  let y = 56

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 48) {
      doc.addPage()
      y = 56
    }
  }

  return {
    doc,
    marginX,
    pageWidth,
    maxWidth,
    get y() {
      return y
    },
    set y(value: number) {
      y = value
    },
    ensureSpace,
  }
}

function drawHeader(ctx: ReturnType<typeof newDoc>, activity: Activity, subtitle: string) {
  const { doc, marginX, pageWidth } = ctx
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(activity.exam_name, marginX, ctx.y)
  ctx.y += 22

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(90)
  doc.text(
    `${activity.subject}  |  ${activity.grade}  |  ${activity.education_level}  |  ${activity.country}`,
    marginX,
    ctx.y
  )
  ctx.y += 20

  doc.setTextColor(140)
  doc.text(subtitle, marginX, ctx.y)
  ctx.y += 22

  doc.setDrawColor(210)
  doc.line(marginX, ctx.y, pageWidth - marginX, ctx.y)
  ctx.y += 24
  doc.setTextColor(20)
}

/** The clean copy students receive: questions only, no answers. */
export function exportActivityPdf(activity: Activity) {
  const ctx = newDoc()
  const { doc, marginX, maxWidth, ensureSpace } = ctx

  drawHeader(ctx, activity, "Name: _______________________________     Date: _______________")

  doc.setFontSize(12)
  activity.exercises.forEach((exercise, index) => {
    doc.setFont("helvetica", "bold")
    const questionLines = doc.splitTextToSize(`${index + 1}. ${exercise.question}`, maxWidth)
    ensureSpace(questionLines.length * 16 + 12)
    doc.text(questionLines, marginX, ctx.y)
    ctx.y += questionLines.length * 16 + 4

    doc.setFont("helvetica", "normal")
    if (exercise.type === "mc" && exercise.options?.length) {
      exercise.options.forEach((option, i) => {
        const letter = String.fromCharCode(65 + i)
        const lines = doc.splitTextToSize(`   ${letter}. ${option}`, maxWidth)
        ensureSpace(lines.length * 14)
        doc.text(lines, marginX, ctx.y)
        ctx.y += lines.length * 14
      })
    } else if (exercise.type === "tf") {
      ensureSpace(14)
      doc.text("   ☐ True      ☐ False", marginX, ctx.y)
      ctx.y += 14
    } else {
      ensureSpace(30)
      doc.text("   ________________________________________________", marginX, ctx.y)
      ctx.y += 30
    }
    ctx.y += 12
  })

  doc.save(fileName(activity.exam_name, "activity"))
}

/** A standalone answer key, downloaded separately so it never accidentally
 * ends up in a student's hands mixed in with the exam itself. */
export function exportAnswerKeyPdf(activity: Activity) {
  const ctx = newDoc()
  const { doc, marginX, maxWidth, ensureSpace } = ctx

  drawHeader(ctx, activity, "Answer key, for teacher use only")

  doc.setFontSize(12)
  activity.exercises.forEach((exercise, index) => {
    const answer = activity.answer_key?.[exercise.id] ?? exercise.correct_answer
    doc.setFont("helvetica", "bold")
    const questionLines = doc.splitTextToSize(`${index + 1}. ${exercise.question}`, maxWidth)
    ensureSpace(questionLines.length * 16 + 4)
    doc.text(questionLines, marginX, ctx.y)
    ctx.y += questionLines.length * 16 + 4

    doc.setFont("helvetica", "normal")
    doc.setTextColor(30, 110, 60)
    const answerLines = doc.splitTextToSize(`   ${answer}`, maxWidth)
    ensureSpace(answerLines.length * 15 + 10)
    doc.text(answerLines, marginX, ctx.y)
    ctx.y += answerLines.length * 15 + 12
    doc.setTextColor(20)
  })

  doc.save(fileName(activity.exam_name, "answer-key"))
}
