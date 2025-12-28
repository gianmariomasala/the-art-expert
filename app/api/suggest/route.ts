import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
      try {
            const { title, author } = await request.json();

            if (!title) {
                  return NextResponse.json(
                        { error: "Title is required" },
                        { status: 400 }
                  );
            }

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                  return NextResponse.json(
                        { error: "API Key not configured" },
                        { status: 500 }
                  );
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `Sei un esperto onnisciente di ogni forma d'arte. 
    Analizza l'opera intitolata "${title}"${author ? ` di ${author}` : ""}.
    
    DEVI rispondere ESCLUSIVAMENTE con un oggetto JSON valido. Non scrivere altro testo prima o dopo.
    Formato richiesto:
    {
      "year": "Anno o periodo di uscita",
      "concepts": ["Concetto 1 (dettagliato)", "Concetto 2 (dettagliato)", "Concetto 3..."]
    }
    
    L'array "concepts" deve contenere almeno 5 stringhe. Ogni stringa deve essere un concetto chiave approfondito e ben spiegato in Italiano. Non usare markdown all'interno delle stringhe dell'array.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();

            // Remove markdown code blocks if present
            text = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();

            // Sometimes models add a preview text before the JSON, try to find the first { and last }
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                  text = text.substring(firstBrace, lastBrace + 1);
            }

            const data = JSON.parse(text);

            return NextResponse.json(data);
      } catch (error: any) {
            console.error("Error calling Gemini:", error);
            if (error.response) {
                  console.error("Error response:", await error.response.text());
            }
            return NextResponse.json(
                  { error: "Failed to fetch suggestions", details: error.message },
                  { status: 500 }
            );
      }
}
