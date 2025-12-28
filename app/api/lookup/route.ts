import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
      try {
            const { title, author } = await request.json();

            if (!title && !author) {
                  return NextResponse.json({ error: "Missing info" }, { status: 400 });
            }

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                  return NextResponse.json({ error: "No API Key" }, { status: 500 });
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

            let prompt = "";
            // Mode 1: Given Title, find Author AND Correct Title
            if (title && !author) {
                  prompt = `Qual è il titolo ESATTO dell'opera d'arte che l'utente intende con "${title}"? E chi è l'autore?
                  Rispondi SOLO con un oggetto JSON: {"title": "Titolo Esatto", "author": "Nome Autore"}.
                  Se non lo sai, rispondi {"title": "${title}", "author": "Unknown"}.`;
            }
            // Mode 2: Given Author, suggest Titles
            else if (author && !title) {
                  prompt = `Elenca 5 opere famose di ${author}. Rispondi SOLO con un elenco JSON di stringhe. Esempio: ["Opera 1", "Opera 2"].`;
            } else {
                  return NextResponse.json({ message: "Nothing to infer" });
            }

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();

            // More robust JSON extraction
            const firstBrace = text.indexOf('{');
            const firstBracket = text.indexOf('[');
            const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;

            const lastBrace = text.lastIndexOf('}');
            const lastBracket = text.lastIndexOf(']');
            const end = (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) ? lastBrace : lastBracket;

            if (start !== -1 && end !== -1 && end > start) {
                  text = text.substring(start, end + 1);
            }

            let data;
            if (title && !author) {
                  try {
                        data = JSON.parse(text);
                  } catch (e) {
                        data = { title, author: "Unknown" };
                  }
            } else {
                  try {
                        data = { titles: JSON.parse(text) };
                  } catch (e) {
                        data = { titles: [] }; // Fallback
                  }
            }

            return NextResponse.json(data);
      } catch (error: any) {
            console.error("Lookup Error:", error);
            return NextResponse.json({ error: "Lookup Failed" }, { status: 500 });
      }
}
