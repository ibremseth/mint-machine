const BASE_URL = process.env.DURABLE_WALLETS_URL!;
const API_KEY = process.env.DURABLE_WALLETS_API_KEY!;

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`durable-wallets ${res.status}: ${text}`);
  }
  return res.json();
}

export async function sendTransaction(
  to: string,
  abi: string,
  args: unknown[],
) {
  return request("/pool/send", {
    method: "POST",
    body: JSON.stringify({ to, abi, args }),
  });
}

export async function getWallets(): Promise<string[]> {
  const data = await request("/pool/wallets");
  return data.wallets ?? data;
}

export async function getWalletStatus(address: string) {
  return request(`/wallets/${address}/status`);
}

export async function getTransaction(wallet: string, nonce: number) {
  return request(`/wallets/${wallet}/tx/${nonce}`);
}

export async function getTransactions(
  wallet: string,
  from?: number,
  to?: number,
) {
  const params = new URLSearchParams();
  if (from !== undefined) params.set("from", String(from));
  if (to !== undefined) params.set("to", String(to));
  const qs = params.toString();
  return request(`/wallets/${wallet}/txs${qs ? `?${qs}` : ""}`);
}
