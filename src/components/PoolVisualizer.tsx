"use client";

import { useEffect, useRef } from "react";

type TxStatus = "pending" | "submitted" | "confirmed" | "error";

interface TrackedTx {
  wallet: string;
  nonce: number;
  status: TxStatus;
  hash?: string;
  error?: string;
  createdAt: number;
}

interface WalletInfo {
  address: string;
  pendingNonce: number;
  submittedNonce: number;
  confirmedNonce: number;
  queueDepth: number;
  inFlight: number;
}

interface PoolVisualizerProps {
  wallets: WalletInfo[];
  transactions: TrackedTx[];
  onClear: () => void;
}

const STATUS_CONFIG: Record<
  TxStatus,
  {
    color: string;
    bg: string;
    border: string;
    glow: string;
    label: string;
    dot: string;
  }
> = {
  pending: {
    color: "text-amber-400",
    bg: "bg-amber-400/8",
    border: "border-amber-400/20",
    glow: "0 0 8px rgba(245,158,11,0.4)",
    label: "PENDING",
    dot: "bg-amber-400",
  },
  submitted: {
    color: "text-sky-400",
    bg: "bg-sky-400/8",
    border: "border-sky-400/20",
    glow: "0 0 8px rgba(56,189,248,0.4)",
    label: "SUBMITTED",
    dot: "bg-sky-400",
  },
  confirmed: {
    color: "text-emerald-400",
    bg: "bg-emerald-400/8",
    border: "border-emerald-400/20",
    glow: "0 0 8px rgba(52,211,153,0.4)",
    label: "CONFIRMED",
    dot: "bg-emerald-400",
  },
  error: {
    color: "text-red-400",
    bg: "bg-red-400/8",
    border: "border-red-400/20",
    glow: "0 0 8px rgba(248,113,113,0.4)",
    label: "ERROR",
    dot: "bg-red-400",
  },
};

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function TxCard({ tx }: { tx: TrackedTx }) {
  const config = STATUS_CONFIG[tx.status];
  const prevStatus = useRef(tx.status);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevStatus.current !== tx.status && cardRef.current) {
      const el = cardRef.current;
      el.style.boxShadow = config.glow;
      const timeout = setTimeout(() => {
        el.style.boxShadow = "none";
      }, 600);
      prevStatus.current = tx.status;
      return () => clearTimeout(timeout);
    }
  }, [tx.status, config.glow]);

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-muted text-[10px] tabular-nums">#{tx.nonce}</span>
        <span className="flex items-center gap-1">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot}`}
          />
          <span
            className={`${config.color} text-[10px] font-bold tracking-wider`}
          >
            {config.label}
          </span>
        </span>
      </div>
      {tx.hash && (
        <div className="text-muted/50 text-[9px] mt-0.5 font-mono tabular-nums">
          {truncateAddress(tx.hash)}
        </div>
      )}
      {tx.error && (
        <div className="text-red-400/60 text-[9px] mt-0.5 truncate">
          {tx.error}
        </div>
      )}
    </>
  );

  const className = `${config.bg} ${config.border} border rounded px-2.5 py-1.5 transition-all duration-500 block`;

  if (tx.hash) {
    return (
      <a
        ref={cardRef}
        href={`https://sepolia.basescan.org/tx/${tx.hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} hover:brightness-125`}
        style={{ animation: "slide-in 0.3s ease-out" }}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      ref={cardRef}
      className={className}
      style={{ animation: "slide-in 0.3s ease-out" }}
    >
      {content}
    </div>
  );
}

function WalletLane({
  wallet,
  transactions,
}: {
  wallet: WalletInfo;
  transactions: TrackedTx[];
}) {
  const sorted = [...transactions].sort((a, b) => b.nonce - a.nonce);

  return (
    <div className="bg-surface border border-border rounded min-w-[220px] flex-1">
      <div className="border-b border-border px-3 py-2.5">
        <a
          href={`https://sepolia.basescan.org/address/${wallet.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground text-xs font-bold tracking-wider hover:text-primary transition-colors"
        >
          {truncateAddress(wallet.address)}
        </a>
        <div className="flex gap-3 mt-1.5 text-[10px] uppercase tracking-wider text-muted">
          <span>
            NONCE{" "}
            <span className="text-foreground/70 tabular-nums">
              {wallet.pendingNonce}
            </span>
          </span>
          <span>
            QUEUE{" "}
            <span className="text-foreground/70 tabular-nums">
              {wallet.queueDepth}
            </span>
          </span>
          <span>
            IN-FLT{" "}
            <span className="text-foreground/70 tabular-nums">
              {wallet.inFlight}
            </span>
          </span>
        </div>
      </div>

      <div className="p-2 space-y-1.5 min-h-[200px]">
        {sorted.length === 0 && (
          <div className="text-muted/30 text-xs text-center py-8 uppercase tracking-widest">
            standby
          </div>
        )}
        {sorted.map((tx) => (
          <TxCard key={`${tx.wallet}-${tx.nonce}`} tx={tx} />
        ))}
      </div>
    </div>
  );
}

export function PoolVisualizer({
  wallets,
  transactions,
  onClear,
}: PoolVisualizerProps) {
  const txByWallet = (address: string) =>
    transactions.filter(
      (tx) => tx.wallet.toLowerCase() === address.toLowerCase(),
    );

  const hasSettled = transactions.some(
    (tx) => tx.status === "confirmed" || tx.status === "error",
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted">
          Wallet Pool
        </div>
        <div className="flex-1 border-t border-border" />
        <div className="flex gap-3 text-[10px]">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <span key={status} className="flex items-center gap-1">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot}`}
              />
              <span className="text-muted">{config.label}</span>
            </span>
          ))}
        </div>
        {hasSettled && (
          <button
            onClick={onClear}
            className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded border border-red-400/30 bg-red-400/10 text-red-400 hover:bg-red-400/20 transition-all"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {wallets.map((wallet) => (
          <WalletLane
            key={wallet.address}
            wallet={wallet}
            transactions={txByWallet(wallet.address)}
          />
        ))}
      </div>
    </div>
  );
}
