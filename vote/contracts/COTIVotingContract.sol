// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

contract COTIVotingContract {
    // Custom errors for better gas efficiency and clearer error messages
    error VoterAlreadyRegistered(address voter);
    error VoterNotRegistered(address voter);
    error InvalidVoterAddress();
    error EmptyVoterName();
    error ElectionClosed();
    error ElectionStillOpen();
    error OnlyOwnerAllowed();
    error InvalidVoteOption(uint8 option);

    error NoVotersRegistered();
    error CannotCloseElectionWithoutVoters();
    error InvalidVoterState(address voter);
    error NoVotesCast();
    
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
        bool hasVoted;
    }
    
    mapping(address => Voter) public voters;
    address[] public voterAddresses;
    
    // Election state
    bool public electionOpened;
    address private owner;
    
    // Vote tallies (computed when election closes)
    utUint64[5] private voteTallies; // Index 0 unused, 1-4 for options
    bool private talliesInitialized;
    
    // Events for tracking operations
    event VoterRegistered(address indexed voterId, string name);
    event VoteCast(address indexed voter);
    event VoteChanged(address indexed voter);
    event ElectionStateChanged(bool isOpen);
    
    constructor() {
        owner = msg.sender;
        electionOpened = true;
        
        // Initialize voting options
        votingOptions[0] = VoteOption(1, "Chocolate");
        votingOptions[1] = VoteOption(2, "Raspberry");
        votingOptions[2] = VoteOption(3, "Sandwich");
        votingOptions[3] = VoteOption(4, "Mango");
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwnerAllowed();
        _;
    }
    
    modifier onlyRegisteredVoter() {
        if (!voters[msg.sender].isRegistered) revert VoterNotRegistered(msg.sender);
        _;
    }
    
    modifier electionOpen() {
        if (!electionOpened) revert ElectionClosed();
        _;
    }
    
    modifier electionClosed() {
        if (electionOpened) revert ElectionStillOpen();
        _;
    }
    
    // Voter registration functionality
    function addVoter(string memory name, address voterId) public onlyOwner {
        if (voters[voterId].isRegistered) revert VoterAlreadyRegistered(voterId);
        if (voterId == address(0)) revert InvalidVoterAddress();
        if (bytes(name).length == 0) revert EmptyVoterName();
        
        // Check for whitespace-only names
        bytes memory nameBytes = bytes(name);
        bool hasNonWhitespace = false;
        for (uint i = 0; i < nameBytes.length; i++) {
            if (nameBytes[i] != 0x20) { // 0x20 is space character
                hasNonWhitespace = true;
                break;
            }
        }
        if (!hasNonWhitespace) revert EmptyVoterName();
        
        // Initialize voter with empty encrypted vote (will be set when they vote)
        utUint8 memory emptyVote;
        
        voters[voterId] = Voter({
            name: name,
            voterId: voterId,
            encryptedVote: emptyVote,
            isRegistered: true,
            hasVoted: false
        });
        
        voterAddresses.push(voterId);
        
        emit VoterRegistered(voterId, name);
    }
    
    // Voter lookup and validation helper methods
    function isVoterRegistered(address voterId) public view returns (bool) {
        return voters[voterId].isRegistered;
    }
    
    function getVoterInfo(address voterId) public view returns (string memory name, bool isRegistered) {
        Voter memory voter = voters[voterId];
        return (voter.name, voter.isRegistered);
    }
    
    function getRegisteredVoterCount() public view returns (uint256) {
        return voterAddresses.length;
    }
    
    function getVoterAddresses() public view returns (address[] memory) {
        return voterAddresses;
    }
    
    // Encrypted voting functionality
    function castVote(itUint8 calldata encryptedVote) public onlyRegisteredVoter electionOpen {
        
        // Validate the encrypted input and convert to gtUint8
        gtUint8 validatedVote = MpcCore.validateCiphertext(encryptedVote);
        
        // Convert to utUint8 for storage
        utUint8 memory storedVote = MpcCore.offBoardCombined(validatedVote, msg.sender);
        
        // Store the encrypted vote
        voters[msg.sender].encryptedVote = storedVote;
        voters[msg.sender].hasVoted = true;
        
        emit VoteCast(msg.sender);
    }
    
    function changeVote(itUint8 calldata newEncryptedVote) public onlyRegisteredVoter electionOpen {
        
        // Validate the encrypted input and convert to gtUint8
        gtUint8 validatedVote = MpcCore.validateCiphertext(newEncryptedVote);
        
        // Convert to utUint8 for storage
        utUint8 memory storedVote = MpcCore.offBoardCombined(validatedVote, msg.sender);
        
        // Update the encrypted vote (maintains encryption throughout)
        voters[msg.sender].encryptedVote = storedVote;
        // hasVoted remains true since they already voted
        
        emit VoteChanged(msg.sender);
    }
    
    // Election control methods
    function toggleElection() public onlyOwner {
        // Additional validation: ensure there are voters registered before closing election
        if (electionOpened && voterAddresses.length == 0) {
            revert CannotCloseElectionWithoutVoters();
        }
        
        electionOpened = !electionOpened;
        emit ElectionStateChanged(electionOpened);
    }
    
    // Vote aggregation logic - secure vote counting using COTI MPC operations
    function _aggregateVotes() private {
        if (voterAddresses.length == 0) revert NoVotersRegistered();
        
        // Check if any votes have been cast
        bool anyVotesCast = false;
        for (uint256 i = 0; i < voterAddresses.length; i++) {
            if (voters[voterAddresses[i]].hasVoted) {
                anyVotesCast = true;
                break;
            }
        }
        
        // If no votes have been cast, revert with specific error
        if (!anyVotesCast) revert NoVotesCast();
        
        // Initialize vote tallies to 0 for each option (1-4) only once
        if (!talliesInitialized) {
            for (uint8 i = 1; i <= 4; i++) {
                gtUint64 gtZero = MpcCore.setPublic64(0);
                utUint64 memory zeroTally = MpcCore.offBoardCombined(gtZero, owner);
                voteTallies[i] = zeroTally;
            }
            talliesInitialized = true;
        }
        
        // Iterate through all registered voters and aggregate their votes
        for (uint256 i = 0; i < voterAddresses.length; i++) {
            address voterAddr = voterAddresses[i];
            Voter storage voter = voters[voterAddr];
            
            // Ensure voter is still registered (defensive programming)
            if (!voter.isRegistered) revert InvalidVoterState(voterAddr);
            
            // Skip voters who haven't voted yet
            if (!voter.hasVoted) continue;
            
            // Load the encrypted vote using MpcCore.onBoard()
            gtUint8 encryptedVote = MpcCore.onBoard(voter.encryptedVote.ciphertext);
            
            // For each voting option (1-4), check if this vote matches and add to tally
            for (uint8 optionId = 1; optionId <= 4; optionId++) {
                // Create encrypted version of the option ID for comparison
                gtUint8 optionValue = MpcCore.setPublic8(optionId);
                
                // Check if the vote equals this option (returns encrypted boolean)
                gtBool isMatch = MpcCore.eq(encryptedVote, optionValue);
                
                // Convert boolean to uint64 (1 if match, 0 if not)
                gtUint64 one = MpcCore.setPublic64(1);
                gtUint64 zero = MpcCore.setPublic64(0);
                gtUint64 voteIncrement = MpcCore.mux(isMatch, zero, one);
                
                // Load current tally and add the increment
                gtUint64 currentTally = MpcCore.onBoard(voteTallies[optionId].ciphertext);
                gtUint64 newTally = MpcCore.add(currentTally, voteIncrement);
                
                // Store the updated tally
                utUint64 memory updatedTally = MpcCore.offBoardCombined(newTally, owner);
                voteTallies[optionId] = updatedTally;
            }
        }
    }
    
    // Results retrieval method - returns VoteResult array with option IDs and labels
    function getResults() public electionClosed returns (VoteResult[4] memory) {
        if (voterAddresses.length == 0) revert NoVotersRegistered();
        
        // Aggregate votes first to ensure tallies are up to date
        _aggregateVotes();
        
        // Create results array to return
        VoteResult[4] memory results;
        
        // Decrypt vote tallies and populate results with option IDs and labels
        for (uint8 i = 0; i < 4; i++) {
            uint8 optionId = votingOptions[i].id; // 1-4
            string memory optionLabel = votingOptions[i].label;
            
            uint64 decryptedCount = 0;
            
            // Only decrypt if tallies have been initialized
            if (talliesInitialized) {
                // Load and decrypt the vote tally for this option
                gtUint64 encryptedTally = MpcCore.onBoard(voteTallies[optionId].ciphertext);
                decryptedCount = MpcCore.decrypt(encryptedTally);
            }
            
            // Create result entry with option ID, label, and decrypted vote count
            results[i] = VoteResult({
                optionId: optionId,
                optionLabel: optionLabel,
                voteCount: decryptedCount
            });
        }
        
        return results;
    }
    
    // Getter methods for voting options and question
    function getVotingOptions() public view returns (VoteOption[4] memory) {
        return votingOptions;
    }
    
    function getVotingQuestion() public pure returns (string memory) {
        return VOTING_QUESTION;
    }
    
    // Additional helper functions with error handling
    function getElectionStatus() public view returns (bool isOpen, uint256 voterCount, address electionOwner) {
        return (electionOpened, voterAddresses.length, owner);
    }
    
    function validateVoteOption(uint8 optionId) public pure returns (bool) {
        return optionId >= 1 && optionId <= 4;
    }
}