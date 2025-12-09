# Auction Test Suite Documentation

## Overview

This directory contains tests for the PrivateAuction and MyToken smart contracts, which demonstrate privacy-preserving sealed-bid auctions using COTI's Multi-Party Computation (MPC) technology. The tests include both local unit tests and COTI testnet integration tests.

## Test Files

### `PrivateAuction.comprehensive.test.js`
Comprehensive contract functionality tests that cover:
- **PrivateAuction Contract**:
  - Contract Initialization: Verify beneficiary, token contract, owner, and initial state
  - State Management: Test bid counter, winner tracking, and state consistency
  - Access Control: Verify function accessibility and permissions
  - Function Signatures: Validate all function structures and parameters
  - Event Definitions: Validate Winner and HighestBid event structures
  - Custom Errors: Validate TooEarly and TooLate error definitions
  - View Function Behavior: Test state-query functions
  - Edge Cases: Handle multiple users, rapid calls, and edge scenarios
  - Contract Deployment: Verify deployment with different parameters
  - Gas Estimation: Verify reasonable gas costs for view operations

- **MyToken Contract**:
  - Token Initialization: Verify name and symbol
  - Function Signatures: Validate mint and getMyBalance functions
  - View Function Behavior: Test name and symbol getters
  - Contract Deployment: Verify valid deployment
  - Gas Estimation: Verify reasonable gas costs

### `PrivateAuction.test.js`
Basic compatibility test file (2 tests) for initial contract validation.

## Running Tests

### COTI Testnet Tests - ✅ PRIMARY TEST METHOD

**Important**: PrivateAuction contract **requires COTI testnet** for testing because its constructor uses MPC operations (`MpcCore.offBoard`, `MpcCore.setPublic`) that require COTI's MPC precompiles. These are only available on COTI testnet, not local Hardhat network.

```bash
npx hardhat test --network cotiTestnet
```

**Result:** Full test suite runs on COTI testnet

This runs all tests on COTI testnet and is the **primary test validation method** for this project.

**Setup:**

1. **Set up environment variables** in `.env`:
   ```bash
   # COTI Testnet RPC URL - REQUIRED
   VITE_APP_NODE_HTTPS_ADDRESS=https://testnet.coti.io/rpc

   # Bidder Account - REQUIRED for testnet tests
   VITE_BIDDER_PK=your_bidder_private_key_here
   VITE_BIDDER_AES_KEY=your_bidder_aes_key_here

   # Deployer Account (optional, for contract deployment)
   DEPLOYER_PRIVATE_KEY=your_deployer_private_key_here
   ```

   **Important**: At minimum, `VITE_BIDDER_PK` must be configured for tests to run on COTI testnet.

2. **Ensure you have COTI testnet ETH** for gas fees in the bidder wallet

3. **Run tests on COTI testnet**:
   ```bash
   npx hardhat test --network cotiTestnet
   ```

**What is tested:**
- ✅ **PrivateAuction** (56 tests): Contract initialization, state management, access control, function signatures, events, custom errors, view functions, edge cases, deployment, gas estimation
- ✅ **MyToken** (11 tests): Token initialization, function signatures, view functions, deployment, gas estimation

**Test Results on COTI Testnet:**
- Some tests using `.connect()` and `estimateGas` will skip due to COTI RPC limitations
- Expected: ~45-55 passing, ~10-20 pending (skipped)

### Local Tests (Hardhat Network) - MyToken Only

```bash
npx hardhat test
```

**Result: 11 passing (MyToken only)**

Only MyToken tests run on local Hardhat network because:
- ✅ MyToken constructor does NOT use MPC operations
- ❌ PrivateAuction constructor DOES use MPC operations (requires COTI testnet)

**Local test coverage:**
- ✅ MyToken: name, symbol, mint signature, getMyBalance signature, view functions, deployment, gas estimation

## Test Accounts

When running on COTI testnet, tests use accounts from environment variables:
- **Owner/Beneficiary**: First signer (usually from VITE_BIDDER_PK or DEPLOYER_PRIVATE_KEY)
- **Bidders**: Additional signers for placing bids

These accounts must have:
- Sufficient COTI testnet tokens for gas fees
- Properly configured AES keys for MPC operations

## Test Coverage

### PrivateAuction - Contract Initialization (10 tests)
- ✅ Correct beneficiary address set
- ✅ Correct token contract address set
- ✅ Correct contract owner set
- ✅ Zero bid counter initialization
- ✅ No winner initially
- ✅ No highest bidder initially
- ✅ Token not transferred initially
- ✅ Correct stoppable setting
- ✅ Not manually stopped initially
- ✅ End time set in the future

