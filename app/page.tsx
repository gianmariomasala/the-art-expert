"use client";

import { useEffect, useMemo, useState } from "react";
import { exportConceptsToPdf } from "../src/lib/pdf-export";
import styles from "./page.module.css";

type SuggestResponse = {
  concepts: string[] | string;
  year?: string | null;
};

type LookupResponse =
  | { author?: string; titles?: string[] }
  | { error?: string };

export default function Home() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  const [concepts, setConcepts] = useState<string[] | null>(null);
  const [certifiedYear, setCertifiedYear] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);

  const canSubmit = useMemo(() => title.trim().length > 0 && !loading, [title, loading]);
  const canExport = useMemo(() => (concepts?.length ?? 0) > 0 && !loading, [concepts, loading]);

  // --- Lookup Author from Title (on blur) ---
  const handleTitleBlur = async () => {
    const t = title.trim();
    if (!t) return;
    if (author.trim()) return;

    setLookupLoading(true);
    setLookupError(null);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Lookup failed");
      }

      const data = (await res.json()) as LookupResponse;

      if ("author" in data && data.author && data.author !== "Unknown") {
        setAuthor(data.author);
      }
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLookupLoading(false);
    }
  };

  // --- Lookup Titles from Author (on blur) ---
  const handleAuthorBlur = async () => {
    const a = author.trim();
    if (!a) return;

    setLookupLoading(true);
    setLookupError(null);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: a }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Lookup failed");
      }

      const data = (await res.json()) as LookupResponse;

      if ("titles" in data && Array.isArray(data.titles)) {
        setSuggestedTitles(data.titles.slice(0, 12));
      }
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLookupLoading(false);
    }
  };

  // Clear suggestions when author changes manually
  useEffect(() => {
    if (!author.trim()) setSuggestedTitles([]);
  }, [author]);

  // --- Submit / Analyze ---
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const t = title.trim();
    const a = author.trim();

    if (!t) return;

    setLoading(true);
    setError(null);
    setConcepts(null);
    setCertifiedYear(null);

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, author: a }),
      });

      if (!res.ok) {
        // important: avoid JSON parse errors when API returns HTML
        const txt = await res.text();
        throw new Error(txt || "Request failed");
      }

      const data = (await res.json()) as SuggestResponse;

      const list =
        Array.isArray(data.concepts) ? data.concepts : typeof data.concepts === "string" ? [data.concepts] : [];

      setConcepts(list);
      setCertifiedYear(data.year ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!canExport) return;

    try {
      await exportConceptsToPdf(
        title.trim(),
        author.trim() || "Unknown",
        certifiedYear,
        "concepts-container"
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.hero}>
          <h1 className={styles.brand}>TheArtExpert</h1>
          <p className={styles.tagline}>Discover meanings behind masterpieces</p>
        </header>

        <section className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label} htmlFor="artwork-title">
              Artwork Title (Music, Book, Movie, Painting...)
            </label>

            <input
              id="artwork-title"
              className={styles.input}
              type="text"
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
                <option key={`${t}-${i}`} value={t} />
              ))}
            </datalist>

            <label className={styles.label} htmlFor="artwork-author">
              Creator/Author (Optional)
            </label>

            <input
              id="artwork-author"
              className={styles.input}
              type="text"
              placeholder="e.g. Frédéric Chopin"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              onBlur={handleAuthorBlur}
              disabled={loading}
            />

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={!canSubmit}
            >
              {loading ? "Analisi in corso..." : "Descrivi e Analizza"}
            </button>

            {(lookupLoading || lookupError) && (
              <div className={styles.hintRow}>
                {lookupLoading ? (
                  <span className={styles.hint}>Looking up…</span>
                ) : (
                  <span className={styles.hintError}>{lookupError}</span>
                )}
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
          </form>
        </section>

        {concepts && (
          <section className={styles.results}>
            <div className={styles.resultsHeader}>
              <div className={styles.resultsTitle}>
                <span>Concepts</span>
                <span className={styles.badge}>{concepts.length}</span>
                {certifiedYear && <span className={styles.yearPill}>{certifiedYear}</span>}
              </div>

              <button
                type="button"
                className={styles.exportInline}
                onClick={handleExport}
                disabled={!canExport}
                title={canExport ? "Export concepts to PDF" : "No concepts to export"}
              >
                Export PDF
              </button>
            </div>

            <div id="concepts-container">
              <ul className={styles.conceptsList}>
                {concepts.map((c, i) => (
                  <li key={i} className={styles.conceptItem}>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
