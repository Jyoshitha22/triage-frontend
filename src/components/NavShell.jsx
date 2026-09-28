import React from 'react';
import { AudioLines, ChevronLeft } from 'lucide-react';
import ProgressDots from './ProgressDots';
import './NavShell.css';

/**
 * Patient-facing shell. Full-height gradient wash + soft color blobs so
 * screens feel designed edge-to-edge instead of a small card floating
 * in empty space.
 */
export default function NavShell({ step = 1, onBack, children }) {
  return (
    <div className="nav-shell">
      <div className="nav-shell__bg" aria-hidden="true">
        <span className="nav-shell__blob nav-shell__blob--gold" />
        <span className="nav-shell__blob nav-shell__blob--navy" />
      </div>

      <header className="nav-shell__header">
        <div className="nav-shell__header-row">
          <div className="nav-shell__side">
            {onBack && (
              <button onClick={onBack} aria-label="Back" className="nav-shell__back">
                <ChevronLeft size={20} />
              </button>
            )}
          </div>

          <div className="nav-shell__brand">
            <span className="nav-shell__brand-icon"><AudioLines size={16} /></span>
            <span className="nav-shell__brand-name">Triage</span>
          </div>

          <div className="nav-shell__side nav-shell__side--end">
            <span className="nav-shell__step-mobile">{step}/5</span>
          </div>
        </div>
        <div className="nav-shell__progress">
          <ProgressDots step={step} />
        </div>
      </header>

      <main className="nav-shell__main">{children}</main>
    </div>
  );
}