import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Folder, FileText, FileImage, FileSpreadsheet, File as FileIcon,
  ChevronRight, ArrowLeft, ExternalLink, Loader2, RefreshCw, AlertCircle, X,
} from "lucide-react";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

interface FolderResp {
  folder: { id: string; name: string; parents: string[]; webViewLink?: string };
  files: DriveFile[];
  nextPageToken: string | null;
  rootFolderId: string | null;
}

const isFolder = (m: string) => m === "application/vnd.google-apps.folder";

const iconFor = (m: string) => {
  if (isFolder(m)) return <Folder className="w-5 h-5 text-primary" />;
  if (m.includes("spreadsheet")) return <FileSpreadsheet className="w-5 h-5 text-success" />;
  if (m.includes("document") || m.includes("pdf")) return <FileText className="w-5 h-5 text-accent" />;
  if (m.startsWith("image/")) return <FileImage className="w-5 h-5 text-accent" />;
  return <FileIcon className="w-5 h-5 text-muted-foreground" />;
};

const previewUrlFor = (f: DriveFile) =>
  isFolder(f.mimeType)
    ? null
    : `https://drive.google.com/file/d/${f.id}/preview`;

const DriveBrowser = ({ rootFolderId }: { rootFolderId: string }) => {
  const [stack, setStack] = useState<{ id: string; name: string }[]>([
    { id: rootFolderId, name: "InvoiceIQ" },
  ]);
  const [data, setData] = useState<FolderResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<DriveFile | null>(null);

  const currentId = stack[stack.length - 1].id;

  const load = useCallback(async (folderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("drive-browse", {
        body: { folderId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setData(data as FolderResp);
    } catch (e: any) {
      setError(e.message ?? "Failed to load folder");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(currentId);
  }, [currentId, load]);

  const openFolder = (f: DriveFile) => {
    setStack((s) => [...s, { id: f.id, name: f.name }]);
  };
  const goTo = (i: number) => setStack((s) => s.slice(0, i + 1));
  const goUp = () => stack.length > 1 && setStack((s) => s.slice(0, -1));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge variant="outline" className="gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Live · Google Drive
        </Badge>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="sm" className="gap-1.5"
            onClick={() => load(currentId)} disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {data?.folder?.webViewLink && (
            <a href={data.folder.webViewLink} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm" className="gap-1.5">
                Open in Drive <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm flex-wrap p-2 rounded-lg bg-muted/40 border border-border/60">
        {stack.length > 1 && (
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={goUp}>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
        )}
        {stack.map((s, i) => (
          <div key={s.id + i} className="flex items-center gap-1">
            <button
              onClick={() => goTo(i)}
              className={`px-2 py-1 rounded hover:bg-muted transition-colors ${
                i === stack.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.name}
            </button>
            {i < stack.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="rounded-xl border border-border/60 overflow-hidden bg-background/40">
        {loading && !data ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : !data || data.files.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            This folder is empty.
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {data.files.map((f) => {
              const folder = isFolder(f.mimeType);
              return (
                <li key={f.id}>
                  <button
                    onClick={() => (folder ? openFolder(f) : setPreview(f))}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="shrink-0">{iconFor(f.mimeType)}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-medium text-sm">{f.name}</span>
                      {f.modifiedTime && (
                        <span className="block text-xs text-muted-foreground">
                          Modified {new Date(f.modifiedTime).toLocaleDateString()}
                        </span>
                      )}
                    </span>
                    {folder && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Click a folder to open it · Click a file to preview it here · Use the breadcrumbs to go back.
      </p>

      {/* In-app file preview overlay */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-card border border-border/60 rounded-xl shadow-elegant w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
              <div className="flex items-center gap-2 min-w-0">
                {iconFor(preview.mimeType)}
                <span className="font-semibold truncate">{preview.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {preview.webViewLink && (
                  <a href={preview.webViewLink} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      Open in Drive <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                )}
                <Button variant="ghost" size="icon" onClick={() => setPreview(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-muted/20">
              <iframe
                src={previewUrlFor(preview)!}
                className="w-full h-full"
                title={preview.name}
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriveBrowser;
