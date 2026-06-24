import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Mounts children only once the wrapper is near the viewport.
 * Used to defer expensive (3D / canvas / chart) subtrees so they
 * don't block initial navigation.
 */
const LazyVisible = ({
  children,
  rootMargin = "200px",
  fallback = null,
  className,
}: {
  children: ReactNode;
  rootMargin?: string;
  fallback?: ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className={className} aria-hidden={!visible}>
      {visible ? children : fallback}
    </div>
  );
};

export default LazyVisible;
