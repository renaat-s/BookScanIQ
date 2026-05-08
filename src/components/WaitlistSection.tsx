import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Copy, Flame, Loader2, Sparkles } from "lucide-react";

const waitlistSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255),
  referral_source: z.string().trim().max(50).optional(),
});

const REFERRAL_OPTIONS = [
  "Instagram",
  "LinkedIn",
  "Twitter/X",
  "YouTube",
  "Reddit",
  "Google Search",
  "Word of Mouth",
  "Other",
];

const SHARE_URL = "https://invoice-iq.com";

const useCountUp = (target: number, durationMs = 1200) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
};

const WaitlistSection = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referral, setReferral] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [count, setCount] = useState<number>(0);
  const animatedCount = useCountUp(count);

  useEffect(() => {
    let active = true;
    supabase.rpc("get_waitlist_count").then(({ data, error }) => {
      if (!active) return;
      if (!error && typeof data === "number") setCount(data);
      else if (!error && data != null) setCount(Number(data));
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = waitlistSchema.safeParse({
      name: name || undefined,
      email,
      referral_source: referral || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("waitlist").insert({
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name ?? null,
      referral_source: parsed.data.referral_source ?? null,
    });

    if (error) {
      // 23505 = unique_violation. Treat as friendly success.
      if (error.code === "23505") {
        toast.success("You're already on the list! We'll be in touch soon.");
        setSubmitted(true);
      } else {
        console.error("Waitlist insert error:", error);
        toast.error("Something went wrong. Please try again.");
      }
    } else {
      toast.success("You're in! 🎉");
      setSubmitted(true);
      setCount((c) => c + 1);
      // Fire-and-forget welcome email — don't block UI on email delivery
      supabase.functions
        .invoke("send-waitlist-welcome", {
          body: {
            email: parsed.data.email.toLowerCase(),
            name: parsed.data.name ?? null,
          },
        })
        .catch((err) => console.error("Welcome email failed:", err));
    }
    setSubmitting(false);
  };

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <section
      id="waitlist"
      aria-labelledby="waitlist-heading"
      className="relative py-20 overflow-hidden bg-gradient-subtle"
    >
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-gradient-primary opacity-20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-96 h-96 bg-brand-accent opacity-20 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-sm text-brand-primary font-medium mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            Early Access
          </div>
          <h2
            id="waitlist-heading"
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Join the <span className="text-gradient">Waitlist</span>
          </h2>
          <p className="text-lg text-foreground/70 leading-relaxed">
            Be the first to automate your bookkeeping when we launch.
          </p>

          <div
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/60 backdrop-blur-sm border border-border shadow-card"
            aria-live="polite"
          >
            <Flame className="w-4 h-4 text-brand-accent" />
            <span className="text-sm font-medium">
              <span className="tabular-nums font-bold text-foreground">
                {animatedCount.toLocaleString()}
              </span>{" "}
              <span className="text-muted-foreground">
                {count === 1 ? "person has" : "people have"} joined the waitlist
              </span>
            </span>
          </div>
        </div>

        <Card className="max-w-xl mx-auto p-8 md:p-10 backdrop-blur-xl bg-card/70 border-border/60 shadow-elegant animate-fade-in">
          {submitted ? (
            <div className="text-center space-y-6 animate-scale-in">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-success animate-scale-in" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">You're in!</h3>
                <p className="text-foreground/70">
                  We'll notify you the moment InvoiceIQ goes live.
                </p>
              </div>
              <div className="pt-2 space-y-3">
                <p className="text-sm font-medium">Share InvoiceIQ with a friend</p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={SHARE_URL}
                    aria-label="Share link"
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="hero"
                    onClick={handleCopyShare}
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="waitlist-name">Full Name</Label>
                <Input
                  id="waitlist-name"
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitlist-email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="waitlist-email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitlist-referral">
                  How did you hear about us?
                </Label>
                <Select value={referral} onValueChange={setReferral}>
                  <SelectTrigger id="waitlist-referral">
                    <SelectValue placeholder="Select an option (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {REFERRAL_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                disabled={submitting}
                className="w-full shadow-elegant transition-smooth hover:scale-[1.02]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Reserving your spot...
                  </>
                ) : (
                  "Reserve My Spot"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          )}
        </Card>
      </div>
    </section>
  );
};

export default WaitlistSection;
