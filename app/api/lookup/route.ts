// app/api/lookup/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

type LookupBody = {
      title?: string;
      author?: string;
};

function safeJsonParse(text: string) {
      const trimmed = text.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) return JSON.parse(trimmed);

      const start = trimmed.indexOf("{");
      const end = trimmed.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
            return JSON.parse(trimmed.slice(start, end + 1));
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

            const body = (await req.json()) as LookupBody;
            const title = (body.title || "").trim();
            const author = (body.author || "").trim();

            if (!title && !author) {
                  return NextResponse.json({ error: "Provide title or author." }, { status: 400 });
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

            const model = genAI.getGenerativeModel({
                  model: modelName,
                  generationConfig: {
                        temperature: 0.2,
                        responseMimeType: "application/json",
                  },
            });

            // 1) title -> canonicalTitle + author + altTitles
            if (title) {
                  const prompt = `
Return ONLY valid JSON.

Schema:
{
  "canonicalTitle": string,
  "author": string | null,
  "altTitles": string[]
}

Rules:
- canonicalTitle: the most standard / commonly used title in the original language (often English for artworks; keep diacritics).
- altTitles: up to 8 reasonable variants (translations, common spellings), unique, no empty strings.
- If uncertain about author, set author to null.
- No markdown, no backticks.

User input:
- Title: ${title}
- Author (optional): ${author || "not provided"}
      `.trim();

                  const result = await model.generateContent(prompt);
                  const parsed = safeJsonParse(result.response.text());

                  const canonicalTitle = String(parsed?.canonicalTitle || "").trim() || title;
                  const foundAuthor =
                        parsed?.author === null ? null : String(parsed?.author || "").trim() || null;

                  const altTitlesRaw = Array.isArray(parsed?.altTitles) ? parsed.altTitles : [];
                  const altTitles = altTitlesRaw
                        .map((t: any) => String(t || "").trim())
                        .filter(Boolean);

                  // In UI tu già usi data.titles per il datalist: gli passiamo (canonical + alt)
                  const titles = Array.from(new Set([canonicalTitle, ...altTitles])).slice(0, 10);

                  return NextResponse.json({
                        canonicalTitle,
                        author: foundAuthor ?? "Unknown",
                        titles,
                  });
            }

            // 2) author -> suggested titles
            const prompt = `
Return ONLY valid JSON.

Schema:
{
  "titles": string[]
}

Rules:
- Provide 8 to 12 well-known works (music/books/movies/paintings) by this author/creator.
- Titles should be canonical (original language where standard).
- No markdown, no backticks.

Author:
${author}
    `.trim();

            const result = await model.generateContent(prompt);
            const parsed = safeJsonParse(result.response.text());

            const titlesRaw = Array.isArray(parsed?.titles) ? parsed.titles : [];
            const titles = titlesRaw
                  .map((t: any) => String(t || "").trim())
                  .filter(Boolean)
                  .slice(0, 12);

            return NextResponse.json({ titles });
      } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return NextResponse.json({ error: "Server error", detail: message }, { status: 500 });
      }
}
