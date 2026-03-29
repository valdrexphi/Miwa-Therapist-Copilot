"use client";

import type { DiagnosticConsideration } from "@/lib/types";

type DiagnosticCardProps = {
  item: DiagnosticConsideration;
  index: number;
};

export default function DiagnosticCard({ item, index }: DiagnosticCardProps) {
  return (
    <article className="diagnostic-card">
      <div className="diagnostic-card-header">
        <span className="diagnostic-card-index">Diagnosis {index + 1}</span>
        <h4 className="diagnostic-card-title">{item.diagnosis_to_consider}</h4>
      </div>

      <div className="diagnostic-card-body">
        <div className="diagnostic-detail">
          <div className="diagnostic-detail-label">Supported by</div>
          <ul className="diagnostic-detail-list">
            {item.supported_by.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>

        <div className="diagnostic-detail">
          <div className="diagnostic-detail-label">Missing information</div>
          <ul className="diagnostic-detail-list">
            {item.missing_information.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>

        <div className="diagnostic-detail">
          <div className="diagnostic-detail-label">Rule-out / competing considerations</div>
          <ul className="diagnostic-detail-list">
            {item.rule_out_or_competing_considerations.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>

        {item.icd10_codes && item.icd10_codes.length > 0 && (
          <div className="diagnostic-detail diagnostic-icd10">
            <div className="diagnostic-detail-label">
              ICD-10-CM codes to consider
              <span className="icd10-disclaimer"> — pending further assessment</span>
            </div>
            <div className="icd10-list">
              {item.icd10_codes.map((code) => (
                <div key={code.code} className="icd10-item">
                  <div className="icd10-item-header">
                    <span className="icd10-badge">{code.code}</span>
                    <span className="icd10-description">{code.description}</span>
                  </div>
                  <p className="icd10-rationale">{code.rationale}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
