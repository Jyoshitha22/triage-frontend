import React from 'react';
import { ChevronLeft } from 'lucide-react';
import ProgressDots from './ProgressDots';
import PatientSidebar from './PatientSidebar';
import girlImg from '../assets/details-girl.png';
import './NavShell.css';

/**
 * Patient-facing shell, laid out like the Patient details page:
 * left panel (Home / Language / Help), the page centered on one screen
 * (no scrolling), and the doctor on the right.
 */
export default function NavShell({ step = 1, onBack, children }) {
  return (
    <div className="nav-shell">
      <div className="nav-shell__deco" aria-hidden="true">
        <img src={girlImg} alt="" className="nav-shell__girl" />
      </div>

      <div className="nav-shell__layout">
        <PatientSidebar />

        <div className="nav-shell__content">
          <div className="nav-shell__top">
            {onBack && (
              <button onClick={onBack} aria-label="Back" className="nav-shell__back">
                <ChevronLeft size={20} />
              </button>
            )}
            <ProgressDots step={step} />
          </div>

          <main className="nav-shell__main">{children}</main>
        </div>
      </div>
    </div>
  );
}