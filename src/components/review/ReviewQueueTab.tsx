import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  RefreshCw,
  Undo2,
  XCircle,

} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useReviewQueue, type ReviewEntry } from "@/hooks/useReviewQueue";
import { getPlanByTier } from "@/lib/stripe-plans";
import { useLowCogMode } from "@/contexts/LowCogModeContext";

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);

const formatDate = (raw: string | null) => {
  if (!raw) return "No date";
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? "No date"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const EXPORT_HOLD_MS = 12 * 60 * 60 * 1000;

const isCurrentMonth = (entry: ReviewEntry) => {
  const raw = entry.reviewed_at || entry.entry_date || entry.created_at;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return true;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

function EntryRow({
  entry,
  selected,
  onSelect,
  onApprove,
  onReject,
  onUnapprove,
  showActions,
}: {
  entry: ReviewEntry;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUnapprove?: (id: string) => void;
  showActions: boolean;
}) {

  const { lowCog } = useLowCogMode();
  const isIncome = entry.type === "income";
  const isUncategorized = entry.type === "uncategorized";

  return (
    <Card
      className={`flex flex-wrap items-center gap-3 border bg-card/80 backdrop-blur ${
        lowCog ? "p-5" : "p-3 sm:p-4"
      } ${isUncategorized ? "border-orange-500/40" : "border-border"}`}
    >
      {showActions && (
        <Checkbox
          checked={selected}
          onCheckedChange={(c) => onSelect(entry.id, Boolean(c))}
          aria-label={`Select ${entry.vendor ?? "entry"}`}
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium truncate">{entry.vendor || "Unknown vendor"}</span>
          <Badge
            variant="secondary"
            className={
              isIncome
                ? "bg-emerald-500/15 text-emerald-500"
                : isUncategorized
                  ? "bg-orange-500/15 text-orange-500"
                  : "bg-rose-500/15 text-rose-500"
            }
          >
            {isIncome ? "Income" : isUncategorized ? "Uncategorized" : "Expense"}
          </Badge>
          {entry.exported_at && (
            <Badge variant="outline" className="text-[10px]">Exported</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(entry.entry_date)}
          
          {entry.review_note ? ` · Note: ${entry.review_note}` : ""}
        </p>
      </div>

      <div className="text-right font-semibold tabular-nums">{formatMoney(entry.amount)}</div>

      {entry.drive_file_id && (
        <Button variant="ghost" size="sm" asChild>
          <a
            href={`https://drive.google.com/file/d/${entry.drive_file_id}/view`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open source document"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      )}

      {onUnapprove && !entry.exported_at && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => onUnapprove(entry.id)}
        >
          <Undo2 className="w-4 h-4" /> Move to pending
        </Button>
      )}

      {showActions && (
        <div className="flex gap-2">
          <Button size="sm" className="gap-1.5" onClick={() => onApprove(entry.id)}>
            <CheckCircle2 className="w-4 h-4" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onReject(entry.id)}>
            <XCircle className="w-4 h-4" /> Reject
          </Button>
        </div>
      )}

    </Card>
  );
}

export function ReviewQueueTab() {
  const navigate = useNavigate();
  const { subscription } = useAuth();
  const {
    pending,
    approved,
    rejected,
    loading,
    working,
    queueEnabled,
    toggleQueue,
    setStatus,
    refetch,
  } = useReviewQueue();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const unlocked = subscription.isDeveloper || Boolean(getPlanByTier(subscription.tier));

  const pendingValue = useMemo(
    () => pending.reduce((sum, e) => sum + (e.amount || 0), 0),
    [pending],
  );

  // Monthly reset: approved / exported / rejected windows only show the current
  // financial month. Older entries stay permanently in the Ledger Log (Audit tab).
  const approvedThisMonth = useMemo(
    () => approved.filter(isCurrentMonth),
    [approved],
  );
  const rejectedThisMonth = useMemo(
    () => rejected.filter(isCurrentMonth),
    [rejected],
  );

  // Exported entries move out of Approved automatically 12 hours after export.
  const { approvedList, exportedList } = useMemo(() => {
    const now = Date.now();
    const approvedList: ReviewEntry[] = [];
    const exportedList: ReviewEntry[] = [];
    for (const e of approvedThisMonth) {
      const exportedAt = e.exported_at ? new Date(e.exported_at).getTime() : null;
      if (exportedAt && !Number.isNaN(exportedAt) && now - exportedAt >= EXPORT_HOLD_MS) {
        exportedList.push(e);
      } else {
        approvedList.push(e);
      }
    }
    return { approvedList, exportedList };
  }, [approvedThisMonth]);


  const onSelect = (id: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  if (!unlocked) {
    return (
      <Card className="p-8 text-center space-y-4">
        <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
        <div>
          <h3 className="font-semibold">Review queue is a paid feature</h3>
          <p className="text-sm text-muted-foreground">
            Approve documents before they reach Xero or QuickBooks.
          </p>
        </div>
        <Button onClick={() => navigate("/pricing")}>View plans</Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Loading your review queue...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Review queue</h3>
          <p className="text-sm text-muted-foreground">
            Approve or reject documents before they are exported to your accounting software.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="review-gate"
              checked={queueEnabled}
              onCheckedChange={toggleQueue}
            />
            <Label htmlFor="review-gate" className="text-sm">Hold new documents for review</Label>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Awaiting review
          </p>
          <p className="text-2xl font-semibold mt-1">{pending.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Value on hold</p>
          <p className="text-2xl font-semibold mt-1">{formatMoney(pendingValue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Approved / exported / rejected</p>
          <p className="text-2xl font-semibold mt-1">
            {approvedList.length}{" "}
            <span className="text-muted-foreground text-base">
              / {exportedList.length} / {rejectedThisMonth.length}
            </span>
          </p>
        </Card>

      </div>

      {selected.size > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-3 border-primary/40">
          <span className="text-sm">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={working}
              onClick={async () => {
                await setStatus(Array.from(selected), "approved");
                setSelected(new Set());
              }}
            >
              Approve selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={working}
              onClick={async () => {
                await setStatus(Array.from(selected), "rejected");
                setSelected(new Set());
              }}
            >
              Reject selected
            </Button>
          </div>
        </Card>
      )}

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedList.length})</TabsTrigger>
          <TabsTrigger value="exported">Exported ({exportedList.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedThisMonth.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 m-0">
          {pending.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nothing is waiting for review.
            </p>
          ) : (
            pending.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                selected={selected.has(e.id)}
                onSelect={onSelect}
                onApprove={(id) => setStatus([id], "approved")}
                onReject={(id) => setStatus([id], "rejected")}
                showActions
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-3 m-0">
          <p className="text-xs text-muted-foreground">
            Entries that have not been exported yet can be sent back to Pending. Exported
            entries move to the Exported window 12 hours after export.
          </p>
          {approvedList.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No approved documents this month.
            </p>
          ) : (
            approvedList.slice(0, 100).map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                selected={false}
                onSelect={onSelect}
                onApprove={() => undefined}
                onReject={() => undefined}
                onUnapprove={(id) => setStatus([id], "pending")}
                showActions={false}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="exported" className="space-y-3 m-0">
          {exportedList.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nothing has been exported yet this month.
            </p>
          ) : (
            exportedList.slice(0, 100).map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                selected={false}
                onSelect={onSelect}
                onApprove={() => undefined}
                onReject={() => undefined}
                showActions={false}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-3 m-0">
          {rejectedThisMonth.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No rejected documents.
            </p>
          ) : (
            rejectedThisMonth.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                selected={false}
                onSelect={onSelect}
                onApprove={(id) => setStatus([id], "approved")}
                onReject={() => undefined}
                showActions={false}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Approved, exported and rejected entries roll over at the start of each financial
        month and remain permanently viewable in the Ledger Log under the Audit tab.
        Pending entries are never cleared.
      </p>
    </div>
  );
}


export default ReviewQueueTab;
