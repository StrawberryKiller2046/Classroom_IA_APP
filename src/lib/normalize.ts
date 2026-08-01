/** Lowercase, strip accents, and trim whitespace so trivial formatting differences don't fail a match. */
export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

export function isCorrectAnswer(given: string, correct: string, type: "mc" | "tf" | "short"): boolean {
  if (!given) return false
  if (type === "short") {
    return normalizeAnswer(given) === normalizeAnswer(correct)
  }
  return normalizeAnswer(given) === normalizeAnswer(correct)
}
