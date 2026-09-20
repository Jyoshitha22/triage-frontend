

/**
 * Brand mark: a heart with an ECG/heartbeat line running through its
 * center, with a stethoscope looped beneath it. Used anywhere the app
 * previously showed a plain stethoscope icon (role select, language
 * welcome, login hero, hospital login hero).
 */
export default function HeartbeatLogo({ size = 40, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      {/* Stethoscope tubing, looping behind/below the heart */}
      <path
        d="M14 30 C14 40, 20 46, 28 46 C36 46, 40 40, 40 32 M40 32 L46 32 M46 32 C49.3 32, 52 34.7, 52 38 C52 41.3, 49.3 44, 46 44 C42.7 44, 40 41.3, 40 38"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="14" cy="26" r="3.2" stroke="currentColor" strokeOpacity="0.55" strokeWidth="2.5" fill="none" />

      {/* Heart */}
      <path
        d="M32 50 C18 40, 10 32, 10 22.5 C10 15.6, 15.4 11, 21.5 11 C26 11, 29.6 13.6, 32 17.2 C34.4 13.6, 38 11, 42.5 11 C48.6 11, 54 15.6, 54 22.5 C54 32, 46 40, 32 50 Z"
        fill="currentColor"
      />

      {/* Heartbeat / ECG line through the middle of the heart. Every
          place this logo is used, the heart itself renders pale (on a
          dark circular badge) — so the cutout line uses the dark badge
          color to read clearly against it, not the light page mist. */}
      <path
        d="M14 26 L21 26 L24.5 19 L28.5 33 L32.5 22 L35.5 29 L38 26 L50 26"
        stroke="var(--color-midnight)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
