"use client";

import type {
  CopilotApiResponse,
  DiagnosticConsideration,
  DraftCopilotApiResponse,
  EditingCopilotApiResponse,
  OutputMode,
  RegenerateTarget,
} from "@/lib/types";
import SectionCard from "@/components/section-card";
import DiagnosticCard from "@/components/diagnostic-card";

type OutputTab =
  | "documentation"
  | "clinical_thinking"
  | "diagnosis"
  | "supervision"
  | "next_session";

const outputTabs: Array<{ id: OutputTab; label: string }> = [
  { id: "documentation", label: "Documentation" },
  { id: "clinical_thinking", label: "Clinical Thinking" },
  { id: "diagnosis", label: "Diagnosis & ICD-10" },
  { id: "supervision", label: "Supervision" },
  { id: "next_session", label: "Next Session" },
];

type OutputPanelProps = {
  result: CopilotApiResponse;
  outputMode: OutputMode;
  activeTab: OutputTab;
  copiedSection: string | null;
  regeneratingSection: RegenerateTarget | null;
  canRegenerate: boolean;
  onTabChange: (tab: OutputTab) => void;
  onCopy: (key: string, text: string) => void;
  onRegenerate: (target: RegenerateTarget) => void;
  onExportAll: () => void;
};

function renderNote(note: string) {
  const lines = note.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return <p className="placeholder">No note generated.</p>;

  return (
    <div className="structured-note">
      {lines.map((line, i) => {
        const match = line.match(/^([A-Z]):\s*(.*)$/);
        if (!match) {
          return <p key={i} className="note-paragraph">{line}</p>;
        }
        const [, label, content] = match;
        return (
          <div key={i} className="note-row">
            <div className="note-label">{label}</div>
            <p className="note-content">{content}</p>
          </div>
        );
      })}
    </div>
  );
}

