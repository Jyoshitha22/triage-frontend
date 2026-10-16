import brandHeart from '../assets/brand-heart.png';
import { useLanguage } from '../context/LanguageContext';
import './BrandLogo.css';

/**
 * The one Triage logo used on every page: same size, same look.
 * (Its position is set once in AppBackground.css so every page
 * puts it in the same top-left spot.)
 */
export default function BrandLogo({ className = '', light = false }) {
  const { t } = useLanguage();

  return (
    <div className={`brand-logo${light ? ' brand-logo--light' : ''} ${className}`}>
      <img src={brandHeart} alt="" className="brand-logo__img" />
      <div>
        <div className="brand-logo__name">Triage</div>
        <div className="brand-logo__tag">{t('brandTagline')}</div>
      </div>
    </div>
  );
}