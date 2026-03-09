"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GlobalStats } from "@/components/GlobalStats";
import { MintControls } from "@/components/MintControls";
import { PoolVisualizer } from "@/components/PoolVisualizer";

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

export default function Home() {
  const [transactions, setTransactions] = useState<Map<string, TrackedTx>>(
    new Map(),
  );
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [totalSupply, setTotalSupply] = useState("0");
  const [isMinting, setIsMinting] = useState(false);
  const [tps, setTps] = useState(0);
  const confirmedTimestamps = useRef<number[]>([]);

  // Poll pool status
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/pool");
        if (res.ok) {
          const data = await res.json();
          setWallets(data.wallets);
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll stats (totalSupply from chain)
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setTotalSupply(data.totalSupply);
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll pending transaction statuses
  useEffect(() => {
    const pending = [...transactions.values()].filter(
      (tx) => tx.status !== "confirmed" && tx.status !== "error",
    );
    if (pending.length === 0) return;

    const poll = async () => {
      for (const tx of pending) {
        try {
          const res = await fetch(`/api/tx/${tx.wallet}/${tx.nonce}`);
          if (res.ok) {
            const data = await res.json();
            const key = `${tx.wallet}-${tx.nonce}`;
            setTransactions((prev) => {
              const next = new Map(prev);
              const existing = next.get(key);
              if (!existing) return prev;
              const newStatus = data.status as TxStatus;
              if (
                newStatus === "confirmed" &&
                existing.status !== "confirmed"
              ) {
                confirmedTimestamps.current.push(Date.now());
              }
              next.set(key, {
                ...existing,
                status: newStatus,
                hash: data.hash ?? existing.hash,
                error: data.error ?? existing.error,
              });
              return next;
            });
          }
        } catch {}
      }
    };

    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  }, [transactions]);

  // TPS calculation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const window = 10000;
      confirmedTimestamps.current = confirmedTimestamps.current.filter(
        (t) => now - t < window,
      );
      setTps(confirmedTimestamps.current.length / (window / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMint = useCallback(async (address: string, count: number) => {
    setIsMinting(true);
    try {
      const promises = Array.from({ length: count }, () =>
        fetch("/api/mint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        }).then((r) => r.json()),
      );
      const results = await Promise.all(promises);

      setTransactions((prev) => {
        const next = new Map(prev);
        for (const result of results) {
          if (result.wallet && result.nonce !== undefined) {
            const key = `${result.wallet}-${result.nonce}`;
            next.set(key, {
              wallet: result.wallet,
              nonce: result.nonce,
              status: result.status || "pending",
              createdAt: Date.now(),
            });
          }
        }
        return next;
      });
    } finally {
      setIsMinting(false);
    }
  }, []);

  const txList = [...transactions.values()];

  const clearSettled = useCallback(() => {
    setTransactions((prev) => {
      const next = new Map(prev);
      for (const [key, tx] of next) {
        if (tx.status === "confirmed" || tx.status === "error") {
          next.delete(key);
        }
      }
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-widest text-foreground">
          MINT MACHINE
        </h1>
        <p className="text-muted text-xs mt-1 tracking-wider uppercase">
          wallet pool transaction visualizer
        </p>
      </header>

      <GlobalStats
        totalSupply={totalSupply}
        tps={tps}
        walletCount={wallets.length}
        totalInFlight={
          txList.filter(
            (tx) => tx.status === "submitted" || tx.status === "pending",
          ).length
        }
        totalQueued={txList.filter((tx) => tx.status === "pending").length}
      />

      <MintControls onMint={handleMint} isMinting={isMinting} />

      <PoolVisualizer
        wallets={wallets}
        transactions={txList}
        onClear={clearSettled}
      />
    </div>
  );
}
