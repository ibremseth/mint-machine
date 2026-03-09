import { sendTransaction } from "@/lib/durable-wallets";
import { NextResponse } from "next/server";

const CONTRACT_ADDRESS = process.env.MINT_CONTRACT_ADDRESS!;

export async function POST(request: Request) {
  const { address } = await request.json();

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  try {
    const result = await sendTransaction(CONTRACT_ADDRESS, "mint(address)", [
      address,
    ]);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
