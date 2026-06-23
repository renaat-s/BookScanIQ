import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface VendorEntry {
  name: string;
  total: number;
  count: number;
}

const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const vendorKey = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 64);

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

// Try a handful of common domain guesses for a vendor.
function candidateDomains(name: string): string[] {
  const cleaned = name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|gmbh|corp|co|company|sa|bv|plc)\b\.?/g, "")
    .replace(/[^a-z0-9 ]+/g, "")
    .trim();
  const compact = cleaned.replace(/\s+/g, "");
  const dashed = cleaned.replace(/\s+/g, "-");
  if (!compact) return [];
  const bases = Array.from(new Set([compact, dashed]));
  const tlds = [".com", ".io", ".co"];
  const out: string[] = [];
  for (const b of bases) for (const t of tlds) out.push(`${b}${t}`);
  return out;
}

function probeLogo(domain: string): Promise<string | null> {
  return new Promise((resolve) => {
    const url = `https://logo.clearbit.com/${domain}`;
    const img = new Image();
    let done = false;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      resolve(ok ? url : null);
    };
    img.onload = () => finish(img.naturalWidth > 0);
    img.onerror = () => finish(false);
    setTimeout(() => finish(false), 4000);
    img.src = url;
  });
}

type LogoMap = Record<string, { url: string | null; resolved: boolean }>;

const VendorCard = ({
  vendor,
  rank,
  logoUrl,
}: {
  vendor: VendorEntry;
  rank: number;
  logoUrl: string | null;
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = logoUrl && !imgFailed;
  return (
    <div className="p-4 rounded-xl border border-border/60 bg-gradient-subtle hover:shadow-elegant transition-all hover-scale">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-background border border-border/60 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
          {showLogo ? (
            <img
              src={logoUrl!}
              alt={vendor.name}
              className="w-full h-full object-contain p-1"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="text-muted-foreground">{initialsOf(vendor.name) || "?"}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground tabular-nums">#{rank}</span>
            <p className="font-semibold truncate">{vendor.name}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {vendor.count} document{vendor.count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums">{formatMoney(vendor.total)}</p>
        </div>
      </div>
    </div>
  );
};

const LatestRunVendors = ({
  vendors,
  userId,
}: {
  vendors: VendorEntry[];
  userId: string | undefined;
}) => {
  const [logos, setLogos] = useState<LogoMap>({});

  // Load cached logos
  useEffect(() => {
    if (!userId || vendors.length === 0) return;
    const keys = vendors.map((v) => vendorKey(v.name));
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("vendor_logos")
        .select("vendor_key, logo_url")
        .eq("user_id", userId)
        .in("vendor_key", keys);
      if (cancelled) return;
      const next: LogoMap = {};
      (data || []).forEach((row: { vendor_key: string; logo_url: string }) => {
        next[row.vendor_key] = { url: row.logo_url, resolved: true };
      });
      setLogos((prev) => ({ ...next, ...prev }));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, vendors]);

  // Resolve missing logos and cache them
  useEffect(() => {
    if (!userId) return;
    const toResolve = vendors.filter((v) => {
      const k = vendorKey(v.name);
      return !logos[k]?.resolved;
    });
    if (toResolve.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const v of toResolve) {
        if (cancelled) return;
        const k = vendorKey(v.name);
        const domains = candidateDomains(v.name);
        let found: { url: string; domain: string } | null = null;
        for (const d of domains) {
          const url = await probeLogo(d);
          if (url) {
            found = { url, domain: d };
            break;
          }
        }
        if (cancelled) return;
        setLogos((prev) => ({
          ...prev,
          [k]: { url: found?.url || null, resolved: true },
        }));
        if (found) {
          await supabase
            .from("vendor_logos")
            .upsert(
              {
                user_id: userId,
                vendor_name: v.name,
                vendor_key: k,
                logo_url: found.url,
                domain: found.domain,
              },
              { onConflict: "user_id,vendor_key" }
            );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, vendors, logos]);

  const sorted = useMemo(
    () => [...vendors].sort((a, b) => b.total - a.total),
    [vendors]
  );

  return (
    <Card className="border-border/60 shadow-card">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> Latest Run Vendors
          <Badge variant="secondary" className="ml-1">{sorted.length}</Badge>
        </CardTitle>
        <CardDescription className="text-xs">
          Vendors from the most recent scan — logos auto-fetched and cached for next time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No vendors from a recent run yet.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {sorted.map((v, i) => {
              const k = vendorKey(v.name);
              return (
                <VendorCard
                  key={v.name}
                  vendor={v}
                  rank={i + 1}
                  logoUrl={logos[k]?.url || null}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LatestRunVendors;
