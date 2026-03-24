# Mint Machine

Demo app for minting ERC-20 tokens on Base Sepolia, built on [Durable Wallets](https://github.com/ibremseth/durable-wallets).

Enter a recipient address, pick a batch size, and watch transactions flow through a pool of managed wallets in real time.

## Setup

```bash
bun install
```

Create a `.env` file:

```
DURABLE_WALLETS_URL=<your durable wallets service url>
DURABLE_WALLETS_API_KEY=<your api key>
RPC_URL=<alchemy or other base sepolia rpc url>
MINT_CONTRACT_ADDRESS=<deployed erc20 contract address>
```

## Development

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).
