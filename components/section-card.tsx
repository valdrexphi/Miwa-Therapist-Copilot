"use client";

import type { RegenerateTarget } from "@/lib/types";

type SectionCardProps = {
  title: string;
  kicker: string;
  description?: string;
  children: React.ReactNode;
  copyKey: string;
  target: RegenerateTarget;
  copiedSection: string | null;
  regeneratingSection: RegenerateTarget | null;
  canRegenerate: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
};

export default function SectionCard({
  title,
  kicker,
  description,
  children,
  copyKey,
  target,
  copiedSection,
  regeneratingSection,
  canRegenerate,
  onCopy,
  onRegenerate,
}: SectionCardProps) {
  const isRegenerating = regeneratingSection === target;
  const isCopied = copiedSection === copyKey;

  return (
    <div className={`section-card ${isRegenerating ? "section-card-regenerating" : ""}`}>
      <div className="section-card-header">
        <div className="section-card-meta">
          <span className="section-kicker">{kicker}</span>
          <h3 className="section-title">{title}</h3>
          {description && <p className="section-description">{description}</p>}
        </div>
        <div className="section-card-actions">
          {canRegenerate && (
            <button
              className="icon-button"
              onClick={onRegenerate}
              disabled={isRegenerating || regeneratingSection !== null}
              title="Regenerate this section"
              aria-label={`Regenerate ${title}`}
            >
              <svg
                className={`icon-regen ${isRegenerating ? "icon-spinning" : ""}`}
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M7.5 1C4.46 1 2 3.46 2 6.5a5.48 5.48 0 0 0 1.12 3.32L1.5 11.5h4V7.5L4.14 8.86A3.5 3.5 0 1 1 7.5 10v1.5A5.5 5.5 0 1 0 7.5 1z"
                  fill="currentColor"
                />
              </svg>
            </button>
          )}
          <button
            className="icon-button"
            onClick={onCopy}
            title="Copy to clipboard"
            aria-label={`Copy ${title}`}
          >
            {isCopied ? (
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path d="M2 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M3 10H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className={`section-card-body ${isRegenerating ? "section-card-body-loading" : ""}`}>
        {isRegenerating ? (
          <div className="skeleton-lines">
            <div className="skeleton-line skeleton-line-full" />
            <div className="skeleton-line skeleton-line-80" />
            <div className="skeleton-line skeleton-line-60" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
