import { LogOut } from 'lucide-react';
import DoctorArtwork from './DoctorArtwork';
import './HospitalShell.css';

/**
 * Doctor/hospital-facing shell: page title, staff actions, and background.
 */
export default function HospitalShell({ title, doctorName, onLogout, compact = false, wide = false, showDoctorArtwork = false, doctorArtworkSide = 'left', children }) {
  return (
    <div className="hospital-shell">
      {showDoctorArtwork && <DoctorArtwork side={doctorArtworkSide} />}
      <div className="hospital-shell__bg" aria-hidden="true">
        <span className="hospital-shell__blob hospital-shell__blob--gold" />
        <span className="hospital-shell__blob hospital-shell__blob--navy" />
      </div>

      {(title || doctorName || onLogout) && (
        <header className="hospital-shell__header">
          <div className="hospital-shell__header-row">
            <div className="hospital-shell__brand">
              {title && <span className="hospital-shell__title">{title}</span>}
            </div>

            <div className="hospital-shell__actions">
              {doctorName && <span className="hospital-shell__doctor">{doctorName}</span>}
              {onLogout && (
                <button onClick={onLogout} aria-label="Log out" className="hospital-shell__logout">
                  <LogOut size={16} />
                  <span>Log out</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      <main className={`hospital-shell__main${compact ? ' hospital-shell__main--compact' : ''}${wide ? ' hospital-shell__main--wide' : ''}${showDoctorArtwork ? ' hospital-shell__main--with-art' : ''}${showDoctorArtwork && doctorArtworkSide === 'right' ? ' hospital-shell__main--with-art-right' : ''}`}>{children}</main>
    </div>
  );
}