# DateGame Test Results

This document records the results of the `DateGame` contract deployment and functional testing on the COTI Testnet.

## Deployment Details

- **Network**: COTI Testnet
- **Deployment Timestamp**: 2026-01-14
- **Contract Address**: `0x4188E0CB7215558133BC17137C427a88A9215B53`
- **Deployer**: `0xe45FC1a7D84e73C8c71EdF2814E7467F7C86a8A2`

## Test Suite: `test/DateGame.functional.test.js`

The functional tests verify the core privacy-preserving mechanics of the `DateGame` contract using `@coti-io/coti-ethers`.

### Tested Scenarios
1.  **Setting Age**: Encrypted `setAge` call.
2.  **Guessing (Greater Than)**: Encrypted `greaterThan` query.
3.  **Guessing (Less Than)**: Encrypted `lessThan` query.
4.  **Verification**: Decrypting `comparisonResult` to verify logic correctness (True/False).

### Execution Results

**Command**:
```bash
npx hardhat test test/DateGame.functional.test.js --network cotiTestnet
```

**Output**:
```text
  DateGame Functional Tests (COTI Testnet)
Testing with account: 0xe45FC1a7D84e73C8c71EdF2814E7467F7C86a8A2
Using existing contract at: 0x4188E0CB7215558133BC17137C427a88A9215B53
    ✔ should set age successfully (6329ms)
    ✔ should allow owner to guess age (greaterThan check)
    ✔ should allow owner to guess age (lessThan check)
    ✔ should return false for incorrect guess (greaterThan)

  4 passing (2m)
```

## How to Run
To reproduce these results:

1.  Ensure `.env` has `VITE_ADMIN_PK` and `VITE_ADMIN_AES_KEY` set.
2.  Run the tests:
    ```bash
    npx hardhat test test/DateGame.functional.test.js --network cotiTestnet
    ```
    *Optionally set `EXISTING_CONTRACT_ADDRESS` to skip deployment.*
