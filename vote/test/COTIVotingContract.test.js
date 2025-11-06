import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

// Import hardhat chai matchers
import "@nomicfoundation/hardhat-chai-matchers";

describe("COTIVotingContract", function () {
  let votingContract;
  let owner;
  let voter1;
  let voter2;
  let voter3;

  beforeEach(async function () {
    [owner, voter1, voter2, voter3] = await ethers.getSigners();
    
    const COTIVotingContract = await ethers.getContractFactory("COTIVotingContract");
    votingContract = await COTIVotingContract.deploy();
    await votingContract.waitForDeployment();
  });

  describe("Contract Initialization", function () {
    it("should initialize with correct voting question", async function () {
      const question = await votingContract.getVotingQuestion();
      expect(question).to.equal("What is your favorite food?");
    });

    it("should initialize with correct voting options", async function () {
      const options = await votingContract.getVotingOptions();
      expect(options).to.have.length(4);
      expect(Number(options[0].id)).to.equal(1);
      expect(options[0].label).to.equal("Chocolate");
      expect(Number(options[1].id)).to.equal(2);
      expect(options[1].label).to.equal("Raspberry");
      expect(Number(options[2].id)).to.equal(3);
      expect(options[2].label).to.equal("Sandwich");
      expect(Number(options[3].id)).to.equal(4);
      expect(options[3].label).to.equal("Mango");
    });

    it("should initialize with election opened", async function () {
      const isOpen = await votingContract.electionOpened();
      expect(isOpen).to.be.true;
    });

    it("should set deployer as owner", async function () {
      const [isOpen, voterCount, electionOwner] = await votingContract.getElectionStatus();
      expect(electionOwner).to.equal(owner.address);
    });
  });

  describe("Voter Registration", function () {
    it("should allow owner to register voters", async function () {
      await expect(votingContract.addVoter("Alice", voter1.address))
        .to.emit(votingContract, "VoterRegistered")
        .withArgs(voter1.address, "Alice");

      const isRegistered = await votingContract.isVoterRegistered(voter1.address);
      expect(isRegistered).to.be.true;

      const [name, registered] = await votingContract.getVoterInfo(voter1.address);
      expect(name).to.equal("Alice");
      expect(registered).to.be.true;
    });

    it("should prevent duplicate voter registration", async function () {
      await votingContract.addVoter("Alice", voter1.address);
      
      await expect(votingContract.addVoter("Alice Again", voter1.address))
        .to.be.revertedWithCustomError(votingContract, "VoterAlreadyRegistered")
        .withArgs(voter1.address);
    });

    it("should prevent registration with invalid address", async function () {
      await expect(votingContract.addVoter("Invalid", ethers.ZeroAddress))
        .to.be.revertedWithCustomError(votingContract, "InvalidVoterAddress");
    });

    it("should prevent registration with empty name", async function () {
      await expect(votingContract.addVoter("", voter1.address))
        .to.be.revertedWithCustomError(votingContract, "EmptyVoterName");
    });

    it("should prevent non-owner from registering voters", async function () {
      await expect(votingContract.connect(voter1).addVoter("Alice", voter2.address))
        .to.be.revertedWithCustomError(votingContract, "OnlyOwnerAllowed");
    });

    it("should track registered voter count", async function () {
      expect(Number(await votingContract.getRegisteredVoterCount())).to.equal(0);
      
      await votingContract.addVoter("Alice", voter1.address);
      expect(Number(await votingContract.getRegisteredVoterCount())).to.equal(1);
      
      await votingContract.addVoter("Bob", voter2.address);
      expect(Number(await votingContract.getRegisteredVoterCount())).to.equal(2);
    });
  });

  describe("Election State Management", function () {
    beforeEach(async function () {
      // Register a voter for election state tests
      await votingContract.addVoter("Alice", voter1.address);
    });

    it("should allow owner to toggle election state", async function () {
      expect(await votingContract.electionOpened()).to.be.true;
      
      await expect(votingContract.toggleElection())
        .to.emit(votingContract, "ElectionStateChanged")
        .withArgs(false);
      
      expect(await votingContract.electionOpened()).to.be.false;
      
      await expect(votingContract.toggleElection())
        .to.emit(votingContract, "ElectionStateChanged")
        .withArgs(true);
      
      expect(await votingContract.electionOpened()).to.be.true;
    });

    it("should prevent non-owner from toggling election", async function () {
      await expect(votingContract.connect(voter1).toggleElection())
        .to.be.revertedWithCustomError(votingContract, "OnlyOwnerAllowed");
    });

    it("should prevent closing election without voters", async function () {
      // Deploy fresh contract without voters
      const COTIVotingContract = await ethers.getContractFactory("COTIVotingContract");
      const freshContract = await COTIVotingContract.deploy();
      await freshContract.waitForDeployment();
      
      await expect(freshContract.toggleElection())
        .to.be.revertedWithCustomError(freshContract, "CannotCloseElectionWithoutVoters");
    });
  });

  describe("Vote Option Validation", function () {
    it("should validate correct vote options", async function () {
      expect(await votingContract.validateVoteOption(1)).to.be.true;
      expect(await votingContract.validateVoteOption(2)).to.be.true;
      expect(await votingContract.validateVoteOption(3)).to.be.true;
      expect(await votingContract.validateVoteOption(4)).to.be.true;
    });

    it("should reject invalid vote options", async function () {
      expect(await votingContract.validateVoteOption(0)).to.be.false;
      expect(await votingContract.validateVoteOption(5)).to.be.false;
      expect(await votingContract.validateVoteOption(255)).to.be.false;
    });
  });

  describe("Access Control", function () {
    it("should prevent accessing results when election is open", async function () {
      await votingContract.addVoter("Alice", voter1.address);
      
      await expect(votingContract.getResults())
        .to.be.revertedWithCustomError(votingContract, "ElectionStillOpen");
    });

    it("should verify voter registration is required", async function () {
      const isRegistered = await votingContract.isVoterRegistered(voter1.address);
      expect(isRegistered).to.be.false;
      
      await votingContract.addVoter("Alice", voter1.address);
      const isNowRegistered = await votingContract.isVoterRegistered(voter1.address);
      expect(isNowRegistered).to.be.true;
    });

    it("should verify election state controls access", async function () {
      await votingContract.addVoter("Alice", voter1.address);
      expect(await votingContract.electionOpened()).to.be.true;
      
      await votingContract.toggleElection();
      expect(await votingContract.electionOpened()).to.be.false;
    });
  });

  describe("Error Handling", function () {
    it("should handle results request with registered voters but no votes cast", async function () {
      // Add voters but don't have them vote
      await votingContract.addVoter("Alice", voter1.address);
      await votingContract.addVoter("Bob", voter2.address);
      
      // Close election
      await votingContract.toggleElection();
      
      // Should revert with NoVotesCast error since no votes were cast
      await expect(votingContract.getResults())
        .to.be.revertedWithCustomError(votingContract, "NoVotesCast");
    });
  });
});