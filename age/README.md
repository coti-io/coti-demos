# Age Guessing Game - Privacy-Preserving Age Verification

A decentralized application that demonstrates privacy-preserving age verification using Coti's Multi-Party Computation (MPC) technology. The game allows an admin to store their birth date (converted to age) encrypted on-chain, while players try to guess the age through encrypted comparisons without ever seeing the actual value.

## 🚀 Live Deployment

- **Contract Address**: `0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729`
- **Network**: Coti Testnet
- **Chain ID**: 7082400
- **Backend Server**: Express.js server running on port 3002

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
3. **Set up environment variables** (optional for custom deployment)

   For deploying your own contract, create a `.env` file:

   ```bash
   DEPLOYER_PRIVATE_KEY=your_deployment_private_key_here
   VITE_APP_NODE_HTTPS_ADDRESS=https://testnet.coti.io/rpc
   AES_KEY=your_32_character_aes_key
   ```

   For the backend server, update `server/index.js` to use environment variables:

   ```javascript
   const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || 'your_wallet_private_key'
   const AES_KEY = process.env.AES_KEY || 'your_32_character_aes_key'
   ```

## 🚀 Quick Start

### Option 1: Use Existing Deployment

1. **Start the backend server**

   ```bash
   npm run server
   ```

   Server will run on `http://localhost:3002`
2. **Start the React application** (in a new terminal)

   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:5173`

   **Alternative**: Run both concurrently

   ```bash
   npm run dev:full
   ```
3. **Open your browser**
   Navigate to `http://localhost:5173`
4. **Play the game**

   - Choose "Start as Admin" to store a birth date
   - Choose "Start as Player" to guess the age
   - The app connects to the deployed contract at `0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729`

### Option 2: Deploy Your Own Contract

1. **Compile the contract**

   ```bash
   npm run compile
   ```
2. **Deploy to Coti Testnet**

   ```bash
   npm run deploy:coti
   ```
3. **Update contract address**
   Copy the deployed contract address and update it in multiple locations:

   - `server/index.js`:

     ```javascript
     const DATE_GAME_ADDRESS = 'your_new_contract_address'
     ```
   - `src/pages/HomePage.jsx` (in the contract display section):

     ```jsx
     <p>Contract: your_new_contract_address</p>
     ```
   - `src/pages/Player1Page.jsx` (in the explorer link):

     ```javascript
     const contractAddress = 'your_new_contract_address'
     ```
4. **Update your `.env` file** with your wallet configuration:

   ```bash
   DEPLOYER_PRIVATE_KEY=your_wallet_private_key
   AES_KEY=your_32_character_aes_key
   ```
5. **Start both backend and frontend**

   ```bash
   npm run dev:full
   ```

## 📱 How to Use

### Admin Role (Store Birth Date)

1. Navigate to the **Admin Page** (`/admin`)
2. **Select Birth Date**
   - Choose your birth date using the date picker
   - The server calculates your current age in years
3. **Store Encrypted Age**
   - Click "Store Birth Date" to encrypt and store the calculated age on-chain
   - The birth date is converted to age on the backend before encryption
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
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  HomePage    │  │  Admin Page  │  │  Player Page │     │
│  │     (/)      │  │   (/admin)   │  │  (/player)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │ API Calls (fetch)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Server (Express.js)                     │
│  • Port 3002                                                 │
│  • Handles MPC encryption/decryption                         │
│  • Birth date → Age conversion                              │
│  • Manages Coti wallet with AES key                         │
│  ┌──────────────────────────────────────────────────┐      │
│  │  API Endpoints:                                    │      │
│  │  • POST /api/store-date     (Store birth date)   │      │
│  │  • POST /api/compare-date   (Compare ages)       │      │
│  │  • GET  /api/is-date-set    (Check if set)       │      │
│  │  • GET  /health             (Health check)       │      │
│  └──────────────────────────────────────────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ Coti-Ethers SDK
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Coti Testnet (Chain ID: 7082400)               │
│  ┌────────────────────────────────────────────────┐        │
│  │   DateGame Smart Contract (Solidity)           │        │
│  │   Address: 0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729 │
│  │                                                 │        │
│  │   • setAge(itUint64)       - Store encrypted age│       │
│  │   • greaterThan(itUint64)  - Compare (stored > input)│  │
│  │   • lessThan(itUint64)     - Compare (stored < input)│  │
│  │   • comparisonResult()     - Get encrypted result│     │
│  │   • isAgeSet()             - Check if age stored│      │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
age/
├── contracts/
│   └── DateGame.sol              # Smart contract with MPC operations
├── scripts/
│   └── deploy-DateGame.js        # Hardhat deployment script
├── server/
│   ├── index.js                  # Express.js backend server
│   └── DateGameABI.json          # Contract ABI for backend
├── src/
│   ├── App.jsx                   # React Router setup
│   ├── apiService.js             # API client for backend calls
│   ├── cotiUtils.js              # Coti utility functions
│   ├── DateGameABI.json          # Contract ABI for frontend
│   ├── index.css                 # Global styles
│   ├── main.jsx                  # React entry point
│   └── pages/
│       ├── HomePage.jsx          # Landing page with game rules
│       ├── Player1Page.jsx       # Admin page (store birth date)
│       └── Player2Page.jsx       # Player page (guess age)
├── artifacts/                    # Compiled contracts (Hardhat output)
├── cache/                        # Hardhat cache
├── hardhat.config.js            # Hardhat configuration
├── vite.config.js               # Vite bundler configuration
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

### Key Components

#### Smart Contract (`DateGame.sol`)

- **Language**: Solidity ^0.8.19
- **MPC Operations**: Uses `@coti-io/coti-contracts` MPC library
- **Storage**: Encrypted age stored as `utUint64` (user + network ciphertext)
- **Privacy**: All comparisons happen on encrypted data using `gtUint64` (garbled type)

