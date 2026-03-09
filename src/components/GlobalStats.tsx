"use client";

interface GlobalStatsProps {
  totalSupply: string;
  contractAddress: string;
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
  contractAddress,
  tps,
  walletCount,
  totalInFlight,
  totalQueued,
}: GlobalStatsProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <div className="bg-surface border border-border rounded px-4 py-3 min-w-[120px]">
        <div className="text-[10px] uppercase tracking-widest text-muted mb-1">
          Total Supply
        </div>
        <a
          href={`https://sepolia.basescan.org/token/${contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xl font-bold tabular-nums text-foreground hover:text-blue-400 transition-colors"
        >
          {totalSupply} BRRRR
        </a>
      </div>
      <StatCard label="TPS" value={tps.toFixed(1)} />
      <StatCard label="Pool Size" value={walletCount} />
      <StatCard label="In-Flight" value={totalInFlight} highlight />
      <StatCard label="Pending" value={totalQueued} highlight />
    </div>
  );
}
