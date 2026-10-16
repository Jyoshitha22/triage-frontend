import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { useLanguage } from '../context/LanguageContext';
import './AppHeader.css';

/** The shared Triage header used throughout patient and staff flows. */
export function AppHeader() {
  const { t } = useLanguage();

  return (
    <header className="app-header">
      <Link to="/" className="app-header__home" aria-label="Triage home">
        <BrandLogo />
      </Link>
      <nav className="app-header__nav" aria-label="About Triage">
        <span>{t('headerSymptoms')}</span><i />
        <span>{t('headerGuidance')}</span><i />
        <span>{t('headerCare')}</span>
      </nav>
    </header>
  );
}

// Fallback: Export it both ways so Vite can never throw a mismatch error again!
export default AppHeader;
