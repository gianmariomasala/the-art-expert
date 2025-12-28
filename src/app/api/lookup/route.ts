import { GoogleGenerativeAI } from "@google/generative-ai";
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
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            let prompt = "";
            // Mode 1: Given Title, find Author
            if (title && !author) {
                  prompt = `Chi è l'autore dell'opera d'arte "${title}"? Rispondi SOLO con il nome dell'autore. Se non lo sai o l'opera è generica, rispondi "Unknown".`;
            }
            // Mode 2: Given Author, suggest Titles
            else if (author && !title) {
                  prompt = `Elenca 5 opere famose di ${author}. Rispondi SOLO con un elenco JSON di stringhe. Esempio: ["Opera 1", "Opera 2"].`;
            } else {
                  // Both present or edge case
                  return NextResponse.json({ message: "Nothing to infer" });
            }

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();

            // Clean up if it's JSON
            if (text.startsWith("```json")) {
                  text = text.replace(/```json/g, "").replace(/```/g, "").trim();
            }

            let data;
            if (title && !author) {
                  data = { author: text };
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
