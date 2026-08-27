import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type BackState = {
  from?: string;
};

/**
 * Navigate back using router state when available, otherwise an explicit
 * fallback route (never rely on history.length in SPAs).
 */
export function useSmartBack(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const from = (location.state as BackState | null)?.from;
    if (from) {
      navigate(from);
      return;
    }
    navigate(fallback);
  }, [navigate, location.state, fallback]);
}

export default useSmartBack;