### PrivateAuction - State Management (3 tests)
- ✅ Bid counter tracking
- ✅ State queries from any address
- ✅ State consistency across multiple queries

### PrivateAuction - Access Control (3 tests)
- ✅ Anyone can view public state variables
- ✅ Owner can view contract owner
- ✅ Non-owners can view contract owner

### PrivateAuction - Function Signatures (14 tests)
- ✅ bid() signature
- ✅ getBid() signature
- ✅ doIHaveHighestBid() signature
- ✅ claim() signature
- ✅ withdraw() signature
- ✅ auctionEnd() signature
- ✅ stop() signature
- ✅ beneficiary() getter signature
- ✅ endTime() getter signature
- ✅ tokenContract() getter signature
- ✅ bidCounter() getter signature
- ✅ winner() getter signature
- ✅ highestBidder() getter signature
- ✅ tokenTransferred() getter signature

### PrivateAuction - Event Definitions (4 tests)
- ✅ Winner event structure
- ✅ Winner event parameters (who)
- ✅ HighestBid event structure
- ✅ HighestBid event parameters (isHighestBid)

### PrivateAuction - Custom Errors (4 tests)
- ✅ TooEarly error definition
- ✅ TooEarly error parameters (time)
- ✅ TooLate error definition
- ✅ TooLate error parameters (time)

### PrivateAuction - View Function Behavior (2 tests)
- ✅ Multiple calls to state getters
- ✅ Multiple calls to counter getters

### PrivateAuction - Edge Cases (3 tests)
- ✅ Rapid successive state checks
- ✅ Calls from different users
- ✅ State consistency across queries

### PrivateAuction - Contract Deployment (5 tests)
- ✅ Auction bytecode verification
- ✅ Token bytecode verification
- ✅ Auction valid address
- ✅ Token valid address
- ✅ Multiple auction deployments

### PrivateAuction - Gas Estimation (2 tests)
- ✅ State getter gas costs
- ✅ Boolean getter gas costs

### MyToken - Token Initialization (2 tests)
- ✅ Correct name ("MyToken")
- ✅ Correct symbol ("MTK")

### MyToken - Function Signatures (4 tests)
- ✅ mint() signature
- ✅ getMyBalance() signature
- ✅ name() signature
- ✅ symbol() signature

### MyToken - View Function Behavior (2 tests)
- ✅ Multiple calls to name()
- ✅ Multiple calls to symbol()

### MyToken - Contract Deployment (2 tests)
- ✅ Bytecode verification
- ✅ Valid address

### MyToken - Gas Estimation (1 test)
- ✅ name() and symbol() gas costs

## Contract Functions

### PrivateAuction Contract Functions

#### State-Changing Functions

```solidity
// Place an encrypted bid
function bid(itUint64 calldata itBid) public onlyBeforeEnd

// Check if caller has highest bid (emits HighestBid event)
function doIHaveHighestBid() public

// Claim the auction item (only highest bidder, only after end)
function claim() public onlyAfterEnd

// Withdraw bid after auction ends (non-winners)
function withdraw() public onlyAfterEnd

// Transfer highest bid to beneficiary (only after end)
function auctionEnd() public onlyAfterEnd

// Stop the auction early (only owner, if stoppable)
function stop() public onlyContractOwner
```

#### View Functions

```solidity
// Get caller's encrypted bid
function getBid() public returns (ctUint64)

// Get beneficiary address
function beneficiary() public view returns (address)

// Get auction end time
function endTime() public view returns (uint)

// Get token contract address
function tokenContract() public view returns (PrivateERC20)

// Get number of bids
function bidCounter() public view returns (uint)

// Get winner address (address(0) if not claimed)
function winner() public view returns (address)

// Get current highest bidder address
function highestBidder() public view returns (address)

// Check if token has been transferred
function tokenTransferred() public view returns (bool)

// Check if auction is stoppable
function stoppable() public view returns (bool)

// Check if auction has been manually stopped
function manuallyStopped() public view returns (bool)

// Get contract owner address
function contractOwner() public view returns (address)
```

#### Events

```solidity
// Emitted when auction is won
event Winner(address who)

// Emitted after doIHaveHighestBid check
event HighestBid(ctBool isHighestBid)
```

#### Custom Errors

```solidity
// Function called too early
error TooEarly(uint time)

// Function called too late
error TooLate(uint time)
```

### MyToken Contract Functions

