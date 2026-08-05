// Supabase Edge Function: generate-activity
//
// - Verifies the caller's JWT and resolves user_id.
// - Checks usage_counters for the current month BEFORE calling Gemini.
//   The frontend never decides quota — this function is the single source of truth.
// - Calls Gemini (Flash) asking for structured JSON (exam_name, exercises[], answer_key).
// - Persists the activity (including answer_key, even if include_answer_sheet was requested
//   purely for the DB-backed Auto-Corrector, not just the PDF) and increments the usage counter.

import { createClient } from "jsr:@supabase/supabase-js@2"

const MONTHLY_GENERATION_LIMIT = 30

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface GenerateRequest {
  country: string
  education_level: string
  grade: string
  subject: string
  topic?: string
  exercise_type: string
  difficulty: string
  num_exercises: number
  exam_name: string
  classroom_id?: string | null
  // When true, Gemini's own suggested title (based on the actual exam
  // content) is saved instead of the client's placeholder exam_name.
  use_ai_title?: boolean
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401)
    }

    // Client scoped to the caller's JWT, used only to identify who is asking.
    const userClient = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) {
      return json({ error: "Invalid or expired session" }, 401)
    }
    const userId = userData.user.id

    // Service-role client for privileged reads/writes (usage_counters, activities).
    const admin = createClient(supabaseUrl, serviceRoleKey)

    const month = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

    const { data: counter } = await admin
      .from("usage_counters")
      .select("generations_used")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle()

    const used = counter?.generations_used ?? 0
    if (used >= MONTHLY_GENERATION_LIMIT) {
      return json(
        { error: "Monthly generation limit reached.", used, limit: MONTHLY_GENERATION_LIMIT },
        429
      )
    }

    const body: GenerateRequest = await req.json()
    for (const field of ["country", "education_level", "grade", "subject", "exercise_type", "difficulty", "num_exercises", "exam_name"] as const) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return json({ error: `Missing required field: ${field}` }, 400)
      }
    }

    const generated = await callGemini(geminiApiKey, body)
    const { exercises } = generated

    const answerKey: Record<string, string> = {}
    for (const ex of exercises) {
      answerKey[ex.id] = ex.correct_answer
    }

    const { data: activity, error: insertError } = await admin
      .from("activities")
      .insert({
        user_id: userId,
        classroom_id: body.classroom_id ?? null,
        exam_name: body.use_ai_title && generated.exam_name ? generated.exam_name : body.exam_name,
        subject: body.subject,
        country: body.country,
        education_level: body.education_level,
        grade: body.grade,
        topic: body.topic ?? null,
        exercise_type: body.exercise_type,
        difficulty: body.difficulty,
        num_exercises: body.num_exercises,
        exercises,
        // Always persisted so the Auto-Corrector can read it directly from the DB,
        // regardless of whether the teacher also wants it printed on the PDF.
        answer_key: answerKey,
      })
      .select()
      .single()

    if (insertError) {
      return json({ error: `Failed to save activity: ${insertError.message}` }, 500)
    }

    await admin
      .from("usage_counters")
      .upsert(
        { user_id: userId, month, generations_used: used + 1 },
        { onConflict: "user_id,month" }
      )

    return json({ activity }, 200)
  } catch (err) {
    console.error(err)
    return json({ error: err instanceof Error ? err.message : "Unexpected error" }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

interface GeminiExercise {
  id: string
  question: string
  type: "mc" | "tf" | "short"
  options?: string[]
  correct_answer: string
}

async function callGemini(
  apiKey: string,
  req: GenerateRequest
): Promise<{ exam_name: string; exercises: GeminiExercise[] }> {
  const schema = {
    type: "OBJECT",
    properties: {
      exam_name: { type: "STRING" },
      exercises: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            question: { type: "STRING" },
            type: { type: "STRING", enum: ["mc", "tf", "short"] },
            options: { type: "ARRAY", items: { type: "STRING" } },
            correct_answer: { type: "STRING" },
          },
          required: ["id", "question", "type", "correct_answer"],
        },
      },
    },
    required: ["exam_name", "exercises"],
  }

  const prompt = `You are an expert teacher creating a classroom exam for the Latin American / Spanish-speaking education market.

Country / curriculum region: ${req.country}
Education level: ${req.education_level}
Grade / year: ${req.grade}
Subject: ${req.subject}
${req.topic ? `Specific topic: ${req.topic}` : ""}
Exercise type: ${req.exercise_type}
Difficulty: ${req.difficulty}
Number of exercises: ${req.num_exercises}

Write every question, option, and the exam title in Spanish, using vocabulary, spelling, and phrasing natural to ${req.country} specifically (not a generic or Spain-centric register, unless the country is Spain).

Align the content, expected prior knowledge, and skill level with the official national curriculum standards for ${req.education_level} / ${req.grade} / ${req.subject} in ${req.country} — not a generic international standard and not another country's curriculum. Use locally appropriate context: currency, units of measurement, place names, historical references, and cultural examples relevant to ${req.country}.

Generate exactly ${req.num_exercises} exercises appropriate for this curriculum, level, and difficulty.
For "mc" (multiple choice) exercises, include an "options" array of 3-5 choices (in Spanish) and set "correct_answer" to the exact text of the correct option.
For "tf" (true/false) exercises, set "correct_answer" to exactly the English word "True" or "False" — never "Verdadero"/"Falso" — because the app matches this field literally regardless of the exam's language; the question text itself still goes in Spanish.
For "short" (short answer) exercises, set "correct_answer" to a concise expected answer in Spanish.
Give every exercise a unique "id" like "q1", "q2", etc.

Also set "exam_name" to a short, specific title in Spanish (4-8 words) that describes what this exam is actually about. Write it like a real exam title a teacher would print at the top of the page, for example "Fracciones en la Vida Cotidiana" or "La Revolución Mexicana: Causas y Consecuencias". Never use a generic "Materia - Grado - Fecha" format, and never mention the country, grade, or difficulty level in the title itself.

Return ONLY the structured JSON, no extra commentary.`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${text}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Gemini returned no content")

  const parsed = JSON.parse(text) as { exam_name: string; exercises: GeminiExercise[] }
  return parsed
}
