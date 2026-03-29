"use client";

import { useEffect, useState } from "react";
import {
  isCopilotApiError,
  isCopilotApiResponse,
  isCopilotPartialApiResponse,
  type CopilotApiResponse,
  type CopilotFormData,
  type NoteFormat,
  type OutputMode,
  type RegenerateTarget,
} from "@/lib/types";
import CopilotForm from "@/components/copilot-form";
import OutputPanel from "@/components/output-panel";

const SESSION_KEY = "miwa-session-v2";

const initialForm: CopilotFormData = {
  caseType: "",
  noteFormat: "BIRP",
  outputMode: "draft",
  orientation: "",
  presentingProblem: "",
  treatmentGoal: "",
  sessionNotes: "",
};

type FeedbackRating = "useful" | "not_useful";
type StrongestSection =
  | ""
  | "note"
  | "interventions"
  | "supervision"
  | "compliance_flags"
  | "diagnostic_support"
  | "next_session_focus";

type FeedbackForm = {
  rating: FeedbackRating | "";
  strongestSection: StrongestSection;
  comments: string;
};

type OutputTab =
  | "documentation"
  | "clinical_thinking"
  | "diagnosis"
  | "supervision"
  | "next_session";

const initialFeedback: FeedbackForm = {
  rating: "",
  strongestSection: "",
  comments: "",
};

const sampleCases: Array<{ id: string; label: string; data: CopilotFormData }> = [
  {
    id: "couple-triangulation",
    label: "Couple / triangulation",
    data: {
      caseType: "couple",
      noteFormat: "BIRP",
      outputMode: "draft",
      orientation: "MFT/Systemic",
      presentingProblem: "Fictional couple reporting repeated conflict escalation, withdrawal, and tension involving one partner's mother.",
      treatmentGoal: "Reduce reactive conflict, strengthen direct communication, and decrease reliance on third-party involvement.",
      sessionNotes: "- Fictional sample for testing only\n- Partner A reported arguments increase after contact with Partner B's mother\n- Partner B described feeling caught between spouse and mother\n- Therapist tracked a pursuer-withdrawer cycle during discussion\n- Session focused on direct communication and reducing triangulating moves",
    },
  },
  {
    id: "teen-anxiety",
    label: "Teen anxiety / school refusal",
    data: {
      caseType: "family",
      noteFormat: "SOAP",
      outputMode: "draft",
      orientation: "CBT",
      presentingProblem: "Fictional teen with anxiety-related school refusal, morning escalation at home, and conflict about attendance.",
      treatmentGoal: "Increase school attendance, reduce morning escalation, and improve parent-teen coordination.",
      sessionNotes: "- Fictional sample for testing only\n- Parent reported repeated morning conflict before school\n- Teen reported stomach pain and dread before leaving home\n- Parent described shifting between comforting and threatening consequences\n- Therapist explored the sequence of anxiety, reassurance, conflict, and school avoidance",
    },
  },
  {
    id: "trauma-avoidance",
    label: "Trauma / avoidance",
    data: {
      caseType: "individual",
      noteFormat: "DAP",
      outputMode: "draft",
      orientation: "EFT",
      presentingProblem: "Fictional adult presenting with trauma-related avoidance, emotional numbing, and difficulty discussing triggering reminders.",
      treatmentGoal: "Increase emotional awareness, reduce avoidance, and build safer engagement with triggering material.",
      sessionNotes: "- Fictional sample for testing only\n- Client reported shutting down when conversations move toward trauma history\n- Client described avoiding family events that bring up reminders\n- Therapist slowed the pace and reflected the protective function of withdrawal\n- Session focused on noticing cues that precede numbing and avoidance",
    },
  },
];

