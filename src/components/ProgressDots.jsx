import React from 'react';
import { Check } from 'lucide-react';
import './ProgressDots.css';

/**
 * Numbered step header for the patient flow. `step` is the overall flow
 * position (1 = Login … 5 = Reply). Login has its own screen, so this
 * only renders steps 2–5.
 */
const LABELS = ['Details', 'Symptoms', 'Waiting', 'Reply'];

export default function ProgressDots({ step }) {
  const headerStep = step - 1;

  return (
    <div className="progress-dots">
      {LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < headerStep;
        const current = n === headerStep;
        return (
          <div key={label} className="progress-dots__item">
            <div className="progress-dots__node">
              <span className={`progress-dots__circle ${done ? 'progress-dots__circle--done' : current ? 'progress-dots__circle--current' : ''}`}>
                {done ? <Check size={14} /> : n}
              </span>
              <span className={`progress-dots__label ${current ? 'progress-dots__label--current' : ''}`}>{label}</span>
            </div>
            {i < LABELS.length - 1 && (
              <span className={`progress-dots__line ${done ? 'progress-dots__line--done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}