import { useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageCircleQuestion, Smile, Meh, Frown, Loader2, Send } from "lucide-react";

type Sentiment = "happy" | "neutral" | "worried";

const PROMPT = "What's still worrying you about your bookkeeping?";

const FeedbackWidget = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const submit = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 2) {
      toast({ title: "Add a quick note", description: "Even a single sentence helps.", variant: "destructive" });
      return;
    }
    if (trimmed.length > 4000) {
      toast({ title: "Too long", description: "Please keep it under 4,000 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-feedback", {
        body: { message: trimmed, sentiment, prompt: PROMPT, route: pathname },
      });
      if (error || (data as { error?: string })?.error) throw new Error((data as { error?: string })?.error || error?.message);
      toast({ title: "Thank you", description: "Your note went straight to the founder's inbox." });
      setMessage("");
      setSentiment(null);
      setOpen(false);
    } catch (e) {
      toast({
        title: "Couldn't send",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all text-sm font-semibold"
      >
        <MessageCircleQuestion className="w-4 h-4" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{PROMPT}</SheetTitle>
            <SheetDescription>
              One sentence is enough. Goes straight to the founder, no support queue.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                How are you feeling?
              </p>
              <div className="grid grid-cols-3 gap-2">
                <SentimentBtn icon={<Smile className="w-4 h-4" />} label="Happy" value="happy" current={sentiment} onSelect={setSentiment} />
                <SentimentBtn icon={<Meh className="w-4 h-4" />} label="Neutral" value="neutral" current={sentiment} onSelect={setSentiment} />
                <SentimentBtn icon={<Frown className="w-4 h-4" />} label="Worried" value="worried" current={sentiment} onSelect={setSentiment} />
              </div>
            </div>

            <div>
              <Textarea
                placeholder="e.g. I'm not sure my receipts from Stripe are being captured…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={4000}
                className="resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right mt-1">{message.length}/4000</p>
            </div>

            <Button onClick={submit} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Sending…" : "Send to founder"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

const SentimentBtn = ({
  icon, label, value, current, onSelect,
}: {
  icon: React.ReactNode; label: string; value: Sentiment;
  current: Sentiment | null; onSelect: (v: Sentiment) => void;
}) => {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-muted/40 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
};

export default FeedbackWidget;