#### Backend Server (`server/index.js`)

- **Framework**: Express.js with CORS
- **SDK**: `@coti-io/coti-ethers` for MPC encryption/decryption
- **Key Management**: Server-side wallet with AES key for encryption
- **Date Processing**: Converts birth dates to age in years before encryption

#### Frontend (`src/`)

- **Framework**: React 18 with React Router DOM
- **Build Tool**: Vite
- **API Client**: Custom `apiService.js` for backend communication
- **Pages**: Home, Admin (store), Player (guess)

## 🔧 Available Scripts

### Smart Contract

- `npm run compile` - Compile smart contracts with Hardhat
- `npm run deploy:coti` - Deploy DateGame contract to Coti Testnet
- `npm run test` - Run Hardhat tests

### Frontend

- `npm run dev` - Start Vite dev server (default: http://localhost:5173)
- `npm run build` - Build React app for production
- `npm run preview` - Preview production build

### Backend

- `npm run server` - Start Express.js backend server (port 3002)
- `npm run dev:full` - Run both backend server and frontend dev server concurrently

## 🔐 Smart Contract Features

The DateGame contract provides:

- **Encrypted Age Storage**: Store ages as encrypted `utUint64` values using Coti's MPC
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

1. **Encryption** (Backend): Birth date → Age calculation → Encrypt with Coti wallet
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
- **Transaction Tracking**: Links to Coti Explorer for transaction verification

## 🔍 Troubleshooting

### Common Issues

1. **Backend server not starting**

   - Ensure port 3002 is not already in use
   - Check that `PRIVATE_KEY` and `AES_KEY` are set in `server/index.js`
   - Verify Coti provider connection
2. **"Failed to initialize Coti service" error**

   - Verify the contract address in `server/index.js`
   - Check that the ABI file exists at `server/DateGameABI.json`
   - Ensure the wallet has funds on Coti Testnet
3. **Transaction failures**

   - Ensure the backend wallet has sufficient ETH for gas fees
   - Check that the contract address is correct
   - Verify network configuration (Chain ID: 7082400)
4. **Build errors**

   - Delete `node_modules` and run `npm install` again
   - Ensure Node.js version is 16 or higher
   - Check that all dependencies are installed
5. **API connection errors**

   - Verify backend server is running on port 3002
   - Check browser console for CORS errors
   - Ensure `apiService.js` points to correct backend URL

### Getting Test ETH

To get test ETH for Coti Testnet:

1. Visit the Coti Testnet faucet
2. Enter your wallet address
3. Request test tokens

## 🔐 Privacy & Security

### How MPC Ensures Privacy

The Age Guessing Game uses Coti's Multi-Party Computation (MPC) to ensure complete privacy:

1. **Client-Server Separation**

   - Frontend doesn't handle private keys or encryption
   - Backend server manages wallet and performs encryption/decryption
   - Reduces client-side complexity and security risks
2. **Birth Date → Age Conversion**

   - Birth date sent to server over HTTPS
   - Server calculates age in years (not stored in plain text)
   - Only the age is encrypted and stored on-chain
3. **Encrypted Storage**

   - Age encrypted as `utUint64` (user + network ciphertext)
   - Stored on public blockchain, but value is encrypted
   - Only the owner (with AES key) can decrypt
4. **Encrypted Comparisons**

   - Player's guess is encrypted before sending to contract
   - Comparison happens on `gtUint64` garbled types
   - Result is `gtBool` → `gtUint8` → `utUint8` (encrypted 0 or 1)
   - Only the backend can decrypt the result to YES/NO
5. **Zero Knowledge to Player**

   - Player only receives YES/NO answers
   - Actual age value never exposed
   - Even blockchain explorers only see encrypted ciphertexts

### Security Best Practices

⚠️ **Important**: This is a demo application. For production use:

- Store private keys in secure key management systems (e.g., AWS KMS, HashiCorp Vault)
- Use environment variables for all sensitive data
- Implement proper authentication and authorization
- Add rate limiting and input validation
- Use HTTPS for all communications
- Implement proper error handling without exposing sensitive information

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
- **Coti MPC Library**: `@coti-io/coti-contracts` ^1.0.0
- **Hardhat**: ^2.19.0 (development framework)
- **Hardhat-Ethers**: ^3.0.0 (Ethers.js integration)

### Backend Layer

- **Node.js**: v16+
- **Express.js**: ^4.21.2 (API server)
- **Coti-Ethers SDK**: `@coti-io/coti-ethers` ^1.0.5 (MPC encryption/decryption)
- **Ethers.js**: ^6.0.0 (blockchain interactions)
- **CORS**: ^2.8.5 (cross-origin support)

### Frontend Layer

- **React**: ^18.2.0 (UI framework)
- **React Router DOM**: ^7.9.5 (routing)
- **Vite**: ^4.4.0 (build tool)
- **@vitejs/plugin-react**: ^4.0.0

### Key Dependencies

- **@coti-io/coti-contracts**: MPC operations (MpcCore, ExtendedOperations)
- **@coti-io/coti-ethers**: Wallet encryption/decryption utilities
- **concurrently**: ^8.2.2 (run multiple processes)

## 🀽� Links

- [Coti Documentation](https://docs.coti.io/)
- [Coti MPC Documentation](https://docs.coti.io/coti-v2-documentation/build-on-coti/mpc)
- [Coti Testnet Explorer](https://testnet.cotiscan.io/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Vite Documentation](https://vitejs.dev/guide/)

## 📞 Support

For support and questions:

- Open an issue on GitHub
- Check the Coti Discord community
- Review the documentation links above

---

Built with ❤️ using Coti's MPC technology for secure, private computations on blockchain.
