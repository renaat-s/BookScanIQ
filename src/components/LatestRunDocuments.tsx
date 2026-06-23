import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, ImageOff, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useLedgerLiveRows, LedgerEntry } from "@/hooks/useLedgerLiveRows";

const ThumbCard = ({ entry }: { entry: LedgerEntry }) => {
  const [failed, setFailed] = useState(false);
  const thumbUrl = entry.driveId
    ? `https://drive.google.com/thumbnail?id=${entry.driveId}&sz=w800`
    : null;
  const isIncome = entry.type.toLowerCase().includes("income");

  return (
    <Card className="overflow-hidden border-border/60 shadow-card hover:shadow-elegant transition-all group">
      <a
        href={entry.link || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-[3/4] bg-muted relative overflow-hidden"
      >
        {thumbUrl && !failed ? (
          <img
            src={thumbUrl}
            alt={entry.vendor}
            loading="lazy"
            onError={() => setFailed(true)}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <ImageOff className="w-8 h-8 opacity-50" />
            <span className="text-xs">No preview</span>
          </div>
        )}
        {entry.type && (
          <div className="absolute top-2 left-2">
            <Badge variant={isIncome ? "default" : "secondary"} className="text-[10px]">
              {entry.type}
            </Badge>
          </div>
        )}
        {entry.link && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-background/90 backdrop-blur rounded-md p-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </a>
      <CardContent className="p-3 space-y-1">
        <p className="font-medium text-sm truncate">{entry.vendor}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{entry.date || "—"}</span>
          <span className="font-semibold tabular-nums text-foreground">
            {entry.total || "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const LatestRunDocuments = () => {
  const { entries, loading, error, reload } = useLedgerLiveRows();
  const items = useMemo(() => entries.filter((e) => e.driveId || e.link), [entries]);

  return (
    <Card className="border-border/60 shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Ledger Documents
              <Badge variant="secondary" className="ml-1">{items.length}</Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Live previews for every transaction currently in your Live Workspace ledger.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={reload} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 text-xs p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        ) : loading && items.length === 0 ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No ledger entries with document links yet.</p>
            <p className="text-xs mt-1">Run a scan to populate your Live Workspace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((e) => (
              <ThumbCard key={e.rowIndex} entry={e} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LatestRunDocuments;