```solidity
// Mint encrypted tokens to an address
function mint(address to, itUint64 calldata amount) external

// Get caller's encrypted balance
function getMyBalance() public returns (ctUint64)

// Standard ERC20 functions
function name() public view returns (string)
function symbol() public view returns (string)
// ... plus all other PrivateERC20 functions
```

## MPC Flow in PrivateAuction

The PrivateAuction contract uses COTI's MPC for privacy-preserving auction operations:

1. **Token Minting**:
   - User encrypts amount client-side → `itUint64`
   - Contract validates and mints as encrypted `utUint64`

2. **Bid Placement**:
   - Bidder encrypts bid client-side → `itUint64`
   - Contract validates as `gtUint64`
   - Transfers tokens from bidder to auction contract
   - Updates highest bid if necessary (encrypted comparison)

3. **Bid Retrieval**:
   - Bidder calls `getBid()`
   - Contract loads bid as `gtUint64`
   - Returns as `ctUint64` encrypted for bidder
   - Bidder decrypts with their AES key

4. **Highest Bid Check**:
   - Bidder calls `doIHaveHighestBid()`
   - Contract compares bid with highest bid (encrypted)
   - Emits `HighestBid` event with encrypted boolean result
   - Bidder decrypts result with their AES key

5. **Claiming/Withdrawal**:
   - After auction ends, highest bidder calls `claim()`
   - Non-winners call `withdraw()` to get tokens back
   - All operations use encrypted amounts

6. **Privacy Guarantee**:
   - No bidder can see others' actual bid amounts
   - Only encrypted comparisons reveal highest bidder
   - All bid amounts remain encrypted on-chain

## Running Specific Test Suites

Run specific test suites using grep:

```bash
# Test only PrivateAuction initialization
npx hardhat test --grep "Contract Initialization"

# Test only access control
npx hardhat test --grep "Access Control"

# Test only event definitions
npx hardhat test --grep "Event Definitions"

# Test only MyToken
npx hardhat test --grep "MyToken"

# Test only function signatures
npx hardhat test --grep "Function Signatures"
```

## Notes

- **Test Suite Focus**: Tests validate contract logic, state management, access control, and function signatures
- **Primary Test Method**: COTI testnet testing is the primary validation method (67 total tests)
- **PrivateAuction Requirements**: MUST be tested on COTI testnet - constructor uses MPC operations
- **Local Testing**: Only MyToken tests (11 passing) run on local Hardhat network
- **COTI Testnet**: Full test suite runs on COTI testnet, some tests using `.connect()` and `estimateGas` skip due to RPC limitations
- **Gas Costs**: View functions have minimal gas costs; state-changing functions with MPC are more expensive
- **Two Contracts**: Test suite covers both PrivateAuction (56 tests) and MyToken (11 tests)

## Troubleshooting

### "Pending Block is Not Available" Errors on COTI Testnet

This is a known COTI testnet network instability issue. The tests include retry logic to handle this:

**Symptoms:**
- Contract deployment fails with "pending block is not available"
- Tests fail in the `before` hook
- Error occurs during `estimateGas` or `waitForDeployment`

**Solutions:**
1. The tests automatically retry deployment up to 5 times with 3-second delays
2. If all retries fail, try running the tests again after a few minutes
3. Check COTI testnet status and network connectivity
4. Ensure you have sufficient testnet ETH for gas fees

**Note:** This is a network-level issue, not a problem with the tests or contract code. The vote, age, and millionaire project tests document similar issues.

### TooEarly / TooLate Errors

These are expected custom errors when:
- Trying to bid after the auction has ended (TooLate)
- Trying to claim or withdraw before the auction has ended (TooEarly)

These time-based restrictions are enforced by modifiers on the contract.

## Test Structure

The test suite follows the pattern used in other COTI demo projects:
- Organized by functional areas
- Clear test descriptions
- Comprehensive coverage of edge cases
- Both positive and negative test cases
- Gas estimation checks
- Multiple contract testing (PrivateAuction + MyToken)

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Add descriptive test names
3. Include both positive and negative cases
4. Consider edge cases and error conditions
5. Update this README with new test coverage

## References

- [COTI MPC Documentation](https://docs.coti.io/coti-v2-documentation/build-on-coti/mpc)
- [Hardhat Testing Guide](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [Chai Assertions](https://www.chaijs.com/api/bdd/)
- [PrivateERC20 Contract](https://docs.coti.io/coti-v2-documentation/build-on-coti/mpc/examples/private-erc-20)