function serializeResult(result: CopilotApiResponse): string {
  const sections: string[] = [];

  if ("birp_note" in result) {
    sections.push(`=== CLINICAL NOTE ===\n${result.birp_note}`);
    sections.push(`=== CLINICAL HYPOTHESIS ===\n${result.clinical_hypothesis}`);
    sections.push(`=== INTERVENTIONS ===\n${result.interventions.map((i) => `• ${i}`).join("\n")}`);
  }

  if ("revised_note" in result) {
    sections.push(`=== REVISED NOTE ===\n${result.revised_note}`);
    sections.push(`=== WORDING SUGGESTIONS ===\n${result.wording_suggestions.map((i) => `• ${i}`).join("\n")}`);
    sections.push(`=== RATIONALE FOR EDITS ===\n${result.rationale_for_edits.map((i) => `• ${i}`).join("\n")}`);
  }

  sections.push(`=== SUPERVISION QUESTIONS ===\n${result.supervision_questions.map((i) => `• ${i}`).join("\n")}`);
  sections.push(`=== COMPLIANCE FLAGS ===\n${result.compliance_flags.map((i) => `• ${i}`).join("\n")}`);
  sections.push(
    `=== DIAGNOSTIC CONSIDERATIONS ===\n${result.diagnostic_considerations
      .map(
        (d) =>
          `${d.diagnosis_to_consider}\n` +
          `  Supported by: ${d.supported_by.join("; ")}\n` +
          `  Missing: ${d.missing_information.join("; ")}\n` +
          `  Rule-out: ${d.rule_out_or_competing_considerations.join("; ")}\n` +
          `  ICD-10: ${d.icd10_codes.map((c) => `${c.code} (${c.description})`).join(", ")}`
      )
      .join("\n\n")}`
  );
  sections.push(`=== CLARIFYING QUESTIONS ===\n${result.clarifying_questions.map((i) => `• ${i}`).join("\n")}`);

  if ("next_session_focus" in result) {
    sections.push(`=== NEXT SESSION FOCUS ===\n${result.next_session_focus.map((i) => `• ${i}`).join("\n")}`);
  }

  return sections.join("\n\n");
}

