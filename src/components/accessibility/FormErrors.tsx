'use client';

/**
 * Accessible Form Error Summary — WCAG SC 3.3.1 (Error Identification),
 * SC 3.3.3 (Error Suggestion).
 *
 * Requirements:
 * - Errors identified in text (not just color)
 * - Error summary appears at top of form on submit
 * - Each error links to its field
 * - Focus moves to error summary on submit failure
 * - Uses role="alert" for immediate screen reader announcement
 * - Suggests corrections when possible
 */

import { useEffect, useRef } from 'react';

interface FormError {
  field: string;
  fieldId: string;
  message: string;
  suggestion?: string;
}

interface FormErrorSummaryProps {
  errors: FormError[];
  formLabel?: string;
}

export function FormErrorSummary({ errors, formLabel = 'form' }: FormErrorSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);

  // Focus the error summary when errors appear
  useEffect(() => {
    if (errors.length > 0 && summaryRef.current) {
      summaryRef.current.focus();
    }
  }, [errors]);

  if (errors.length === 0) return null;

  return (
    <div
      ref={summaryRef}
      role="alert"
      aria-label={`${errors.length} error${errors.length > 1 ? 's' : ''} in ${formLabel}`}
      tabIndex={-1}
      className="form-error-summary"
    >
      <h3 className="error-summary-title">
        <span aria-hidden="true">⚠️</span>
        {' '}
        {errors.length} error{errors.length > 1 ? 's' : ''} found
      </h3>
      <ul className="error-summary-list">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              className="error-summary-link"
              onClick={(e) => {
                e.preventDefault();
                const field = document.getElementById(error.fieldId);
                if (field) {
                  field.focus();
                  field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            >
              <strong>{error.field}:</strong> {error.message}
              {error.suggestion && (
                <span className="error-suggestion"> ({error.suggestion})</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Individual field error message component.
 * Associates with field via aria-describedby.
 */
interface FieldErrorProps {
  id: string;
  message: string;
  suggestion?: string;
}

export function FieldError({ id, message, suggestion }: FieldErrorProps) {
  return (
    <p
      id={id}
      className="field-error"
      role="alert"
      aria-live="polite"
    >
      <span aria-hidden="true">✗</span>
      {' '}{message}
      {suggestion && <span className="field-suggestion"> {suggestion}</span>}
    </p>
  );
}
