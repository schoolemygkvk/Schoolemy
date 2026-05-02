import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { FaFilePdf, FaChevronLeft, FaChevronRight, FaDownload } from "react-icons/fa";
import { getSafeLessonMediaUrl } from "../../../../utils/safeLessonMediaUrl";
import { styles } from "./PDFViewer.styles";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export function PDFViewer({ lesson, courseId, theme, activeColors }) {
  const pdfFiles = Array.isArray(lesson?.pdfFile) ? lesson.pdfFile : [];
  const [selectedPdfIndex, setSelectedPdfIndex] = useState(null);
  const [numPages, setNumPages] = useState({});
  const [currentPages, setCurrentPages] = useState({});

  if (pdfFiles.length === 0) {
    return null;
  }

  const validPdfs = pdfFiles.filter((pdf) => {
    if (!pdf) return false;
    if (pdf._id) return true;
    return Boolean(getSafeLessonMediaUrl(pdf.url, "pdf"));
  });

  if (validPdfs.length === 0) {
    console.warn("No valid PDFs found in lesson:", lesson);
    return null;
  }

  const getPdfUrl = (pdf) => {
    if (pdf._id) {
      return `/api/resources/download/${courseId}/${pdf._id}/pdf`;
    }
    return getSafeLessonMediaUrl(pdf.url, "pdf");
  };

  const handleDocumentLoadSuccess = (index, { numPages }) => {
    setNumPages((prev) => ({ ...prev, [index]: numPages }));
    setCurrentPages((prev) => ({ ...prev, [index]: 1 }));
  };

  const handleNextPage = (index) => {
    setCurrentPages((prev) => ({
      ...prev,
      [index]: Math.min((prev[index] || 1) + 1, numPages[index] || 1),
    }));
  };

  const handlePrevPage = (index) => {
    setCurrentPages((prev) => ({
      ...prev,
      [index]: Math.max((prev[index] || 1) - 1, 1),
    }));
  };

  return (
    <div style={{ ...styles.card, marginTop: theme?.spacing?.lg || "20px" }}>
      <h2 style={styles.sectionTitle}>
        <FaFilePdf style={{ marginRight: "8px" }} />
        Materials ({validPdfs.length})
      </h2>

      {selectedPdfIndex !== null ? (
        <div style={styles.pdfViewerContainer}>
          <div style={styles.pdfHeader}>
            <button
              onClick={() => setSelectedPdfIndex(null)}
              style={{
                ...styles.closeButton,
                color: activeColors?.primary || "#007bff",
              }}
            >
              ← Back to Materials
            </button>
            <h3 style={{ margin: 0, flex: 1 }}>
              {validPdfs[selectedPdfIndex].name ||
                validPdfs[selectedPdfIndex].url?.split("/").pop() ||
                `Document ${selectedPdfIndex + 1}`}
            </h3>
            <a
              href={getPdfUrl(validPdfs[selectedPdfIndex])}
              download
              style={{
                ...styles.downloadBtn,
                backgroundColor: activeColors?.primary || "#007bff",
                color: "#fff",
              }}
            >
              <FaDownload /> Download
            </a>
          </div>

          <div style={styles.pdfDisplayContainer}>
            <Document
              file={getPdfUrl(validPdfs[selectedPdfIndex])}
              onLoadSuccess={(doc) =>
                handleDocumentLoadSuccess(
                  selectedPdfIndex,
                  doc
                )
              }
              loading={<div style={styles.loadingText}>Loading PDF...</div>}
              error={<div style={styles.errorText}>Failed to load PDF</div>}
            >
              <Page
                pageNumber={currentPages[selectedPdfIndex] || 1}
                renderTextLayer={false}
              />
            </Document>
          </div>

          <div style={styles.pdfControls}>
            <button
              disabled={!currentPages[selectedPdfIndex] || currentPages[selectedPdfIndex] <= 1}
              onClick={() => handlePrevPage(selectedPdfIndex)}
              style={{
                ...styles.navButton,
                backgroundColor:
                  currentPages[selectedPdfIndex] <= 1
                    ? "#ddd"
                    : activeColors?.primary || "#007bff",
                color: currentPages[selectedPdfIndex] <= 1 ? "#999" : "#fff",
                cursor:
                  currentPages[selectedPdfIndex] <= 1 ? "not-allowed" : "pointer",
              }}
            >
              <FaChevronLeft /> Previous
            </button>

            <span style={styles.pageInfo}>
              Page {currentPages[selectedPdfIndex] || 1} of{" "}
              {numPages[selectedPdfIndex] || "?"}
            </span>

            <button
              disabled={
                !numPages[selectedPdfIndex] ||
                !currentPages[selectedPdfIndex] ||
                currentPages[selectedPdfIndex] >= numPages[selectedPdfIndex]
              }
              onClick={() => handleNextPage(selectedPdfIndex)}
              style={{
                ...styles.navButton,
                backgroundColor:
                  currentPages[selectedPdfIndex] >=
                  numPages[selectedPdfIndex]
                    ? "#ddd"
                    : activeColors?.primary || "#007bff",
                color:
                  currentPages[selectedPdfIndex] >=
                  numPages[selectedPdfIndex]
                    ? "#999"
                    : "#fff",
                cursor:
                  currentPages[selectedPdfIndex] >=
                  numPages[selectedPdfIndex]
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Next <FaChevronRight />
            </button>
          </div>
        </div>
      ) : (
        <div style={{ ...styles.pdfGrid, ...(theme?.spacing?.md && { gap: theme.spacing.md }) }}>
          {validPdfs.map((pdf, i) => {
            const pdfName = pdf.name || pdf.url?.split("/").pop() || `Document ${i + 1}`;

            return (
              <div key={`pdf-${i}`} style={styles.pdfListCard}>
                <div
                  onClick={() => setSelectedPdfIndex(i)}
                  style={{
                    ...styles.pdfCard,
                    border: "1px solid #ddd",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    flex: 1,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border = `1px solid ${activeColors?.primary || "#007bff"}`;
                    e.currentTarget.style.backgroundColor =
                      activeColors?.lightGray || "#f5f5f5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border = "1px solid #ddd";
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  title={`View: ${pdfName}`}
                >
                  <div
                    style={{
                      ...styles.pdfIcon,
                      backgroundColor: activeColors?.lightGray || "#f0f0f0",
                      color: activeColors?.primary || "#007bff",
                    }}
                  >
                    <FaFilePdf />
                  </div>
                  <div style={styles.pdfDetails}>
                    <div style={styles.pdfTitle}>{pdfName}</div>
                  </div>
                </div>
                <a
                  href={getPdfUrl(pdf)}
                  download
                  style={{
                    ...styles.downloadIconBtn,
                    color: activeColors?.primary || "#007bff",
                  }}
                  title={`Download: ${pdfName}`}
                >
                  <FaDownload />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
