import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const MOCK_CONCEPTS = [
      {
            title: "Sfumato Enigmatico",
            description: "La tecnica rivoluzionaria di Leonardo che dissolve i contorni, creando un'atmosfera di mistero e intangibilità che avvolge il soggetto, rendendo l'espressione indefinibile ed eterna.",
      },
      {
            title: "Prospettiva Atmosferica",
            description: "L'uso magistrale del colore e della luce per suggerire la profondità, dove il paesaggio sullo sfondo sfuma nell'azzurro, connettendo l'umano al divino e al naturale.",
      },
      {
            title: "Umanesimo Psicologico",
            description: "Un ritratto che trascende la semplice rappresentazione fisica per indagare l'anima del soggetto, segnando il passaggio dal simbolismo medievale al realismo introspettivo rinascimentale.",
      },
      {
            title: "Composizione Piramidale",
            description: "La struttura solida e bilanciata che conferisce monumentalità e calma alla figura, ancorandola allo spazio ma permettendo al contempo un dinamismo sottile nella torsione del busto.",
      },
      {
            title: "Universalità Temporale",
            description: "La capacità dell'opera di comunicare attraverso i secoli, divenendo un'icona che riflette non solo un'epoca specifica, ma la condizione umana nella sua complessità e bellezza.",
      },
];

export async function POST(req: Request) {
      try {
            const { title, apiKey } = await req.json();

            if (!title) {
                  return NextResponse.json(
                        { error: 'Title is required' },
                        { status: 400 }
                  );
            }

            if (!apiKey) {
                  // Return mock data if no API key is provided
                  // Simulate delay for realism
                  await new Promise((resolve) => setTimeout(resolve, 1500));
                  return NextResponse.json({ concepts: MOCK_CONCEPTS });
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

            const prompt = `
      Sei un esperto critico d'arte e di cultura (musica, cinema, letteratura, arti visive).
      Il tuo compito è analizzare l'opera intitolata: "${title}".
      
      Restituisci ESATTAMENTE 5 concetti chiave fondamentali per comprendere quest'opera.
      Usa un tono sofisticato, esperto, accademico ma appassionato.
      Scrivi in ITALIANO.
      
      Il formato deve essere un array JSON puro di oggetti, senza markdown, con questa struttura:
      [
        {
          "title": "Titolo del Concetto (max 5-6 parole)",
          "description": "Descrizione approfondita (2-3 frasi)"
        }
      ]
    `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up markdown code blocks if present
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            try {
                  const concepts = JSON.parse(cleanText);
                  return NextResponse.json({ concepts });
            } catch (e) {
                  console.error("JSON Parse Error", e);
                  return NextResponse.json(
                        { error: 'Failed to parse AI response' },
                        { status: 500 }
                  );
            }
      } catch (error: any) {
            console.error("API Error", error);
            return NextResponse.json(
                  { error: error.message || 'Something went wrong' },
                  { status: 500 }
            );
      }
}
