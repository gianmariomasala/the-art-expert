import jsPDF from "jspdf";

/**
 * Export concepts to a text-based PDF (selectable text).
 * You can pass either:
 * - elementId: string  -> it will read <li> from DOM
 * - concepts: string[] -> it will use the array directly
 */
export const exportConceptsToPdf = async (
      title: string,
      author: string,
      year: string | null,
      source: string | string[]
) => {
      // Small delay to let layout settle (fonts, rendering)
      await new Promise((r) => setTimeout(r, 200));

      // 1) Build concepts array from source
      let concepts: string[] = [];

      if (Array.isArray(source)) {
            concepts = source.map((s) => String(s || "").trim()).filter(Boolean);
      } else {
            const elementId = source;
            const root = document.getElementById(elementId);
            if (!root) throw new Error(`Element #${elementId} not found`);

            const liNodes = Array.from(root.querySelectorAll("li"));
            concepts = liNodes.map((li) => (li.textContent || "").trim()).filter(Boolean);
      }

      if (concepts.length === 0) throw new Error("No concepts to export");

      // --- PDF setup (A4, mm) ---
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();

      // Layout constants
      const marginX = 16;
      const marginTop = 18;
      const marginBottom = 16;
      const contentW = pageW - marginX * 2;

      // Typography
      const titleSize = 18;
      const metaSize = 11;
      const bodySize = 11;

      let y = marginTop;

      const addPageIfNeeded = (neededHeight: number) => {
            if (y + neededHeight > pageH - marginBottom) {
                  doc.addPage();
                  y = marginTop;
            }
      };

      const sanitizeFilename = (s: string) =>
            s
                  .toLowerCase()
                  .replace(/[^\w\s-]/g, "")
                  .trim()
                  .replace(/\s+/g, "-")
                  .slice(0, 80);

      // --- Header ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(titleSize);

      const safeTitle = (title || "Untitled").trim();
      const safeAuthor = (author || "").trim();
      const safeYear = (year || "").trim();

      const titleLines = doc.splitTextToSize(safeTitle, contentW);
      addPageIfNeeded(titleLines.length * 8);
      doc.text(titleLines, marginX, y);
      y += titleLines.length * 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(metaSize);

      const metaParts: string[] = [];
      if (safeAuthor) metaParts.push(safeAuthor);
      if (safeYear) metaParts.push(safeYear);

      if (metaParts.length) {
            addPageIfNeeded(8);
            doc.text(metaParts.join(" • "), marginX, y);
            y += 8;
      }

      // Divider
      addPageIfNeeded(6);
      doc.setDrawColor(200);
      doc.setLineWidth(0.3);
      doc.line(marginX, y, pageW - marginX, y);
      y += 6;

      // Section title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      addPageIfNeeded(8);
      doc.text("Concepts", marginX, y);
      y += 8;

      // --- Body bullets ---
      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodySize);

      const bulletIndent = 4;
      const bulletSymbolX = marginX;
      const textX = marginX + bulletIndent;
      const lineHeight = 6;

      for (const c of concepts) {
            const lines = doc.splitTextToSize(c, contentW - bulletIndent);
            const needed = lines.length * lineHeight + 3;
            addPageIfNeeded(needed);

            doc.text("•", bulletSymbolX, y);
            doc.text(lines, textX, y);

            y += lines.length * lineHeight + 3;
      }

      // Footer (page numbers)
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(130);
            doc.text(`${i} / ${pageCount}`, pageW - marginX, pageH - 8, {
                  align: "right",
            });
      }

      const fileBase = sanitizeFilename(safeTitle || "the-art-expert");
      doc.save(`${fileBase}.pdf`);
};

