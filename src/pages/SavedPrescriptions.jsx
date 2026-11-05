import { useEffect, useState } from 'react';
import { Bookmark, ClipboardList, MessageSquare, Pill, Stethoscope } from 'lucide-react';
import PatientSidebar from '../components/PatientSidebar';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import session from '../utils/session';
import './SavedPrescriptions.css';

export default function SavedPrescriptions() {
  const { t } = useLanguage();
  const patientEmail = session.getPatient()?.email || '';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopped = false;
    if (!patientEmail) {
      setItems([]);
      setLoading(false);
      return () => { stopped = true; };
    }

    api.get(`/prescriptions?patient_email=${encodeURIComponent(patientEmail)}`)
      .then((rows) => {
        if (!stopped) setItems(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!stopped) setItems([]);
      })
      .finally(() => {
        if (!stopped) setLoading(false);
      });

    return () => { stopped = true; };
  }, [patientEmail]);

  return (
    <div className="saved-page">
      <div className="saved-page__body">
        <PatientSidebar />
        <main className="saved-page__main">
          <section className="saved-page__card">
            <div className="saved-page__head">
              <span className="saved-page__icon"><Bookmark size={26} /></span>
              <div>
                <h1 className="saved-page__title">{t('savedTitle')}</h1>
                <p className="saved-page__sub">{t('savedSubtitle')}</p>
              </div>
            </div>

            {loading && <p className="saved-page__empty">{t('savedLoading')}</p>}
            {!loading && items.length === 0 && <p className="saved-page__empty">{t('savedEmpty')}</p>}

            {!loading && items.length > 0 && (
              <div className="saved-page__list">
                {items.map((row) => (
                  <article key={row.prescription_id} className="saved-page__item">
                    <p className="saved-page__symptom"><Stethoscope size={14} /> <strong>{t('savedSymptomsLabel')}:</strong> {row.symptom_text || '-'}</p>
                    <p><Pill size={14} /> <strong>{t('savedMedicinesLabel')}:</strong> {row.medicines || '-'}</p>
                    <p><ClipboardList size={14} /> <strong>{t('savedTestsLabel')}:</strong> {row.tests || '-'}</p>
                    <p><MessageSquare size={14} /> <strong>{t('savedAdviceLabel')}:</strong> {row.advice || '-'}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
