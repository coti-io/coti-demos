# Design Document

## Overview

The COTI Encrypted Voting Contract is a privacy-preserving smart contract that enables secure voting on a single quiz question. The contract leverages COTI's Multi-Party Computation (MPC) capabilities to maintain vote privacy while allowing for transparent result tallying when the election closes.

## Architecture

The contract follows COTI's MPC patterns established in the DateGame.sol example, utilizing encrypted data types and secure computation operations. The architecture consists of:

1. **Encrypted Vote Storage**: Individual votes stored as `utUint8` encrypted values
2. **Voter Management**: Mapping of voter addresses to encrypted votes and metadata
3. **Election State Control**: Boolean flag controlling voting access and result visibility
4. **Result Aggregation**: Secure computation of vote tallies using COTI's MPC operations

## Components and Interfaces

### Core Contract Structure

```solidity
contract COTIVotingContract {
    // Static voting data
    string constant VOTING_QUESTION = "What is your favorite food?";
    
    // Vote option structure
    struct VoteOption {
        uint8 id;
        string label;
    }
    
    // Hardcoded voting options
    VoteOption[4] public votingOptions;
    
    // Result structure for returning tallies with names
    struct VoteResult {
        uint8 optionId;
        string optionLabel;
        uint64 voteCount;
    }
    
    // Voter management
    struct Voter {
        string name;
        address voterId;
        utUint8 encryptedVote;  // COTI encrypted vote (0 = not voted, 1-4 = options)
        bool isRegistered;
    }
    
    mapping(address => Voter) public voters;
    address[] public voterAddresses;
    
    // Election state
    bool public electionOpened;
    address private owner;
    
    // Vote tallies (computed when election closes)
    utUint64[5] private voteTallies; // Index 0 unused, 1-4 for options
}
```

### Key Methods

1. **addVoter(string name, address voterId)**: Register new voters
2. **castVote(itUint8 encryptedVote)**: Submit encrypted votes
3. **changeVote(itUint8 newEncryptedVote)**: Update existing votes
4. **toggleElection()**: Control election state (owner only)
5. **getResults()**: Return VoteResult array with option names and tallies (when closed)
6. **getVotingOptions()**: Return all available voting options with IDs and labels
7. **getVotingQuestion()**: Return the voting question

### Encryption Patterns

Following DateGame.sol patterns:
- Use `itUint8` for encrypted inputs from users
- Convert to `gtUint8` using `MpcCore.validateCiphertext()`
- Store as `utUint8` using `MpcCore.offBoardCombined()`
- Load stored values using `MpcCore.onBoard()`

## Data Models

### Voter Structure
```solidity
struct Voter {
    string name;           // Public voter name
    address voterId;       // Unique voter address
    utUint8 encryptedVote; // COTI encrypted vote value
    bool isRegistered;     // Registration status
}
```

### Vote Options (Static)
```solidity
struct VoteOption {
    uint8 id;
    string label;
}

// Initialized in constructor:
// votingOptions[0] = VoteOption(1, "Chocolate");
// votingOptions[1] = VoteOption(2, "Raspberry");
// votingOptions[2] = VoteOption(3, "Sandwich");
// votingOptions[3] = VoteOption(4, "Mango");
```

### Vote Results Structure
```solidity
struct VoteResult {
    uint8 optionId;      // 1-4
    string optionLabel;  // "Chocolate", "Raspberry", etc.
    uint64 voteCount;    // Decrypted vote tally
}
```

### Election State
```solidity
bool public electionOpened;  // Controls voting access and result visibility
```

## Error Handling

### Vote Validation
- Reject votes when election is closed
- Validate vote options are in range 1-4
- Prevent unregistered voters from voting
- Handle encryption/decryption errors gracefully

### Access Control
- Only owner can toggle election state
- Only registered voters can cast votes
- Results only accessible when election is closed

### Edge Cases
- Handle duplicate voter registration attempts
- Manage vote changes for existing voters
- Ensure proper initialization of encrypted values

## Testing Strategy

### Unit Tests
- Vote casting and validation
- Voter registration and management
- Election state transitions
- Access control enforcement

### Integration Tests
- End-to-end voting flow
- Result calculation accuracy
- Privacy preservation verification
- Multi-voter scenarios

### Security Tests
- Unauthorized access attempts
- Vote privacy validation
- Encryption/decryption integrity
- State manipulation resistance

## Implementation Notes

### COTI MPC Integration
- Follow DateGame.sol patterns for encryption operations
- Use `MpcCore.validateCiphertext()` for input validation
- Implement proper key management for encrypted storage
- Ensure consistent encryption context across operations

### Vote Option Management
- Initialize voting options in constructor with hardcoded values
- Provide getter methods to retrieve option names and IDs
- Validate votes against available option IDs (1-4)
- Return results with both option IDs and human-readable labels

### Gas Optimization
- Minimize encrypted operations where possible
- Batch vote tally calculations
- Optimize storage layout for voter data
- Use events for off-chain tracking

### Privacy Considerations
- Votes remain encrypted until results are requested
- No intermediate vote counts exposed
- Voter registration is public but votes are private
- Results only available after election closes
- Results include both vote counts and option labels for clarity