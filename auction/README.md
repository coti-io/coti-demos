[![COTI Website](https://img.shields.io/badge/COTI%20WEBSITE-4CAF50?style=for-the-badge)](https://coti.io)
[![image](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://telegram.coti.io)
[![image](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.coti.io)
[![image](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://twitter.coti.io)
[![image](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtube.coti.io)


# Private Auction - Privacy-Preserving Sealed Bid Auctions

A decentralized application that demonstrates privacy-preserving sealed bid auctions using COTI's Multi-Party Computation (MPC) technology. The auction allows bidders to place encrypted bids on-chain that remain completely confidential until the auction ends, ensuring fair price discovery without revealing sensitive bidding information to competitors.

## Live Demo
- **Demo URL**: https://auction.demo.coti.io
- **PrivateAuction Contract**: `0x2B1F89FF304279BB008802E4f2Ef1416e09d3743`
- **MyToken Contract**: `0xa3b32cB50a69C312932f0a7D1d4cb01a35DC0945`
- **Network**: COTI Testnet
- **Chain ID**: 7082400
- **Architecture**: React SPA with client-side MPC encryption and Private ERC20 token integration

## Features

- **Private Bidding**: Bids are encrypted using MPC and remain confidential on-chain
- **Sealed Bid Auction**: No bidder can see others' bids during the auction period
- **Secure Comparisons**: Uses COTI's MPC for privacy-preserving bid comparisons
- **Token-Based**: Bids are placed using Private ERC20 tokens. 
- **Automatic Winner Tracking**: Highest bid is determined through encrypted comparisons
- **Fair Settlement**: Winners can claim the item, losers can withdraw their tokens
- **In-App Redeployment**: Deploy new contract instances directly from the UI

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/cotitech-io/demos.git
   cd auction
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your wallet credentials:

   ```bash
   # COTI Testnet RPC URL
   RPC_URL=https://testnet.coti.io/rpc
   PRIVATE_KEY=your_private_key_here

   # Frontend environment variables
   VITE_AUCTION_ADDRESS=0x2B1F89FF304279BB008802E4f2Ef1416e09d3743
   VITE_TOKEN_ADDRESS=0xa3b32cB50a69C312932f0a7D1d4cb01a35DC0945
   VITE_APP_NODE_HTTPS_ADDRESS=https://testnet.coti.io/rpc

   # Alice credentials
   VITE_ALICE_PK=your_alice_private_key_here
   VITE_ALICE_AES_KEY=your_alice_aes_key_here
   VITE_ALICE_ADDRESS=your_alice_address_here

   # Bob credentials
   VITE_BOB_PK=your_bob_private_key_here
   VITE_BOB_AES_KEY=your_bob_aes_key_here
   VITE_BOB_ADDRESS=your_bob_address_here

   # Bea credentials
   VITE_BEA_PK=your_bea_private_key_here
   VITE_BEA_AES_KEY=your_bea_aes_key_here
   VITE_BEA_ADDRESS=your_bea_address_here

   # Charlie credentials
   VITE_CHARLIE_PK=your_charlie_private_key_here
   VITE_CHARLIE_AES_KEY=your_charlie_aes_key_here
   VITE_CHARLIE_ADDRESS=your_charlie_address_here

   # David credentials
   VITE_DAVID_PK=your_david_private_key_here
   VITE_DAVID_AES_KEY=your_david_aes_key_here
   VITE_DAVID_ADDRESS=your_david_address_here

   # Ethan credentials
   VITE_ETHAN_PK=your_ethan_private_key_here
   VITE_ETHAN_AES_KEY=your_ethan_aes_key_here
   VITE_ETHAN_ADDRESS=your_ethan_address_here
   ```

## Quick Start

### Option 1: Use Existing Deployment

1. **Start the React application**

   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:3003`

2. **Open your browser**
   Navigate to `http://localhost:3003`

3. **Participate in the auction**
   - The Home Page is the main interface for bidding
   - Check your token balance (tokens are granted at deployment)
   - Place encrypted bids during the auction
   - The app connects to the deployed contracts on COTI Testnet

### Option 2: Deploy Via Web App

The application comes with pre-compiled artifacts, so you can deploy new contracts directly from the UI without needing to compile code.

1. **Start the application**

   ```bash
   npm run dev
   ```

2. **Deploy Contracts**
   - Click the "Redeploy Contracts" button in the "Auction Actions" card
   - Confirm the deployment
   - The app will deploy new `MyToken` and `PrivateAuction` contracts
   - The page will reload and use your new custom contracts (saved in localStorage)

## How to Use

### Token Balance

1. Navigate to the **Home Page** (`/`)
2. **Check Balance**
   - Your token balance is automatically updated
   - Tokens are granted during deployment or pre-funded
   
### Placing a Bid

1. **Check Auction Status**
   - View the auction timer to ensure it's still active
   - Check your encrypted token balance
2. **Enter Bid Amount**
   - Input the number of tokens you want to bid
   - Ensure you have sufficient token balance
3. **Submit Encrypted Bid**
   - Click "Place Bid"
   - Your bid is encrypted before being sent to the blockchain
   - Wait for transaction confirmation


### After Auction Ends

1. **Winners**
   - Click "Claim Item" to claim your winnings
   - Your tokens will be locked with the contract
2. **Non-Winners**
   - **Automatic Withdrawal**: Tokens are automatically returned to your wallet
   - No manual action is required


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

## Project Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React SPA)                       │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  HomePage    │  │ MultiBidder  │                         │
│  │     (/)      │  │  (/multi)    │                         │
│  └──────────────┘  └──────────────┘                         │
│                         │                                   │
│  ┌──────────────────────▼────────────────────────────────┐  │
│  │  useAuction Hook (Custom React Hook)                  │  │
│  │  • Manages COTI wallets (Bidders)                     │  │
│  │  • Handles MPC encryption/decryption client-side      │  │
│  │  • Direct smart contract interactions                 │  │
│  │  • Token minting, bidding, claiming, withdrawing      │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ COTI-Ethers SDK
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              COTI Testnet (Chain ID: 7082400)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   MyToken (ERC20) Smart Contract                     │   │
│  │   Address: 0xa3b32cB50a69C312932f0a7D1d4cb01a35DC09. │   │
│  │                                                      │   │
│  │   • mint(address, itUint64)  - Mint encrypted tokens │   │
│  │   • balanceOf(address)       - Get encrypted balance │   │
│  │   • transfer(address, ctUint64) - Transfer tokens    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   PrivateAuction Smart Contract                      │   │
│  │   Address: 0x2B1F89FF304279BB008802E4f2Ef1416e09d37..│   │
│  │                                                      │   │
│  │   • placeBid(itUint64)       - Place encrypted bid   │   │
│  │   • getBid(address)          - Get encrypted bid     │   │
│  │   • endAuction()             - End auction period    │   │
│  │   • claimItem()              - Winner claims item    │   │
│  │   • withdraw()               - Losers withdraw bids  │   │
│  │   • getHighestBid()          - Get encrypted max bid │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
auction/
├── contracts/
│   ├── PrivateAuction.sol      # Main auction contract with MPC operations
│   └── MyToken.sol             # ERC20 token with MPC encryption
├── scripts/
│   └── deploy.js               # Hardhat deployment script
├── test/
│   └── PrivateAuction.test.js  # Contract tests
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── AuctionInfo.jsx     # Auction status display
│   │   ├── BidForm.jsx         # Bid submission form
│   │   ├── TokenBalance.jsx    # Token balance display
│   │   └── TransactionList.jsx # Transaction history
│   ├── config/
│   │   └── theme.js            # Styled components theme
│   ├── hooks/
│   │   └── useAuction.js       # Custom hook for auction interactions
│   ├── pages/
│   │   ├── HomePage.jsx        # Landing page with auction info
│   │   └── MultiBidderPage.jsx # Multi-bidder testing interface
│   ├── assets/                 # Static assets
│   ├── App.jsx                 # Main app component with routing
│   └── main.jsx                # React entry point
├── artifacts/                  # Compiled contracts (Hardhat output)
├── cache/                      # Hardhat cache
├── .env.example                # Environment variables template
├── hardhat.config.cjs          # Hardhat configuration
├── vite.config.js              # Vite bundler configuration
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

### Key Components

#### Smart Contract (`PrivateAuction.sol`)

- **Language**: Solidity ^0.8.19
- **MPC Operations**: Uses `@coti-io/coti-contracts` MPC library
- **Token Integration**: Requires ERC20 token with MPC support (MyToken)
- **Storage**: Encrypted bids stored as `utUint64` (user + network ciphertext)
- **Privacy**: All bid comparisons happen on encrypted data using `gtUint64`
- **Time-Based**: Auction duration enforced on-chain

#### Token Contract (`MyToken.sol`)

- **Standard**: Private ERC20 token
- **Minting**: Supports encrypted token minting via `itUint64` input types
- **Balance Privacy**: Token balances stored as encrypted `utUint64` values
- **Transfer**: Encrypted token transfers using `ctUint64` ciphertexts

#### Custom Hook (`useAuction.js`)

- **Framework**: React Hooks
- **SDK**: `@coti-io/coti-ethers` for MPC encryption/decryption
- **Key Management**: App pre-loaded wallets with AES keys for encryption
- **Contract Interactions**: Direct calls to PrivateAuction and MyToken contracts
- **State Management**: Manages auction status, bids, balances, and transactions

#### Frontend (`src/`)

- **Framework**: React 18 with React Router DOM
- **Styling**: Styled Components with custom theme
- **Build Tool**: Vite
- **Hook**: Custom `useAuction` hook for all contract interactions
- **Pages**: Home,  Multi-Bidder

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

## Available Scripts

### Smart Contract

- `npm run compile` - Compile smart contracts with Hardhat
- `npm run deploy:coti` - Deploy PrivateAuction and MyToken contracts to COTI Testnet
- `npm run test` - Run Hardhat tests (requires COTI network)

### Frontend

- `npm run dev` - Start Vite dev server (default: http://localhost:3003)
- `npm run build` - Build React app for production
- `npm run preview` - Preview production build

## Smart Contract Features

The PrivateAuction contract provides:

- **Encrypted Bid Storage**: Store bids as encrypted `utUint64` values using COTI's MPC
- **Secure Bid Comparisons**: Compare bids without revealing actual values to other participants
- **Privacy Preservation**: No bidder can see other bids during the auction
- **MPC Operations**: Uses garbled types (`gtUint64`, `gtBool`) for encrypted computation
- **Time-Based Auction**: Enforces auction start and end times on-chain
- **Winner Determination**: Automatically tracks highest bidder through encrypted comparisons
- **Fair Settlement**: Winners claim items, losers withdraw bids after auction ends
- **Token Integration**: Seamless integration with encrypted ERC20 tokens

### PrivateAuction Contract Functions

```solidity
// Place an encrypted bid (requires token approval)
function placeBid(itUint64 calldata bidAmount) external

// Get your own encrypted bid
function getBid(address bidder) public view returns (ctUint64)

// Get the current highest encrypted bid
function getHighestBid() external view returns (ctUint64)

// End the auction (only owner)
function endAuction() external onlyOwner

// Winner claims the item
function claimItem() external

// Non-winners withdraw their bids
function withdraw() external

// Check if auction has ended
function auctionEnded() public view returns (bool)
```

### MyToken Contract Functions

```solidity
// Mint encrypted tokens to an address
function mint(address to, itUint64 calldata amount) external

// Get encrypted balance of an address
function balanceOf(address account) public view returns (ctUint64)

// Transfer encrypted tokens
function transfer(address to, ctUint64 calldata amount) external

// Approve spender for encrypted amount
function approve(address spender, itUint64 calldata amount) external
```

### MPC Flow

1. **Token Minting** (Frontend): Amount → Encrypt with COTI wallet → `itUint64` → Contract stores as `utUint64`
2. **Bid Placement** (Frontend): Bid amount → Encrypt → `itUint64` → Contract converts to `gtUint64` for comparison
3. **Bid Comparison** (Contract): Load bids as `gtUint64` → Compare using MPC → Update highest bid → Store as `utUint64`
4. **Bid Retrieval** (Frontend): Read `ctUint64` from contract → Decrypt with user's AES key → Display plaintext amount
5. **Winner Check** (Contract): Compare user's bid with highest bid using encrypted comparison → Return boolean result

## How It Works

1. **Bidders receive tokens** automatically or via faucet (encrypted balance)
2. **Bidders submit encrypted bids** using the PrivateAuction contract
3. **Bids are stored on-chain** in encrypted form (`utUint64`)
4. **Highest bid is tracked automatically** using MPC operations without revealing values
5. **Auction ends** after the specified duration
6. **Winner claims the item**, their tokens are transferred to the auction owner
7. **Losing bidders' tokens** are automatically returned to them

## UI Pages

- **Home Page** (`/`): Main interface for minting tokens, placing bids, managing participation, and contract redeployment
- **Bidder Page** (`/bidder`): Legacy bidding interface (integrated into Home Page)
- **Multi-Bidder Page** (`/multi`): Testing interface for simulating multiple bidders

## Technology Stack

### Smart Contract Layer

- **Solidity**: ^0.8.19
- **COTI MPC Library**: `@coti-io/coti-contracts` ^1.0.0
- **Hardhat**: ^2.19.0 (development framework)
- **Hardhat-Ethers**: ^3.0.0 (Ethers.js integration)

### Frontend Layer

- **React**: ^18.2.0 (UI framework)
- **React Router DOM**: ^6.22.0 (routing)
- **Styled Components**: ^6.1.8 (CSS-in-JS styling)
- **Vite**: ^5.0.0 (build tool)
- **@vitejs/plugin-react**: ^4.2.0
- **COTI-Ethers SDK**: `@coti-io/coti-ethers` ^1.0.5 (MPC encryption/decryption)
- **Ethers.js**: ^6.0.0 (blockchain interactions)

### Key Dependencies

- **@coti-io/coti-contracts**: MPC operations (MpcCore, ExtendedOperations)
- **@coti-io/coti-ethers**: Wallet encryption/decryption utilities

## Troubleshooting

### Common Issues

1. **Contract not configured error**
   - Ensure you've copied `.env.example` to `.env`
   - Verify `VITE_AUCTION_ADDRESS` and `VITE_TOKEN_ADDRESS` are set in `.env`
   - Check that the contract addresses are valid

2. **Wallet not configured error**
   - Verify `VITE_BIDDER_PK` and `VITE_BIDDER_AES_KEY` are set
   - Ensure private keys don't include the `0x` prefix

3. **Transaction failures**
   - Ensure the wallet has sufficient ETH for gas fees
   - Check that you have sufficient token balance before placing bids
   - Verify you've approved the auction contract to spend your tokens
   - Check that the contract addresses are correct
   - Verify network configuration (Chain ID: 7082400)

4. **Bid placement fails**
   - Ensure you have enough token balance
   - Check that you've approved the auction contract
   - Verify the auction hasn't ended yet
   - Make sure your bid is greater than zero

5. **Build errors**
   - Delete `node_modules` and run `npm install` again
   - Ensure Node.js version is 16 or higher
   - Check that all dependencies are installed

6. **RPC connection errors**
   - Verify `VITE_APP_NODE_HTTPS_ADDRESS` is set correctly
   - Check network connectivity
   - Try using a different RPC endpoint if available

### Getting Test COTI

To get test COTI for Testnet:

1. Visit the [COTI Discord](https://discord.com/invite/Z4r8D6ez49)
2. Navigate to the testnet faucet channel
3. Request test tokens for your wallet address

## Privacy & Security

### How MPC Ensures Privacy

The Private Auction uses COTI's Multi-Party Computation (MPC) to ensure complete privacy:

1. **Client-Side Encryption**
   - All MPC operations happen in the browser using COTI wallets
   - Private keys and AES keys stored in environment variables
   - No server-side storage of sensitive data

2. **Encrypted Bid Storage**
   - Bids encrypted as `utUint64` (user + network ciphertext)
   - Stored on public blockchain, but values are encrypted
   - Only users with proper AES keys can decrypt their own bids

3. **Encrypted Token Balances**
   - Token balances stored as `utUint64` encrypted values
   - Transfers use encrypted amounts
   - Balance privacy preserved across all operations

4. **Encrypted Bid Comparisons**
   - Bidder's bid is encrypted before sending to contract
   - Comparison happens on `gtUint64` garbled types
   - Contract determines winner without decrypting individual bids
   - No bidder can see other participants' bids

5. **Zero Knowledge to Competitors**
   - Bidders only see their own bid values after decryption
   - Highest bid tracked in encrypted form
   - Even blockchain explorers only see encrypted ciphertexts
   - Fair auction without information leakage

### Security Best Practices

⚠️ **Important**: This is a demo application. For production use:

- Store private keys in secure key management systems 
- Use environment variables for all sensitive data
- Never commit `.env` files to version control
- Implement proper authentication and authorization
- Add rate limiting and input validation
- Use HTTPS for all communications
- Implement proper error handling without exposing sensitive information
- Consider using hardware wallets or secure enclaves for key management
- Audit smart contracts before production deployment
- Implement emergency pause mechanisms
- Add comprehensive event logging for monitoring

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Links

- [COTI Documentation](https://docs.coti.io/)
- [COTI MPC Documentation](https://docs.coti.io/coti-v2-documentation/build-on-coti/mpc)
- [COTI Testnet Explorer](https://testnet.cotiscan.io/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Styled Components Documentation](https://styled-components.com/docs)

- Review the documentation links above

## License

MIT

