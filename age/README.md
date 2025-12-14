# Age Guessing Game - Privacy-Preserving Age Verification

A decentralized application that demonstrates privacy-preserving age verification using COTI's Multi-Party Computation (MPC) technology. The game allows an admin to store their birth date (converted to age) encrypted on-chain, while players try to guess the age through encrypted comparisons without ever seeing the actual value.

## 🚀 Live Deployment

- **Contract Address**: `0x831b9d372bB5e740c688112433609754F7e1E06c`
- **Network**: COTI Testnet
- **Chain ID**: 7082400
- **Architecture**: Standalone React app with client-side MPC encryption

## 🛠 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/cotitech-io/demos.git
   cd age
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
   VITE_APP_NODE_HTTPS_ADDRESS=https://testnet.coti.io/rpc

   # Deployed DateGame Contract Address
   VITE_CONTRACT_ADDRESS=0x831b9d372bB5e740c688112433609754F7e1E06c

   # Admin Account (Player 1 - stores the age)
   VITE_ADMIN_PK=your_admin_private_key_here
   VITE_ADMIN_AES_KEY=your_admin_aes_key_here

   # Player Account (Player 2 - guesses the age)
   VITE_PLAYER_PK=your_player_private_key_here
   VITE_PLAYER_AES_KEY=your_player_aes_key_here

   # Deployer Account (for hardhat deployment)
   DEPLOYER_PRIVATE_KEY=your_deployer_private_key_here
   ```

## 🚀 Quick Start

### Option 1: Use Existing Deployment

1. **Start the React application**

   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:3000`

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Play the game**
   - Choose "Start as Admin" to store a birth date
   - Choose "Start as Player" to guess the age
   - The app connects to the deployed contract at `0x831b9d372bB5e740c688112433609754F7e1E06c`

### Option 2: Deploy Your Own Contract

1. **Compile the contract**

   ```bash
   npm run compile
   ```

2. **Deploy to COTI Testnet**

   ```bash
   npm run deploy:coti
   ```

3. **Update contract address**
   Copy the deployed contract address and update it in your `.env` file:

   ```bash
   VITE_CONTRACT_ADDRESS=your_new_contract_address
   ```

4. **Start the application**

   ```bash
   npm run dev
   ```

## 📱 How to Use

### Admin Role (Store Birth Date)

1. Navigate to the **Admin Page** (`/admin`)
2. **Select Birth Date**
   - Choose your birth date using the date picker
   - The app calculates your current age in years client-side
3. **Store Encrypted Age**
   - Click "Store Birth Date" to encrypt and store the calculated age on-chain
   - The birth date is converted to age in the browser before encryption
   - Wait for transaction confirmation
   - View the encrypted ciphertext and transaction hash

### Player Role (Guess the Age)

1. Navigate to the **Player Page** (`/player`)
2. **Enter Age Guess**
   - Input a number representing your age guess
3. **Ask Questions**
   - Click "Are you OLDER than [age]?" to check if stored age > your guess
   - Click "Are you YOUNGER than [age]?" to check if stored age < your guess
4. **Receive Encrypted Answer**
   - The comparison happens on encrypted data using MPC
   - View the result (YES/NO) without revealing the actual age
5. **Keep Guessing**
   - Use the feedback to narrow down your guesses
   - Try to find the exact age!

## 🏗 Project Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React SPA)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  HomePage    │  │  Admin Page  │  │  Player Page │       │
│  │     (/)      │  │   (/admin)   │  │  (/player)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                         │                                   │
│  ┌──────────────────────▼────────────────────────────────┐  │
│  │  useAgeContract Hook (Custom React Hook)              │  │
│  │  • Manages COTI wallets (Admin & Player)              │  │
│  │  • Handles MPC encryption/decryption client-side      │  │
│  │  • Birth date → Age conversion                        │  │
│  │  • Direct smart contract interactions                 │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ COTI-Ethers SDK
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              COTI Testnet (Chain ID: 7082400)               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   DateGame Smart Contract (Solidity)                 │   │
│  │   Address: 0x831b9d372bB5e740c688112433609754F7e1E06c│   │
│  │                                                      │   │
│  │   • setAge(itUint64)       - Store encrypted age     │   │
│  │   • greaterThan(itUint64)  - Compare (stored > input)│   │
│  │   • lessThan(itUint64)     - Compare (stored < input)│   │
│  │   • comparisonResult()     - Get encrypted result    │   │
│  │   • isAgeSet()             - Check if age stored     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
age/
├── contracts/
│   └── DateGame.sol              # Smart contract with MPC operations
├── scripts/
│   └── deploy-DateGame.js        # Hardhat deployment script
├── src/
│   ├── App.jsx                   # React Router setup
│   ├── index.css                 # Global styles
│   ├── main.jsx                  # React entry point
│   ├── hooks/
│   │   └── useAgeContract.js     # Custom hook for contract interactions
│   └── pages/
│       ├── HomePage.jsx          # Landing page with game rules
│       ├── Player1Page.jsx       # Admin page (store birth date)
│       └── Player2Page.jsx       # Player page (guess age)
├── artifacts/                    # Compiled contracts (Hardhat output)
├── cache/                        # Hardhat cache
├── .env.example                  # Environment variables template
├── hardhat.config.js             # Hardhat configuration
├── vite.config.js                # Vite bundler configuration
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

