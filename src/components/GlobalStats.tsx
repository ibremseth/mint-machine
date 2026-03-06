"use client";

interface GlobalStatsProps {
  totalMinted: number;
  tps: number;
  walletCount: number;
  totalInFlight: number;
  totalQueued: number;
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded px-4 py-3 min-w-[120px]">
      <div className="text-[10px] uppercase tracking-widest text-muted mb-1">
        {label}
      </div>
      <div
        className={`text-xl font-bold tabular-nums ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}

export function GlobalStats({
  totalMinted,
  tps,
  walletCount,
  totalInFlight,
  totalQueued,
}: GlobalStatsProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <StatCard label="Total Minted" value={totalMinted} />
      <StatCard label="TPS" value={tps.toFixed(1)} />
      <StatCard label="Pool Size" value={walletCount} />
      <StatCard label="In-Flight" value={totalInFlight} highlight />
      <StatCard label="Queued" value={totalQueued} highlight />
    </div>
  );
}
