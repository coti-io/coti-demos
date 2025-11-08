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
    error VoterHasNotVoted(address voter);
    
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
        ctUint8 encryptedVote;  // COTI encrypted vote (0 = not voted, 1-4 = options)
        bool isRegistered;
        bool hasVoted;
        bool hasAuthorizedOwner;  // Whether voter has authorized owner to read their vote
    }
    
    mapping(address => Voter) public voters;
    address[] public voterAddresses;
    
    // Election state
    bool public electionOpened;
    address private owner;
    
    // Vote tallies (computed when election closes)
    ctUint64[5] private voteTallies; // Index 0 unused, 1-4 for options
    bool private talliesInitialized;
    bool private resultsAggregated; // Track if results have been aggregated for current election
    
    // Events for tracking operations
    event VoterRegistered(address indexed voterId, string name);
    event VoteCast(address indexed voter);
    event VoteChanged(address indexed voter);
    event ElectionStateChanged(bool isOpen);
    event OwnerAuthorized(address indexed voter);
    event ResultsDecrypted(uint8 indexed optionId, string optionLabel, uint64 voteCount);
    
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
        ctUint8 emptyVote;
        
        voters[voterId] = Voter({
            name: name,
            voterId: voterId,
            encryptedVote: emptyVote,
            isRegistered: true,
            hasVoted: false,
            hasAuthorizedOwner: false
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
    
    // Authorization functionality - voters authorize owner to read their votes for tallying
    function authorizeOwnerToReadVote() public onlyRegisteredVoter {
        require(!voters[msg.sender].hasAuthorizedOwner, "Owner already authorized");
        
        voters[msg.sender].hasAuthorizedOwner = true;
        
        emit OwnerAuthorized(msg.sender);
    }
    
    // Encrypted voting functionality
    function castVote(itUint8 calldata encryptedVote) public onlyRegisteredVoter electionOpen {
        
        // Validate the encrypted input and convert to gtUint8
        gtUint8 validatedVote = MpcCore.validateCiphertext(encryptedVote);
        
        // Store with generic encryption (like medical records)
        ctUint8 storedVote = MpcCore.offBoard(validatedVote);
        
        // Store the encrypted vote
        voters[msg.sender].encryptedVote = storedVote;
        voters[msg.sender].hasVoted = true;
        
        // Automatically authorize owner when casting vote
        if (!voters[msg.sender].hasAuthorizedOwner) {
            voters[msg.sender].hasAuthorizedOwner = true;
            emit OwnerAuthorized(msg.sender);
        }
        
        emit VoteCast(msg.sender);
    }
    
    function changeVote(itUint8 calldata newEncryptedVote) public onlyRegisteredVoter electionOpen {
        
        // Validate the encrypted input and convert to gtUint8
        gtUint8 validatedVote = MpcCore.validateCiphertext(newEncryptedVote);
        
        // Store with generic encryption (like medical records)
        ctUint8 storedVote = MpcCore.offBoard(validatedVote);
        
        // Update the encrypted vote
        voters[msg.sender].encryptedVote = storedVote;
        // hasVoted remains true since they already voted
        
        // Automatically authorize owner when changing vote (if not already authorized)
        if (!voters[msg.sender].hasAuthorizedOwner) {
            voters[msg.sender].hasAuthorizedOwner = true;
            emit OwnerAuthorized(msg.sender);
        }
        
        emit VoteChanged(msg.sender);
    }
    
    // Vote verification method - allows voters to retrieve their own encrypted vote
    // Works exactly like getRecordForDoctor() in medical records
    function getMyVote() public onlyRegisteredVoter returns (ctUint8) {
        // Check that voter has cast a vote
        if (!voters[msg.sender].hasVoted) revert VoterHasNotVoted(msg.sender);
        
        // Load the generically encrypted vote
        gtUint8 gtVote = MpcCore.onBoard(voters[msg.sender].encryptedVote);
        
        // Re-encrypt for voter (same pattern as doctor reading patient record)
        ctUint8 voteForVoter = MpcCore.offBoardToUser(gtVote, msg.sender);
        
        // Return voter-specific encrypted vote
        return voteForVoter;
    }
    
    // Election control methods
    function toggleElection() public onlyOwner {
        // Additional validation: ensure there are voters registered before closing election
        if (electionOpened && voterAddresses.length == 0) {
            revert CannotCloseElectionWithoutVoters();
        }
        
        electionOpened = !electionOpened;
        
        // Reset aggregation flag when reopening election
        if (electionOpened) {
            resultsAggregated = false;
            talliesInitialized = false;
        }
        
        emit ElectionStateChanged(electionOpened);
    }
    
    // Vote aggregation logic - secure vote counting using COTI MPC operations
    function _aggregateVotes() private {
        if (voterAddresses.length == 0) revert NoVotersRegistered();
        
        // Skip if already aggregated for this election
        if (resultsAggregated) return;
        
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
        
        // Initialize vote tallies to 0 for each option (1-4)
        for (uint8 i = 1; i <= 4; i++) {
            gtUint64 gtZero = MpcCore.setPublic64(0);
            ctUint64 zeroTally = MpcCore.offBoard(gtZero);
            voteTallies[i] = zeroTally;
        }
        talliesInitialized = true;
        
        // Iterate through all registered voters and aggregate their votes
        for (uint256 i = 0; i < voterAddresses.length; i++) {
            address voterAddr = voterAddresses[i];
            Voter storage voter = voters[voterAddr];
            
            // Ensure voter is still registered (defensive programming)
            if (!voter.isRegistered) revert InvalidVoterState(voterAddr);
            
            // Skip voters who haven't voted yet
            if (!voter.hasVoted) continue;
            
            // Voter must have authorized owner to read their vote for tallying
            require(voter.hasAuthorizedOwner, "Voter has not authorized owner to read vote");
            
            // Load the encrypted vote (encrypted for the voter)
            gtUint8 encryptedVote = MpcCore.onBoard(voter.encryptedVote);
            
            // For each voting option (1-4), check if this vote matches and add to tally
            for (uint8 optionId = 1; optionId <= 4; optionId++) {
                // Create encrypted version of the option ID for comparison
                gtUint8 optionValue = MpcCore.setPublic8(optionId);
                
                // Check if the vote equals this option (returns encrypted boolean)
                gtBool isMatch = MpcCore.eq(encryptedVote, optionValue);
                
                // Convert boolean to uint64 (1 if match, 0 if not)
                gtUint64 one = MpcCore.setPublic64(1);
                gtUint64 zero = MpcCore.setPublic64(0);
                gtUint64 voteIncrement = MpcCore.mux(isMatch, one, zero);
                
                // Load current tally and add the increment
                gtUint64 currentTally = MpcCore.onBoard(voteTallies[optionId]);
                gtUint64 newTally = MpcCore.add(currentTally, voteIncrement);
                
                // Store the updated tally (generic ciphertext)
                ctUint64 updatedTally = MpcCore.offBoard(newTally);
                voteTallies[optionId] = updatedTally;
            }
        }
        
        // Mark aggregation as complete
        resultsAggregated = true;
    }
    
    // Aggregate votes - must be called before viewing results
    function aggregateVotes() public electionClosed {
        _aggregateVotes();
    }
    
    // View results after aggregation - read-only function
    function viewResults() public view electionClosed returns (VoteResult[4] memory) {
        if (voterAddresses.length == 0) revert NoVotersRegistered();
        require(talliesInitialized, "Votes have not been aggregated yet. Call aggregateVotes() first.");
        
        // Create results array to return
        VoteResult[4] memory results;
        
        // Return results with option IDs and labels (counts are encrypted)
        for (uint8 i = 0; i < 4; i++) {
            uint8 optionId = votingOptions[i].id; // 1-4
            string memory optionLabel = votingOptions[i].label;
            
            // Note: We return 0 for counts since they are encrypted
            // To get actual counts, use getResults() which decrypts them
            results[i] = VoteResult({
                optionId: optionId,
                optionLabel: optionLabel,
                voteCount: 0
            });
        }
        
        return results;
    }
    
    // Results retrieval method - aggregates and decrypts results
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
                // Load the generic encrypted tally and decrypt it
                // MpcCore.decrypt() can decrypt generic ciphertexts when called from a transaction
                gtUint64 encryptedTally = MpcCore.onBoard(voteTallies[optionId]);
                decryptedCount = MpcCore.decrypt(encryptedTally);
                
                // Emit the decrypted result as an event so it can be read from transaction logs
                emit ResultsDecrypted(optionId, optionLabel, decryptedCount);
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