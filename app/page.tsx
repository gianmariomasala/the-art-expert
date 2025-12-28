"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [concepts, setConcepts] = useState<string[] | null>(null);
  const [certifiedYear, setCertifiedYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Lookup Author + Canonical Title from Title
  const handleTitleBlur = async () => {
    if (title && !author) {
      console.log("Looking up author and canonical title for:", title);
      try {
        const res = await fetch("/api/lookup", {
          method: "POST",
          body: JSON.stringify({ title }),
        });
        const data = await res.json();
        console.log("Lookup result:", data);

        if (data.author && data.author !== "Unknown") setAuthor(data.author);
        if (data.title && data.title !== title) setTitle(data.title);
      } catch (e) {
        console.error("Lookup failed", e);
      }
    }
  };

  // Lookup Titles from Author
  const handleAuthorBlur = async () => {
    if (author) {
      console.log("Looking up titles for:", author);
      try {
        const res = await fetch("/api/lookup", {
          method: "POST",
          body: JSON.stringify({ author }),
        });
        const data = await res.json();
        console.log("Lookup result:", data);

        if (data.titles && Array.isArray(data.titles)) {
          setSuggestedTitles(data.titles);
        }
      } catch (e) {
        console.error("Lookup failed", e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    setConcepts(null);
    setCertifiedYear(null);

    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details
          ? `${data.error}: ${data.details}`
          : data.error || "Something went wrong";
        throw new Error(errorMessage);
      }

      // Update with canonical names (for final result / PDF)
      if (data.canonicalTitle) setTitle(data.canonicalTitle);
      if (data.canonicalAuthor) setAuthor(data.canonicalAuthor);

      // Ensure concepts is an array
      if (Array.isArray(data.concepts)) {
        setConcepts(data.concepts);
      } else if (typeof data.concepts === "string") {
        setConcepts([data.concepts]);
      } else {
        setConcepts(null);
      }

      setCertifiedYear(data.year);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!title?.trim()) return;
    if (!concepts || concepts.length === 0) return;

    setIsExporting(true);
    try {
      const mod = await import("@/lib/pdf-export");

      // Debug: ci dice cosa sta davvero esportando il modulo
      console.log("pdf-export module keys:", Object.keys(mod));
      console.log("exportConceptsToPdf typeof:", typeof (mod as any).exportConceptsToPdf);

      const fn = (mod as any).exportConceptsToPdf;
      if (typeof fn !== "function") {
        throw new Error(
          "exportConceptsToPdf is not a function. Controlla che lib/pdf-export.ts esporti: export function exportConceptsToPdf(...)"
        );
      }

      // ✅ Nuova firma: (title, author, year, concepts[])
      fn(title, author, certifiedYear, concepts);
    } catch (err) {
      console.error("Export failed:", err);
      const msg = err instanceof Error ? err.message : "Errore sconosciuto.";
      alert(`Errore durante la creazione del PDF: ${msg}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div>
          <h1 className={styles.title}>TheArtExpert</h1>
          <p className={styles.subtitle}>Discover meanings behind masterpieces</p>
        </div>

        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.inputGroup}>
            <label htmlFor="artwork-title" className={styles.label}>
              Artwork Title (Music, Book, Movie, Painting...)
            </label>
            <input
              id="artwork-title"
              type="text"
              className={styles.input}
              placeholder="e.g. Nocturne Op. 9 No. 2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              disabled={loading}
              list="suggested-titles"
              required
            />
            <datalist id="suggested-titles">
              {suggestedTitles.map((t, i) => (
                <option key={i} value={t} />
              ))}
            </datalist>

            <label htmlFor="artwork-author" className={styles.label}>
              Creator/Author (Optional)
            </label>
            <input
              id="artwork-author"
              type="text"
              className={styles.input}
              placeholder="e.g. Frédéric Chopin"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              onBlur={handleAuthorBlur}
              disabled={loading}
            />
          </form>

          <button
            type="submit"
            className={styles.button}
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
          >
            {loading ? "Analisi in corso..." : "Descrivi e Analizza"}
          </button>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        {concepts && (
          <div className={styles.result}>
            <div
              style={{
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className={styles.resultTitle} style={{ margin: 0 }}>
                  Concepts
                </span>

                {certifiedYear && (
                  <span
                    style={{
                      background: "#f97316",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                    }}
                  >
                    {certifiedYear}
                  </span>
                )}
              </div>

              <button
                className={styles.exportButton}
                onClick={handleExport}
                disabled={isExporting || !concepts?.length}
                title={!concepts?.length ? "Nessun contenuto da esportare" : "Esporta PDF"}
              >
                {isExporting ? "Generazione..." : "Salva come PDF"}
              </button>
            </div>

            {/* UI list (non usata per il PDF) */}
            <div id="concepts-export-area">
              <ul className={styles.conceptsList} style={{ paddingLeft: "20px", margin: 0 }}>
                {concepts.map((concept, index) => (
                  <li
                    key={index}
                    style={{
                      marginBottom: "12px",
                      lineHeight: "1.6",
                      color: "#e5e7eb",
                    }}
                  >
                    {concept}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


