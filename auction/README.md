# Private Auction

This project implements a Private Auction using COTI's MPC (Multi-Party Computation) features, with both smart contracts and a React-based user interface.

## Features

- **Private Bidding**: Bids are encrypted and remain confidential on-chain
- **Secure Auction**: Uses COTI's MPC for privacy-preserving comparisons
- **Token-Based**: Bids are placed using ERC20 tokens
- **Winner Selection**: Automatic tracking of highest bid
- **Claim & Withdraw**: Winners can claim, losers can withdraw

## Prerequisites

- Node.js
- NPM

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your private key and contract addresses.
   ```bash
   cp .env.example .env
   ```

## Smart Contract Development

### Compilation

Compile the smart contracts:
```bash
npm run compile
```

### Testing

**Note:** The tests rely on COTI's `MpcCore` library, which calls precompiled contracts available only on the COTI network. Local testing with `hardhat test` will fail unless you are forking the COTI network or using a compatible simulator.

To run tests against the COTI Testnet (requires configured `.env` with funds):
```bash
npx hardhat test --network cotiTestnet
```

### Deployment

Deploy the contracts to the COTI Testnet:
```bash
npm run deploy:coti
```

This script will:
1. Deploy a mock `MyToken` contract.
2. Deploy the `PrivateAuction` contract with the token address.

## Frontend Development

### Running the UI

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3003`

### Building for Production

Build the production bundle:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
auction/
├── contracts/           # Solidity smart contracts
│   ├── PrivateAuction.sol
│   └── MyToken.sol
├── scripts/            # Deployment scripts
│   └── deploy.js
├── test/              # Contract tests
│   └── PrivateAuction.test.js
├── src/               # React frontend
│   ├── components/    # Reusable UI components
│   ├── config/        # Theme configuration
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── assets/        # Static assets
│   └── App.jsx        # Main app component
├── hardhat.config.cjs # Hardhat configuration
├── vite.config.js     # Vite configuration
└── package.json       # Dependencies and scripts
```

## Deployed Contracts (COTI Testnet)

- **MyToken**: `0xe53e1e154c67653f3b16A0308B875ccfe8A1272e`
- **PrivateAuction**: `0x975A20aa4547e4120b07bA7ff0576A1cBC619d31`

## How It Works

1. **Bidders** submit encrypted bids using the private token
2. **Bids** are stored on-chain in encrypted form
3. **Highest bid** is tracked automatically using MPC operations
4. **After auction ends**, the winner can claim the item
5. **Losing bidders** can withdraw their bids

## UI Pages

- **Home Page** (`/`): Introduction and auction information
- **Bidder Page** (`/bidder`): Interface for placing bids and managing participation

## Technology Stack

- **Smart Contracts**: Solidity 0.8.19
- **MPC Library**: @coti-io/coti-contracts
- **Frontend**: React 18
- **Styling**: Styled Components
- **Build Tool**: Vite
- **Network**: COTI Testnet

## Development Status

✅ Smart contracts deployed and verified
✅ UI structure and styling complete
🚧 Contract integration in progress (bid placement, checking, claiming, withdrawal)

## Next Steps

- Complete integration of bid placement with encryption
- Implement bid checking functionality
- Add claim and withdrawal features
- Add real-time auction status updates
- Implement auction timer display

## License

MIT