### Key Components

#### Smart Contract (`DateGame.sol`)

- **Language**: Solidity ^0.8.19
- **MPC Operations**: Uses `@coti-io/coti-contracts` MPC library
- **Storage**: Encrypted age stored as `utUint64` (user + network ciphertext)
- **Privacy**: All comparisons happen on encrypted data using `gtUint64` (garbled type)

#### Custom Hook (`useAgeContract.js`)

- **Framework**: React Hooks
- **SDK**: `@coti-io/coti-ethers` for MPC encryption/decryption
- **Key Management**: Client-side wallets with AES keys for encryption
- **Date Processing**: Converts birth dates to age in years before encryption
- **Retry Logic**: Handles transient RPC errors with exponential backoff

#### Frontend (`src/`)

- **Framework**: React 18 with React Router DOM
- **Build Tool**: Vite
- **Hook**: Custom `useAgeContract` hook for all contract interactions
- **Pages**: Home, Admin (store), Player (guess)

## 🔧 Available Scripts

### Smart Contract

- `npm run compile` - Compile smart contracts with Hardhat
- `npm run deploy:coti` - Deploy DateGame contract to COTI Testnet
- `npm run test` - Run Hardhat tests

### Frontend

- `npm run dev` - Start Vite dev server (default: http://localhost:3000)
- `npm run build` - Build React app for production
- `npm run preview` - Preview production build

## 🔐 Smart Contract Features

The DateGame contract provides:

- **Encrypted Age Storage**: Store ages as encrypted `utUint64` values using COTI's MPC
- **Secure Comparisons**: Compare ages without revealing actual values
- **Privacy Preservation**: Admin's age is never exposed to players
- **MPC Operations**: Uses garbled types (`gtUint64`, `gtBool`) for encrypted computation
- **Owner-based Encryption**: Age encrypted with owner's address for decryption consistency

### Contract Functions

```solidity
// Store encrypted age (calculated from birth date on backend)
function setAge(itUint64 calldata age) external

// Compare stored age with guess (returns encrypted result)
function greaterThan(itUint64 calldata value) external  // stored > value
function lessThan(itUint64 calldata value) external     // stored < value

// Read encrypted comparison result (ctUint8: 0=false, 1=true)
function comparisonResult() public view returns (ctUint8)

// Check if age has been stored
function isAgeSet() external view returns (bool)
```

### MPC Flow

1. **Encryption** (Backend): Birth date → Age calculation → Encrypt with COTI wallet
2. **Storage** (Contract): `itUint64` (input type) → `gtUint64` (garbled type) → `utUint64` (user+network ciphertext)
3. **Comparison** (Contract): Load `utUint64` → `gtUint64` → Compare → `gtBool` → `gtUint8` → `utUint8`
4. **Decryption** (Backend): Read `ctUint8` → Decrypt → Boolean result (YES/NO)

## 🎨 UI Features

- **Three-Page Architecture**:
  - **Home**: Game rules and role selection
  - **Admin**: Store birth date (server-side encryption)
  - **Player**: Guess age with encrypted comparisons
- **Modern Design**: Clean, card-based interface with responsive layout
- **Real-time Feedback**: Loading states, transaction hashes, and encrypted ciphertext display
- **API-based Architecture**: Frontend communicates with Express.js backend for all MPC operations
- **Transaction Tracking**: Links to COTI Explorer for transaction verification

## 🔍 Troubleshooting

### Common Issues

1. **Contract not configured error**
   - Ensure you've copied `.env.example` to `.env`
   - Verify `VITE_CONTRACT_ADDRESS` is set in `.env`
   - Check that the contract address is valid

2. **Wallet not configured error**
   - Verify `VITE_ADMIN_PK` and `VITE_ADMIN_AES_KEY` are set for admin page
   - Verify `VITE_PLAYER_PK` and `VITE_PLAYER_AES_KEY` are set for player page
   - Ensure private keys don't include the `0x` prefix

3. **Transaction failures**
   - Ensure the wallets have sufficient ETH for gas fees
   - Check that the contract address is correct
   - Verify network configuration (Chain ID: 7082400)

4. **Build errors**
   - Delete `node_modules` and run `npm install` again
   - Ensure Node.js version is 16 or higher
   - Check that all dependencies are installed

5. **RPC connection errors**
   - Verify `VITE_APP_NODE_HTTPS_ADDRESS` is set correctly
   - Check network connectivity
   - Try using a different RPC endpoint if available

### Getting Test ETH

To get test ETH for COTI Testnet:

1. Visit the [COTI Discord](https://discord.com/invite/Z4r8D6ez49)
2. Navigate to the testnet faucet channel
3. Request test tokens for your wallet address

## 🔐 Privacy & Security

### How MPC Ensures Privacy

The Age Guessing Game uses COTI's Multi-Party Computation (MPC) to ensure complete privacy:

1. **Client-Side Encryption**
   - All MPC operations happen in the browser using COTI wallets
   - Private keys and AES keys stored in environment variables
   - No server-side storage of sensitive data

2. **Birth Date → Age Conversion**
   - Birth date converted to age in the browser
   - Only the age is encrypted and stored on-chain
   - Original birth date never leaves the client

3. **Encrypted Storage**
   - Age encrypted as `utUint64` (user + network ciphertext)
   - Stored on public blockchain, but value is encrypted
   - Only users with proper AES keys can decrypt

4. **Encrypted Comparisons**
   - Player's guess is encrypted before sending to contract
   - Comparison happens on `gtUint64` garbled types
   - Result is `gtBool` → `gtUint8` → `utUint8` (encrypted 0 or 1)
   - Player wallet decrypts the result to YES/NO

5. **Zero Knowledge to Player**
   - Player only receives YES/NO answers
   - Actual age value never exposed
   - Even blockchain explorers only see encrypted ciphertexts

### Security Best Practices

⚠️ **Important**: This is a demo application. For production use:

- Store private keys in secure key management systems (e.g., AWS KMS, HashiCorp Vault)
- Use environment variables for all sensitive data
- Never commit `.env` files to version control
- Implement proper authentication and authorization
- Add rate limiting and input validation
- Use HTTPS for all communications
- Implement proper error handling without exposing sensitive information
- Consider using hardware wallets or secure enclaves for key management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## � Technology Stack

### Smart Contract Layer

- **Solidity**: ^0.8.19
- **COTI MPC Library**: `@coti-io/coti-contracts` ^1.0.0
- **Hardhat**: ^2.19.0 (development framework)
- **Hardhat-Ethers**: ^3.0.0 (Ethers.js integration)

### Backend Layer

- **Node.js**: v16+
- **Express.js**: ^4.21.2 (API server)
- **COTI-Ethers SDK**: `@coti-io/coti-ethers` ^1.0.5 (MPC encryption/decryption)
- **Ethers.js**: ^6.0.0 (blockchain interactions)
- **CORS**: ^2.8.5 (cross-origin support)

### Frontend Layer

- **React**: ^18.2.0 (UI framework)
- **React Router DOM**: ^7.9.5 (routing)
- **Vite**: ^4.4.0 (build tool)
- **@vitejs/plugin-react**: ^4.0.0
- **COTI-Ethers SDK**: `@coti-io/coti-ethers` ^1.0.5 (MPC encryption/decryption)
- **Ethers.js**: ^6.0.0 (blockchain interactions)

### Key Dependencies

- **@coti-io/coti-contracts**: MPC operations (MpcCore, ExtendedOperations)
- **@coti-io/coti-ethers**: Wallet encryption/decryption utilities

## 🔄 Migration from Server-Side to Client-Side

This app was refactored from a server-side architecture (Express.js backend) to a standalone React app with client-side MPC operations:

### What Changed

- **Removed**: Express.js backend server, API endpoints, `apiService.js`, `cotiUtils.js`
- **Added**: `useAgeContract` custom React hook for direct contract interactions
- **Updated**: All MPC operations now happen in the browser
- **Improved**: Better separation of concerns, reduced latency, no backend dependency

### Benefits

- **Simpler deployment**: Single static site hosting (Vercel, Netlify, etc.)
- **Lower latency**: Direct blockchain communication without API middleware
- **Better scalability**: No backend server to maintain
- **Clearer architecture**: Similar to the example voting app structure

## 🀽� Links

- [COTI Documentation](https://docs.coti.io/)
- [COTI MPC Documentation](https://docs.coti.io/coti-v2-documentation/build-on-coti/mpc)
- [COTI Testnet Explorer](https://testnet.cotiscan.io/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Vite Documentation](https://vitejs.dev/guide/)

## 📞 Support

For support and questions:

- Open an issue on GitHub
- Check the COTI Discord community
- Review the documentation links above

---

Built with ❤️ using COTI's MPC technology for secure, private computations on blockchain.
