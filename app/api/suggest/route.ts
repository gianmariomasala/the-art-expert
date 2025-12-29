// app/api/suggest/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

type SuggestBody = {
      title?: string;
      author?: string;
};

type SuggestResponse = {
      year: string | null;
      concepts: string[];
};

function isProbablyJustTitles(concepts: string[]) {
      // Se sono troppo corti, quasi sicuramente sono solo etichette.
      // (es: "Prostituzione", "Redenzione"...)
      const short = concepts.filter((c) => (c || "").trim().length < 60).length;
      return short >= Math.ceil(concepts.length * 0.6);
}

function normalizeYear(y: unknown): string | null {
      if (typeof y !== "string") return null;
      const s = y.trim();
      if (!s) return null;
      // accetta 4 cifre, oppure "c. 1978" ecc -> estrai 4 cifre se presenti
      const m = s.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
      return m ? m[1] : null;
}

function safeJsonParse(text: string): any {
      // Gemini a volte spara testo extra: proviamo a “ritagliare” il JSON
      const trimmed = text.trim();

      // già JSON?
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            return JSON.parse(trimmed);
      }

      // prova a trovare il primo {...} sensato
      const start = trimmed.indexOf("{");
      const end = trimmed.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
            const chunk = trimmed.slice(start, end + 1);
            return JSON.parse(chunk);
      }

      throw new Error("Gemini did not return JSON.");
}

export async function POST(req: Request) {
      try {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                  return NextResponse.json(
                        { error: "Missing GEMINI_API_KEY in environment (.env.local / Vercel env)." },
                        { status: 500 }
                  );
            }

            const body = (await req.json()) as SuggestBody;
            const title = (body.title || "").trim();
            const author = (body.author || "").trim();

            if (!title) {
                  return NextResponse.json({ error: "Missing title." }, { status: 400 });
            }

            const genAI = new GoogleGenerativeAI(apiKey);

            // Se vuoi cambiarlo senza toccare codice:
            // GEMINI_MODEL=gemini-2.0-flash
            const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

            const model = genAI.getGenerativeModel({
                  model: modelName,
                  generationConfig: {
                        temperature: 0.6,
                        // Importantissimo: chiediamo JSON puro
                        responseMimeType: "application/json",
                  },
            });

            const prompt = `
Return ONLY valid JSON (no markdown, no backticks, no explanations).

Schema:
{
  "year": string | null,
  "concepts": string[]
}

Rules:
- concepts MUST contain 8 to 12 items.
- Each item MUST be a full paragraph in ITALIAN (2–4 sentences).
- Each paragraph MUST explain a distinct theme/meaning/idea (not single-word labels).
- Avoid generic filler. Be specific to the artwork.
- If you don't know the year with confidence, set year to null.
- Do NOT include bullet characters like "•" inside strings.

Artwork:
- Title: ${title}
- Creator/Author: ${author || "Unknown / not provided"}

Now output the JSON only.
`.trim();

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            const parsed = safeJsonParse(text);

            const conceptsRaw = Array.isArray(parsed?.concepts) ? parsed.concepts : null;
            const concepts: string[] =
                  conceptsRaw?.map((c: any) => String(c || "").trim()).filter(Boolean) || [];

            const year = normalizeYear(parsed?.year);

            if (concepts.length < 6) {
                  return NextResponse.json(
                        {
                              error: "Gemini returned too few concepts (invalid output).",
                              debug: { receivedText: text },
                        },
                        { status: 500 }
                  );
            }

            if (isProbablyJustTitles(concepts)) {
                  return NextResponse.json(
                        {
                              error:
                                    "Gemini returned short label-like concepts (looks like titles, not paragraphs). Try GEMINI_MODEL=gemini-2.0-flash or adjust prompt.",
                              debug: { sample: concepts.slice(0, 4) },
                        },
                        { status: 500 }
                  );
            }

            const payload: SuggestResponse = { year, concepts };

            return NextResponse.json(payload, { status: 200 });
      } catch (err) {
            const message = err instanceof Error ? err.message : "Unknown error";
            return NextResponse.json({ error: message }, { status: 500 });
      }
}
