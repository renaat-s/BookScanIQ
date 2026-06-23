import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, ImageOff } from "lucide-react";

export interface LatestRunInvoice {
  id: string;
  invoice_vendor: string | null;
  invoice_total: string | null;
  invoice_date: string | null;
  invoice_type: string | null;
  web_view_link: string | null;
  file_id: string | null;
}

function extractDriveId(inv: LatestRunInvoice): string | null {
  if (inv.file_id) return inv.file_id;
  if (inv.web_view_link) {
    const m = inv.web_view_link.match(/[-\w]{25,}/);
    if (m) return m[0];
  }
  return null;
}

const ThumbCard = ({ inv }: { inv: LatestRunInvoice }) => {
  const driveId = extractDriveId(inv);
  const [failed, setFailed] = useState(false);
  const thumbUrl = driveId
    ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`
    : null;
  const isIncome = (inv.invoice_type || "").toLowerCase() === "income";

  return (
    <Card className="overflow-hidden border-border/60 shadow-card hover:shadow-elegant transition-all group">
      <a
        href={inv.web_view_link || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-[3/4] bg-muted relative overflow-hidden"
      >
        {thumbUrl && !failed ? (
          <img
            src={thumbUrl}
            alt={inv.invoice_vendor || "Document preview"}
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
        <div className="absolute top-2 left-2">
          <Badge variant={isIncome ? "default" : "secondary"} className="text-[10px]">
            {inv.invoice_type || "—"}
          </Badge>
        </div>
        {inv.web_view_link && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-background/90 backdrop-blur rounded-md p-1.5">
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </a>
      <CardContent className="p-3 space-y-1">
        <p className="font-medium text-sm truncate">{inv.invoice_vendor || "Unknown vendor"}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{inv.invoice_date || "—"}</span>
          <span className="font-semibold tabular-nums text-foreground">
            {inv.invoice_total || "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const LatestRunDocuments = ({ invoices }: { invoices: LatestRunInvoice[] }) => {
  const items = useMemo(() => invoices.slice(0, 60), [invoices]);

  return (
    <Card className="border-border/60 shadow-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Latest Run Documents
          <Badge variant="secondary" className="ml-1">{items.length}</Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Live previews of every document captured in the most recent scan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No documents from a recent run yet.</p>
            <p className="text-xs mt-1">Run a scan to populate this panel.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((inv) => (
              <ThumbCard key={inv.id} inv={inv} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LatestRunDocuments;
