import { getTransaction } from "@/lib/durable-wallets";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ wallet: string; nonce: string }> },
) {
  const { wallet, nonce } = await params;

  try {
    const result = await getTransaction(wallet, parseInt(nonce, 10));
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
