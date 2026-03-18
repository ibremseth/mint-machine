"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface MintControlsProps {
  onMint: (address: string, count: number) => void;
  isMinting: boolean;
}

const COOLDOWNS: Record<number, number> = { 1: 1000, 10: 5000, 20: 10000, 50: 20000 };
const BURST_PRESETS = [10, 20, 50];

interface CooldownInfo {
  startedAt: number;
  duration: number;
}

function CooldownButton({
  onClick,
  disabled,
  cooldown,
  className,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  cooldown: CooldownInfo | null;
  className: string;
  children: React.ReactNode;
}) {
  const onCooldown = cooldown !== null;
  const trueDisabled = disabled && !onCooldown;

  return (
    <button
      onClick={onCooldown ? undefined : onClick}
      disabled={trueDisabled}
      className={`relative overflow-hidden ${className} ${onCooldown ? "cursor-not-allowed opacity-60" : ""}`}
    >
      {onCooldown && (
        <span
          key={cooldown.startedAt}
          className="absolute inset-0 origin-left animate-cooldown-fill"
          style={{
            animationDuration: `${cooldown.duration}ms`,
          }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function MintControls({ onMint, isMinting }: MintControlsProps) {
  const [address, setAddress] = useState("");
  const [cooldowns, setCooldowns] = useState<Map<number, CooldownInfo>>(new Map());
  const [hasWallet, setHasWallet] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const pendingCooldown = useRef<number | null>(null);

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address);

  useEffect(() => {
    setHasWallet(typeof window !== "undefined" && !!window.ethereum);
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) return;
    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts?.[0]) setAddress(accounts[0]);
    } catch {
      // user rejected
    } finally {
      setConnecting(false);
    }
  }, []);

  // Start the cooldown animation once minting finishes
  useEffect(() => {
    if (isMinting || pendingCooldown.current === null) return;
    const count = pendingCooldown.current;
    pendingCooldown.current = null;
    const duration = COOLDOWNS[count];
    setCooldowns((prev) => {
      const next = new Map(prev);
      next.set(count, { startedAt: Date.now(), duration });
      return next;
    });
    setTimeout(() => {
      setCooldowns((prev) => {
        const next = new Map(prev);
        next.delete(count);
        return next;
      });
    }, duration);
  }, [isMinting]);

  const handleMint = useCallback(
    (count: number) => {
      pendingCooldown.current = count;
      onMint(address, count);
    },
    [address, onMint],
  );

  return (
    <div className="bg-surface border border-border rounded p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        {hasWallet && !isValidAddress && (
          <button
            onClick={connectWallet}
            disabled={connecting}
            className="px-3 py-2 bg-surface-alt border border-border rounded text-muted text-xs font-bold uppercase tracking-wider hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {connecting ? "..." : "My Wallet"}
          </button>
        )}
        <input
          type="text"
          placeholder="0x... recipient address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted/40 focus:outline-none focus:border-primary/50"
        />
        <CooldownButton
          onClick={() => handleMint(1)}
          disabled={!isValidAddress || isMinting || cooldowns.has(1)}
          cooldown={cooldowns.get(1) ?? null}
          className="px-6 py-2 bg-accent/15 border border-accent/40 rounded text-accent text-sm font-bold uppercase tracking-wider hover:bg-accent/25 hover:border-accent/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {isMinting ? "Minting..." : "Mint 1"}
        </CooldownButton>
        <div className="flex items-center gap-1.5">
          {BURST_PRESETS.map((count) => (
            <CooldownButton
              key={count}
              onClick={() => handleMint(count)}
              disabled={!isValidAddress || isMinting || cooldowns.has(count)}
              cooldown={cooldowns.get(count) ?? null}
              className="px-4 py-2 bg-primary/10 border border-primary/30 rounded text-primary text-sm font-bold tracking-wider hover:bg-primary/20 hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              x{count}
            </CooldownButton>
          ))}
        </div>
      </div>
      {address && !isValidAddress && (
        <p className="text-red-400/70 text-xs mt-2">
          Enter a valid Ethereum address
        </p>
      )}
    </div>
  );
}
