import { useState, useEffect } from "react";

/**
 * Subscribes to matchMedia "change" (not window resize) — avoids redundant listeners
 * and effect churn from including `matches` in the dependency array.
 */
export function useMediaQueryStable(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
