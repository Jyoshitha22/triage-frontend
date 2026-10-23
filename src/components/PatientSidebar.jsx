import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Home, Languages, HelpCircle, X, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './PatientSidebar.css';

/**
 * Left panel shown on every patient page: Home, a Language dropdown
 * (changes the app language right here) and Help.
 */
export default function PatientSidebar() {
  const navigate = useNavigate();
  const { language, setLanguage, languages, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const current = languages.find((l) => l.code === language);

  return (
    <>
      <nav className="psb" aria-label={t('menuLabel')}>
        <button type="button" className="psb__item psb__item--active" onClick={() => navigate('/')}>
          <Home size={28} /> <span>{t('homeLabel')}</span>
        </button>

        <button type="button" className="psb__item" onClick={() => setLangOpen((o) => !o)} aria-label={t('languageLabel')} aria-haspopup="listbox" aria-expanded={langOpen}>
          <Languages size={28} />
          <span>{t('languageLabel')} <small>{current?.nativeLabel}</small></span>
          <ChevronDown size={18} className={`psb__chev ${langOpen ? 'is-open' : ''}`} />
        </button>
        {langOpen && (
          <ul className="psb__langs" role="listbox" aria-label={t('chooseLanguage')}>
            {languages.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l.code === language}
                  className={l.code === language ? 'is-active' : ''}
                  onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                >
                  <span>{l.nativeLabel} <em>({l.label})</em></span>
                  {l.code === language && <Check size={18} />}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className="psb__item" onClick={() => setHelpOpen(true)}>
          <HelpCircle size={28} /> <span>{t('helpMenuLabel')}</span>
        </button>
      </nav>

      {helpOpen && (
        <div className="psb-modal" role="dialog" aria-modal="true" aria-label={t('helpTitle')}>
          <button type="button" className="psb-modal__backdrop" aria-label={t('close')} onClick={() => setHelpOpen(false)} />
          <div className="psb-modal__box">
            <div className="psb-modal__header">
              <h2 className="psb-modal__title">{t('helpTitle')}</h2>
              <button type="button" className="psb-modal__close" aria-label={t('close')} onClick={() => setHelpOpen(false)}><X size={20} /></button>
            </div>
            <ol className="psb-modal__steps">
              <li>{t('helpDetailsStep')}</li>
              <li>{t('helpSymptomsStep')}</li>
              <li>{t('helpReplyStep')}</li>
            </ol>
            <div className="psb-modal__warn">
              <p>{t('helpEmergency')}</p>
              <div className="psb-modal__emergency-links">
                <a href="tel:108">{t('ambulanceNumber')}</a>
                <a href="tel:112">{t('emergencyNumber')}</a>
              </div>
            </div>
            <button type="button" className="psb-modal__ok" onClick={() => setHelpOpen(false)}>{t('gotIt')}</button>
          </div>
        </div>
      )}
    </>
  );
}