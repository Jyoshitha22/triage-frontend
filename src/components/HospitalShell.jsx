import React from 'react';
import { AudioLines, LogOut } from 'lucide-react';
import './HospitalShell.css';

/**
 * Doctor/hospital-facing shell. Not a linear flow, so no step header —
 * just identity, a way out, and the same soft brand background as the
 * patient side.
 */
export default function HospitalShell({ title, doctorName, onLogout, children }) {
  return (
    <div className="hospital-shell">
      <div className="hospital-shell__bg" aria-hidden="true">
        <span className="hospital-shell__blob hospital-shell__blob--gold" />
        <span className="hospital-shell__blob hospital-shell__blob--navy" />
      </div>

      <header className="hospital-shell__header">
        <div className="hospital-shell__header-row">
          <div className="hospital-shell__brand">
            <span className="hospital-shell__brand-icon"><AudioLines size={16} /></span>
            <span className="hospital-shell__brand-name">Triage</span>
            {title && <span className="hospital-shell__title">· {title}</span>}
          </div>

          <div className="hospital-shell__actions">
            {doctorName && <span className="hospital-shell__doctor">{doctorName}</span>}
            {onLogout && (
              <button onClick={onLogout} aria-label="Log out" className="hospital-shell__logout">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="hospital-shell__main">{children}</main>
    </div>
  );
}