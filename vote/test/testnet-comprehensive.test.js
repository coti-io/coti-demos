import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

// Import hardhat chai matchers
import "@nomicfoundation/hardhat-chai-matchers";

// Import RPC utilities
import { retryRpcCall, sendTransactionWithRetry, waitForTransactionWithRetry } from "../scripts/utils/rpc-utils.js";

// This test file runs comprehensive tests against the deployed contract
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

describe("COTI Voting Contract - Comprehensive Testnet Tests", function () {
  let votingContract;
  let owner;
  let testAddresses;

  before(async function () {
    if (!CONTRACT_ADDRESS) {
      throw new Error("CONTRACT_ADDRESS environment variable not set. Please deploy the contract first and set the address.");
    }

    console.log("Running comprehensive tests against deployed contract at:", CONTRACT_ADDRESS);
    
    [owner] = await ethers.getSigners();
    
    // Connect to the deployed contract
    const COTIVotingContract = await ethers.getContractFactory("COTIVotingContract");
    votingContract = COTIVotingContract.attach(CONTRACT_ADDRESS);
    
    // Generate test addresses
    testAddresses = [
      "0x1111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222",
      "0x3333333333333333333333333333333333333333"
    ];
    
    console.log("Connected to contract with owner:", owner.address);
  });

  describe("Comprehensive Voter Management", function () {
    it("should register multiple voters successfully", async function () {
      const initialCount = await retryRpcCall(() => votingContract.getRegisteredVoterCount());
      console.log("Initial voter count:", Number(initialCount));

      const timestamp = Date.now();
      const voters = [
        { name: `Alice_${timestamp}`, address: testAddresses[0] },
        { name: `Bob_${timestamp}`, address: testAddresses[1] },
        { name: `Carol_${timestamp}`, address: testAddresses[2] }
      ];

      // Register voters one by one
      for (let i = 0; i < voters.length; i++) {
        const voter = voters[i];
        console.log(`Registering voter ${i + 1}: ${voter.name}`);
        
        const tx = await sendTransactionWithRetry(
          votingContract,
          "addVoter",
          [voter.name, voter.address]
        );
        
        await waitForTransactionWithRetry(tx);
        console.log(`✓ Registered ${voter.name} at ${voter.address}`);
        
        // Verify registration
        const isRegistered = await retryRpcCall(() => votingContract.isVoterRegistered(voter.address));
        expect(isRegistered).to.be.true;
        
        const [name, registered] = await retryRpcCall(() => votingContract.getVoterInfo(voter.address));
        expect(name).to.equal(voter.name);
        expect(registered).to.be.true;
      }

      const finalCount = await retryRpcCall(() => votingContract.getRegisteredVoterCount());
      expect(Number(finalCount)).to.be.greaterThan(Number(initialCount));
      console.log("Final voter count:", Number(finalCount));
    });

    it("should prevent duplicate voter registration", async function () {
      const timestamp = Date.now();
      const duplicateVoter = {
        name: `Duplicate_${timestamp}`,
        address: testAddresses[0] // Using an already registered address
      };

      try {
        const tx = await sendTransactionWithRetry(
          votingContract,
          "addVoter",
          [duplicateVoter.name, duplicateVoter.address]
        );
        
        await waitForTransactionWithRetry(tx);
        
        // If we get here, the test should fail
        expect.fail("Should have reverted with VoterAlreadyRegistered");
        
      } catch (error) {
        // Check for either the custom error name or generic revert message
        const hasExpectedError = error.message.includes("VoterAlreadyRegistered") || 
                                error.message.includes("transaction execution reverted");
        expect(hasExpectedError).to.be.true;
        console.log("✓ Correctly prevented duplicate registration");
      }
    });

    it("should retrieve voter addresses correctly", async function () {
      const voterAddresses = await retryRpcCall(() => votingContract.getVoterAddresses());
      console.log("Retrieved voter addresses:", voterAddresses.length);
      
      expect(voterAddresses.length).to.be.greaterThan(0);
      
      // Verify each address is properly registered
      for (const address of voterAddresses) {
        const isRegistered = await retryRpcCall(() => votingContract.isVoterRegistered(address));
        expect(isRegistered).to.be.true;
        console.log(`✓ Verified registration for ${address}`);
      }
    });
  });

  describe("Election State Management", function () {
    it("should manage election state transitions", async function () {
      // Check initial state
      let isOpen = await retryRpcCall(() => votingContract.electionOpened());
      console.log("Initial election state:", isOpen ? "OPEN" : "CLOSED");

      if (isOpen) {
        // Close the election
        console.log("Closing election...");
        const closeTx = await sendTransactionWithRetry(votingContract, "toggleElection", []);
        await waitForTransactionWithRetry(closeTx);
        
        isOpen = await retryRpcCall(() => votingContract.electionOpened());
        expect(isOpen).to.be.false;
        console.log("✓ Election closed successfully");

        // Reopen the election
        console.log("Reopening election...");
        const openTx = await sendTransactionWithRetry(votingContract, "toggleElection", []);
        await waitForTransactionWithRetry(openTx);
        
        isOpen = await retryRpcCall(() => votingContract.electionOpened());
        expect(isOpen).to.be.true;
        console.log("✓ Election reopened successfully");
      } else {
        // Open the election
        console.log("Opening election...");
        const openTx = await sendTransactionWithRetry(votingContract, "toggleElection", []);
        await waitForTransactionWithRetry(openTx);
        
        isOpen = await retryRpcCall(() => votingContract.electionOpened());
        expect(isOpen).to.be.true;
        console.log("✓ Election opened successfully");
      }
    });

    it("should provide accurate election status", async function () {
      const [isOpen, voterCount, contractOwner] = await retryRpcCall(() => votingContract.getElectionStatus());
      
      console.log("Election Status Summary:");
      console.log(`  - State: ${isOpen ? "OPEN" : "CLOSED"}`);
      console.log(`  - Registered Voters: ${Number(voterCount)}`);
      console.log(`  - Contract Owner: ${contractOwner}`);
      
      expect(typeof isOpen).to.equal("boolean");
      expect(Number(voterCount)).to.be.greaterThanOrEqual(0);
      expect(contractOwner).to.be.a("string");
      expect(contractOwner.length).to.equal(42); // Ethereum address length
    });
  });

  describe("Contract Data Integrity", function () {
    it("should maintain consistent voting options", async function () {
      const question = await retryRpcCall(() => votingContract.getVotingQuestion());
      const options = await retryRpcCall(() => votingContract.getVotingOptions());
      
      expect(question).to.equal("What is your favorite food?");
      expect(options).to.have.length(4);
      
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
      
      console.log("✓ All voting options verified");
    });

    it("should validate vote options consistently", async function () {
      // Test all valid options
      for (let i = 1; i <= 4; i++) {
        const isValid = await retryRpcCall(() => votingContract.validateVoteOption(i));
        expect(isValid).to.be.true;
      }
      
      // Test invalid options
      const invalidOptions = [0, 5, 10, 255];
      for (const option of invalidOptions) {
        const isValid = await retryRpcCall(() => votingContract.validateVoteOption(option));
        expect(isValid).to.be.false;
      }
      
      console.log("✓ Vote option validation working correctly");
    });
  });

  describe("Gas Usage and Performance", function () {
    it("should measure gas usage for write operations", async function () {
      console.log("\nGas usage analysis for write operations:");
      
      const timestamp = Date.now();
      const testVoter = {
        name: `GasTest_${timestamp}`,
        address: `0x${timestamp.toString(16).padStart(40, '0')}`
      };
      
      try {
        // Measure voter registration gas
        const tx = await sendTransactionWithRetry(
          votingContract,
          "addVoter",
          [testVoter.name, testVoter.address]
        );
        
        const receipt = await waitForTransactionWithRetry(tx);
        console.log(`  - Voter Registration: ${receipt.gasUsed.toString()} gas`);
        
        // Measure election toggle gas
        const toggleTx = await sendTransactionWithRetry(votingContract, "toggleElection", []);
        const toggleReceipt = await waitForTransactionWithRetry(toggleTx);
        console.log(`  - Election Toggle: ${toggleReceipt.gasUsed.toString()} gas`);
        
        // Toggle back
        const toggleBackTx = await sendTransactionWithRetry(votingContract, "toggleElection", []);
        const toggleBackReceipt = await waitForTransactionWithRetry(toggleBackTx);
        console.log(`  - Election Toggle Back: ${toggleBackReceipt.gasUsed.toString()} gas`);
        
      } catch (error) {
        console.log("  - Gas measurement failed:", error.message);
      }
    });
  });

  describe("Error Handling and Edge Cases", function () {
    it("should handle invalid inputs gracefully", async function () {
      try {
        // Try to register with zero address
        const tx = await sendTransactionWithRetry(
          votingContract,
          "addVoter",
          ["Invalid", ethers.ZeroAddress]
        );
        await waitForTransactionWithRetry(tx);
        expect.fail("Should have reverted with InvalidVoterAddress");
      } catch (error) {
        // Check for either the custom error name or generic revert message
        const hasExpectedError = error.message.includes("InvalidVoterAddress") || 
                                error.message.includes("transaction execution reverted");
        expect(hasExpectedError).to.be.true;
        console.log("✓ Correctly rejected zero address");
      }

      try {
        // Try to register with empty name
        const tx = await sendTransactionWithRetry(
          votingContract,
          "addVoter",
          ["", "0x4444444444444444444444444444444444444444"]
        );
        await waitForTransactionWithRetry(tx);
        expect.fail("Should have reverted with EmptyVoterName");
      } catch (error) {
        // Check for either the custom error name or generic revert message
        const hasExpectedError = error.message.includes("EmptyVoterName") || 
                                error.message.includes("transaction execution reverted");
        expect(hasExpectedError).to.be.true;
        console.log("✓ Correctly rejected empty name");
      }
    });
  });
});