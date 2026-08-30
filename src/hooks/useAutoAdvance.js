import { useEffect, useRef } from "react";
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