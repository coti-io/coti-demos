# Contract Verification Guide for MillionaireComparison

## Contract Details
- **Contract Address:** `0x251734C6CB67Ef202b3A3B576c325f15D8B0f1C4`
- **Contract Name:** `MillionaireComparison`
- **Explorer URL:** https://testnet.cotiscan.io/address/0x251734C6CB67Ef202b3A3B576c325f15D8B0f1C4

## Compiler Settings
- **Compiler Version:** `v0.8.19+commit.7dd6d404`
- **Optimization:** Enabled
- **Optimization Runs:** `200`
- **Via IR:** `true` (⚠️ CRITICAL! Must be enabled)
- **EVM Version:** `default`
- **License:** MIT (Type 3)

## Constructor Arguments
- **Alice Address:** `0xe45FC1a7D84e73C8c71EdF2814E7467F7C86a8A2`
- **Bob Address:** `0x48f9d5da4E224d965497F722555B0eeBCBDF4ab6`
- **ABI-Encoded Constructor Args:**
```
000000000000000000000000e45fc1a7d84e73c8c71edf2814e7467f7c86a8a200000000000000000000000048f9d5da4e224d965497f722555b0eebcbdf4ab6
```

## Verification Methods

### Method 1: Using Hardhat Verify (Recommended)

The easiest method is to use Hardhat's built-in verification command:

```bash
cd /Users/percival.lucena/coti/demo/milionaire

npx hardhat verify --network cotiTestnet \
  0x251734C6CB67Ef202b3A3B576c325f15D8B0f1C4 \
  "0xe45FC1a7D84e73C8c71EdF2814E7467F7C86a8A2" \
  "0x48f9d5da4E224d965497F722555B0eeBCBDF4ab6"
```

### Method 2: Web UI Verification

1. Go to: https://testnet.cotiscan.io/address/0x251734C6CB67Ef202b3A3B576c325f15D8B0f1C4#code
2. Click "Verify & Publish" button
3. Fill in the form:
   - **Contract Address:** `0x251734C6CB67Ef202b3A3B576c325f15D8B0f1C4`
   - **Compiler:** Select `v0.8.19+commit.7dd6d404`
   - **Open Source License Type:** MIT
   - **Optimization:** Yes
   - **Optimization runs:** 200
   - **Via IR Compilation:** ✅ YES (Must check this box!)
   - **Enter the Solidity Contract Code:** Upload `MillionaireComparison_flattened.sol` (located in milionaire folder)
   - **Constructor Arguments ABI-encoded:**
   ```
   000000000000000000000000e45fc1a7d84e73c8c71edf2814e7467f7c86a8a200000000000000000000000048f9d5da4e224d965497f722555b0eebcbdf4ab6
   ```

4. Click "Verify and Publish"

### Method 3: Standard JSON Input (Advanced)

If the flattened source doesn't work, you can try using Standard JSON Input format:
- The build info file is located at: `milionaire/artifacts/build-info/`
- Use the `input` field from this file as the Standard JSON Input
- Contract name should be: `contracts/MillionaireComparison.sol:MillionaireComparison`

## Troubleshooting

### Common Issues:

1. **"Fail - Unable to verify" / Bytecode mismatch**
   - ⚠️ Make sure "Via IR" is enabled - this is the most common issue!
   - Verify the compiler version matches exactly: `v0.8.19+commit.7dd6d404`
   - Ensure optimization runs is set to 200
   - Double-check the constructor arguments are correct

2. **Constructor Arguments Error**
   - The constructor requires TWO addresses: Alice and Bob
   - ABI-encoded format (without 0x prefix):
   ```
   000000000000000000000000e45fc1a7d84e73c8c71edf2814e7467f7c86a8a200000000000000000000000048f9d5da4e224d965497f722555b0eebcbdf4ab6
   ```

3. **Flattened file issues**
   - The flattened contract includes all COTI MPC dependencies
   - File size: ~450KB
   - If upload fails, try the Hardhat verify command instead

4. **Network Configuration**
   - Ensure you're on COTI Testnet (Chain ID: 7082400)
   - Explorer: https://testnet.cotiscan.io

## Files Generated

- `MillionaireComparison_flattened.sol` - Flattened contract source (450KB)
- `get-constructor-args.js` - Script to generate constructor arguments
- `hardhat.config.js` - Updated with verification settings

## Quick Verification Command

The simplest way to verify:

```bash
cd /Users/percival.lucena/coti/demo/milionaire

npx hardhat verify --network cotiTestnet \
  0x251734C6CB67Ef202b3A3B576c325f15D8B0f1C4 \
  "0xe45FC1a7D84e73C8c71EdF2814E7467F7C86a8A2" \
  "0x48f9d5da4E224d965497F722555B0eeBCBDF4ab6"
```

## Important Notes

1. **Via IR is REQUIRED**: COTI MPC contracts MUST be compiled with `viaIR: true`. Without this, verification will fail.

2. **Constructor Arguments**: The contract was deployed with specific Alice and Bob addresses. These must match exactly for verification to succeed.

3. **Hardhat Config**: The `hardhat.config.js` has been updated with:
   - `viaIR: true` in solidity settings
   - Etherscan/Blockscout API configuration for COTI Testnet
   - `@nomicfoundation/hardhat-verify` plugin

## Contract Info

The MillionaireComparison contract implements Yao's Millionaires' Problem using COTI's MPC (Multi-Party Computation). It allows two parties to compare their wealth without revealing the actual amounts to each other.

**Key Features:**
- Privacy-preserving wealth comparison
- Uses COTI's encrypted types (utUint64, gtUint64)
- Results encrypted separately for each party
- No plaintext wealth values ever stored on-chain

## Need Help?

If automated verification fails, try the manual web UI method at:
https://testnet.cotiscan.io/address/0x251734C6CB67Ef202b3A3B576c325f15D8B0f1C4#code

Make sure to check the "Via IR Compilation" checkbox!
