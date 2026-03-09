import { getWallets, getWalletStatus } from "@/lib/durable-wallets";
import { NextResponse } from "next/server";

const DEFAULT_STATUS = {
  pendingNonce: 0,
  submittedNonce: 0,
  confirmedNonce: 0,
  queueDepth: 0,
  inFlight: 0,
};

export async function GET() {
  const addresses = await getWallets();

  const wallets = await Promise.all(
    addresses.map(async (address: string) => {
      try {
        const status = await getWalletStatus(address);
        return { address, ...status };
      } catch {
        return { address, ...DEFAULT_STATUS };
      }
    }),
  );

  return NextResponse.json({ wallets });
}
