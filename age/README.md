# DateGame - Encrypted Date Operations on Coti Testnet

A decentralized application that demonstrates encrypted date operations using Coti's Multi-Party Computation (MPC) technology. Users can store encrypted dates and perform secure comparisons without revealing the actual date values.

## 🚀 Live Deployment

- **Contract Address**: `0xBd54B68007706e6182DbBED88B147bDF53C31955`
- **Network**: Coti Testnet
- **Chain ID**: 7082400

## 🛠 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MetaMask](https://metamask.io/) browser extension
- [Git](https://git-scm.com/)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cotitech-io/date_challenge.git
   cd date_challenge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your private key:
   ```
   DEPLOYER_PRIVATE_KEY=your_private_key_here
   VITE_APP_NODE_HTTPS_ADDRESS=https://testnet.coti.io/rpc
   ```

## 🔧 MetaMask Configuration

Add Coti Testnet to your MetaMask:

- **Network Name**: Coti Testnet
- **RPC URL**: `https://testnet.coti.io/rpc`
- **Chain ID**: `7082400`
- **Currency Symbol**: ETH
- **Block Explorer**: `https://testnet.coti.io/`

## 🚀 Quick Start

### Option 1: Use Existing Deployment

1. **Start the React application**
   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Connect MetaMask**
   - Click "Connect Wallet" in the top-left corner
   - Ensure you're on Coti Testnet
   - The app will connect to the deployed contract automatically

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
   Copy the deployed contract address and update it in `src/App.jsx`:
   ```javascript
   const CONTRACT_ADDRESS = 'your_new_contract_address'
   ```

4. **Start the React application**
   ```bash
   npm run dev
   ```

## 📱 How to Use

### Store a Date
1. **First Card - "Store Date"**
   - Select a date using the date picker
   - Click "Submit" to store the encrypted date on-chain
   - Wait for transaction confirmation

### Compare Dates
2. **Second Card - "Compare Date"**
   - Select a date to compare with the stored date
   - Click "Greater Than" to check if stored date > selected date
   - Click "Less Than" to check if stored date < selected date
   - View the comparison result

## 🏗 Project Structure

```
date_challenge/
├── contracts/
│   └── DateGame.sol          # Smart contract with MPC functionality
├── scripts/
│   └── deploy-DateGame.js    # Deployment script
├── src/
│   ├── App.jsx              # Main React component
│   ├── DateGameABI.json     # Contract ABI
│   ├── index.css            # Styles with glassmorphism design
│   └── main.jsx             # React entry point
├── hardhat.config.js        # Hardhat configuration
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## 🔧 Available Scripts

- `npm run compile` - Compile smart contracts
- `npm run deploy:coti` - Deploy contract to Coti Testnet
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔐 Smart Contract Features

The DateGame contract provides:

- **Encrypted Date Storage**: Store dates as encrypted values using Coti's MPC
- **Secure Comparisons**: Compare dates without revealing actual values
- **User-Specific Encryption**: Each user's data is encrypted with their specific key
- **Gas Optimized**: Efficient operations on Coti Testnet

### Contract Functions

```solidity
function setDate(itUint64 calldata value) external
function greaterThan(itUint64 calldata value) external returns (bool)
function lessThan(itUint64 calldata value) external returns (bool)
```

## 🎨 UI Features

- **Glassmorphism Design**: Modern, translucent interface
- **Background Image**: Custom bg.png with overlay effects
- **Responsive Layout**: Works on desktop and mobile
- **Real-time Feedback**: Loading states and transaction status
- **MetaMask Integration**: Seamless wallet connection

## 🔍 Troubleshooting

### Common Issues

1. **MetaMask not connecting**
   - Ensure you're on Coti Testnet
   - Check that MetaMask is unlocked
   - Refresh the page and try again

2. **Transaction failures**
   - Ensure you have sufficient ETH for gas fees
   - Check that the contract address is correct
   - Verify network configuration

3. **Build errors**
   - Delete `node_modules` and run `npm install` again
   - Ensure Node.js version is 16 or higher
   - Check that all dependencies are installed

### Getting Test ETH

To get test ETH for Coti Testnet:
1. Visit the Coti Testnet faucet
2. Enter your wallet address
3. Request test tokens

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Coti Documentation](https://docs.coti.io/)
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