import jsPDF from "jspdf"
import type { Activity } from "@/types/database"

export function exportActivityToPdf(activity: Activity, options: { includeAnswerKey: boolean }) {
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

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(activity.exam_name, marginX, y)
  y += 22

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(90)
  doc.text(
    `${activity.subject} — ${activity.grade} — ${activity.education_level} — ${activity.country}`,
    marginX,
    y
  )
  y += 26

  doc.setTextColor(20)
  doc.setFontSize(10)
  doc.text("Name: _______________________________     Date: _______________", marginX, y)
  y += 24

  doc.setDrawColor(210)
  doc.line(marginX, y, pageWidth - marginX, y)
  y += 24

  doc.setFontSize(12)
  activity.exercises.forEach((exercise, index) => {
    doc.setFont("helvetica", "bold")
    const questionLines = doc.splitTextToSize(`${index + 1}. ${exercise.question}`, maxWidth)
    ensureSpace(questionLines.length * 16 + 12)
    doc.text(questionLines, marginX, y)
    y += questionLines.length * 16 + 4

    doc.setFont("helvetica", "normal")
    if (exercise.type === "mc" && exercise.options?.length) {
      exercise.options.forEach((option, i) => {
        const letter = String.fromCharCode(65 + i)
        const lines = doc.splitTextToSize(`   ${letter}. ${option}`, maxWidth)
        ensureSpace(lines.length * 14)
        doc.text(lines, marginX, y)
        y += lines.length * 14
      })
    } else if (exercise.type === "tf") {
      ensureSpace(14)
      doc.text("   ☐ True      ☐ False", marginX, y)
      y += 14
    } else {
      ensureSpace(30)
      doc.text("   ________________________________________________", marginX, y)
      y += 30
    }
    y += 12
  })

  if (options.includeAnswerKey && activity.answer_key) {
    doc.addPage()
    y = 56
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.text("Answer Key", marginX, y)
    y += 24
    doc.setFontSize(11)
    activity.exercises.forEach((exercise, index) => {
      doc.setFont("helvetica", "normal")
      const answer = activity.answer_key?.[exercise.id] ?? ""
      const lines = doc.splitTextToSize(`${index + 1}. ${answer}`, maxWidth)
      ensureSpace(lines.length * 16)
      doc.text(lines, marginX, y)
      y += lines.length * 16 + 4
    })
  }

  doc.save(`${activity.exam_name.replace(/[^a-z0-9]+/gi, "-")}.pdf`)
}
