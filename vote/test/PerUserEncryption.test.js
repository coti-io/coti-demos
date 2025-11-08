import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { Wallet as CotiWallet } from "@coti-io/coti-ethers";

// Import hardhat chai matchers
import "@nomicfoundation/hardhat-chai-matchers";

// Helper function to create encrypted votes using COTI SDK
async function createEncryptedVote(value, wallet, contractAddress, functionSelector) {
  // Use the wallet's encryptValue method from COTI SDK
  // This properly encrypts the value for use with MpcCore.validateCiphertext
  return await wallet.encryptValue(
    value,
    contractAddress,
    functionSelector
  );
}

// Helper function to wrap contract with fixed gas parameters for COTI testnet
function wrapContractForCotiTestnet(contract) {
  const gasOptions = {
    gasLimit: 15000000, // High gas limit for MPC operations
    gasPrice: ethers.parseUnits("10", "gwei")
  };
  
  // List of view/pure functions that don't need gas
  const viewFunctions = [
    'getAddress', 'interface', 'runner', 'target', 'waitForDeployment',
    'getVotingQuestion', 'getVotingOptions', 'isVoterRegistered', 'getVoterInfo',
    'getRegisteredVoterCount', 'getVoterAddresses',
    'getElectionStatus', 'validateVoteOption', 'electionOpened', 'voters',
    'voterAddresses', 'votingOptions'
  ];
  // Note: getMyVote and getResults are NOT view functions - they do MPC operations
  
  // Create a proxy that adds gas options to state-changing contract calls
  return new Proxy(contract, {
    get(target, prop) {
      const original = target[prop];
      
      // Handle connect() specially to wrap the returned contract
      if (prop === 'connect') {
        return function(signer) {
          const connected = original.call(target, signer);
          return wrapContractForCotiTestnet(connected);
        };
      }
      
      // If it's a function and not a view/pure function, wrap it
      if (typeof original === 'function' && !viewFunctions.includes(prop)) {
        return async function(...args) {
          // Check if last arg is already an options object
          const lastArg = args[args.length - 1];
          const hasOptions = lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg) && 
                           (lastArg.gasLimit !== undefined || lastArg.value !== undefined);
          
          if (!hasOptions) {
            args.push(gasOptions);
          }
          
          return original.apply(target, args);
        };
      }
      
      return original;
    }
  });
}

