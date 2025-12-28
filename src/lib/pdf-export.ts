import jsPDF from "jspdf";

function safeFileName(name: string) {
      return (name || "export")
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/(^-|-$)/g, "");
}

export function exportConceptsToPdf(
      title: string,
      author: string,
      year: string | null,
      concepts: string[]
) {
      console.log("✅ exportConceptsToPdf ARRAY version running", {
            title,
            conceptsLen: concepts?.length,
      });
      if (!title?.trim()) throw new Error("Missing title");
      if (!Array.isArray(concepts) || concepts.length === 0) throw new Error("No concepts to export");

      const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const marginX = 48;
      const marginTop = 56;
      const marginBottom = 56;
      const contentWidth = pageWidth - marginX * 2;

      const bodyFontSize = 11;
      const lineHeight = 16;

      const headerY = 36;

      const drawHeader = () => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.text(title, marginX, headerY);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            const meta = [author, year ? String(year) : null].filter(Boolean).join(" · ");
            if (meta) doc.text(meta, marginX, headerY + 16);

            doc.setDrawColor(220);
            doc.setLineWidth(0.6);
            doc.line(marginX, headerY + 26, pageWidth - marginX, headerY + 26);
      };

      const maxY = pageHeight - marginBottom;
      const startYFirst = marginTop + 24;
      const startYOther = marginTop;

      const ensureSpace = (y: number, needed: number) => {
            if (y + needed <= maxY) return y;
            doc.addPage();
            return startYOther;
      };

      drawHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodyFontSize);

      let y = startYFirst;

      for (const conceptRaw of concepts) {
            const concept = (conceptRaw || "").replace(/\r/g, "").trim();
            if (!concept) continue;

            const conceptText = concept.replace(/\n{2,}/g, "\n").trim();

            const bullet = "•";
            const bulletIndent = 14;
            const textX = marginX + bulletIndent;

            const lines = doc.splitTextToSize(conceptText, contentWidth - bulletIndent);
            const blockHeight = lines.length * lineHeight + 12;

            y = ensureSpace(y, blockHeight);

            doc.text(bullet, marginX, y);
            doc.text(lines, textX, y, { baseline: "top" });

            y += lines.length * lineHeight + 12;
      }

      doc.save(`${safeFileName(title)}.pdf`);
}

