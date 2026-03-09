"use client";

interface GlobalStatsProps {
  totalSupply: string;
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
  totalSupply,
  tps,
  walletCount,
  totalInFlight,
  totalQueued,
}: GlobalStatsProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <StatCard label="Total Supply" value={`${totalSupply} BRRRR`} />
      <StatCard label="TPS" value={tps.toFixed(1)} />
      <StatCard label="Pool Size" value={walletCount} />
      <StatCard label="In-Flight" value={totalInFlight} highlight />
      <StatCard label="Pending" value={totalQueued} highlight />
    </div>
  );
}
