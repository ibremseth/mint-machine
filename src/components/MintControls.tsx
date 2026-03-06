"use client";

import { useState } from "react";

interface MintControlsProps {
  onMint: (address: string, count: number) => void;
  isMinting: boolean;
}

const BURST_PRESETS = [10, 20, 50];

export function MintControls({ onMint, isMinting }: MintControlsProps) {
  const [address, setAddress] = useState("");

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address);

  return (
    <div className="bg-surface border border-border rounded p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="0x... recipient address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted/40 focus:outline-none focus:border-primary/50"
        />
        <button
          onClick={() => onMint(address, 1)}
          disabled={!isValidAddress || isMinting}
          className="px-6 py-2 bg-accent/15 border border-accent/40 rounded text-accent text-sm font-bold uppercase tracking-wider hover:bg-accent/25 hover:border-accent/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {isMinting ? "Minting..." : "Mint 1"}
        </button>
        <div className="flex items-center gap-1.5">
          {BURST_PRESETS.map((count) => (
            <button
              key={count}
              onClick={() => onMint(address, count)}
              disabled={!isValidAddress || isMinting}
              className="px-4 py-2 bg-primary/10 border border-primary/30 rounded text-primary text-sm font-bold tracking-wider hover:bg-primary/20 hover:border-primary/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              x{count}
            </button>
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
