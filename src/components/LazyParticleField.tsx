import { lazy, Suspense, useEffect, useState } from "react";

// three.js + @react-three/fiber weigh ~700kB. Keep them out of the initial
// bundle: load only after first paint, and skip entirely on small screens,
// reduced-motion setups, or Low Cognitive Load mode.
const ParticleField = lazy(() => import("./ParticleField"));

const shouldSkip = () => {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (window.matchMedia("(max-width: 768px)").matches) return true;
  if (document.documentElement.classList.contains("low-cog")) return true;
  return false;
};

const LazyParticleField = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (shouldSkip()) return;
    const idle =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
        .requestIdleCallback;
    let handle: number;
    if (idle) handle = idle(() => setShow(true));
    else handle = window.setTimeout(() => setShow(true), 400);
    return () => {
      if (!idle) window.clearTimeout(handle);
    };
  }, []);

  if (!show) return null;

  return (
    <Suspense fallback={null}>
      <ParticleField />
    </Suspense>
  );
};

export default LazyParticleField;
