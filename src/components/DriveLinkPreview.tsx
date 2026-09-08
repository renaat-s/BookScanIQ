import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, FileText, Loader2, X, Maximize2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Extracts a Google Drive file id from common URL shapes.
export const extractDriveId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
    /\/document\/d\/([a-zA-Z0-9_-]{10,})/,
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]{10,})/,
    /\/presentation\/d\/([a-zA-Z0-9_-]{10,})/,
  ];
  for (const rx of patterns) {
    const m = url.match(rx);
    if (m) return m[1];
  }
  return null;
};

export const isUrl = (v: string): boolean => {
  const s = (v ?? "").trim();
  return /^https?:\/\/\S+$/i.test(s);
};

const CARD_W = 360;
const CARD_H = 260;
const OFFSET = 18;

interface Props {
  url: string;
  label?: string;
}

const DriveLinkPreview = ({ url, label }: Props) => {
  const [hoverOpen, setHoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [modalLoaded, setModalLoaded] = useState(false);
  const [modalMode, setModalMode] = useState<"thumb" | "iframe">("thumb");
  const [modalThumbFailed, setModalThumbFailed] = useState(false);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const raf = useRef<number | null>(null);

  const driveId = extractDriveId(url);
  const thumbUrl = driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200` : null;
  const modalThumbUrl = driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w2400` : null;
  const iframeUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : null;


  // Smoothly trail the cursor for hover preview.
  useEffect(() => {
    if (!hoverOpen) return;
    const onMove = (e: MouseEvent) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let x = e.clientX + OFFSET;
      let y = e.clientY + OFFSET;
      if (x + CARD_W > vw - 8) x = e.clientX - CARD_W - OFFSET;
      if (y + CARD_H > vh - 8) y = e.clientY - CARD_H - OFFSET;
      targetX.current = Math.max(8, x);
      targetY.current = Math.max(8, y);
    };
    const tick = () => {
      setPos((p) => ({
        x: p.x + (targetX.current - p.x) * 0.18,
        y: p.y + (targetY.current - p.y) * 0.18,
      }));
      raf.current = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    raf.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [hoverOpen]);

  const handleEnter = (e: React.MouseEvent) => {
    targetX.current = e.clientX + OFFSET;
    targetY.current = e.clientY + OFFSET;
    setPos({ x: targetX.current, y: targetY.current });
    setHoverOpen(true);
  };
  const handleLeave = () => {
    setHoverOpen(false);
    setLoaded(false);
    setThumbFailed(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!driveId) return; // fall through to normal link for non-drive urls
    e.preventDefault();
    setHoverOpen(false);
    setModalOpen(true);
  };

  const display = label || (driveId ? "Open document" : url);
  const showIframe = thumbFailed && iframeUrl;

  return (
    <>
      <a
        href={url}
        target={driveId ? undefined : "_blank"}
        rel="noreferrer"
        onClick={handleClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="inline-flex items-center gap-1 text-primary hover:underline max-w-[200px] truncate align-middle cursor-pointer"
      >
        <ExternalLink className="w-3 h-3 shrink-0" />
        <span className="truncate">{display}</span>
      </a>

      {/* Cursor-trailing hover preview */}
      {hoverOpen && driveId && createPortal(
        <div
          style={{
            position: "fixed",
            left: pos.x,
            top: pos.y,
            width: CARD_W,
            height: CARD_H,
            pointerEvents: "none",
            zIndex: 9999,
          }}
          className="rounded-xl border border-border/80 bg-popover shadow-2xl overflow-hidden animate-fade-in"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/60 bg-muted/60 text-[11px] text-muted-foreground">
            <FileText className="w-3 h-3" />
            <span className="truncate">Drive preview · click to open</span>
          </div>
          <div className="relative w-full bg-background" style={{ height: CARD_H - 28 }}>
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            )}
            {showIframe ? (
              <iframe
                src={iframeUrl!}
                title="Drive preview"
                className="w-full h-full border-0"
                onLoad={() => setLoaded(true)}
              />
            ) : (
              <img
                src={thumbUrl!}
                alt="Drive preview"
                className="w-full h-full object-contain"
                onLoad={() => setLoaded(true)}
                onError={() => {
                  setThumbFailed(true);
                  setLoaded(false);
                }}
              />
            )}
          </div>
        </div>,
        document.body,
      )}

      {/* In-app document modal */}
      {driveId && (
        <Dialog
          open={modalOpen}
          onOpenChange={(o) => {
            setModalOpen(o);
            if (!o) {
              setModalLoaded(false);
              setModalMode("thumb");
              setModalThumbFailed(false);
            }
          }}
        >
          <DialogContent
            className="max-w-5xl w-[95vw] h-[88vh] p-0 overflow-hidden gap-0 border-border/70"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/40">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium truncate">
                  {label || "Document preview"}
                </span>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  · Rendered inside BookScanIQ
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setModalLoaded(false);
                    setModalMode((m) => (m === "thumb" ? "iframe" : "thumb"));
                  }}
                  title="Switch render mode"
                >
                  {modalMode === "thumb" ? "Interactive view" : "Image view"}
                </Button>
                <a href={url} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="sm" className="gap-1.5 h-8">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Open in Drive</span>
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="relative flex-1 bg-background overflow-auto" style={{ height: "calc(88vh - 49px)" }}>
              {!modalLoaded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              {modalMode === "thumb" && !modalThumbFailed ? (
                <div className="w-full h-full flex items-start justify-center p-4 bg-muted/20">
                  <img
                    src={modalThumbUrl!}
                    alt={label || "Document preview"}
                    className="max-w-full h-auto object-contain rounded-md shadow-lg bg-background"
                    onLoad={() => setModalLoaded(true)}
                    onError={() => {
                      setModalThumbFailed(true);
                      setModalLoaded(false);
                      setModalMode("iframe");
                    }}
                  />
                </div>
              ) : (
                <iframe
                  src={iframeUrl!}
                  title="Document preview"
                  className="w-full h-full border-0"
                  allow="autoplay"
                  onLoad={() => setModalLoaded(true)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

    </>
  );
};

export default DriveLinkPreview;
