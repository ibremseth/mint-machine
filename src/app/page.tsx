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
  const [contractAddress, setContractAddress] = useState("");
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

  // Poll stats — 5s while txns are in-flight, 30s when idle
  const hasPending = [...transactions.values()].some(
    (tx) => tx.status !== "confirmed" && tx.status !== "error",
  );
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setTotalSupply(data.totalSupply);
          if (data.contractAddress) setContractAddress(data.contractAddress);
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, hasPending ? 5000 : 30000);
    return () => clearInterval(interval);
  }, [hasPending]);

  // Ref to latest transactions so the polling interval can read current
  // state without being torn down and recreated on every change.
  const transactionsRef = useRef(transactions);
  transactionsRef.current = transactions;

  // Poll pending transaction statuses, batched per wallet
  useEffect(() => {
    async function fetchWalletTxs(wallet: string, txs: TrackedTx[]) {
      const nonces = txs.map((tx) => tx.nonce);
      const res = await fetch(
        `/api/txs/${wallet}?from=${Math.min(...nonces)}&to=${Math.max(...nonces)}`,
      );
      if (!res.ok) return;

      const data = await res.json();
      const byNonce = new Map<number, (typeof data.transactions)[0]>();
      for (const tx of data.transactions ?? []) {
        byNonce.set(tx.nonce, tx);
      }

      setTransactions((prev) => {
        const next = new Map(prev);
        let changed = false;
        for (const tracked of txs) {
          const key = `${tracked.wallet}-${tracked.nonce}`;
          const existing = next.get(key);
          const remote = byNonce.get(tracked.nonce);
          if (!existing || !remote) continue;
          if (remote.status === existing.status && remote.hash === existing.hash)
            continue;
          if (remote.status === "confirmed" && existing.status !== "confirmed") {
            confirmedTimestamps.current.push(Date.now());
          }
          next.set(key, {
            ...existing,
            status: remote.status as TxStatus,
            hash: remote.hash ?? existing.hash,
            error: remote.error ?? existing.error,
          });
          changed = true;
        }
        return changed ? next : prev;
      });
    }

    let polling = false;
    const interval = setInterval(async () => {
      if (polling) return;
      polling = true;
      try {
        // Group pending txs by wallet
        const byWallet = new Map<string, TrackedTx[]>();
        for (const tx of transactionsRef.current.values()) {
          if (tx.status === "confirmed" || tx.status === "error") continue;
          const list = byWallet.get(tx.wallet) ?? [];
          list.push(tx);
          byWallet.set(tx.wallet, list);
        }

        await Promise.all(
          [...byWallet.entries()].map(([wallet, txs]) =>
            fetchWalletTxs(wallet, txs).catch(() => {}),
          ),
        );
      } finally {
        polling = false;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
        <p className="text-muted/70 text-xs mt-3 max-w-md mx-auto">
          Mint ERC-20 tokens on Base Sepolia, built on{" "}
          <a
            href="https://github.com/ibremseth/durable-wallets"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary/70 hover:text-primary transition-colors underline underline-offset-2"
          >
            Durable Wallets
          </a>
        </p>
      </header>

      <GlobalStats
        totalSupply={totalSupply}
        contractAddress={contractAddress}
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
