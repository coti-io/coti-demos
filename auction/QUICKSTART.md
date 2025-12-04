# Quick Start Guide - Fixed Private Auction

## 🎉 What's New

The Private Auction contract has been **fixed and redeployed** with support for multiple bidders!

### Bug Fixed
- **Issue:** Only the first bidder could place bids (all others reverted)
- **Fix:** Corrected bid comparison logic in [PrivateAuction.sol:104](contracts/PrivateAuction.sol#L104)
- **Result:** All bidders can now successfully place bids ✅

### New Contract Addresses
- **Token:** `0xa3b32cB50a69C312932f0a7D1d4cb01a35DC0945`
- **Auction:** `0x2B1F89FF304279BB008802E4f2Ef1416e09d3743`

## Getting Started

### 1. Start the Frontend

```bash
npm run dev
```

The app will automatically use the new contract addresses from `.env`.

### 2. Access the App

Open your browser to the URL shown (typically `http://localhost:5173`)

### 3. Available Pages

#### Single Bidder Page
Navigate to `/bidder` - Original single bidder interface

#### Multi-Bidder Dashboard
Navigate to `/multi-bidder` - Test multiple bidders simultaneously

## Testing Multiple Bidders

### Option 1: Use the UI
1. Open `/multi-bidder` page
2. All 5 bidders (Alice, Bob, Bea, Charlie, David) are pre-loaded
3. Click "Get Tokens" for each bidder to mint test tokens
4. Enter bid amounts and click "Place Bid"
5. Use "Check if Highest" to see if each bidder has the highest bid
6. After auction ends, losers can "Withdraw" their bids

### Option 2: Run Test Script
```bash
node scripts/testMultipleBids.cjs
```

This will:
- Deploy fresh contracts
- Mint tokens to 5 bidders
- Place bids sequentially
- Show detailed success/failure for each bid

## Contract Details

### Auction Parameters
- **Duration:** 1 hour from deployment
- **Stoppable:** Yes (owner can end early)
- **Beneficiary:** Deployer address

### Key Functions
- `bid()` - Place an encrypted bid
- `getBid()` - Retrieve your encrypted bid
- `doIHaveHighestBid()` - Check if you have the highest bid (encrypted result)
- `withdraw()` - Withdraw your bid after auction ends (if not winner)
- `claim()` - Claim auction object (winner only, after auction ends)

## Pre-configured Test Wallets

The `.env` file includes 6 test wallets with credentials:
- **Alice** - 0x841bcafec082e856709ae082f77c9783cae76163
- **Bob** - 0x48f9d5da4e224d965497f722555b0eebcbdf4ab6
- **Bea** - 0xb2e02380dc1656778f531b713f895ecd47c5d132
- **Charlie** - 0x90de80d53c1ea7dc5e512fd284f0b5c7317ac3cb
- **David** - 0xe4ee64bd8a43c0f8bd981bc04a43e849cef8b75a
- **Ethan** - 0x8c27eb71b76d22fffcc372aa674f19082550534a

All wallets are pre-configured with:
- Private keys
- AES encryption keys (for COTI MPC)
- Ready to place bids

## Useful Links

### Contracts on Explorer
- **Token:** https://testnet.cotiscan.io/address/0xa3b32cB50a69C312932f0a7D1d4cb01a35DC0945
- **Auction:** https://testnet.cotiscan.io/address/0x2B1F89FF304279BB008802E4f2Ef1416e09d3743

### Documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment details
- [MULTIPLE_BIDDERS_ISSUE.md](MULTIPLE_BIDDERS_ISSUE.md) - Bug analysis and resolution
- [MULTIPLE_BIDDERS.md](MULTIPLE_BIDDERS.md) - Multi-bidder UI guide

## Troubleshooting

### App shows old contract addresses
- Restart the dev server: `Ctrl+C` then `npm run dev`
- Clear browser cache and reload

### Bids failing
- Ensure you have tokens (click "Get Tokens" first)
- Check auction hasn't ended (1 hour duration)
- Verify you're using the correct network (COTI Testnet)

### "Insufficient balance" error
- Click "Get Tokens" to mint test tokens
- Each wallet needs to mint their own tokens

## Next Steps

1. **Test Multiple Bidders** - Try the multi-bidder page with all 5 pre-configured wallets
2. **Place Real Bids** - Use different bid amounts to test the sealed-bid auction
3. **Check Highest Bid** - Use the "Check if Highest" function to verify (result is encrypted)
4. **Wait for Auction End** - After 1 hour, test withdrawal and claiming

## Need Help?

- Check console logs for detailed error messages
- Review test results in `scripts/testMultipleBids.cjs`
- See [MULTIPLE_BIDDERS_ISSUE.md](MULTIPLE_BIDDERS_ISSUE.md) for common issues
