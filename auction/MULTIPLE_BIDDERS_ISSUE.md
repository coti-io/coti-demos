# Multiple Bidders Issue - Analysis & Findings

## ✅ RESOLVED

**Status:** Fixed and deployed to production
**Fix Date:** December 3, 2025
**New Deployment:** See [DEPLOYMENT.md](DEPLOYMENT.md)

## Problem Summary

**Only the first bidder can successfully place a bid. All subsequent bidders' transactions revert.**

## Test Results

Comprehensive testing with 5 sequential bidders on a fresh contract deployment:

- ✅ **Alice (1st bidder)**: 10 tokens - SUCCESS (Gas: 1,002,577)
- ❌ **Bob (2nd bidder)**: 20 tokens - FAILED (Gas: 1,013,565, Status: 0)
- ❌ **Bea (3rd bidder)**: 15 tokens - FAILED (Gas: 1,013,577, Status: 0)
- ❌ **Charlie (4th bidder)**: 25 tokens - FAILED (Gas: 1,013,577, Status: 0)
- ❌ **David (5th bidder)**: 30 tokens - FAILED (Gas: 1,013,577, Status: 0)

**Final bid counter: 1** (only Alice's bid accepted)

### Test Environment
- Fresh contract deployment (not an expired auction)
- All bidders properly funded (10,000 tokens each)
- All approvals successful (100,000 tokens approved)
- All bid encryptions successful
- All bidders are NEW (no existing bids)

### Test Contracts
- Token: https://testnet.cotiscan.io/address/0xA30953b42A2C31a3F13a2B6261802e161fb920Ce
- Auction: https://testnet.cotiscan.io/address/0xD90bDD2a2AdB5dcBc50D77A18c95C961f717ed00

## Root Cause Analysis

### 1. Confirmed Bug: Incorrect Highest Bid Update Logic

**Location:** [PrivateAuction.sol:104](contracts/PrivateAuction.sol#L104)

```solidity
ctUint64 currentBid = bids[msg.sender];  // Line 99
if (
    ctUint64.unwrap(highestBid) == 0 ||
    MpcCore.decrypt(
        MpcCore.ge(
            MpcCore.onBoard(existingBid),  // ❌ BUG: Should be currentBid
            MpcCore.onBoard(highestBid)
        )
    )
) {
    highestBid = currentBid;
}
```

**Issue:** Uses `existingBid` (old value) instead of `currentBid` (new value) when determining if the bid should become the highest bid.

**Impact:** Even if subsequent bids succeeded, they would not be properly recognized as the highest bid.

**Fix Required:**
```solidity
MpcCore.onBoard(currentBid),  // Use currentBid, not existingBid
```

### 2. Primary Issue: PrivateERC20 TransferFrom Failure

**Evidence:**
- All subsequent bidders pass approval and encryption steps
- Transaction reverts with status: 0
- High gas consumption (~1M gas) indicates deep execution before revert
- Revert occurs during `tokenContract.transferFrom()` call at lines 75-79

**Hypothesis:**
The COTI PrivateERC20 contract appears to have issues handling multiple sequential `transferFrom` calls to the same recipient (the auction contract) when encrypted balances are involved. This could be related to:

1. **MPC State Management**: The encrypted balance state might not properly accumulate across multiple transfers
2. **Encrypted Arithmetic**: Adding encrypted values (Alice's 10 + Bob's 20) might fail in the MPC system
3. **Gas Estimation**: The encrypted operations might exceed internal gas limits or MPC operation limits

**Transaction Flow for Second Bidder (Bob):**
```solidity
1. existingBid = 0 (no previous bid) ✅
2. gtBid = validateCiphertext(20) ✅
3. Enter if block (existingBid == 0) ✅
4. bidCounter++ → 2 ✅
5. bids[Bob] = 20 ✅
6. tokenContract.transferFrom(Bob, auction, 20) ❌ REVERTS HERE
```

## What We've Ruled Out

- ❌ Frontend implementation issues (tested with standalone script)
- ❌ Wallet credential problems (all wallets properly initialized)
- ❌ Insufficient token balance (all bidders have 10,000 tokens)
- ❌ Insufficient approval (all bidders approved 100,000 tokens)
- ❌ Expired auction (fresh deployment with 1-hour duration)
- ❌ Contract already having bids (fresh deployment, bid counter = 0)

## Potential Solutions

### Option 1: Fix the Contract Bug and Report COTI Issue
1. Fix the `existingBid` → `currentBid` bug at line 104
2. Report the PrivateERC20 multiple transfer issue to COTI team
3. Wait for COTI platform fix

### Option 2: Redesign the Auction Logic
Instead of accumulating encrypted bids in the contract, consider:
```solidity
// Store only the latest bid, not accumulated bids
// Each bidder withdraws their old bid before placing a new one
function bid(itUint64 calldata itBid) public onlyBeforeEnd {
    // If bidder has existing bid, return it first
    if (ctUint64.unwrap(bids[msg.sender]) != 0) {
        tokenContract.transfer(msg.sender, MpcCore.onBoard(bids[msg.sender]));
    }

    // Then accept new bid
    gtUint64 gtBid = MpcCore.validateCiphertext(itBid);
    bids[msg.sender] = MpcCore.offBoard(gtBid);
    tokenContract.transferFrom(msg.sender, address(this), gtBid);

    // Update highest bid tracking...
}
```

### Option 3: Use Native Token Instead of ERC20
Replace PrivateERC20 token bids with native encrypted value transfers (if COTI supports this pattern).

## Immediate Actions

1. **File issue with COTI**: Report PrivateERC20 multi-transfer limitation
2. **Fix contract bug**: Update line 104 to use `currentBid`
3. **Update documentation**: Warn users that current implementation only supports single bidder
4. **Consider workaround**: Implement Option 2 redesign if COTI fix is not available

## Test Script

The issue can be reproduced with:
```bash
node scripts/testMultipleBids.cjs
```

This script:
- Deploys fresh Token and Auction contracts
- Funds 5 bidders with 10,000 tokens each
- Tests sequential bidding
- Reports success/failure for each bidder

## Resolution

### What Was Done

1. **Fixed Contract Bug** at [line 104](contracts/PrivateAuction.sol#L104):
   - Changed `MpcCore.onBoard(existingBid)` to `MpcCore.onBoard(currentBid)`
   - This ensures the new bid value is compared against highest bid, not the old value

2. **Deployed Fixed Contract:**
   - New Token: `0xa3b32cB50a69C312932f0a7D1d4cb01a35DC0945`
   - New Auction: `0x2B1F89FF304279BB008802E4f2Ef1416e09d3743`
   - See [DEPLOYMENT.md](DEPLOYMENT.md) for full details

3. **Verified Fix with Tests:**
   - All 5 bidders successfully placed bids ✅
   - Bid counter incremented correctly: 1 → 2 → 3 → 4 → 5
   - All transactions confirmed with status: 1 (success)

### Test Results After Fix

- ✅ **Alice**: 10 tokens - SUCCESS (Gas: 1,002,571)
- ✅ **Bob**: 20 tokens - SUCCESS (Gas: 1,089,798)
- ✅ **Bea**: 15 tokens - SUCCESS (Gas: 1,086,908)
- ✅ **Charlie**: 25 tokens - SUCCESS (Gas: 1,089,786)
- ✅ **David**: 30 tokens - SUCCESS (Gas: 1,089,786)

**Final Statistics:** 5/5 successful (100% success rate)

### Updated Environment Variables

The `.env` file has been updated with new contract addresses:
```bash
VITE_AUCTION_ADDRESS=0x2B1F89FF304279BB008802E4f2Ef1416e09d3743
VITE_TOKEN_ADDRESS=0xa3b32cB50a69C312932f0a7D1d4cb01a35DC0945
```

**Note:** The PrivateERC20 hypothesis from the original analysis was incorrect. The issue was purely the contract logic bug, not a platform limitation.

## References

- Test Script: [scripts/testMultipleBids.cjs](scripts/testMultipleBids.cjs)
- Contract: [contracts/PrivateAuction.sol](contracts/PrivateAuction.sol)
- Token: [contracts/MyToken.sol](contracts/MyToken.sol)
- Deployment Info: [DEPLOYMENT.md](DEPLOYMENT.md)
- Test Results: See "Resolution" section above