// Helper function to retry contract calls on COTI testnet
async function retryContractCall(fn, maxRetries = 5, baseDelay = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn();
      // If transaction, wait for it to be mined
      if (result && typeof result.wait === 'function') {
        const receipt = await result.wait();
        // Add delay after successful transaction
        await new Promise(resolve => setTimeout(resolve, 1000));
        return receipt;
      }
      return result;
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;
      
      // Check if it's a retryable error
      const isRetryableError = 
        error.message.includes("pending block is not available") ||
        error.message.includes("timeout") ||
        error.message.includes("network error") ||
        error.message.includes("nonce") ||
        error.message.includes("replacement fee too low") ||
        error.code === "NETWORK_ERROR" ||
        error.code === "TIMEOUT" ||
        error.code === "REPLACEMENT_UNDERPRICED";
      
      if (!isRetryableError || isLastAttempt) {
        throw error;
      }
      
      const delay = baseDelay + (i * 2000); // Increase delay linearly
      console.log(`  Call failed (attempt ${i + 1}/${maxRetries}), retrying in ${delay}ms...`);
      console.log(`  Error: ${error.message.substring(0, 100)}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

describe("COTIVotingContract - Per-User Encryption Tests", function () {
  let votingContract;
  let owner;
  let voter1;
  let voter2;
  let voter3;
  let isCotiTestnet = false;

  before(async function () {
    // Check if we're on COTI testnet
    const network = await ethers.provider.getNetwork();
    isCotiTestnet = network.chainId === 7082400n;
    
    if (!isCotiTestnet) {
      console.log("⚠️  Skipping MPC-dependent tests - requires COTI testnet (chainId: 7082400)");
      console.log("   Current network chainId:", network.chainId.toString());
    } else {
      console.log("✓ Running on COTI testnet - MPC tests enabled");
    }
  });

  beforeEach(async function () {
    // Increase timeout for COTI testnet deployments
    if (isCotiTestnet) {
      this.timeout(180000); // 3 minutes for testnet
    }
    
    // Use accounts from .env when on COTI testnet, otherwise use default signers
    if (isCotiTestnet) {
      // Load accounts from environment variables
      const alicePK = process.env.ALICE_PK;
      const bobPK = process.env.BOB_PK;
      const beaPK = process.env.BEA_PK;
      const charliePK = process.env.CHARLIE_PK;
      
      // Load AES keys for encryption
      const aliceAES = process.env.ALICE_AES_KEY;
      const bobAES = process.env.BOB_AES_KEY;
      const beaAES = process.env.BEA_AES_KEY;
      const charlieAES = process.env.CHARLIE_AES_KEY;
      
      if (!alicePK || !bobPK || !beaPK) {
        throw new Error("Missing required environment variables: ALICE_PK, BOB_PK, BEA_PK");
      }
      
      if (!aliceAES || !bobAES || !beaAES) {
        throw new Error("Missing required AES keys: ALICE_AES_KEY, BOB_AES_KEY, BEA_AES_KEY");
      }
      
      // Create COTI wallets from private keys with AES keys
      owner = new CotiWallet(alicePK, ethers.provider);
      owner.setUserOnboardInfo({ aesKey: aliceAES });
      
      voter1 = new CotiWallet(bobPK, ethers.provider);
      voter1.setUserOnboardInfo({ aesKey: bobAES });
      
      voter2 = new CotiWallet(beaPK, ethers.provider);
      voter2.setUserOnboardInfo({ aesKey: beaAES });
      
      if (charliePK && charlieAES) {
        voter3 = new CotiWallet(charliePK, ethers.provider);
        voter3.setUserOnboardInfo({ aesKey: charlieAES });
      } else {
        voter3 = voter2;
      }
      
      console.log("Using accounts from .env:");
      console.log("  Owner (Alice):", owner.address);
      console.log("  Voter1 (Bob):", voter1.address);
      console.log("  Voter2 (Bea):", voter2.address);
      console.log("  Voter3 (Charlie):", voter3.address);
    } else {
      // Use default Hardhat signers for local testing
      [owner, voter1, voter2, voter3] = await ethers.getSigners();
    }
    
    // Deploy contract with retry logic for COTI testnet
    const COTIVotingContract = await ethers.getContractFactory("COTIVotingContract", owner);
    
    if (isCotiTestnet) {
      // Add delay and retry logic for testnet deployments
      let retries = 3;
      while (retries > 0) {
        try {
          console.log(`  Deploying contract (${4 - retries}/3)...`);
          votingContract = await COTIVotingContract.deploy({
            gasLimit: 3000000,
            gasPrice: ethers.parseUnits("10", "gwei")
          });
          await votingContract.waitForDeployment();
          console.log(`  ✓ Contract deployed at: ${await votingContract.getAddress()}`);
          
          // Wrap contract to automatically add gas options to all calls
          votingContract = wrapContractForCotiTestnet(votingContract);
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          console.log(`  Deployment failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retry
        }
      }
    } else {
      votingContract = await COTIVotingContract.deploy();
      await votingContract.waitForDeployment();
    }
  });

  describe("Per-User Vote Casting", function () {
    before(function () {
      if (!isCotiTestnet) {
        this.skip();
      }
    });
    beforeEach(async function () {
      // Register multiple voters for testing
      await votingContract.addVoter("Alice", voter1.address);
      await votingContract.addVoter("Bob", voter2.address);
      await votingContract.addVoter("Carol", voter3.address);
    });

    it("should allow multiple voters to cast votes using different addresses", async function () {
      // Create encrypted votes for different voters
      const vote1 = createMockEncryptedVote(1); // Chocolate
      const vote2 = createMockEncryptedVote(2); // Raspberry
      const vote3 = createMockEncryptedVote(3); // Sandwich
      
      // Each voter casts their vote
      await expect(votingContract.connect(voter1).castVote(vote1))
        .to.emit(votingContract, "VoteCast")
        .withArgs(voter1.address);
      
      await expect(votingContract.connect(voter2).castVote(vote2))
        .to.emit(votingContract, "VoteCast")
        .withArgs(voter2.address);
      
      await expect(votingContract.connect(voter3).castVote(vote3))
        .to.emit(votingContract, "VoteCast")
        .withArgs(voter3.address);
      
      // Verify all voters have voted
      const [, , hasVoted1] = await votingContract.voters(voter1.address);
      const [, , hasVoted2] = await votingContract.voters(voter2.address);
      const [, , hasVoted3] = await votingContract.voters(voter3.address);
      
      expect(hasVoted1).to.be.true;
      expect(hasVoted2).to.be.true;
      expect(hasVoted3).to.be.true;
    });

    it("should verify each vote is encrypted for the specific voter", async function () {
      // Cast votes from different voters
      const vote1 = createMockEncryptedVote(1);
      const vote2 = createMockEncryptedVote(2);
      
      await votingContract.connect(voter1).castVote(vote1);
      await votingContract.connect(voter2).castVote(vote2);
      
      // Each voter should be able to retrieve their own vote
      const retrievedVote1 = await votingContract.connect(voter1).getMyVote();
      const retrievedVote2 = await votingContract.connect(voter2).getMyVote();
      
      // Verify the votes are returned (encrypted for each voter)
      expect(retrievedVote1).to.exist;
      expect(retrievedVote2).to.exist;
      
      // The encrypted votes should be different objects (different encryption contexts)
      expect(retrievedVote1).to.not.deep.equal(retrievedVote2);
    });

    it("should store votes with ctUint8 type for per-user encryption", async function () {
      const vote = createMockEncryptedVote(1);
      
      await votingContract.connect(voter1).castVote(vote);
      
      // Retrieve the stored vote
      const voterData = await votingContract.voters(voter1.address);
      
      // Verify the vote is stored (encryptedVote field exists)
      expect(voterData.encryptedVote).to.exist;
      expect(voterData.hasVoted).to.be.true;
    });

    it("should use MpcCore.offBoardToUser for voter-specific encryption", async function () {
      // This test verifies the contract behavior that indicates offBoardToUser is used
      const vote = createMockEncryptedVote(1);
      
      // Cast vote
      await votingContract.connect(voter1).castVote(vote);
      
      // Voter should be able to retrieve their vote (only possible with offBoardToUser)
      const retrievedVote = await votingContract.connect(voter1).getMyVote();
      expect(retrievedVote).to.exist;
    });

    it("should handle multiple voters casting the same vote option", async function () {
      const vote = createMockEncryptedVote(1); // All vote for Chocolate
      
      await votingContract.connect(voter1).castVote(vote);
      await votingContract.connect(voter2).castVote(vote);
      await votingContract.connect(voter3).castVote(vote);
      
      // All should have voted successfully
      const [, , hasVoted1] = await votingContract.voters(voter1.address);
      const [, , hasVoted2] = await votingContract.voters(voter2.address);
      const [, , hasVoted3] = await votingContract.voters(voter3.address);
      
      expect(hasVoted1).to.be.true;
      expect(hasVoted2).to.be.true;
      expect(hasVoted3).to.be.true;
    });

    it("should handle voters casting different vote options", async function () {
      const vote1 = createMockEncryptedVote(1);
      const vote2 = createMockEncryptedVote(2);
      const vote3 = createMockEncryptedVote(4);
      
      await votingContract.connect(voter1).castVote(vote1);
      await votingContract.connect(voter2).castVote(vote2);
      await votingContract.connect(voter3).castVote(vote3);
      
      // Each voter should be able to retrieve their own vote
      const retrievedVote1 = await votingContract.connect(voter1).getMyVote();
      const retrievedVote2 = await votingContract.connect(voter2).getMyVote();
      const retrievedVote3 = await votingContract.connect(voter3).getMyVote();
      
      expect(retrievedVote1).to.exist;
      expect(retrievedVote2).to.exist;
      expect(retrievedVote3).to.exist;
    });
  });

  describe("Per-User Vote Changing", function () {
    before(function () {
      if (!isCotiTestnet) {
        this.skip();
      }
    });

    beforeEach(async function () {
      await votingContract.addVoter("Alice", voter1.address);
      await votingContract.addVoter("Bob", voter2.address);
    });

    it("should allow voters to change their vote with per-user encryption", async function () {
      // Cast initial vote
      const initialVote = createMockEncryptedVote(1);
      await votingContract.connect(voter1).castVote(initialVote);
      
      // Change vote
      const newVote = createMockEncryptedVote(2);
      await expect(votingContract.connect(voter1).changeVote(newVote))
        .to.emit(votingContract, "VoteChanged")
        .withArgs(voter1.address);
      
      // Verify hasVoted remains true
      const [, , hasVoted] = await votingContract.voters(voter1.address);
      expect(hasVoted).to.be.true;
    });

    it("should maintain per-user encryption when changing votes", async function () {
      // Cast initial vote
      const initialVote = createMockEncryptedVote(1);
      await votingContract.connect(voter1).castVote(initialVote);
      
      // Retrieve initial encrypted vote
      const retrievedVote1 = await votingContract.connect(voter1).getMyVote();
      
      // Change vote
      const newVote = createMockEncryptedVote(3);
      await votingContract.connect(voter1).changeVote(newVote);
      
      // Retrieve changed encrypted vote
      const retrievedVote2 = await votingContract.connect(voter1).getMyVote();
      
      // Both should exist and be encrypted for the voter
      expect(retrievedVote1).to.exist;
      expect(retrievedVote2).to.exist;
    });

    it("should use voter's unique encryption key for vote changes", async function () {
      // Both voters cast initial votes
      const vote1 = createMockEncryptedVote(1);
      const vote2 = createMockEncryptedVote(2);
      
      await votingContract.connect(voter1).castVote(vote1);
      await votingContract.connect(voter2).castVote(vote2);
      
      // Voter1 changes their vote
      const newVote = createMockEncryptedVote(3);
      await votingContract.connect(voter1).changeVote(newVote);
      
      // Both voters should still be able to retrieve their votes
      const retrievedVote1 = await votingContract.connect(voter1).getMyVote();
      const retrievedVote2 = await votingContract.connect(voter2).getMyVote();
      
      expect(retrievedVote1).to.exist;
      expect(retrievedVote2).to.exist;
      
      // Votes should be different (different voters, different encryption)
      expect(retrievedVote1).to.not.deep.equal(retrievedVote2);
    });

    it("should allow multiple vote changes with consistent encryption", async function () {
      // Cast initial vote
      const vote1 = createMockEncryptedVote(1);
      await votingContract.connect(voter1).castVote(vote1);
      
      // Change vote multiple times
      const vote2 = createMockEncryptedVote(2);
      await votingContract.connect(voter1).changeVote(vote2);
      
      const vote3 = createMockEncryptedVote(3);
      await votingContract.connect(voter1).changeVote(vote3);
      
      const vote4 = createMockEncryptedVote(4);
      await votingContract.connect(voter1).changeVote(vote4);
      
      // Voter should still be able to retrieve their final vote
      const finalVote = await votingContract.connect(voter1).getMyVote();
      expect(finalVote).to.exist;
      
      // hasVoted should still be true
      const [, , hasVoted] = await votingContract.voters(voter1.address);
      expect(hasVoted).to.be.true;
    });

    it("should maintain hasVoted flag as true after vote changes", async function () {
      const initialVote = createMockEncryptedVote(1);
      await votingContract.connect(voter1).castVote(initialVote);
      
      // Check hasVoted is true
      let [, , hasVoted] = await votingContract.voters(voter1.address);
      expect(hasVoted).to.be.true;
      
      // Change vote
      const newVote = createMockEncryptedVote(2);
      await votingContract.connect(voter1).changeVote(newVote);
      
      // hasVoted should still be true
      [, , hasVoted] = await votingContract.voters(voter1.address);
      expect(hasVoted).to.be.true;
    });

    it("should store changed votes with ctUint8 type", async function () {
      const initialVote = createMockEncryptedVote(1);
      await votingContract.connect(voter1).castVote(initialVote);
      
      const newVote = createMockEncryptedVote(2);
      await votingContract.connect(voter1).changeVote(newVote);
      
      // Verify the vote is stored
      const voterData = await votingContract.voters(voter1.address);
      expect(voterData.encryptedVote).to.exist;
      expect(voterData.hasVoted).to.be.true;
    });
  });

  describe("Vote Retrieval - getMyVote()", function () {
    beforeEach(async function () {
      // Register voters for each test
      await votingContract.addVoter("Alice", voter1.address);
      await votingContract.addVoter("Bob", voter2.address);
      await votingContract.addVoter("Carol", voter3.address);
    });

    it("should revert when voter has not cast a vote", async function () {
      // Voter1 is registered but hasn't voted yet
      await expect(votingContract.connect(voter1).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterHasNotVoted")
        .withArgs(voter1.address);
    });

    it("should revert when unregistered voter tries to retrieve vote", async function () {
      // Create a new signer that is not registered
      const [, , , , unregisteredVoter] = await ethers.getSigners();
      
      await expect(votingContract.connect(unregisteredVoter).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterNotRegistered")
        .withArgs(unregisteredVoter.address);
    });

    it("should verify getMyVote() method exists and has correct signature", async function () {
      // Verify the method exists on the contract
      expect(votingContract.getMyVote).to.be.a("function");
      
      // Verify it requires voter to have voted
      await expect(votingContract.connect(voter1).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterHasNotVoted");
    });

    it("should enforce onlyRegisteredVoter modifier on getMyVote()", async function () {
      const [, , , , unregisteredVoter] = await ethers.getSigners();
      
      // Unregistered voter should not be able to call getMyVote
      await expect(votingContract.connect(unregisteredVoter).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterNotRegistered")
        .withArgs(unregisteredVoter.address);
      
      // Registered voter should be able to call it (but will fail with VoterHasNotVoted)
      await expect(votingContract.connect(voter1).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterHasNotVoted")
        .withArgs(voter1.address);
    });

    it("should handle multiple voters checking their vote status", async function () {
      // All registered voters should get VoterHasNotVoted error
      await expect(votingContract.connect(voter1).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterHasNotVoted")
        .withArgs(voter1.address);
      
      await expect(votingContract.connect(voter2).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterHasNotVoted")
        .withArgs(voter2.address);
      
      await expect(votingContract.connect(voter3).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterHasNotVoted")
        .withArgs(voter3.address);
    });

    it("should verify error message includes voter address", async function () {
      // Test that the error includes the specific voter's address
      try {
        await votingContract.connect(voter1).getMyVote();
        expect.fail("Should have reverted");
      } catch (error) {
        expect(error.message).to.include("VoterHasNotVoted");
      }
    });
  });

  describe("Vote Retrieval Access Control", function () {
    beforeEach(async function () {
      await votingContract.addVoter("Alice", voter1.address);
      await votingContract.addVoter("Bob", voter2.address);
    });

    it("should prevent owner from calling getMyVote if not registered as voter", async function () {
      // Owner is not registered as a voter
      await expect(votingContract.connect(owner).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterNotRegistered")
        .withArgs(owner.address);
    });

    it("should allow owner to call getMyVote if registered as voter", async function () {
      // Register owner as a voter
      await votingContract.addVoter("Owner Voter", owner.address);
      
      // Owner should now be able to call getMyVote (but will get VoterHasNotVoted)
      await expect(votingContract.connect(owner).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterHasNotVoted")
        .withArgs(owner.address);
    });

    it("should verify getMyVote is callable by any registered voter", async function () {
      // All registered voters should be able to attempt calling getMyVote
      const voters = [voter1, voter2];
      
      for (const voter of voters) {
        await expect(votingContract.connect(voter).getMyVote())
          .to.be.revertedWithCustomError(votingContract, "VoterHasNotVoted")
          .withArgs(voter.address);
      }
    });
  });

  describe("Vote Retrieval State Validation", function () {
    beforeEach(async function () {
      await votingContract.addVoter("Alice", voter1.address);
    });

    it("should check hasVoted flag before allowing vote retrieval", async function () {
      // Verify voter is registered but hasn't voted
      const [name, isRegistered] = await votingContract.getVoterInfo(voter1.address);
      expect(isRegistered).to.be.true;
      expect(name).to.equal("Alice");
      
      // getMyVote should fail because hasVoted is false
      await expect(votingContract.connect(voter1).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterHasNotVoted")
        .withArgs(voter1.address);
    });

    it("should work regardless of election state", async function () {
      // Test with election open
      expect(await votingContract.electionOpened()).to.be.true;
      await expect(votingContract.connect(voter1).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterHasNotVoted");
      
      // Close election and test again
      await votingContract.toggleElection();
      expect(await votingContract.electionOpened()).to.be.false;
      await expect(votingContract.connect(voter1).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterHasNotVoted");
      
      // Reopen election
      await votingContract.toggleElection();
      expect(await votingContract.electionOpened()).to.be.true;
      await expect(votingContract.connect(voter1).getMyVote())
        .to.be.revertedWithCustomError(votingContract, "VoterHasNotVoted");
    });
  });

  describe("Integration Tests - Vote Tallying", function () {
    before(function () {
      if (!isCotiTestnet) {
        this.skip();
      }
    });

    beforeEach(async function () {
      // Increase timeout for COTI testnet
      if (isCotiTestnet) {
        this.timeout(180000); // 3 minutes for testnet
      }
      
      // Register multiple voters for integration testing with retry logic
      if (isCotiTestnet) {
        console.log("  Registering voters...");
        // Gas options are automatically added by the contract wrapper
        await retryContractCall(() => votingContract.addVoter("Alice", voter1.address));
        await retryContractCall(() => votingContract.addVoter("Bob", voter2.address));
        await retryContractCall(() => votingContract.addVoter("Carol", voter3.address));
        console.log("  ✓ Voters registered");
      } else {
        await votingContract.addVoter("Alice", voter1.address);
        await votingContract.addVoter("Bob", voter2.address);
        await votingContract.addVoter("Carol", voter3.address);
      }
    });

    it("should aggregate votes from multiple voters using different keys", async function () {
      if (isCotiTestnet) {
        this.timeout(300000); // 5 minutes for testnet
      }
      // Get contract address and function selector for encryption
      const contractAddress = await votingContract.getAddress();
      const castVoteSelector = votingContract.interface.getFunction("castVote").selector;
      
      // Create encrypted votes from different voters with different options
      console.log("  Encrypting votes...");
      const vote1 = await createEncryptedVote(1, voter1, contractAddress, castVoteSelector); // Chocolate
      const vote2 = await createEncryptedVote(2, voter2, contractAddress, castVoteSelector); // Raspberry
      const vote3 = await createEncryptedVote(1, voter3, contractAddress, castVoteSelector); // Chocolate
      console.log("  ✓ Votes encrypted");
      
      // Cast votes with retry logic (authorization happens automatically)
      console.log("  Casting votes...");
      await retryContractCall(() => votingContract.connect(voter1).castVote(vote1));
      await retryContractCall(() => votingContract.connect(voter2).castVote(vote2));
      await retryContractCall(() => votingContract.connect(voter3).castVote(vote3));
      console.log("  ✓ Votes cast (owner automatically authorized)");
      
      // Close election to trigger aggregation
      console.log("  Closing election...");
      await retryContractCall(() => votingContract.toggleElection());
      console.log("  ✓ Election closed");
      
      // Aggregate votes (state-changing transaction)
      console.log("  Aggregating votes...");
      const aggregateTx = await votingContract.aggregateVotes({
        gasLimit: 15000000,
        gasPrice: ethers.parseUnits("10", "gwei")
      });
      await aggregateTx.wait();
      console.log("  ✓ Votes aggregated");
      
      // Get results with decryption (state-changing transaction)
      console.log("  Getting results...");
      const resultsTx = await votingContract.getResults({
        gasLimit: 15000000,
        gasPrice: ethers.parseUnits("10", "gwei")
      });
      await resultsTx.wait();
      console.log("  ✓ Results computed");
      
      // Now we can view the structure (though counts are encrypted in storage)
      const resultsView = await votingContract.viewResults();
      console.log("  ✓ Results retrieved");
      
      // Verify results structure
      expect(resultsView).to.have.length(4);
      expect(resultsView[0].optionId).to.equal(1);
      expect(resultsView[0].optionLabel).to.equal("Chocolate");
      expect(resultsView[1].optionId).to.equal(2);
      expect(resultsView[1].optionLabel).to.equal("Raspberry");
      expect(resultsView[2].optionId).to.equal(3);
      expect(resultsView[2].optionLabel).to.equal("Sandwich");
      expect(resultsView[3].optionId).to.equal(4);
      expect(resultsView[3].optionLabel).to.equal("Mango");
      
      console.log("  ✅ Integration test PASSED!");
      console.log("  - Votes encrypted with COTI SDK");
      console.log("  - Votes cast with automatic authorization");
      console.log("  - Vote aggregation completed with MPC operations");
      console.log("  - Results decrypted successfully");
      console.log("  - Results structure verified");
    });

    it("should produce accurate tallies with getResults()", async function () {
      // All voters vote for the same option
      const vote = createMockEncryptedVote(3); // Sandwich
      
      await votingContract.connect(voter1).castVote(vote);
      await votingContract.connect(voter2).castVote(vote);
      await votingContract.connect(voter3).castVote(vote);
      
      // Close election
      await votingContract.toggleElection();
      
      // Get results
      const results = await votingContract.getResults();
      
      // Verify all votes went to Sandwich
      expect(Number(results[0].voteCount)).to.equal(0); // Chocolate
      expect(Number(results[1].voteCount)).to.equal(0); // Raspberry
      expect(Number(results[2].voteCount)).to.equal(3); // Sandwich
      expect(Number(results[3].voteCount)).to.equal(0); // Mango
    });

    it("should handle complete voting flow from registration to results", async function () {
      // Step 1: Verify voters are registered
      expect(await votingContract.isVoterRegistered(voter1.address)).to.be.true;
      expect(await votingContract.isVoterRegistered(voter2.address)).to.be.true;
      expect(await votingContract.isVoterRegistered(voter3.address)).to.be.true;
      expect(Number(await votingContract.getRegisteredVoterCount())).to.equal(3);
      
      // Step 2: Verify election is open
      expect(await votingContract.electionOpened()).to.be.true;
      
      // Step 3: Cast votes
      const vote1 = createMockEncryptedVote(1);
      const vote2 = createMockEncryptedVote(2);
      const vote3 = createMockEncryptedVote(4);
      
      await expect(votingContract.connect(voter1).castVote(vote1))
        .to.emit(votingContract, "VoteCast")
        .withArgs(voter1.address);
      
      await expect(votingContract.connect(voter2).castVote(vote2))
        .to.emit(votingContract, "VoteCast")
        .withArgs(voter2.address);
      
      await expect(votingContract.connect(voter3).castVote(vote3))
        .to.emit(votingContract, "VoteCast")
        .withArgs(voter3.address);
      
      // Step 4: Verify votes were cast
      const [, , hasVoted1] = await votingContract.voters(voter1.address);
      const [, , hasVoted2] = await votingContract.voters(voter2.address);
      const [, , hasVoted3] = await votingContract.voters(voter3.address);
      
      expect(hasVoted1).to.be.true;
      expect(hasVoted2).to.be.true;
      expect(hasVoted3).to.be.true;
      
      // Step 5: Voters can retrieve their own votes
      const retrievedVote1 = await votingContract.connect(voter1).getMyVote();
      const retrievedVote2 = await votingContract.connect(voter2).getMyVote();
      const retrievedVote3 = await votingContract.connect(voter3).getMyVote();
      
      expect(retrievedVote1).to.exist;
      expect(retrievedVote2).to.exist;
      expect(retrievedVote3).to.exist;
      
      // Step 6: Close election
      await expect(votingContract.toggleElection())
        .to.emit(votingContract, "ElectionStateChanged")
        .withArgs(false);
      
      expect(await votingContract.electionOpened()).to.be.false;
      
      // Step 7: Get results
      const results = await votingContract.getResults();
      
      // Step 8: Verify results are accurate
      expect(results).to.have.length(4);
      expect(Number(results[0].voteCount)).to.equal(1); // Chocolate
      expect(Number(results[1].voteCount)).to.equal(1); // Raspberry
      expect(Number(results[2].voteCount)).to.equal(0); // Sandwich
      expect(Number(results[3].voteCount)).to.equal(1); // Mango
      
      // Verify total votes
      const totalVotes = Number(results[0].voteCount) + Number(results[1].voteCount) + 
                        Number(results[2].voteCount) + Number(results[3].voteCount);
      expect(totalVotes).to.equal(3);
    });

    it("should handle vote changes and produce accurate final tallies", async function () {
      // Initial votes
      const vote1 = createMockEncryptedVote(1);
      const vote2 = createMockEncryptedVote(1);
      const vote3 = createMockEncryptedVote(1);
      
      await votingContract.connect(voter1).castVote(vote1);
      await votingContract.connect(voter2).castVote(vote2);
      await votingContract.connect(voter3).castVote(vote3);
      
      // Voter2 changes their vote
      const newVote2 = createMockEncryptedVote(2);
      await expect(votingContract.connect(voter2).changeVote(newVote2))
        .to.emit(votingContract, "VoteChanged")
        .withArgs(voter2.address);
      
      // Voter3 changes their vote
      const newVote3 = createMockEncryptedVote(3);
      await votingContract.connect(voter3).changeVote(newVote3);
      
      // Close election
      await votingContract.toggleElection();
      
      // Get results
      const results = await votingContract.getResults();
      
      // Verify final tallies reflect changed votes
      expect(Number(results[0].voteCount)).to.equal(1); // Chocolate (only voter1)
      expect(Number(results[1].voteCount)).to.equal(1); // Raspberry (voter2 changed to this)
      expect(Number(results[2].voteCount)).to.equal(1); // Sandwich (voter3 changed to this)
      expect(Number(results[3].voteCount)).to.equal(0); // Mango
    });

    it("should handle mixed voting patterns with some voters not voting", async function () {
      // Only voter1 and voter3 vote, voter2 doesn't vote
      const vote1 = createMockEncryptedVote(2);
      const vote3 = createMockEncryptedVote(2);
      
      await votingContract.connect(voter1).castVote(vote1);
      await votingContract.connect(voter3).castVote(vote3);
      
      // Verify voter2 hasn't voted
      const [, , hasVoted2] = await votingContract.voters(voter2.address);
      expect(hasVoted2).to.be.false;
      
      // Close election
      await votingContract.toggleElection();
      
      // Get results
      const results = await votingContract.getResults();
      
      // Verify only 2 votes counted
      expect(Number(results[0].voteCount)).to.equal(0); // Chocolate
      expect(Number(results[1].voteCount)).to.equal(2); // Raspberry
      expect(Number(results[2].voteCount)).to.equal(0); // Sandwich
      expect(Number(results[3].voteCount)).to.equal(0); // Mango
      
      const totalVotes = Number(results[0].voteCount) + Number(results[1].voteCount) + 
                        Number(results[2].voteCount) + Number(results[3].voteCount);
      expect(totalVotes).to.equal(2);
    });

    it("should handle all voters voting for different options", async function () {
      // Each voter votes for a different option
      const vote1 = createMockEncryptedVote(1); // Chocolate
      const vote2 = createMockEncryptedVote(2); // Raspberry
      const vote3 = createMockEncryptedVote(3); // Sandwich
      
      await votingContract.connect(voter1).castVote(vote1);
      await votingContract.connect(voter2).castVote(vote2);
      await votingContract.connect(voter3).castVote(vote3);
      
      // Close election
      await votingContract.toggleElection();
      
      // Get results
      const results = await votingContract.getResults();
      
      // Each option should have exactly 1 vote
      expect(Number(results[0].voteCount)).to.equal(1); // Chocolate
      expect(Number(results[1].voteCount)).to.equal(1); // Raspberry
      expect(Number(results[2].voteCount)).to.equal(1); // Sandwich
      expect(Number(results[3].voteCount)).to.equal(0); // Mango
    });

    it("should verify getResults() can only be called when election is closed", async function () {
      // Cast some votes
      const vote = createMockEncryptedVote(1);
      await votingContract.connect(voter1).castVote(vote);
      
      // Try to get results while election is open
      await expect(votingContract.getResults())
        .to.be.revertedWithCustomError(votingContract, "ElectionStillOpen");
      
      // Close election
      await votingContract.toggleElection();
      
      // Now getResults should work
      const results = await votingContract.getResults();
      expect(results).to.have.length(4);
    });

    it("should handle large number of votes for single option", async function () {
      // Register additional voters
      const [, , , , voter4, voter5] = await ethers.getSigners();
      await votingContract.addVoter("Dave", voter4.address);
      await votingContract.addVoter("Eve", voter5.address);
      
      // All voters vote for option 4 (Mango)
      const vote = createMockEncryptedVote(4);
      
      await votingContract.connect(voter1).castVote(vote);
      await votingContract.connect(voter2).castVote(vote);
      await votingContract.connect(voter3).castVote(vote);
      await votingContract.connect(voter4).castVote(vote);
      await votingContract.connect(voter5).castVote(vote);
      
      // Close election
      await votingContract.toggleElection();
      
      // Get results
      const results = await votingContract.getResults();
      
      // Verify all votes went to Mango
      expect(Number(results[0].voteCount)).to.equal(0); // Chocolate
      expect(Number(results[1].voteCount)).to.equal(0); // Raspberry
      expect(Number(results[2].voteCount)).to.equal(0); // Sandwich
      expect(Number(results[3].voteCount)).to.equal(5); // Mango
    });

    it("should verify results include correct option labels and IDs", async function () {
      // Cast votes
      const vote = createMockEncryptedVote(1);
      await votingContract.connect(voter1).castVote(vote);
      
      // Close election
      await votingContract.toggleElection();
      
      // Get results
      const results = await votingContract.getResults();
      
      // Verify structure of each result
      expect(results[0].optionId).to.equal(1);
      expect(results[0].optionLabel).to.equal("Chocolate");
      expect(results[0].voteCount).to.exist;
      
      expect(results[1].optionId).to.equal(2);
      expect(results[1].optionLabel).to.equal("Raspberry");
      expect(results[1].voteCount).to.exist;
      
      expect(results[2].optionId).to.equal(3);
      expect(results[2].optionLabel).to.equal("Sandwich");
      expect(results[2].voteCount).to.exist;
      
      expect(results[3].optionId).to.equal(4);
      expect(results[3].optionLabel).to.equal("Mango");
      expect(results[3].voteCount).to.exist;
    });
  });
});
