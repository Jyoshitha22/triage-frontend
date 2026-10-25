import { Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './ProgressDots.css';

/**
 * Numbered step header for the patient flow. `step` is the overall flow
 * position (1 = Login … 5 = Reply). Login has its own screen, so this
 * only renders steps 2–5.
 */
const LABEL_KEYS = ['progressDetails', 'progressSymptoms', 'progressWaiting', 'progressReply'];
const DEFAULT_LABELS = ['Details', 'Symptoms', 'Waiting', 'Reply'];

export default function ProgressDots({ step, t, size = 'default' }) {
  const { t: contextT } = useLanguage();
  const translate = t || contextT;
  const headerStep = step - 1;
  const sizeClass = size === 'large' ? 'progress-dots--large' : '';

  return (
    <div className={`progress-dots ${sizeClass}`}>
      {LABEL_KEYS.map((labelKey, i) => {
        const n = i + 1;
        const done = n < headerStep;
        const current = n === headerStep;
        return (
          <div key={labelKey} className="progress-dots__item">
            <div className="progress-dots__node">
              <span className={`progress-dots__circle ${done ? 'progress-dots__circle--done' : current ? 'progress-dots__circle--current' : ''}`}>
                {done ? <Check size={14} /> : n}
              </span>
              <span className={`progress-dots__label ${current ? 'progress-dots__label--current' : ''}`}>{translate ? translate(labelKey) : DEFAULT_LABELS[i]}</span>
            </div>
            {i < LABEL_KEYS.length - 1 && (
              <span className={`progress-dots__line ${done ? 'progress-dots__line--done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}