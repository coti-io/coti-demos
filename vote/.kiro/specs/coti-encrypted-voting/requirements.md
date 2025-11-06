# Requirements Document

## Introduction

This document specifies the requirements for a COTI encrypted smart contract voting system that enables private voting on a single quiz question with predefined options. The system maintains vote privacy through COTI's encrypted computation capabilities while allowing election management and result tallying.

## Glossary

- **Voting_Contract**: The COTI encrypted smart contract that manages the voting process
- **Voter**: An individual with a unique voterId who can cast votes
- **Vote_Option**: One of the predefined answer choices for the voting question
- **Election_State**: The current status of the election (open or closed)
- **Vote_Tally**: The aggregated count of votes for each option
- **Encrypted_Vote**: A vote value stored using COTI's encryption to maintain privacy

## Requirements

### Requirement 1

**User Story:** As a voter, I want to cast a private vote for my preferred option, so that my choice remains confidential until results are revealed.

#### Acceptance Criteria

1. WHEN a voter submits an encrypted vote, THE Voting_Contract SHALL store the vote using COTI encryption
2. THE Voting_Contract SHALL initialize each voter's vote to an invalid option (0)
3. WHILE the election is open, THE Voting_Contract SHALL allow voters to change their votes
4. THE Voting_Contract SHALL maintain vote privacy until election results are requested

### Requirement 2

**User Story:** As an election administrator, I want to control the election state, so that I can open and close voting periods.

#### Acceptance Criteria

1. THE Voting_Contract SHALL initialize with electionOpened set to true
2. THE Voting_Contract SHALL provide a method to toggle the electionOpened state
3. WHEN electionOpened is false, THE Voting_Contract SHALL prevent new votes from being cast
4. THE Voting_Contract SHALL allow only authorized users to change the election state

### Requirement 3

**User Story:** As an election administrator, I want to add new voters to the system, so that eligible participants can vote.

#### Acceptance Criteria

1. THE Voting_Contract SHALL allow adding new voters with unique voterIds
2. WHEN a new voter is added, THE Voting_Contract SHALL initialize their vote to 0 (invalid option)
3. THE Voting_Contract SHALL store voter information including name and voterId
4. THE Voting_Contract SHALL prevent duplicate voter registration

### Requirement 4

**User Story:** As an election observer, I want to view election results, so that I can see the vote tallies for each option.

#### Acceptance Criteria

1. WHEN electionOpened is false, THE Voting_Contract SHALL allow retrieval of election results
2. IF electionOpened is true, THEN THE Voting_Contract SHALL prevent access to election results
3. THE Voting_Contract SHALL return vote tallies for all four predefined options
4. THE Voting_Contract SHALL decrypt and aggregate votes to produce accurate totals

### Requirement 5

**User Story:** As a system user, I want to interact with a predefined voting question and options, so that the voting process is consistent and standardized.

#### Acceptance Criteria

1. THE Voting_Contract SHALL store the static question "What is your favorite food?"
2. THE Voting_Contract SHALL define four voting options: Chocolate (1), Raspberry (2), Sandwich (3), Mango (4)
3. THE Voting_Contract SHALL validate that votes are cast for valid option IDs (1-4)
4. THE Voting_Contract SHALL reject votes for invalid option IDs