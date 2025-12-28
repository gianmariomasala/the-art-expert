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

  // Function to lookup Author from Title
  const handleTitleBlur = async () => {
    if (title && !author) {
      console.log("Looking up author for:", title);
      try {
        const res = await fetch("/api/lookup", {
          method: "POST",
          body: JSON.stringify({ title }),
        });
        const data = await res.json();
        console.log("Lookup result:", data);
        if (data.author && data.author !== "Unknown") {
          setAuthor(data.author);
        }
      } catch (e) {
        console.error("Lookup failed", e);
      }
    }
  };

  // Function to lookup Titles from Author
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
        throw new Error(data.error || "Something went wrong");
      }

      // Ensure concepts is an array
      if (Array.isArray(data.concepts)) {
        setConcepts(data.concepts);
      } else if (typeof data.concepts === 'string') {
        // Fallback if backend sends string
        setConcepts([data.concepts]);
      }

      setCertifiedYear(data.year);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
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
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.resultTitle} style={{ margin: 0 }}>Concepts</span>
              {certifiedYear && (
                <span style={{
                  background: '#f97316',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}>
                  {certifiedYear}
                </span>
              )}
            </div>
            <ul className={styles.conceptsList} style={{ paddingLeft: '20px', margin: 0 }}>
              {concepts.map((concept, index) => (
                <li key={index} style={{ marginBottom: '12px', lineHeight: '1.6', color: '#e5e7eb' }}>
                  {concept}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