export default function CopilotApp() {
  const [form, setForm] = useState<CopilotFormData>(initialForm);
  const [result, setResult] = useState<CopilotApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<OutputTab>("documentation");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [regeneratingSection, setRegeneratingSection] = useState<RegenerateTarget | null>(null);
  const [feedback, setFeedback] = useState<FeedbackForm>(initialFeedback);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);

  // Restore session from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const { form: savedForm, result: savedResult } = JSON.parse(saved);
        if (savedForm) setForm(savedForm);
        if (savedResult) setResult(savedResult);
        setSessionRestored(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist session to sessionStorage
  useEffect(() => {
    if (!result && !sessionRestored) return;
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ form, result }));
    } catch {
      // ignore
    }
  }, [form, result, sessionRestored]);

  async function handleGenerate() {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data: unknown = await response.json();

      if (!response.ok || isCopilotApiError(data)) {
        setError(isCopilotApiError(data) ? data.error : "Something went wrong. Please try again.");
        return;
      }

      if (!isCopilotApiResponse(data, form.outputMode)) {
        setError("The response was in an unexpected format. Please try again.");
        return;
      }

      setResult(data);
      setFeedback(initialFeedback);
      setFeedbackSubmitted(false);
      setFeedbackOpen(false);
      setActiveTab("documentation");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegenerate(target: RegenerateTarget) {
    if (!result || regeneratingSection) return;
    setRegeneratingSection(target);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, regenerateTarget: target }),
      });

      const data: unknown = await response.json();

      if (!response.ok || isCopilotApiError(data)) {
        setError(isCopilotApiError(data) ? data.error : "Regeneration failed. Please try again.");
        return;
      }

      if (!isCopilotPartialApiResponse(data)) {
        setError("Regeneration returned an unexpected format.");
        return;
      }

      setResult((prev) => (prev ? { ...prev, ...data } : prev));
    } catch {
      setError("Network error during regeneration.");
    } finally {
      setRegeneratingSection(null);
    }
  }

  function handleCopy(key: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(key);
      setTimeout(() => setCopiedSection(null), 2000);
    });
  }

  function handleExportAll() {
    if (!result) return;
    const text = serializeResult(result);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "miwa-clinical-draft.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLoadSample(id: string) {
    const sample = sampleCases.find((s) => s.id === id);
    if (sample) {
      setForm(sample.data);
      setResult(null);
      setError(null);
    }
  }

  async function handleFeedbackSubmit() {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...feedback,
          outputMode: form.outputMode,
          noteFormat: form.noteFormat,
          caseType: form.caseType,
          orientation: form.orientation,
          createdAt: new Date().toISOString(),
        }),
      });
    } catch {
      // best-effort
    }

    // Also store locally as backup
    try {
      const existing = JSON.parse(localStorage.getItem("miwa-feedback") ?? "[]") as unknown[];
      existing.push({ ...feedback, createdAt: new Date().toISOString() });
      localStorage.setItem("miwa-feedback", JSON.stringify(existing));
    } catch {
      // ignore
    }

    setFeedbackSubmitted(true);
  }

  return (
    <main className="app-main">
      <div className="app-layout">
        {/* Left: Form */}
        <aside className="app-sidebar">
          <CopilotForm
            form={form}
            isLoading={isLoading}
            onChange={setForm}
            onSubmit={handleGenerate}
            onLoadSample={handleLoadSample}
            sampleCases={sampleCases}
          />
        </aside>

        {/* Right: Output */}
        <section className="app-content">
          {error && (
            <div className="error-banner" role="alert">
              <strong>Error:</strong> {error}
              <button className="error-dismiss" onClick={() => setError(null)} aria-label="Dismiss error">×</button>
            </div>
          )}

          {isLoading && !result && (
            <div className="loading-panel">
              <div className="loading-panel-inner">
                <div className="loading-spinner-large" aria-hidden="true" />
                <p className="loading-label">Generating clinical draft…</p>
                <p className="loading-sublabel">This usually takes 10–20 seconds.</p>
              </div>
              <div className="skeleton-output">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-line skeleton-line-30" />
                    <div className="skeleton-line skeleton-line-full" />
                    <div className="skeleton-line skeleton-line-80" />
                    <div className="skeleton-line skeleton-line-60" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && !result && (
            <div className="empty-state">
              <div className="empty-state-inner">
                <div className="empty-state-icon" aria-hidden="true">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="6" y="8" width="28" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 16h16M12 22h10M12 28h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3>No draft yet</h3>
                <p>Fill in the session context on the left and click <strong>Generate Draft</strong> to begin.</p>
              </div>
            </div>
          )}

          {result && !isLoading && (
            <>
              <OutputPanel
                result={result}
                outputMode={form.outputMode}
                activeTab={activeTab}
                copiedSection={copiedSection}
                regeneratingSection={regeneratingSection}
                canRegenerate={true}
                onTabChange={setActiveTab}
                onCopy={handleCopy}
                onRegenerate={handleRegenerate}
                onExportAll={handleExportAll}
              />

              {/* Feedback section */}
              <div className="feedback-section">
                {!feedbackOpen && !feedbackSubmitted && (
                  <button
                    className="feedback-toggle"
                    onClick={() => setFeedbackOpen(true)}
                  >
                    Share feedback on this draft
                  </button>
                )}

                {feedbackOpen && !feedbackSubmitted && (
                  <div className="feedback-panel">
                    <div className="feedback-panel-header">
                      <h4>Feedback</h4>
                      <button className="icon-button" onClick={() => setFeedbackOpen(false)} aria-label="Close feedback">×</button>
                    </div>

                    <div className="feedback-body">
                      <div className="field-group">
                        <label className="field-label">Was this draft useful?</label>
                        <div className="radio-row">
                          {(["useful", "not_useful"] as FeedbackRating[]).map((r) => (
                            <label key={r} className="radio-label">
                              <input
                                type="radio"
                                name="rating"
                                value={r}
                                checked={feedback.rating === r}
                                onChange={() => setFeedback((f) => ({ ...f, rating: r }))}
                              />
                              {r === "useful" ? "Yes, useful" : "Not useful"}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="field-group">
                        <label className="field-label" htmlFor="strongestSection">Strongest section</label>
                        <select
                          id="strongestSection"
                          className="field-select"
                          value={feedback.strongestSection}
                          onChange={(e) => setFeedback((f) => ({ ...f, strongestSection: e.target.value as StrongestSection }))}
                        >
                          <option value="">Select…</option>
                          <option value="note">Clinical note</option>
                          <option value="interventions">Interventions</option>
                          <option value="supervision">Supervision questions</option>
                          <option value="compliance_flags">Compliance flags</option>
                          <option value="diagnostic_support">Diagnostic / ICD-10</option>
                          <option value="next_session_focus">Next session focus</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label" htmlFor="feedbackComments">Comments (optional)</label>
                        <textarea
                          id="feedbackComments"
                          className="field-textarea field-textarea-sm"
                          placeholder="Any other thoughts on the output quality…"
                          value={feedback.comments}
                          onChange={(e) => setFeedback((f) => ({ ...f, comments: e.target.value }))}
                          rows={3}
                          maxLength={1000}
                        />
                      </div>

                      <button
                        className="button button-primary"
                        onClick={handleFeedbackSubmit}
                        disabled={!feedback.rating}
                      >
                        Submit Feedback
                      </button>
                    </div>
                  </div>
                )}

                {feedbackSubmitted && (
                  <p className="feedback-thanks">Thanks for the feedback — it helps improve the tool.</p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
