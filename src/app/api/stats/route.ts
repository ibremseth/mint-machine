import { createPublicClient, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";
import { NextResponse } from "next/server";

const CONTRACT_ADDRESS = process.env.MINT_CONTRACT_ADDRESS as `0x${string}`;
const RPC_URL = process.env.RPC_URL || "https://sepolia.base.org";

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL),
});

const erc20Abi = [
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

export async function GET() {
  try {
    const totalSupply = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: erc20Abi,
      functionName: "totalSupply",
    });

    return NextResponse.json({
      totalSupply: formatEther(totalSupply),
      contractAddress: CONTRACT_ADDRESS,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read contract";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
