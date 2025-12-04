# Multiple Bidders Setup

This guide explains how to configure multiple bidder accounts for the Private Auction demo.

## Overview

The auction now supports multiple bidders (Alice, Bob, Bea, Charlie, David, and Ethan) who can simultaneously interact with the auction contract. Each bidder has their own card displaying their wallet, token balance, and transaction history.

## Configuration

### 1. Copy the Environment Template

```bash
cp .env.example .env
```

### 2. Configure Bidder Credentials

Edit the `.env` file and add credentials for each bidder you want to enable:

```bash
# Alice credentials
VITE_ALICE_PK=0x_alice_private_key_here
VITE_ALICE_AES_KEY=alice_aes_key_here
VITE_ALICE_ADDRESS=0x_alice_wallet_address_here

# Bob credentials
VITE_BOB_PK=0x_bob_private_key_here
VITE_BOB_AES_KEY=bob_aes_key_here
VITE_BOB_ADDRESS=0x_bob_wallet_address_here

# Bea credentials
VITE_BEA_PK=0x_bea_private_key_here
VITE_BEA_AES_KEY=bea_aes_key_here
VITE_BEA_ADDRESS=0x_bea_wallet_address_here

# Charlie credentials
VITE_CHARLIE_PK=0x_charlie_private_key_here
VITE_CHARLIE_AES_KEY=charlie_aes_key_here
VITE_CHARLIE_ADDRESS=0x_charlie_wallet_address_here

# David credentials
VITE_DAVID_PK=0x_david_private_key_here
VITE_DAVID_AES_KEY=david_aes_key_here
VITE_DAVID_ADDRESS=0x_david_wallet_address_here

# Ethan credentials
VITE_ETHAN_PK=0x_ethan_private_key_here
VITE_ETHAN_AES_KEY=ethan_aes_key_here
VITE_ETHAN_ADDRESS=0x_ethan_wallet_address_here
```

**Note:** Only bidders with complete credentials (PK, AES_KEY, and ADDRESS) will appear in the UI.

### 3. Obtaining Credentials

For each bidder account, you need:

1. **Private Key (PK)**: The private key of the wallet
2. **AES Key**: The AES encryption key for COTI MPC operations
3. **Address**: The public wallet address

You can generate these using COTI's account generation tools or use existing test accounts.

## Features

Each bidder card displays:

- **Wallet Address**: The bidder's public address
- **Token Balance**: Current MTK token balance
- **Total Bids**: Number of bids placed
- **Action Buttons**:
  - **Place**: Open modal to place a bid
  - **Withdraw**: Withdraw a previously placed bid
  - **Check**: Check if the bidder has the highest bid
  - **Get Tokens**: Mint 1000 test tokens
- **Transaction History**: Last 5 transactions with links to block explorer

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The application will display cards for all configured bidders

3. Each bidder can independently:
   - Get test tokens
   - Place bids
   - Check their bid status
   - Withdraw bids
   - View their transaction history

## Architecture

### Components

- **MultiBidderPage**: Main page component managing all bidders
- **BidderCard**: Individual bidder card component
- **BidModal**: Modal for placing bids
- **IntroModal**: Introduction modal explaining the auction

### Hooks

- **useMultipleBidders**: Hook that loads bidder configurations from environment variables
- **useAuctionContract**: Hook for interacting with the auction smart contract

### State Management

Each bidder has independent state including:
- Token balance
- Transaction history
- Loading status
- Status messages

## Development Notes

### Current Implementation

The current implementation uses simulated transactions with mock transaction hashes. This allows you to test the UI flow without actual blockchain interactions.

### TODO: Real Contract Integration

To integrate with actual smart contracts, update the following functions in `MultiBidderPage.jsx`:

1. **handleSubmitBid**: Replace mock transaction with actual `placeBid` call using bidder's credentials
2. **handleWithdraw**: Implement actual `withdrawBid` contract call
3. **handleCheckBid**: Implement actual `checkIfHighestBid` contract call
4. **handleGetTokens**: Implement actual `mintTokens` contract call

Each function should use the bidder's private key and AES key from the environment variables to sign and encrypt transactions.

## Security Notes

⚠️ **Important**: Never commit the `.env` file to version control. It contains sensitive private keys.

- The `.env` file is already in `.gitignore`
- Use `.env.example` as a template
- Share credentials securely through encrypted channels
- Use test accounts only for development

## Troubleshooting

### Bidder Not Appearing

If a bidder doesn't appear in the UI:
1. Check that all three environment variables are set (PK, AES_KEY, ADDRESS)
2. Verify the variable names match the pattern `VITE_<NAME>_<FIELD>`
3. Restart the development server after changing `.env`

### Transaction Failures

Current implementation uses mock transactions. Real transaction failures will occur when:
- Insufficient gas
- Invalid signatures
- Network issues
- Contract errors

These will be handled once real contract integration is complete.
