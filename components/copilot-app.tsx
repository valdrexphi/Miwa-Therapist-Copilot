"use client";

import { useEffect, useState } from "react";
import {
  CASE_TYPES,
  NOTE_FORMATS,
  ORIENTATIONS,
  OUTPUT_MODES,
  isCopilotApiError,
  isCopilotApiResponse,
  isCopilotPartialApiResponse,
  type CaseType,
  type CopilotApiResponse,
  type CopilotFormData,
  type DiagnosticConsideration,
  type DraftCopilotApiResponse,
  type EditingCopilotApiResponse,
  type NoteFormat,
  type Orientation,
  type OutputMode,
  type RegenerateTarget,
} from "@/lib/types";

const initialForm: CopilotFormData = {
  caseType: "",
  noteFormat: "BIRP",
  outputMode: "draft",
  orientation: "",
  presentingProblem: "",
  treatmentGoal: "",
  sessionNotes: "",
};

type CopyKey =
  | "birp_note"
  | "interventions"
  | "supervision_questions"
  | "compliance_flags"
  | "next_session_focus"
  | "clinical_hypothesis"
  | "diagnostic_considerations"
  | "clarifying_questions"
  | "revised_note"
  | "wording_suggestions"
  | "rationale_for_edits";

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

type StoredFeedbackEntry = FeedbackForm & {
  id: string;
  outputMode: OutputMode;
  noteFormat: NoteFormat;
  caseType: CopilotFormData["caseType"];
  orientation: CopilotFormData["orientation"];
  createdAt: string;
};

type OutputTab =
  | "documentation"
  | "clinical_thinking"
  | "diagnosis"
  | "supervision"
  | "next_session";

type ListSectionProps = {
  title: string;
  kicker: string;
  description: string;
  items: string[];
  copyKey: CopyKey;
  target: RegenerateTarget;
  copiedSection: CopyKey | null;
  regeneratingSection: RegenerateTarget | null;
  canRegenerateSections: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
  variant?: "emphasis" | "flags";
  emptyText: string;
};

const FEEDBACK_STORAGE_KEY = "clinical-copilot-feedback";
const initialFeedbackForm: FeedbackForm = {
  rating: "",
  strongestSection: "",
  comments: "",
};

const outputTabs: Array<{ id: OutputTab; label: string }> = [
  { id: "documentation", label: "Documentation" },
  { id: "clinical_thinking", label: "Clinical Thinking" },
  { id: "diagnosis", label: "Diagnosis" },
  { id: "supervision", label: "Supervision" },
  { id: "next_session", label: "Next Session" },
];

const sampleCases: Array<{ id: string; label: string; data: CopilotFormData }> = [
  {
    id: "couple-triangulation",
    label: "Couple conflict / triangulation",
    data: {
      caseType: "couple",
      noteFormat: "BIRP",
      outputMode: "draft",
      orientation: "MFT/Systemic",
      presentingProblem:
        "Fictional couple reporting repeated conflict escalation, withdrawal, and tension involving one partner's mother.",
      treatmentGoal:
        "Reduce reactive conflict, strengthen direct communication, and decrease reliance on third-party involvement.",
      sessionNotes:
        "- Fictional sample for testing only\n- Partner A reported arguments increase after contact with Partner B's mother\n- Partner B described feeling caught between spouse and mother\n- Therapist tracked a pursuer-withdrawer cycle during discussion\n- Session focused on direct communication and reducing triangulating moves",
    },
  },
  {
    id: "teen-school-refusal",
    label: "Teen anxiety / school refusal",
    data: {
      caseType: "family",
      noteFormat: "SOAP",
      outputMode: "draft",
      orientation: "CBT",
      presentingProblem:
        "Fictional teen with anxiety-related school refusal, morning escalation at home, and conflict about attendance.",
      treatmentGoal:
        "Increase school attendance, reduce morning escalation, and improve parent-teen coordination around support and expectations.",
      sessionNotes:
        "- Fictional sample for testing only\n- Parent reported repeated morning conflict before school\n- Teen reported stomach pain and dread before leaving home\n- Parent described shifting between comforting and threatening consequences\n- Therapist explored the sequence of anxiety, reassurance, conflict, and school avoidance",
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
      presentingProblem:
        "Fictional adult presenting with trauma-related avoidance, emotional numbing, and difficulty discussing triggering reminders.",
      treatmentGoal:
        "Increase emotional awareness, reduce avoidance, and build safer engagement with triggering material at a manageable pace.",
      sessionNotes:
        "- Fictional sample for testing only\n- Client reported shutting down when conversations move toward the trauma history\n- Client described avoiding family events that bring up reminders\n- Therapist slowed the pace and reflected the protective function of withdrawal\n- Session focused on noticing cues that precede numbing and avoidance",
    },
  },
  {
    id: "parent-child-power-struggle",
    label: "Parent-child power struggle",
    data: {
      caseType: "family",
      noteFormat: "BIRP",
      outputMode: "draft",
      orientation: "MFT/Systemic",
      presentingProblem:
        "Fictional parent-child conflict involving defiance, repeated yelling, and inconsistent limit setting at home.",
      treatmentGoal:
        "Reduce escalation, strengthen caregiver alignment, and improve predictable follow-through with limits.",
      sessionNotes:
        "- Fictional sample for testing only\n- Parent and child described repeated arguments around homework and screen time\n- Parent reported giving multiple warnings before escalating to yelling\n- Child reported tuning out once yelling starts\n- Therapist tracked an overfunctioning-underfunctioning pattern and explored clearer structure",
    },
  },
];

