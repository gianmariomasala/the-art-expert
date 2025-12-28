"use client";

import { useState } from "react";
import { ArtworkForm } from "@/components/ArtworkForm";
import { ConceptDisplay, Concept } from "@/components/ConceptDisplay";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { motion } from "framer-motion";

export default function Home() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError("");
    setConcepts([]);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, artist, apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore durante l'analisi");
      }

      setConcepts(data.concepts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-20 bg-dot-black/[0.2] relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-secondary/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="z-10 w-full max-w-5xl flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="inline-block px-3 py-1 mb-2 text-xs font-semibold tracking-widest text-accent uppercase border border-accent/20 rounded-full bg-accent/5">
            Art Expert Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-serif text-primary tracking-tight">
            L'Esperto d'Arte
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Scopri l'essenza invisibile delle opere. Inserisci un titolo e lascia che l'esperto riveli i concetti chiave nascosti.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full flex justify-center mb-16"
        >
          <ArtworkForm
            title={title}
            setTitle={setTitle}
            artist={artist}
            setArtist={setArtist}
            onSubmit={handleAnalyze}
            loading={loading}
          />
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-destructive mb-8 bg-destructive/10 px-4 py-2 rounded-md"
          >
            {error}
          </motion.div>
        )}

        <ConceptDisplay
          concepts={concepts}
          title={title}
          artist={artist}
        />
      </div>

      <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
    </main>
  );
}
