import { useLayoutEffect, type ReactNode } from "react";
import { useLocation, useOutlet, type Location } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/** Cubic close to Framer / Linear page easing. */
const EASE = [0.22, 1, 0.36, 1] as const;

function pageKey(pathname: string) {
  if (pathname.startsWith("/account")) return "/account";
  return pathname;
}

function scrollWindowToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

function ScrollToTopOnMount() {
  useLayoutEffect(() => {
    scrollWindowToTop();
  }, []);
  return null;
}

type PageTransitionProps = {
  location: Location;
  children: ReactNode;
};

/** Route-level fade + rise. `location` must be passed into `<Routes location={...}>` so the exiting page stays frozen. */
export function PageTransition({ location, children }: PageTransitionProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const key = pageKey(location.pathname);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={key}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, pointerEvents: "none" }}
        transition={{ duration: reduceMotion ? 0.08 : 0.26, ease: EASE }}
        className="min-h-dvh"
      >
        <ScrollToTopOnMount />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Inner tab / nested-route transition that keeps the parent shell still. */
export function NestedPageTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, pointerEvents: "none" }}
        transition={{ duration: reduceMotion ? 0.08 : 0.2, ease: EASE }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
