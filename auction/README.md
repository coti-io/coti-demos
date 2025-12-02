# Private Auction

This project implements a Private Auction using COTI's MPC (Multi-Party Computation) features.

## Prerequisites

- Node.js
- NPM

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your private key.
   ```bash
   cp .env.example .env
   ```

## Compilation

Compile the smart contracts:
```bash
npm run compile
```

## Testing

**Note:** The tests rely on COTI's `MpcCore` library, which calls precompiled contracts available only on the COTI network. Local testing with `hardhat test` will fail unless you are forking the COTI network or using a compatible simulator.

To run tests against the COTI Testnet (requires configured `.env` with funds):
```bash
npx hardhat test --network cotiTestnet
```

## Deployment

Deploy the contracts to the COTI Testnet:
```bash
npm run deploy:coti
```

This script will:
1. Deploy a mock `MyToken` contract.
2. Deploy the `PrivateAuction` contract with the token address.
