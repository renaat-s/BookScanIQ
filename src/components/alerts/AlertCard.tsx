import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Copy, X } from "lucide-react";
import type { DetectedAlert } from "@/lib/anomaly-detection";
import { useLowCogMode } from "@/contexts/LowCogModeContext";
import DriveLinkPreview from "@/components/DriveLinkPreview";
import { formatMoney } from "@/lib/currency";

interface AlertCardProps {
  alert: DetectedAlert;
  onDismiss: (alert: DetectedAlert) => void;
}


const formatDate = (raw: string | null) => {
  if (!raw) return "No date";
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? "No date"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const { lowCog } = useLowCogMode();
  const isDuplicate = alert.kind === "duplicate";

  return (
    <Card
      className={`relative overflow-hidden border ${
        isDuplicate ? "border-amber-500/40" : "border-destructive/40"
      } bg-card/80 backdrop-blur ${lowCog ? "p-6" : "p-4 sm:p-5"}`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 ${
          isDuplicate ? "bg-amber-500" : "bg-destructive"
        }`}
        aria-hidden="true"
      />

      <div className="flex flex-wrap items-start justify-between gap-3 pl-2">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                isDuplicate
                  ? "border-amber-500/50 text-amber-600 dark:text-amber-400 gap-1"
                  : "border-destructive/50 text-destructive gap-1"
              }
            >
              {isDuplicate ? <Copy className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {isDuplicate ? "Possible duplicate" : "Spend anomaly"}
            </Badge>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              {alert.confidence} confidence
            </Badge>
          </div>
          <h4 className={`font-semibold ${lowCog ? "text-lg" : "text-sm sm:text-base"}`}>
            {alert.title}
          </h4>
          <p className={`text-muted-foreground ${lowCog ? "text-base" : "text-sm"}`}>
            {alert.reason}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => onDismiss(alert)}
        >
          <X className="w-4 h-4" /> Dismiss
        </Button>
      </div>

      {alert.entries.length > 0 && (
        <div className="mt-4 pl-2 space-y-2">
          {alert.entries.slice(0, 6).map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <span className="font-medium">{entry.vendor || "Unknown vendor"}</span>
                <span className="text-muted-foreground">
                  {" "}
                  &middot; {formatDate(entry.entry_date)}
                  
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold">{formatMoney(Number(entry.amount), entry.currency)}</span>
                {entry.drive_file_id && (
                  <DriveLinkPreview
                    url={`https://drive.google.com/file/d/${entry.drive_file_id}/view`}
                    label="Open"
                  />
                )}
              </div>
            </div>
          ))}
          {alert.entries.length > 6 && (
            <p className="text-xs text-muted-foreground">
              + {alert.entries.length - 6} more entries
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

export default AlertCard;
