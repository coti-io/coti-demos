# Production Deployment - Fixed Private Auction

## Deployment Information

**Deployment Date:** December 3, 2025 19:07 UTC
**Network:** COTI Testnet
**Deployer:** 0xe45FC1a7D84e73C8c71EdF2814E7467F7C86a8A2

## Contract Addresses

### MyToken (ERC20-like Encrypted Token)
- **Address:** `0xa3b32cB50a69C312932f0a7D1d4cb01a35DC0945`
- **Explorer:** https://testnet.cotiscan.io/address/0xa3b32cB50a69C312932f0a7D1d4cb01a35DC0945
- **Deployment TX:** https://testnet.cotiscan.io/tx/0x5af77a68a7817474e8c996eb224129383f01fb9d4821b9d1b3c7b738a3f4dce3

### PrivateAuction (Fixed Version)
- **Address:** `0x2B1F89FF304279BB008802E4f2Ef1416e09d3743`
- **Explorer:** https://testnet.cotiscan.io/address/0x2B1F89FF304279BB008802E4f2Ef1416e09d3743
- **Deployment TX:** https://testnet.cotiscan.io/tx/0x23f21e289958044a2bd843e216c6a825e088321565d32154143071c9055f5c07

## Auction Parameters

- **Beneficiary:** 0xe45FC1a7D84e73C8c71EdF2814E7467F7C86a8A2
- **Bidding Duration:** 3600 seconds (1 hour)
- **Is Stoppable:** Yes (contract owner can manually end auction)

## What Was Fixed

### Critical Bug (Line 104)
**File:** [contracts/PrivateAuction.sol](contracts/PrivateAuction.sol#L104)

**Issue:** The contract used `existingBid` (old bid value) instead of `currentBid` (new bid value) when determining if a bid should become the highest bid. This caused all subsequent bidders after the first to have their transactions revert.

**Fix:**
```solidity
// BEFORE (Bug)
MpcCore.onBoard(existingBid),  // Used OLD bid value

// AFTER (Fixed)
MpcCore.onBoard(currentBid),   // Uses NEW bid value
```

### Test Results

**Before Fix:**
- ✅ Alice (1st bidder): SUCCESS
- ❌ Bob (2nd bidder): FAILED (reverted)
- ❌ Bea (3rd bidder): FAILED (reverted)
- ❌ Charlie (4th bidder): FAILED (reverted)
- ❌ David (5th bidder): FAILED (reverted)

**After Fix:**
- ✅ Alice (1st bidder): SUCCESS (Gas: 1,002,571)
- ✅ Bob (2nd bidder): SUCCESS (Gas: 1,089,798)
- ✅ Bea (3rd bidder): SUCCESS (Gas: 1,086,908)
- ✅ Charlie (4th bidder): SUCCESS (Gas: 1,089,786)
- ✅ David (5th bidder): SUCCESS (Gas: 1,089,786)

**Result:** 5/5 bidders successful ✅

## How to Use

### For Frontend Applications

Update your `.env` file with the new contract addresses:

```bash
VITE_AUCTION_ADDRESS=0x2B1F89FF304279BB008802E4f2Ef1416e09d3743
VITE_TOKEN_ADDRESS=0xa3b32cB50a69C312932f0a7D1d4cb01a35DC0945
VITE_APP_NODE_HTTPS_ADDRESS=https://testnet.coti.io/rpc
```

### Supported Pages

The following pages now work with multiple bidders:

1. **BidderPage** - Original single bidder interface
2. **MultiBidderPage** - Multi-bidder dashboard (now fully functional)

### Testing Multiple Bidders

Run the comprehensive test suite:

```bash
node scripts/testMultipleBids.cjs
```

This will:
- Deploy fresh Token and Auction contracts
- Fund 5 bidders with 10,000 tokens each
- Test sequential bidding from all 5 bidders
- Report success/failure for each bid

## Previous Deployments

### Old Deployment (Buggy - DO NOT USE)
- Token: 0x06F5a8b13b2FBE8e15380709e07596005Bcf7D0D
- Auction: 0x723b160214cE323C6C5A791D386C7F894fCBFf5F
- **Issue:** Only first bidder could place bids

## Notes

- The contract uses COTI's encrypted MPC operations for private bidding
- All bid amounts remain encrypted on-chain
- Only the bidder can decrypt their own bid amount
- The `doIHaveHighestBid()` function returns an encrypted boolean result
- Winner can claim the auction object after the bidding period ends
- Losers can withdraw their bids after the auction ends

## Security Considerations

- All bidder credentials (Private Keys and AES Keys) should be kept secure
- Never commit real private keys to version control
- Use environment variables for sensitive data
- The beneficiary receives the highest bid amount after auction ends
- Contract owner can stop auction early if `isStoppable` is true

## Support & Issues

For issues or questions:
- Check [MULTIPLE_BIDDERS_ISSUE.md](MULTIPLE_BIDDERS_ISSUE.md) for detailed bug analysis
- Check [MULTIPLE_BIDDERS.md](MULTIPLE_BIDDERS.md) for multi-bidder UI documentation
- Review test results in [scripts/testMultipleBids.cjs](scripts/testMultipleBids.cjs)
