import { useEffect, useRef } from "react";

/**
 * Fires `onAdvance` automatically after the patient stops interacting for
 * `delay` ms — used so typed answers move forward on their own, the same
 * way voice answers already auto-advance after being captured.
 *
 * `active` should be true only when the field currently has a valid,
 * submittable value (so an empty field never silently auto-advances).
 * The timer restarts every time `value` changes, so it only fires once
 * the patient has paused, not while they're still typing.
 *
 * Pass `enabled={false}` to turn this off entirely for a given field
 * (e.g. long free-text notes, where auto-submitting mid-thought would be
 * annoying).
 */
export default function useAutoAdvance(value, active, onAdvance, { delay = 1400, enabled = true } = {}) {
  const savedCallback = useRef(onAdvance);
  savedCallback.current = onAdvance;

  useEffect(() => {
    if (!enabled || !active) return undefined;
    const timer = setTimeout(() => savedCallback.current?.(), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, active, enabled, delay]);
}