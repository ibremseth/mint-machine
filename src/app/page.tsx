"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GlobalStats } from "@/components/GlobalStats";
import { MintControls } from "@/components/MintControls";
import { PoolVisualizer } from "@/components/PoolVisualizer";

type TxStatus = "queued" | "submitted" | "confirmed" | "error";

interface TrackedTx {
  wallet: string;
  nonce: number;
  status: TxStatus;
  hash?: string;
  error?: string;
  createdAt: number;
}

// --- Mock data for UI development ---
const MOCK_WALLETS = [
  {
    address: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    currentNonce: 42,
    pendingNonce: 45,
    queueDepth: 2,
    inFlight: 1,
  },
  {
    address: "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
    currentNonce: 38,
    pendingNonce: 39,
    queueDepth: 0,
    inFlight: 1,
  },
  {
    address: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d",
    currentNonce: 51,
    pendingNonce: 54,
    queueDepth: 1,
    inFlight: 2,
  },
];

let mockNonceCounter = 100;

function simulateMockMint(
  address: string,
): Promise<{ wallet: string; nonce: number; status: TxStatus }> {
  return new Promise((resolve) => {
    const wallet =
      MOCK_WALLETS[Math.floor(Math.random() * MOCK_WALLETS.length)];
    const nonce = mockNonceCounter++;
    setTimeout(
      () =>
        resolve({
          wallet: wallet.address,
          nonce,
          status: "queued",
        }),
      100 + Math.random() * 200,
    );
  });
}

function simulateStatusProgression(
  tx: TrackedTx,
  updateTx: (key: string, updates: Partial<TrackedTx>) => void,
) {
  const key = `${tx.wallet}-${tx.nonce}`;
  const submitDelay = 500 + Math.random() * 1500;
  const confirmDelay = submitDelay + 1000 + Math.random() * 3000;
  const willError = Math.random() < 0.08;

  setTimeout(() => updateTx(key, { status: "submitted" }), submitDelay);
  setTimeout(
    () =>
      updateTx(key, {
        status: willError ? "error" : "confirmed",
        hash: willError
          ? undefined
          : `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        error: willError ? "execution reverted" : undefined,
      }),
    confirmDelay,
  );
}
// --- End mock data ---

export default function Home() {
  const [transactions, setTransactions] = useState<Map<string, TrackedTx>>(
    new Map(),
  );
  const [isMinting, setIsMinting] = useState(false);
  const [tps, setTps] = useState(0);
  const confirmedTimestamps = useRef<number[]>([]);

  const updateTx = useCallback(
    (key: string, updates: Partial<TrackedTx>) => {
      setTransactions((prev) => {
        const next = new Map(prev);
        const existing = next.get(key);
        if (existing) {
          if (
            updates.status === "confirmed" &&
            existing.status !== "confirmed"
          ) {
            confirmedTimestamps.current.push(Date.now());
          }
          next.set(key, { ...existing, ...updates });
        }
        return next;
      });
    },
    [],
  );

  const handleMint = useCallback(
    async (address: string, count: number) => {
      setIsMinting(true);
      try {
        const promises = Array.from({ length: count }, () =>
          simulateMockMint(address),
        );
        const results = await Promise.all(promises);

        setTransactions((prev) => {
          const next = new Map(prev);
          for (const result of results) {
            const key = `${result.wallet}-${result.nonce}`;
            const tx: TrackedTx = {
              wallet: result.wallet,
              nonce: result.nonce,
              status: result.status,
              createdAt: Date.now(),
            };
            next.set(key, tx);
            simulateStatusProgression(tx, updateTx);
          }
          return next;
        });
      } finally {
        setIsMinting(false);
      }
    },
    [updateTx],
  );

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

  const txList = [...transactions.values()];
  const totalConfirmed = txList.filter(
    (tx) => tx.status === "confirmed",
  ).length;

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
        totalMinted={totalConfirmed}
        tps={tps}
        walletCount={MOCK_WALLETS.length}
        totalInFlight={
          txList.filter(
            (tx) => tx.status === "submitted" || tx.status === "queued",
          ).length
        }
        totalQueued={txList.filter((tx) => tx.status === "queued").length}
      />

      <MintControls onMint={handleMint} isMinting={isMinting} />

      <PoolVisualizer wallets={MOCK_WALLETS} transactions={txList} onClear={clearSettled} />
    </div>
  );
}
