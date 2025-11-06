import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

// Import hardhat chai matchers
import "@nomicfoundation/hardhat-chai-matchers";

describe("COTI Voting Contract - Integration Tests", function () {
  let votingContract;
  let owner;
  let voter1;
  let voter2;
  let voter3;
  let voter4;

  beforeEach(async function () {
    [owner, voter1, voter2, voter3, voter4] = await ethers.getSigners();
    
    const COTIVotingContract = await ethers.getContractFactory("COTIVotingContract");
    votingContract = await COTIVotingContract.deploy();
    await votingContract.waitForDeployment();
  });

  describe("Complete Voting Workflow", function () {
    it("should handle complete election lifecycle with voter registration", async function () {
      // Phase 1: Election Setup and Voter Registration
      expect(await votingContract.electionOpened()).to.be.true;
      expect(Number(await votingContract.getRegisteredVoterCount())).to.equal(0);

      // Register multiple voters
      await expect(votingContract.addVoter("Alice Smith", voter1.address))
        .to.emit(votingContract, "VoterRegistered")
        .withArgs(voter1.address, "Alice Smith");

      await expect(votingContract.addVoter("Bob Johnson", voter2.address))
        .to.emit(votingContract, "VoterRegistered")
        .withArgs(voter2.address, "Bob Johnson");

      await expect(votingContract.addVoter("Carol Davis", voter3.address))
        .to.emit(votingContract, "VoterRegistered")
        .withArgs(voter3.address, "Carol Davis");

      // Verify voter registration
      expect(Number(await votingContract.getRegisteredVoterCount())).to.equal(3);
      expect(await votingContract.isVoterRegistered(voter1.address)).to.be.true;
      expect(await votingContract.isVoterRegistered(voter2.address)).to.be.true;
      expect(await votingContract.isVoterRegistered(voter3.address)).to.be.true;
      expect(await votingContract.isVoterRegistered(voter4.address)).to.be.false;

      // Phase 2: Election Management
      // Verify election is open and results are not accessible
      await expect(votingContract.getResults())
        .to.be.revertedWithCustomError(votingContract, "ElectionStillOpen");

      // Close election
      await expect(votingContract.toggleElection())
        .to.emit(votingContract, "ElectionStateChanged")
        .withArgs(false);

      expect(await votingContract.electionOpened()).to.be.false;

      // Phase 3: Results with No Votes
      // Should get NoVotesCast error since no votes were cast
      await expect(votingContract.getResults())
        .to.be.revertedWithCustomError(votingContract, "NoVotesCast");

      // Reopen election for voting
      await expect(votingContract.toggleElection())
        .to.emit(votingContract, "ElectionStateChanged")
        .withArgs(true);

      expect(await votingContract.electionOpened()).to.be.true;
    });

    it("should handle voter information retrieval correctly", async function () {
      // Register voters with different names
      await votingContract.addVoter("Alice Smith", voter1.address);
      await votingContract.addVoter("Bob Johnson", voter2.address);

      // Test voter info retrieval
      const [name1, registered1] = await votingContract.getVoterInfo(voter1.address);
      expect(name1).to.equal("Alice Smith");
      expect(registered1).to.be.true;

      const [name2, registered2] = await votingContract.getVoterInfo(voter2.address);
      expect(name2).to.equal("Bob Johnson");
      expect(registered2).to.be.true;

      // Test unregistered voter
      const [name3, registered3] = await votingContract.getVoterInfo(voter3.address);
      expect(name3).to.equal("");
      expect(registered3).to.be.false;

      // Test voter addresses retrieval
      const voterAddresses = await votingContract.getVoterAddresses();
      expect(voterAddresses).to.have.length(2);
      expect(voterAddresses[0]).to.equal(voter1.address);
      expect(voterAddresses[1]).to.equal(voter2.address);
    });
  });

  describe("Multi-Voter Scenarios", function () {
    beforeEach(async function () {
      // Register multiple voters for each test
      await votingContract.addVoter("Alice", voter1.address);
      await votingContract.addVoter("Bob", voter2.address);
      await votingContract.addVoter("Carol", voter3.address);
    });

    it("should handle election state transitions with multiple voters", async function () {
      // Verify initial state
      expect(await votingContract.electionOpened()).to.be.true;
      expect(Number(await votingContract.getRegisteredVoterCount())).to.equal(3);

      // Test election status retrieval
      const [isOpen, voterCount, electionOwner] = await votingContract.getElectionStatus();
      expect(isOpen).to.be.true;
      expect(Number(voterCount)).to.equal(3);
      expect(electionOwner).to.equal(owner.address);

      // Close election
      await votingContract.toggleElection();
      expect(await votingContract.electionOpened()).to.be.false;

      // Verify closed state
      const [isOpenAfter, voterCountAfter, ownerAfter] = await votingContract.getElectionStatus();
      expect(isOpenAfter).to.be.false;
      expect(Number(voterCountAfter)).to.equal(3);
      expect(ownerAfter).to.equal(owner.address);
    });

    it("should prevent duplicate registrations across multiple voters", async function () {
      // Try to register same address with different name
      await expect(votingContract.addVoter("Alice Again", voter1.address))
        .to.be.revertedWithCustomError(votingContract, "VoterAlreadyRegistered")
        .withArgs(voter1.address);

      // Try to register same address with same name
      await expect(votingContract.addVoter("Alice", voter1.address))
        .to.be.revertedWithCustomError(votingContract, "VoterAlreadyRegistered")
        .withArgs(voter1.address);

      // Verify count hasn't changed
      expect(Number(await votingContract.getRegisteredVoterCount())).to.equal(3);
    });
  });

  describe("Access Control and Security", function () {
    beforeEach(async function () {
      await votingContract.addVoter("Alice", voter1.address);
      await votingContract.addVoter("Bob", voter2.address);
    });

    it("should enforce owner-only operations", async function () {
      // Non-owner cannot register voters
      await expect(votingContract.connect(voter1).addVoter("Charlie", voter3.address))
        .to.be.revertedWithCustomError(votingContract, "OnlyOwnerAllowed");

      // Non-owner cannot toggle election
      await expect(votingContract.connect(voter1).toggleElection())
        .to.be.revertedWithCustomError(votingContract, "OnlyOwnerAllowed");

      // Non-owner cannot register themselves
      await expect(votingContract.connect(voter3).addVoter("Charlie", voter3.address))
        .to.be.revertedWithCustomError(votingContract, "OnlyOwnerAllowed");
    });

    it("should validate voter registration requirements", async function () {
      // Cannot register with zero address
      await expect(votingContract.addVoter("Invalid", ethers.ZeroAddress))
        .to.be.revertedWithCustomError(votingContract, "InvalidVoterAddress");

      // Cannot register with empty name
      await expect(votingContract.addVoter("", voter3.address))
        .to.be.revertedWithCustomError(votingContract, "EmptyVoterName");

      // Cannot register with whitespace-only name
      await expect(votingContract.addVoter("   ", voter3.address))
        .to.be.revertedWithCustomError(votingContract, "EmptyVoterName");
    });

    it("should handle election closure validation", async function () {
      // Cannot close election without voters (test with fresh contract)
      const COTIVotingContract = await ethers.getContractFactory("COTIVotingContract");
      const freshContract = await COTIVotingContract.deploy();
      await freshContract.waitForDeployment();

      await expect(freshContract.toggleElection())
        .to.be.revertedWithCustomError(freshContract, "CannotCloseElectionWithoutVoters");

      // Can close election with voters
      await freshContract.addVoter("Test", voter1.address);
      await expect(freshContract.toggleElection())
        .to.emit(freshContract, "ElectionStateChanged")
        .withArgs(false);
    });
  });

  describe("Voting Options and Validation", function () {
    it("should provide correct voting options and question", async function () {
      // Test voting question
      const question = await votingContract.getVotingQuestion();
      expect(question).to.equal("What is your favorite food?");

      // Test voting options
      const options = await votingContract.getVotingOptions();
      expect(options).to.have.length(4);

      // Verify each option
      const expectedOptions = [
        { id: 1, label: "Chocolate" },
        { id: 2, label: "Raspberry" },
        { id: 3, label: "Sandwich" },
        { id: 4, label: "Mango" }
      ];

      for (let i = 0; i < 4; i++) {
        expect(Number(options[i].id)).to.equal(expectedOptions[i].id);
        expect(options[i].label).to.equal(expectedOptions[i].label);
      }
    });

    it("should validate vote options correctly", async function () {
      // Valid options
      for (let i = 1; i <= 4; i++) {
        expect(await votingContract.validateVoteOption(i)).to.be.true;
      }

      // Invalid options
      const invalidOptions = [0, 5, 10, 255];
      for (const option of invalidOptions) {
        expect(await votingContract.validateVoteOption(option)).to.be.false;
      }
    });
  });

  describe("Error Handling and Edge Cases", function () {
    it("should handle various error conditions properly", async function () {
      // Test with no voters registered
      await expect(votingContract.toggleElection())
        .to.be.revertedWithCustomError(votingContract, "CannotCloseElectionWithoutVoters");

      // Register voters and close election
      await votingContract.addVoter("Alice", voter1.address);
      await votingContract.addVoter("Bob", voter2.address);
      await votingContract.toggleElection();

      // Test results with no votes cast
      await expect(votingContract.getResults())
        .to.be.revertedWithCustomError(votingContract, "NoVotesCast");
    });

    it("should maintain data consistency across operations", async function () {
      // Register voters
      await votingContract.addVoter("Alice", voter1.address);
      await votingContract.addVoter("Bob", voter2.address);
      await votingContract.addVoter("Carol", voter3.address);

      // Verify consistent data
      expect(Number(await votingContract.getRegisteredVoterCount())).to.equal(3);
      
      const addresses = await votingContract.getVoterAddresses();
      expect(addresses).to.have.length(3);
      expect(addresses[0]).to.equal(voter1.address);
      expect(addresses[1]).to.equal(voter2.address);
      expect(addresses[2]).to.equal(voter3.address);

      // Verify each voter individually
      for (const address of addresses) {
        expect(await votingContract.isVoterRegistered(address)).to.be.true;
        const [name, registered] = await votingContract.getVoterInfo(address);
        expect(registered).to.be.true;
        expect(name.length).to.be.greaterThan(0);
      }
    });
  });
});