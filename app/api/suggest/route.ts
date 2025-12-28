import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
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
            const model = genAI.getGenerativeModel({
                  model: "gemini-2.0-flash-exp",
                  safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                  ]
            });

            const prompt = `Sei un esperto onnisciente di ogni forma d'arte. 
    Analizza l'opera intitolata "${title}"${author ? ` di ${author}` : ""}.
    
    DEVI rispondere ESCLUSIVAMENTE con un oggetto JSON valido. Non scrivere altro testo prima o dopo.
    Formato richiesto:
    {
      "canonicalTitle": "Titolo Esatto dell'Opera",
      "canonicalAuthor": "Nome Esatto dell'Autore",
      "year": "Anno o periodo di uscita",
      "concepts": ["Concetto 1", "Concetto 2", "Concetto 3...", "Concetto 4", "Concetto 5"]
    }
    
    L'array "concepts" deve contenere esattamente 5 stringhe. Ogni stringa deve essere un concetto chiave approfondito e ben spiegato in Italiano.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();

            // Robust JSON extraction
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');

            if (start !== -1 && end !== -1 && end > start) {
                  text = text.substring(start, end + 1);
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
