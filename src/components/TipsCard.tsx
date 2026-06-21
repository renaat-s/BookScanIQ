import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ChevronRight } from "lucide-react";

const TIPS: { title: string; body: string }[] = [
  {
    title: "Forward receipts to your Gmail inbox",
    body: "InvoiceIQ scans your Gmail for receipts and invoices. Forwarding vendor receipts to yourself ensures they get auto-filed.",
  },
  {
    title: "Use clear vendor names in your spreadsheet",
    body: "Renaming a vendor in your Bookkeeping sheet teaches InvoiceIQ to use that exact label on every future invoice from that sender.",
  },
  {
    title: "Run a Backlog Scan once a quarter",
    body: "A 12-week Backlog Scan catches anything that slipped through — perfect for end-of-quarter cleanups before sending to your accountant.",
  },
  {
    title: "Adjust your 'minutes per document'",
    body: "Set how long bookkeeping really takes you per receipt — the Savings widget then shows your true ROI, not an industry average.",
  },
  {
    title: "Connect Xero or QuickBooks once",
    body: "After connecting, every newly-filed invoice posts as a draft transaction — no copy-paste, no double entry.",
  },
  {
    title: "Check the Audit Log when something looks off",
    body: "The Audit Log shows when each invoice was scanned, parsed and filed — including the AI's reasoning. Trust, but verify.",
  },
  {
    title: "Folder names are your categories",
    body: "InvoiceIQ files into Year › Month › Category folders. Rename or add subfolders in Drive to refine how your invoices get sorted.",
  },
];

const TipsCard = () => {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * TIPS.length));

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % TIPS.length), 12000);
    return () => clearInterval(t);
  }, []);

  const tip = TIPS[idx];

  return (
    <Card className="border-border/60 shadow-card bg-gradient-to-br from-accent/5 to-primary/5">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Tip</p>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setIdx((i) => (i + 1) % TIPS.length)}
              >
                Next <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-sm font-semibold mb-1">{tip.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{tip.body}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TipsCard;