function renderStructuredNote(note: string, emptyText: string) {
  const lines = note.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) {
    return <p className="placeholder note-empty">{emptyText}</p>;
  }

  return (
    <div className="structured-note">
      {lines.map((line, index) => {
        const match = line.match(/^([A-Z]):\s*(.*)$/);
        if (!match) {
          return (
            <p key={`${line}-${index}`} className="note-paragraph">
              {line}
            </p>
          );
        }

        const [, label, content] = match;
        return (
          <div key={`${label}-${index}`} className="note-row">
            <div className="note-label">{label}</div>
            <p className="note-content">{content}</p>
          </div>
        );
      })}
    </div>
  );
}

function renderDiagnosticConsiderations(
  items: DiagnosticConsideration[],
  emptyText: string
) {
  if (!items.length) {
    return <p className="placeholder">{emptyText}</p>;
  }

  const sections: Array<{
    key: keyof Omit<DiagnosticConsideration, "diagnosis_to_consider">;
    label: string;
  }> = [
    { key: "supported_by", label: "Supported by" },
    { key: "missing_information", label: "Missing information" },
    {
      key: "rule_out_or_competing_considerations",
      label: "Rule-out / competing considerations",
    },
  ];

  return (
    <div className="diagnostic-grid">
      {items.map((item, index) => (
        <article
          key={`${item.diagnosis_to_consider}-${index}`}
          className="diagnostic-card"
        >
          <div className="diagnostic-card-header">
            <span className="diagnostic-card-index">Diagnosis {index + 1}</span>
            <h4>{item.diagnosis_to_consider}</h4>
          </div>
          <div className="diagnostic-card-body">
            {sections.map((section) => (
              <div key={section.key} className="diagnostic-detail">
                <div className="diagnostic-detail-label">{section.label}</div>
                <ul className="diagnostic-detail-list">
                  {item[section.key].map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function renderTabEmptyState(message: string) {
  return <p className="placeholder tab-empty-state">{message}</p>;
}

function renderListSection(props: ListSectionProps) {
  const listClass =
    props.variant === "flags"
      ? "result-list result-list-flags"
      : "result-list result-list-emphasis";
  const emptyClass =
    props.variant === "flags" ? "result-list result-list-flags" : "result-list";

  return (
    <div className="result-section">
      <div className="section-header">
        <div>
          <div className="section-kicker">{props.kicker}</div>
          <h3>{props.title}</h3>
        </div>
        <div className="section-actions">
          <button
            type="button"
            className="copy-button"
            onClick={props.onCopy}
            disabled={!props.items.length}
          >
            {props.copiedSection === props.copyKey ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            className="copy-button"
            onClick={props.onRegenerate}
            disabled={!props.canRegenerateSections || props.regeneratingSection !== null}
          >
            {props.regeneratingSection === props.target
              ? "Regenerating..."
              : "Regenerate"}
          </button>
        </div>
      </div>
      <p className="section-description">{props.description}</p>
      {props.items.length ? (
        <ul className={listClass}>
          {props.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <ul className={emptyClass}>
          <li className="placeholder">{props.emptyText}</li>
        </ul>
      )}
    </div>
  );
}

function isDraftResults(
  results: CopilotApiResponse | null,
  outputMode: OutputMode
): results is DraftCopilotApiResponse {
  return Boolean(results) && outputMode === "draft";
}

function isEditingResults(
  results: CopilotApiResponse | null,
  outputMode: OutputMode
): results is EditingCopilotApiResponse {
  return Boolean(results) && outputMode === "editing";
}

export default function CopilotApp() {
  const [formData, setFormData] = useState<CopilotFormData>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CopilotApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<OutputTab>("documentation");
  const [copiedSection, setCopiedSection] = useState<CopyKey | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [regeneratingSection, setRegeneratingSection] =
    useState<RegenerateTarget | null>(null);
  const [feedback, setFeedback] = useState<FeedbackForm>(initialFeedbackForm);
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);

  async function readJsonSafely(response: Response) {
    try {
      return (await response.json()) as unknown;
    } catch {
      return null;
    }
  }

  function getRequestErrorMessage(response: Response, payload: unknown) {
    if (isCopilotApiError(payload)) {
      return payload.error;
    }

    if (response.status >= 500) {
      return "The server could not complete the request. Please try again.";
    }

    return "The request failed. Please review the form and try again.";
  }

  useEffect(() => {
    if (!feedbackStatus) {
      return;
    }

    const timeoutId = window.setTimeout(() => setFeedbackStatus(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [feedbackStatus]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResults(null);
    setActiveTab("documentation");
    setCopiedSection(null);
    setFeedback(initialFeedbackForm);
    setFeedbackStatus(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await readJsonSafely(response);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, data));
      }

      if (!isCopilotApiResponse(data, formData.outputMode)) {
        throw new Error("The app received an unexpected response format.");
      }

      setResults(data);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegenerate(target: RegenerateTarget) {
    setError(null);
    setCopiedSection(null);
    setRegeneratingSection(target);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, regenerateTarget: target }),
      });
      const data = await readJsonSafely(response);

      if (!response.ok) {
        throw new Error(getRequestErrorMessage(response, data));
      }

      if (!isCopilotPartialApiResponse(data)) {
        throw new Error("The app received an unexpected response format.");
      }

      setResults((current) => {
        if (!current) {
          throw new Error("Generate the full draft once before regenerating sections.");
        }

        return { ...current, ...data };
      });
    } catch (regenerateError) {
      setError(
        regenerateError instanceof Error
          ? regenerateError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setRegeneratingSection(null);
    }
  }

  function updateField<Key extends keyof CopilotFormData>(
    field: Key,
    value: CopilotFormData[Key]
  ) {
    setFormData((current) => ({ ...current, [field]: value }));
    setResults(null);
    setActiveTab("documentation");
    setCopiedSection(null);
  }

  function updateFeedbackField<Key extends keyof FeedbackForm>(
    field: Key,
    value: FeedbackForm[Key]
  ) {
    setFeedback((current) => ({ ...current, [field]: value }));
  }

  async function handleCopy(section: CopyKey, text: string) {
    if (!text.trim()) {
      setError("There is nothing to copy yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      window.setTimeout(() => {
        setCopiedSection((current) => (current === section ? null : current));
      }, 1500);
    } catch {
      setError("Copy failed. Please try again.");
    }
  }

  function formatListForCopy(items: string[]) {
    return items.map((item) => `- ${item}`).join("\n");
  }

  function formatDiagnosticConsiderationsForCopy(
    items: DiagnosticConsideration[]
  ) {
    return items
      .map((item, index) =>
        [
          `Diagnosis ${index + 1}: ${item.diagnosis_to_consider}`,
          `Supported by: ${item.supported_by.join("; ")}`,
          `Missing information: ${item.missing_information.join("; ")}`,
          `Rule-out / competing considerations: ${item.rule_out_or_competing_considerations.join(
            "; "
          )}`,
        ].join("\n")
      )
      .join("\n\n");
  }

  function loadSampleCase() {
    const sample = sampleCases.find((item) => item.id === selectedSampleId);
    if (!sample) {
      return;
    }

    setFormData(sample.data);
    setResults(null);
    setError(null);
    setActiveTab("documentation");
    setCopiedSection(null);
    setFeedback(initialFeedbackForm);
    setFeedbackStatus(null);
  }

  function saveFeedbackToLocalStorage(entry: StoredFeedbackEntry) {
    const existingFeedback = window.localStorage.getItem(FEEDBACK_STORAGE_KEY);
    const parsedFeedback: StoredFeedbackEntry[] = existingFeedback
      ? ((JSON.parse(existingFeedback) as unknown[]).filter(
          (item): item is StoredFeedbackEntry =>
            Boolean(item) && typeof item === "object"
        ) as StoredFeedbackEntry[])
      : [];

    const nextFeedback = [entry, ...parsedFeedback].slice(0, 50);
    window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(nextFeedback));
  }

  function handleFeedbackSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!feedback.rating) {
      setFeedbackStatus("Choose useful or not useful before saving feedback.");
      return;
    }

    try {
      saveFeedbackToLocalStorage({
        id: `${Date.now()}`,
        rating: feedback.rating,
        strongestSection: feedback.strongestSection,
        comments: feedback.comments.trim(),
        outputMode: formData.outputMode,
        noteFormat: formData.noteFormat,
        caseType: formData.caseType,
        orientation: formData.orientation,
        createdAt: new Date().toISOString(),
      });
      setFeedback(initialFeedbackForm);
      setFeedbackStatus("Feedback saved on this device for prototype review.");
    } catch {
      setFeedbackStatus("Could not save feedback on this device.");
    }
  }

  const draftResults = isDraftResults(results, formData.outputMode) ? results : null;
  const editingResults = isEditingResults(results, formData.outputMode) ? results : null;
  const canRegenerateSections = Boolean(results) && !isLoading;
  const sharedComplianceFlags =
    draftResults?.compliance_flags || editingResults?.compliance_flags || [];
  const sharedDiagnosticConsiderations =
    draftResults?.diagnostic_considerations ||
    editingResults?.diagnostic_considerations ||
    [];
  const sharedClarifyingQuestions =
    draftResults?.clarifying_questions || editingResults?.clarifying_questions || [];
  const sharedSupervisionQuestions =
    draftResults?.supervision_questions || editingResults?.supervision_questions || [];

  return (
    <main className="page app-page">
      <div className="container">
        <section className="hero">
          <span className="eyebrow">Prototype Workspace</span>
          <h1>Miwa</h1>
          <p className="hero-subtitle">
            Therapist-facing support for documentation drafting, clinical
            reflection, diagnostic review, and supervision preparation.
          </p>
          <p>
            Miwa is a calm, review-first workspace designed to help therapists
            turn de-identified session notes into more usable clinical drafts.
          </p>
        </section>

        <div className="warning">
          Therapist-support prototype only. Do not enter PHI or real client-identifying information. Output is for review support only and is not legal advice.
        </div>

        <div className="info-grid">
          <section className="info-card">
            <h2>How To Use This Prototype</h2>
            <ul>
              <li>Enter brief, de-identified case information only.</li>
              <li>Select the note format, output mode, and therapeutic orientation you want.</li>
              <li>Submit the form to generate a draft or a light-touch editing pass.</li>
              <li>Use the sample cases if you want to test output quality quickly.</li>
            </ul>
          </section>

          <section className="info-card">
            <h2>Review Before Using Output</h2>
            <ul>
              <li>Check that the note matches what actually happened in session.</li>
              <li>Revise any wording that feels unsupported, vague, or overstated.</li>
              <li>Confirm the note fits your documentation standards and clinical judgment.</li>
              <li>Do not rely on the output without therapist review and editing.</li>
            </ul>
          </section>
        </div>

        <div className="grid">
          <section className="card">
            <h2>Session Input</h2>
            <p>Enter only the minimum context needed for this prototype.</p>

            <div className="sample-box">
              <label className="sample-label" htmlFor="sampleCase">Sample test case</label>
              <div className="sample-actions">
                <select id="sampleCase" value={selectedSampleId} onChange={(event) => setSelectedSampleId(event.target.value)}>
                  <option value="">Select a fictional sample case</option>
                  {sampleCases.map((sample) => (
                    <option key={sample.id} value={sample.id}>{sample.label}</option>
                  ))}
                </select>
                <button type="button" className="secondary-button" onClick={loadSampleCase} disabled={!selectedSampleId}>
                  Load sample
                </button>
              </div>
              <p className="sample-hint">These examples are fictional and de-identified for testing only.</p>
            </div>

            <form className="form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="caseType">Case type</label>
                <select id="caseType" value={formData.caseType} onChange={(event) => updateField("caseType", event.target.value as CaseType | "")} required>
                  <option value="">Select a case type</option>
                  {CASE_TYPES.map((caseType) => (
                    <option key={caseType} value={caseType}>{caseType}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="noteFormat">Note format</label>
                <select id="noteFormat" value={formData.noteFormat} onChange={(event) => updateField("noteFormat", event.target.value as NoteFormat)} required>
                  {NOTE_FORMATS.map((noteFormat) => (
                    <option key={noteFormat} value={noteFormat}>{noteFormat}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="outputMode">Output mode</label>
                <select id="outputMode" value={formData.outputMode} onChange={(event) => updateField("outputMode", event.target.value as OutputMode)} required>
                  {OUTPUT_MODES.map((outputMode) => (
                    <option key={outputMode} value={outputMode}>
                      {outputMode === "draft" ? "Draft Mode" : "Editing Mode"}
                    </option>
                  ))}
                </select>
                <div className="hint">
                  Draft Mode generates a fresh clinical draft. Editing Mode preserves more of your original wording and coaches small chart-ready improvements.
                </div>
              </div>

              <div className="field">
                <label htmlFor="orientation">Therapeutic orientation</label>
                <select id="orientation" value={formData.orientation} onChange={(event) => updateField("orientation", event.target.value as Orientation | "")} required>
                  <option value="">Select an orientation</option>
                  {ORIENTATIONS.map((orientation) => (
                    <option key={orientation} value={orientation}>{orientation}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="presentingProblem">Presenting problem</label>
                <textarea id="presentingProblem" value={formData.presentingProblem} onChange={(event) => updateField("presentingProblem", event.target.value)} placeholder="Example: Ongoing conflict escalation and shutdown cycles at home." required />
              </div>

              <div className="field">
                <label htmlFor="treatmentGoal">Treatment goal</label>
                <textarea id="treatmentGoal" value={formData.treatmentGoal} onChange={(event) => updateField("treatmentGoal", event.target.value)} placeholder="Example: Improve communication and reduce reactive conflict patterns." required />
              </div>

              <div className="field">
                <label htmlFor="sessionNotes">
                  {formData.outputMode === "editing" ? "Original note / session wording" : "Session bullet notes"}
                </label>
                <textarea id="sessionNotes" value={formData.sessionNotes} onChange={(event) => updateField("sessionNotes", event.target.value)} placeholder="- Therapist explored recent conflict cycle&#10;- Partner A reported feeling criticized&#10;- Partner B reported withdrawing during arguments" required />
                <div className="hint">
                  {formData.outputMode === "editing"
                    ? "Paste your own note wording here. Editing Mode will try to preserve your phrasing and suggest modest improvements."
                    : "Keep notes de-identified and brief. This prototype does not store submissions."}
                </div>
              </div>

              <div className="actions">
                <button className="button" type="submit" disabled={isLoading}>
                  {isLoading ? "Generating..." : "Submit"}
                </button>
                <span className="status">
                  {isLoading
                    ? "The AI is generating a structured draft."
                    : formData.outputMode === "editing"
                    ? "Editing Mode preserves more of your original wording."
                    : "The output sections will update after submit."}
                </span>
              </div>

              {error ? <div className="error">{error}</div> : null}
            </form>
          </section>

          <section className="card">
            <h2>Output</h2>
            <p>Review all AI output carefully before using it in documentation.</p>

            {isLoading ? (
              <div className="preview-box">
                {formData.outputMode === "editing"
                  ? "Generating revised note, wording suggestions, and coaching-oriented chart review prompts..."
                  : "Generating draft note, interventions, supervision questions, and documentation flags..."}
              </div>
            ) : results ? (
              <div className="preview-box">
                {formData.outputMode === "editing"
                  ? "Editing pass generated. Review suggested wording changes before using them."
                  : "Draft generated. Review for accuracy, completeness, and fit."}
              </div>
            ) : (
              <div className="preview-box">
                No output yet. Submit the form or load a sample case to test the current prompt.
              </div>
            )}

            <div className="output-tabs" role="tablist" aria-label="Output sections">
              {outputTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={activeTab === tab.id ? "output-tab is-active" : "output-tab"}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="results">
              {activeTab === "documentation" ? (
                <div className="tab-panel">
                  {formData.outputMode === "draft" ? (
                    <div className="result-section">
                      <div className="section-header">
                        <div>
                          <div className="section-kicker">Documentation Draft</div>
                          <h3>Draft {formData.noteFormat} Note</h3>
                        </div>
                        <div className="section-actions">
                          <button type="button" className="copy-button" onClick={() => handleCopy("birp_note", draftResults?.birp_note || "")} disabled={!draftResults?.birp_note}>
                            {copiedSection === "birp_note" ? "Copied" : "Copy"}
                          </button>
                          <button type="button" className="copy-button" onClick={() => handleRegenerate("birp_note")} disabled={!canRegenerateSections || regeneratingSection !== null}>
                            {regeneratingSection === "birp_note" ? "Regenerating..." : "Regenerate"}
                          </button>
                        </div>
                      </div>
                      <p className="section-description">
                        Brief {formData.noteFormat} draft that centers the main clinical dynamic when clear.
                      </p>
                      {draftResults ? renderStructuredNote(draftResults.birp_note, "Output will appear here after submit.") : <p className="placeholder note-empty">Output will appear here after submit.</p>}
                    </div>
                  ) : (
                    <>
                      <div className="result-section">
                        <div className="section-header">
                          <div>
                            <div className="section-kicker">Light Edit</div>
                            <h3>Revised Note</h3>
                          </div>
                          <div className="section-actions">
                            <button type="button" className="copy-button" onClick={() => handleCopy("revised_note", editingResults?.revised_note || "")} disabled={!editingResults?.revised_note}>
                              {copiedSection === "revised_note" ? "Copied" : "Copy"}
                            </button>
                            <button type="button" className="copy-button" onClick={() => handleRegenerate("revised_note")} disabled={!canRegenerateSections || regeneratingSection !== null}>
                              {regeneratingSection === "revised_note" ? "Regenerating..." : "Regenerate"}
                            </button>
                          </div>
                        </div>
                        <p className="section-description">
                          Lightly edited note wording that aims to preserve your voice while improving chart-readiness.
                        </p>
                        {editingResults ? renderStructuredNote(editingResults.revised_note, "A revised note will appear here after submit.") : <p className="placeholder note-empty">A revised note will appear here after submit.</p>}
                      </div>

                      {renderListSection({
                        title: "Suggested Wording Improvements",
                        kicker: "Coaching",
                        description: "Brief phrasing suggestions for places that may need more clarity, support, or linkage.",
                        items: editingResults?.wording_suggestions || [],
                        copyKey: "wording_suggestions",
                        target: "wording_suggestions",
                        copiedSection,
                        regeneratingSection,
                        canRegenerateSections,
                        onCopy: () => handleCopy("wording_suggestions", formatListForCopy(editingResults?.wording_suggestions || [])),
                        onRegenerate: () => handleRegenerate("wording_suggestions"),
                        emptyText: "Suggestions will appear here after submit.",
                      })}

                      {renderListSection({
                        title: "Rationale For Edits",
                        kicker: "Why It Helps",
                        description: "Short explanations for why those wording changes may strengthen the note.",
                        items: editingResults?.rationale_for_edits || [],
                        copyKey: "rationale_for_edits",
                        target: "rationale_for_edits",
                        copiedSection,
                        regeneratingSection,
                        canRegenerateSections,
                        onCopy: () =>
                          handleCopy(
                            "rationale_for_edits",
                            formatListForCopy(editingResults?.rationale_for_edits || [])
                          ),
                        onRegenerate: () => handleRegenerate("rationale_for_edits"),
                        emptyText: "Rationale will appear here after submit.",
                      })}
                    </>
                  )}

                  {renderListSection({
                    title: "Compliance / Documentation Flags",
                    kicker: "Chart Review",
                    description: "Practical chart-review prompts for vague, unsupported, or weakly linked documentation.",
                    items: sharedComplianceFlags,
                    copyKey: "compliance_flags",
                    target: "compliance_flags",
                    copiedSection,
                    regeneratingSection,
                    canRegenerateSections,
                    onCopy: () => handleCopy("compliance_flags", formatListForCopy(sharedComplianceFlags)),
                    onRegenerate: () => handleRegenerate("compliance_flags"),
                    variant: "flags",
                    emptyText: "Flags will appear here after submit.",
                  })}
                </div>
              ) : null}

              {activeTab === "clinical_thinking" ? (
                <div className="tab-panel">
                  {formData.outputMode === "draft" ? (
                    <>
                      <div className="result-section">
                        <div className="section-header">
                          <div>
                            <div className="section-kicker">Formulation</div>
                            <h3>Clinical Hypothesis</h3>
                          </div>
                          <div className="section-actions">
                            <button type="button" className="copy-button" onClick={() => handleCopy("clinical_hypothesis", draftResults?.clinical_hypothesis || "")} disabled={!draftResults?.clinical_hypothesis}>
                              {copiedSection === "clinical_hypothesis" ? "Copied" : "Copy"}
                            </button>
                            <button type="button" className="copy-button" onClick={() => handleRegenerate("clinical_hypothesis")} disabled={!canRegenerateSections || regeneratingSection !== null}>
                              {regeneratingSection === "clinical_hypothesis" ? "Regenerating..." : "Regenerate"}
                            </button>
                          </div>
                        </div>
                        <p className="section-description">
                          Brief, tentative formulation of the most likely core dynamic.
                        </p>
                        <p className={draftResults ? "text-block" : "placeholder text-block"}>
                          {draftResults?.clinical_hypothesis || "A brief clinical hypothesis will appear here after submit."}
                        </p>
                      </div>

                      {renderListSection({
                        title: "Intervention Suggestions",
                        kicker: "In-Session Work",
                        description: "Practical next-step ideas aligned with the selected modality and the main relational or systemic pattern.",
                        items: draftResults?.interventions || [],
                        copyKey: "interventions",
                        target: "interventions",
                        copiedSection,
                        regeneratingSection,
                        canRegenerateSections,
                        onCopy: () => handleCopy("interventions", formatListForCopy(draftResults?.interventions || [])),
                        onRegenerate: () => handleRegenerate("interventions"),
                        emptyText: "Suggestions will appear here after submit.",
                      })}
                    </>
                  ) : renderTabEmptyState("Clinical thinking outputs are available in Draft Mode.")}
                </div>
              ) : null}

              {activeTab === "diagnosis" ? (
                <div className="tab-panel">
                  <div className="result-section">
                    <div className="section-header">
                      <div>
                        <div className="section-kicker">Diagnostic Support</div>
                        <h3>Diagnostic Considerations</h3>
                      </div>
                      <div className="section-actions">
                        <button type="button" className="copy-button" onClick={() => handleCopy("diagnostic_considerations", formatDiagnosticConsiderationsForCopy(sharedDiagnosticConsiderations))} disabled={!sharedDiagnosticConsiderations.length}>
                          {copiedSection === "diagnostic_considerations" ? "Copied" : "Copy"}
                        </button>
                        <button type="button" className="copy-button" onClick={() => handleRegenerate("diagnostic_considerations")} disabled={!canRegenerateSections || regeneratingSection !== null}>
                          {regeneratingSection === "diagnostic_considerations" ? "Regenerating..." : "Regenerate"}
                        </button>
                      </div>
                    </div>
                    <p className="section-description">
                      Tentative diagnoses to consider based on the available information, with support, missing data, and competing explanations separated for quick review.
                    </p>
                    {renderDiagnosticConsiderations(sharedDiagnosticConsiderations, "Diagnostic considerations will appear here after submit.")}
                  </div>

                  {renderListSection({
                    title: "Clarifying Questions For Diagnostic Narrowing",
                    kicker: "Diagnostic Support",
                    description: "Targeted therapist-facing questions that help narrow the differential without overstating certainty.",
                    items: sharedClarifyingQuestions,
                    copyKey: "clarifying_questions",
                    target: "clarifying_questions",
                    copiedSection,
                    regeneratingSection,
                    canRegenerateSections,
                    onCopy: () => handleCopy("clarifying_questions", formatListForCopy(sharedClarifyingQuestions)),
                    onRegenerate: () => handleRegenerate("clarifying_questions"),
                    emptyText: "Clarifying questions will appear here after submit.",
                  })}
                </div>
              ) : null}

              {activeTab === "supervision" ? (
                <div className="tab-panel">
                  {renderListSection({
                    title: "Supervision Questions",
                    kicker: "Reflection",
                    description: "Case-specific reflection prompts covering formulation, therapist positioning, and sequencing.",
                    items: sharedSupervisionQuestions,
                    copyKey: "supervision_questions",
                    target: "supervision_questions",
                    copiedSection,
                    regeneratingSection,
                    canRegenerateSections,
                    onCopy: () => handleCopy("supervision_questions", formatListForCopy(sharedSupervisionQuestions)),
                    onRegenerate: () => handleRegenerate("supervision_questions"),
                    emptyText: "Questions will appear here after submit.",
                  })}
                </div>
              ) : null}

              {activeTab === "next_session" ? (
                <div className="tab-panel">
                  {formData.outputMode === "draft"
                    ? renderListSection({
                        title: "Next Session Focus",
                        kicker: "Planning",
                        description: "Two to four realistic priorities to guide the next session.",
                        items: draftResults?.next_session_focus || [],
                        copyKey: "next_session_focus",
                        target: "next_session_focus",
                        copiedSection,
                        regeneratingSection,
                        canRegenerateSections,
                        onCopy: () => handleCopy("next_session_focus", formatListForCopy(draftResults?.next_session_focus || [])),
                        onRegenerate: () => handleRegenerate("next_session_focus"),
                        emptyText: "Next-session priorities will appear here after submit.",
                      })
                    : renderTabEmptyState("Next-session planning is available in Draft Mode.")}
                </div>
              ) : null}
            </div>

            {results ? (
              <section className="feedback-panel">
                <div className="feedback-header">
                  <div>
                    <h3>Prototype Feedback</h3>
                    <p>Lightweight local feedback for early testing. Saved in this browser only.</p>
                  </div>
                </div>

                <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
                  <div className="feedback-field">
                    <span className="feedback-label">Was this useful?</span>
                    <div className="feedback-choice-row">
                      <button type="button" className={feedback.rating === "useful" ? "feedback-choice is-selected" : "feedback-choice"} onClick={() => updateFeedbackField("rating", "useful")}>
                        Useful
                      </button>
                      <button type="button" className={feedback.rating === "not_useful" ? "feedback-choice is-selected" : "feedback-choice"} onClick={() => updateFeedbackField("rating", "not_useful")}>
                        Not useful
                      </button>
                    </div>
                  </div>

                  <div className="feedback-field">
                    <label className="feedback-label" htmlFor="strongestSection">Strongest section</label>
                    <select id="strongestSection" value={feedback.strongestSection} onChange={(event) => updateFeedbackField("strongestSection", event.target.value as StrongestSection)}>
                      <option value="">Select a section</option>
                      <option value="note">Note</option>
                      <option value="interventions">Interventions</option>
                      <option value="supervision">Supervision</option>
                      <option value="compliance_flags">Compliance flags</option>
                      <option value="diagnostic_support">Diagnostic support</option>
                      <option value="next_session_focus">Next session focus</option>
                    </select>
                  </div>

                  <div className="feedback-field">
                    <label className="feedback-label" htmlFor="feedbackComments">Comments</label>
                    <textarea id="feedbackComments" value={feedback.comments} onChange={(event) => updateFeedbackField("comments", event.target.value)} placeholder="Optional notes about what helped or what felt off." />
                  </div>

                  <div className="feedback-actions">
                    <button className="secondary-button" type="submit">Save feedback</button>
                    {feedbackStatus ? <span className="feedback-status">{feedbackStatus}</span> : null}
                  </div>
                </form>
              </section>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
