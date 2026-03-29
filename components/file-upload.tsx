"use client";

import { useRef, useState } from "react";
import type { UploadedContext } from "@/lib/types";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_EXTRACTED_CHARS = 15_000;
const ACCEPTED_TYPES = [".pdf", ".docx", ".txt"];
const ACCEPTED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

type ExtractionStatus = "idle" | "extracting" | "done" | "error";

type FileUploadProps = {
  value: UploadedContext | null;
  onChange: (ctx: UploadedContext | null) => void;
  disabled?: boolean;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function extractFromPDF(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  const pdfjs = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(pageText);
  }

  return pageTexts.join("\n");
}

async function extractFromDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractFromTxt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return extractFromPDF(file);
  if (name.endsWith(".docx")) return extractFromDocx(file);
  return extractFromTxt(file);
}

export default function FileUpload({ value, onChange, disabled }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ExtractionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  async function processFile(file: File) {
    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large (${formatBytes(file.size)}). Maximum size is 50 MB.`);
      return;
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext) && !ACCEPTED_MIME.includes(file.type)) {
      setError(`Unsupported file type. Please upload a PDF, DOCX, or TXT file.`);
      return;
    }

    setStatus("extracting");

    try {
      const raw = await extractText(file);
      const text = raw.trim().slice(0, MAX_EXTRACTED_CHARS);

      if (!text) {
        setError("No readable text found in this file. Try a different format.");
        setStatus("error");
        return;
      }

      onChange({
        filename: file.name,
        fileType: ext,
        text,
      });
      setStatus("done");
    } catch (err) {
      console.error("File extraction error:", err);
      setError("Failed to extract text from this file. Make sure it is not password-protected.");
      setStatus("error");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleRemove() {
    onChange(null);
    setStatus("idle");
    setError(null);
  }

  const isExtracting = status === "extracting";

  return (
    <div className="file-upload-section">
      <div className="field-label-row">
        <label className="field-label">Assessment Document</label>
        <span className="field-optional">Optional</span>
      </div>
      <p className="file-upload-hint">
        Upload a DMH assessment, intake form, or prior evaluation (PDF, DOCX, or TXT, up to 50 MB).
        The AI will read the document and incorporate it as additional context.
      </p>

      {!value && (
        <div
          className={`file-drop-zone ${isDragOver ? "file-drop-zone-over" : ""} ${disabled || isExtracting ? "file-drop-zone-disabled" : ""}`}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={disabled ? undefined : handleDrop}
          onClick={() => !disabled && !isExtracting && inputRef.current?.click()}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
          aria-label="Upload assessment document"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            style={{ display: "none" }}
            disabled={disabled || isExtracting}
          />
          {isExtracting ? (
            <div className="file-drop-inner">
              <span className="spinner" aria-hidden="true" />
              <span className="file-drop-label">Extracting text…</span>
            </div>
          ) : (
            <div className="file-drop-inner">
              <span className="file-drop-icon" aria-hidden="true">↑</span>
              <span className="file-drop-label">
                {isDragOver ? "Drop to upload" : "Click or drag a file here"}
              </span>
              <span className="file-drop-meta">PDF, DOCX, TXT — up to 50 MB</span>
            </div>
          )}
        </div>
      )}

      {value && status === "done" && (
        <div className="file-attached">
          <div className="file-attached-info">
            <span className="file-attached-icon" aria-hidden="true">✓</span>
            <div className="file-attached-details">
              <span className="file-attached-name">{value.filename}</span>
              <span className="file-attached-chars">
                {value.text.length.toLocaleString()} characters extracted
                {value.text.length >= MAX_EXTRACTED_CHARS && " (truncated to 15,000)"}
              </span>
            </div>
          </div>
          <button
            className="file-remove-button"
            onClick={handleRemove}
            type="button"
            aria-label="Remove uploaded file"
            disabled={disabled}
          >
            Remove
          </button>
        </div>
      )}

      {error && (
        <p className="file-upload-error" role="alert">{error}</p>
      )}
    </div>
  );
}
