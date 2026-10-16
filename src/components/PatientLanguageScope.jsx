import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function PatientLanguageScope() {
  const { pathname } = useLocation();
  const { language, setLanguage } = useLanguage();

  useLayoutEffect(() => {
    if ((pathname === '/' || pathname.startsWith('/hospital')) && language !== 'en') {
      setLanguage('en');
    }
  }, [language, pathname, setLanguage]);

  return null;
}
