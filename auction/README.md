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

## Contract Redeployment (In-App)

The application includes an in-browser contract redeployment feature that uses localStorage to manage custom contract addresses.

### How It Works

1. **Default Contracts**: On first load, the app uses contract addresses from `.env` file
2. **Redeploy Button**: Click "Redeploy Contracts" on the home page to deploy new instances
3. **localStorage Storage**: New contract addresses are automatically saved to browser localStorage
4. **Auto-Reload**: Page reloads to use the newly deployed contracts
5. **Reset Option**: Click "Reset to Default Contracts" to clear localStorage and return to `.env` addresses

### Requirements for Redeployment

Configure these environment variables in your `.env` file:

```env
VITE_BIDDER_PK=your_private_key_here
VITE_BIDDER_AES_KEY=your_aes_key_here
VITE_APP_NODE_HTTPS_ADDRESS=https://testnet.coti.io/rpc
```

### Redeployment Process

When you click "Redeploy Contracts", the app:

1. Deploys a new `MyToken` contract
2. Deploys a new `PrivateAuction` contract with the token address
3. Stores both addresses in browser localStorage:
   - `AUCTION_ADDRESS`
   - `TOKEN_ADDRESS`
4. Displays transaction links on CotiScan
5. Automatically reloads the page after 3 seconds

### Contract Address Priority

The application loads contract addresses in this order:

1. **localStorage** (custom deployed contracts)
2. **Environment variables** (`.env` file)
3. **Hardcoded defaults** (fallback)

This pattern allows easy testing with custom deployments while maintaining the ability to reset to production contracts.

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
✅ In-app contract redeployment with localStorage
✅ Contract integration complete (bid placement, checking, claiming, withdrawal)
✅ MPC encryption for bids and token balances
✅ Real-time auction status updates
✅ Auction timer display
✅ Token minting for testing

## License

MIT
