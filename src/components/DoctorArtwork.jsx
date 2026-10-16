import girlImage from '../assets/details-girl.png';
import './DoctorArtwork.css';

export default function DoctorArtwork({ side = 'left' }) {
  return <img className={`doctor-page-art doctor-page-art--${side}`} src={girlImage} alt="" aria-hidden="true" />;
}
