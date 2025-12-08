# DateGame Test Suite Documentation

## Overview

This directory contains tests for the DateGame smart contract, which demonstrates privacy-preserving age verification using COTI's Multi-Party Computation (MPC) technology. The tests include both local unit tests and COTI testnet integration tests.

## Test Files

### `DateGame.test.js`
Comprehensive contract functionality tests that cover:
- **Contract Initialization**: Verify initial state and deployment
- **Age Storage**: Test age setting functionality and state management
- **Comparison Operations**: Test greater than and less than comparisons
- **Access Control**: Verify function accessibility and permissions
- **State Management**: Test age set status tracking
- **Event Definitions**: Validate event structures and parameters
- **Error Handling**: Test proper error messages and reverts
- **Edge Cases**: Handle multiple users, rapid calls, and edge scenarios
- **Gas Estimation**: Verify reasonable gas costs for operations

## Running Tests

### Local Tests (Hardhat Network)

```bash
npx hardhat test
```

This runs all tests on the local Hardhat network. Note that MPC-dependent operations will revert on the local network as they require COTI's MPC infrastructure.

**What works on local network:**
- State management tests (isAgeSet)
- Access control verification
- Function signature validation
- Event definition checks
- Error message validation
- Contract deployment tests

**What requires COTI testnet:**
- Actual MPC encryption/decryption operations
- setAge with real encrypted data
- greaterThan/lessThan comparisons with encrypted values
- comparisonResult decryption

### COTI Testnet Integration Tests

To run tests with actual MPC operations on COTI testnet:

1. **Set up environment variables** in `.env`:
   ```bash
   # COTI Testnet RPC URL
   VITE_APP_NODE_HTTPS_ADDRESS=https://testnet.coti.io/rpc

   # Admin Account (stores the age)
   VITE_ADMIN_PK=your_admin_private_key_here
   VITE_ADMIN_AES_KEY=your_admin_aes_key_here

   # Player Account (guesses the age)
   VITE_PLAYER_PK=your_player_private_key_here
   VITE_PLAYER_AES_KEY=your_player_aes_key_here

   # Deployer Account (for contract deployment)
   DEPLOYER_PRIVATE_KEY=your_deployer_private_key_here
   ```

2. **Deploy the contract to COTI testnet**:
   ```bash
   npm run deploy:coti
   ```

3. **Run tests on COTI testnet**:
   ```bash
   npx hardhat test --network cotiTestnet
   ```

## Test Accounts

When running on COTI testnet, tests can use accounts from environment variables:
- **Admin** (VITE_ADMIN_PK): Stores the encrypted age
- **Player** (VITE_PLAYER_PK): Makes comparison queries

These accounts must have:
- Sufficient COTI testnet tokens for gas fees
- Properly configured AES keys for MPC operations

## Test Coverage

### Contract Initialization
- ✅ Initial state verification (age not set)
- ✅ Owner assignment on deployment
- ✅ Contract deployment to valid address

### Age Storage
- ✅ isAgeSet() returns false initially
- ✅ getAge() reverts when no age is set
- ✅ AgeStored event emission
- ✅ State transition when age is set

### Comparison Operations
- ✅ greaterThan() reverts without age set
- ✅ lessThan() reverts without age set
- ✅ Proper error handling for missing age
- ✅ Access to comparisonResult()

### State Management
- ✅ Age set state tracking
- ✅ State consistency across multiple callers
- ✅ State persistence after operations

### Access Control
- ✅ setAge() callable by any address
- ✅ Comparison functions accessible to all
- ✅ View functions accessible to all
- ✅ No owner-only restrictions (MPC handles privacy)

### Function Signatures
- ✅ Correct setAge signature
- ✅ Correct greaterThan signature
- ✅ Correct lessThan signature
- ✅ Correct comparisonResult signature
- ✅ Correct getAge signature
- ✅ Correct isAgeSet signature

### Event Definitions
- ✅ AgeStored event structure
- ✅ Event parameter validation
- ✅ Event indexing verification

### Error Handling
- ✅ "No age has been stored yet" for comparisons
- ✅ "No age has been stored yet" for getAge
- ✅ MPC validation errors on local network
- ✅ Proper revert behavior

### Multiple Users
- ✅ Multiple players checking status
- ✅ Different users attempting comparisons
- ✅ Consistent results across users

### Edge Cases
- ✅ Rapid successive calls
- ✅ Multiple calls from same user
- ✅ Concurrent state checks
- ✅ Multiple contract deployments

### Gas Estimation
- ✅ Reasonable gas costs for view functions
- ✅ Gas estimation for all public functions

## DateGame Contract Functions

### State-Changing Functions

```solidity
// Store an encrypted age (only needs to be called once)
function setAge(itUint64 calldata age) external

// Compare stored age > incoming value
function greaterThan(itUint64 calldata value) external

// Compare stored age < incoming value
function lessThan(itUint64 calldata value) external
```

### View Functions

```solidity
// Check if an age has been stored
function isAgeSet() external view returns (bool)

// Get the encrypted age (only works if age is set)
function getAge() public view returns (ctUint64)

// Get the encrypted comparison result
function comparisonResult() public view returns (ctUint8)
```

### Events

```solidity
// Emitted when age is successfully stored
event AgeStored(address indexed user)
```

## MPC Flow in DateGame

The DateGame contract uses COTI's MPC for privacy-preserving operations:

1. **Age Storage**:
   - Admin encrypts age client-side → `itUint64`
   - Contract validates and stores as `utUint64` (encrypted)
   - Age stored with owner's address for consistent encryption

2. **Comparison**:
   - Player encrypts guess client-side → `itUint64`
   - Contract loads stored age as `gtUint64`
   - Validates player's guess as `gtUint64`
   - Performs MPC comparison (gt or lt)
   - Returns result as encrypted `ctUint8`

3. **Result Retrieval**:
   - Player retrieves encrypted `ctUint8` result
   - Decrypts client-side with their AES key
   - Gets YES (1) or NO (0) answer

## Running Specific Test Suites

Run specific test suites using grep:

```bash
# Test only initialization
npx hardhat test --grep "Contract Initialization"

# Test only access control
npx hardhat test --grep "Access Control"

# Test only error handling
npx hardhat test --grep "Error Handling"

# Test only state management
npx hardhat test --grep "State Management"
```

## Notes

- **MPC Operations**: MPC-dependent tests require the COTI testnet (chainId: 7082400)
- **Local Testing**: Local tests validate contract logic, state management, and access control
- **Encryption**: Actual encryption/decryption only works on COTI testnet with proper MPC infrastructure
- **Test Detection**: Tests are designed to work on both local and testnet environments
- **Gas Costs**: View functions have minimal gas costs; state-changing functions with MPC are more expensive

## Troubleshooting

### Tests Fail on Local Network

This is expected for MPC operations. The tests are designed to:
- Pass state management and structure tests on local network
- Require COTI testnet for full MPC functionality

### "No age has been stored yet" Errors

This is the correct behavior when:
- Trying to call getAge() before setAge()
- Trying to call greaterThan() or lessThan() before setAge()

### MPC Validation Errors

On local network, MPC validation will fail because:
- Local Hardhat network doesn't have COTI's MPC precompiles
- Use COTI testnet for full MPC testing

## Test Structure

The test suite follows the pattern used in the voting contract tests:
- Organized by functional areas
- Clear test descriptions
- Comprehensive coverage of edge cases
- Both positive and negative test cases
- Gas estimation checks
- Multiple user scenarios

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
