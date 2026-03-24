import { getTransactions } from "@/lib/durable-wallets";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> },
) {
  const { wallet } = await params;
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  try {
    const result = await getTransactions(
      wallet,
      from !== null ? parseInt(from, 10) : undefined,
      to !== null ? parseInt(to, 10) : undefined,
    );
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get transactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