function renderList(
  items: string[],
  variant?: "emphasis" | "flags",
  emptyText = "No items generated."
) {
  if (!items.length) return <p className="placeholder">{emptyText}</p>;
  return (
    <ul className={`output-list ${variant ? `output-list-${variant}` : ""}`}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function renderDiagnosticGrid(
  items: DiagnosticConsideration[],
  emptyText = "No diagnostic considerations generated."
) {
  if (!items.length) return <p className="placeholder">{emptyText}</p>;
  return (
    <div className="diagnostic-grid">
      {items.map((item, i) => (
        <DiagnosticCard key={i} item={item} index={i} />
      ))}
    </div>
  );
}

export default function OutputPanel({
  result,
  outputMode,
  activeTab,
  copiedSection,
  regeneratingSection,
  canRegenerate,
  onTabChange,
  onCopy,
  onRegenerate,
  onExportAll,
}: OutputPanelProps) {
  const isDraft = outputMode === "draft";
  const draft = isDraft ? (result as DraftCopilotApiResponse) : null;
  const editing = !isDraft ? (result as EditingCopilotApiResponse) : null;

  const noteKey = isDraft ? "birp_note" : "revised_note";
  const noteValue = isDraft ? (draft?.birp_note ?? "") : (editing?.revised_note ?? "");
  const noteTarget: RegenerateTarget = isDraft ? "birp_note" : "revised_note";

  return (
    <div className="output-panel">
      <div className="output-panel-header">
        <div className="output-tabs" role="tablist">
          {outputTabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              className={`output-tab ${activeTab === tab.id ? "output-tab-active" : ""}`}
              aria-selected={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button className="export-button" onClick={onExportAll} title="Export all sections">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export
        </button>
      </div>

      <div className="output-tab-content" role="tabpanel">
        {/* Documentation tab */}
        {activeTab === "documentation" && (
          <div className="tab-pane">
            <SectionCard
              title={isDraft ? "Clinical Note Draft" : "Revised Note"}
              kicker={isDraft ? "Documentation" : "Editing Mode"}
              description={isDraft ? "Generated in the selected format. Review and edit before use." : "Lightly edited version of your original wording."}
              copyKey={noteKey}
              target={noteTarget}
              copiedSection={copiedSection}
              regeneratingSection={regeneratingSection}
              canRegenerate={canRegenerate}
              onCopy={() => onCopy(noteKey, noteValue)}
              onRegenerate={() => onRegenerate(noteTarget)}
            >
              {renderNote(noteValue)}
            </SectionCard>

            {isDraft ? null : (
              <>
                <SectionCard
                  title="Wording Suggestions"
                  kicker="Coaching"
                  copyKey="wording_suggestions"
                  target="wording_suggestions"
                  copiedSection={copiedSection}
                  regeneratingSection={regeneratingSection}
                  canRegenerate={canRegenerate}
                  onCopy={() => onCopy("wording_suggestions", (editing?.wording_suggestions ?? []).join("\n"))}
                  onRegenerate={() => onRegenerate("wording_suggestions")}
                >
                  {renderList(editing?.wording_suggestions ?? [], "emphasis")}
                </SectionCard>

                <SectionCard
                  title="Rationale for Edits"
                  kicker="Why these changes"
                  copyKey="rationale_for_edits"
                  target="rationale_for_edits"
                  copiedSection={copiedSection}
                  regeneratingSection={regeneratingSection}
                  canRegenerate={canRegenerate}
                  onCopy={() => onCopy("rationale_for_edits", (editing?.rationale_for_edits ?? []).join("\n"))}
                  onRegenerate={() => onRegenerate("rationale_for_edits")}
                >
                  {renderList(editing?.rationale_for_edits ?? [])}
                </SectionCard>
              </>
            )}

            <SectionCard
              title="Compliance & Documentation Flags"
              kicker="Chart Review"
              description="Prompts to review before finalizing documentation."
              copyKey="compliance_flags"
              target="compliance_flags"
              copiedSection={copiedSection}
              regeneratingSection={regeneratingSection}
              canRegenerate={canRegenerate}
              onCopy={() => onCopy("compliance_flags", (result as DraftCopilotApiResponse | EditingCopilotApiResponse).compliance_flags.join("\n"))}
              onRegenerate={() => onRegenerate("compliance_flags")}
            >
              {renderList(result.compliance_flags, "flags")}
            </SectionCard>
          </div>
        )}

        {/* Clinical thinking tab (draft only) */}
        {activeTab === "clinical_thinking" && isDraft && (
          <div className="tab-pane">
            <SectionCard
              title="Clinical Hypothesis"
              kicker="Formulation"
              description="Tentative and grounded in the provided material only."
              copyKey="clinical_hypothesis"
              target="clinical_hypothesis"
              copiedSection={copiedSection}
              regeneratingSection={regeneratingSection}
              canRegenerate={canRegenerate}
              onCopy={() => onCopy("clinical_hypothesis", draft?.clinical_hypothesis ?? "")}
              onRegenerate={() => onRegenerate("clinical_hypothesis")}
            >
              <p className="hypothesis-text">{draft?.clinical_hypothesis || <span className="placeholder">No hypothesis generated.</span>}</p>
            </SectionCard>

            <SectionCard
              title="Suggested Interventions"
              kicker="Clinical Action"
              description="Practical, orientation-consistent. Not a treatment mandate."
              copyKey="interventions"
              target="interventions"
              copiedSection={copiedSection}
              regeneratingSection={regeneratingSection}
              canRegenerate={canRegenerate}
              onCopy={() => onCopy("interventions", (draft?.interventions ?? []).join("\n"))}
              onRegenerate={() => onRegenerate("interventions")}
            >
              {renderList(draft?.interventions ?? [], "emphasis")}
            </SectionCard>
          </div>
        )}

        {/* Diagnosis tab */}
        {activeTab === "diagnosis" && (
          <div className="tab-pane">
            <div className="diagnosis-tab-header">
              <p className="diagnosis-tab-note">
                All diagnostic considerations and ICD-10 codes below are hypotheses for therapist review only — not confirmed diagnoses. Pending further clinical assessment.
              </p>
            </div>
            <SectionCard
              title="Diagnostic Considerations"
              kicker="Differential — Therapist Facing Only"
              copyKey="diagnostic_considerations"
              target="diagnostic_considerations"
              copiedSection={copiedSection}
              regeneratingSection={regeneratingSection}
              canRegenerate={canRegenerate}
              onCopy={() =>
                onCopy(
                  "diagnostic_considerations",
                  result.diagnostic_considerations
                    .map((d) => `${d.diagnosis_to_consider}\n${d.icd10_codes.map((c) => `  ${c.code} — ${c.description}`).join("\n")}`)
                    .join("\n\n")
                )
              }
              onRegenerate={() => onRegenerate("diagnostic_considerations")}
            >
              {renderDiagnosticGrid(result.diagnostic_considerations)}
            </SectionCard>

            <SectionCard
              title="Clarifying Questions"
              kicker="Differential Narrowing"
              description="Therapist-facing questions to help narrow the diagnostic picture."
              copyKey="clarifying_questions"
              target="clarifying_questions"
              copiedSection={copiedSection}
              regeneratingSection={regeneratingSection}
              canRegenerate={canRegenerate}
              onCopy={() => onCopy("clarifying_questions", result.clarifying_questions.join("\n"))}
              onRegenerate={() => onRegenerate("clarifying_questions")}
            >
              {renderList(result.clarifying_questions)}
            </SectionCard>
          </div>
        )}

        {/* Supervision tab */}
        {activeTab === "supervision" && (
          <div className="tab-pane">
            <SectionCard
              title="Supervision Questions"
              kicker="Supervision Prep"
              description="Case-specific prompts — not generic reflection questions."
              copyKey="supervision_questions"
              target="supervision_questions"
              copiedSection={copiedSection}
              regeneratingSection={regeneratingSection}
              canRegenerate={canRegenerate}
              onCopy={() => onCopy("supervision_questions", result.supervision_questions.join("\n"))}
              onRegenerate={() => onRegenerate("supervision_questions")}
            >
              {renderList(result.supervision_questions, "emphasis")}
            </SectionCard>
          </div>
        )}

        {/* Next session tab (draft only) */}
        {activeTab === "next_session" && isDraft && (
          <div className="tab-pane">
            <SectionCard
              title="Next Session Focus"
              kicker="Planning"
              description="Priorities for the next session — realistic for one visit."
              copyKey="next_session_focus"
              target="next_session_focus"
              copiedSection={copiedSection}
              regeneratingSection={regeneratingSection}
              canRegenerate={canRegenerate}
              onCopy={() => onCopy("next_session_focus", (draft?.next_session_focus ?? []).join("\n"))}
              onRegenerate={() => onRegenerate("next_session_focus")}
            >
              {renderList(draft?.next_session_focus ?? [], "emphasis")}
            </SectionCard>
          </div>
        )}

        {/* Editing mode: next_session and clinical_thinking tabs show a message */}
        {(activeTab === "next_session" || activeTab === "clinical_thinking") && !isDraft && (
          <div className="tab-pane">
            <div className="tab-unavailable">
              <p>This section is available in <strong>Draft Mode</strong>. Switch the output mode in the form to access it.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
