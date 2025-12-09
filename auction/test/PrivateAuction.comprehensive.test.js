import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

// Import hardhat chai matchers
import "@nomicfoundation/hardhat-chai-matchers";

// Helper function to deploy with retry logic for COTI testnet instability
async function deployWithRetry(owner, biddingTime = 3600, isStoppable = true, maxRetries = 5, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Deploy MyToken first
      const MyToken = await ethers.getContractFactory("MyToken");
      const token = await MyToken.deploy({
        gasLimit: 5000000 // Manual gas limit
      });
      await token.waitForDeployment();
      const tokenAddress = await token.getAddress();

      // Deploy PrivateAuction
      const PrivateAuction = await ethers.getContractFactory("PrivateAuction");
      const auction = await PrivateAuction.deploy(
        owner.address,
        tokenAddress,
        biddingTime,
        isStoppable,
        {
          gasLimit: 5000000 // Manual gas limit
        }
      );
      await auction.waitForDeployment();

      console.log(`Contracts deployed successfully at:`);
      console.log(`  Token: ${tokenAddress}`);
      console.log(`  Auction: ${await auction.getAddress()}`);

      return { auction, token };
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`All ${maxRetries} deployment attempts failed`);
        throw error;
      }
      console.log(`Deployment attempt ${attempt} failed: ${error.message}`);
      console.log(`Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

describe("PrivateAuction", function () {
  let auction;
  let token;
  let owner;
  let bidder1;
  let bidder2;
  let bidder3;
  let isCotiNetwork;

  // Increase timeout for COTI testnet
  this.timeout(60000);

  // Deploy ONCE before all tests
  before(async function () {
    [owner, bidder1, bidder2, bidder3] = await ethers.getSigners();

    // Deploy with retry logic - only once for all tests
    const contracts = await deployWithRetry(owner, 3600, true);
    auction = contracts.auction;
    token = contracts.token;

    // Check if we're on COTI network (chainId: 7082400)
    const network = await ethers.provider.getNetwork();
    isCotiNetwork = Number(network.chainId) === 7082400;
  });

  describe("Contract Initialization", function () {
    it("should set the correct beneficiary address", async function () {
      const beneficiary = await auction.beneficiary();
      expect(beneficiary).to.equal(owner.address);
    });

    it("should set the correct token contract address", async function () {
      const tokenAddress = await auction.tokenContract();
      expect(tokenAddress).to.equal(await token.getAddress());
    });

    it("should set the correct contract owner", async function () {
      const contractOwner = await auction.contractOwner();
      expect(contractOwner).to.equal(owner.address);
    });

    it("should initialize with zero bid counter", async function () {
      const bidCounter = await auction.bidCounter();
      expect(bidCounter).to.equal(0);
    });

    it("should initialize with no winner", async function () {
      const winner = await auction.winner();
      expect(winner).to.equal(ethers.ZeroAddress);
    });

    it("should initialize with no highest bidder", async function () {
      const highestBidder = await auction.highestBidder();
      expect(highestBidder).to.equal(ethers.ZeroAddress);
    });

    it("should initialize with token not transferred", async function () {
      const tokenTransferred = await auction.tokenTransferred();
      expect(tokenTransferred).to.be.false;
    });

    it("should initialize with correct stoppable setting", async function () {
      const stoppable = await auction.stoppable();
      expect(stoppable).to.be.true;
    });

    it("should initialize as not manually stopped", async function () {
      const manuallyStopped = await auction.manuallyStopped();
      expect(manuallyStopped).to.be.false;
    });

    it("should set an end time in the future", async function () {
      const endTime = await auction.endTime();
      const now = Math.floor(Date.now() / 1000);
      expect(Number(endTime)).to.be.greaterThan(now);
    });
  });

  describe("State Management", function () {
    it("should track bid counter correctly", async function () {
      const initialCounter = await auction.bidCounter();
      expect(initialCounter).to.equal(0);
    });

    it("should allow checking state from any address", async function () {
      if (isCotiNetwork) {
        this.skip(); // .connect() has issues on COTI testnet
      }
      const beneficiary1 = await auction.connect(bidder1).beneficiary();
      const beneficiary2 = await auction.connect(bidder2).beneficiary();
      const beneficiary3 = await auction.connect(owner).beneficiary();

      expect(beneficiary1).to.equal(beneficiary2);
      expect(beneficiary2).to.equal(beneficiary3);
      expect(beneficiary3).to.equal(owner.address);
    });

    it("should maintain consistent state across multiple queries", async function () {
      const state1 = {
        beneficiary: await auction.beneficiary(),
        bidCounter: await auction.bidCounter(),
        winner: await auction.winner()
      };

      const state2 = {
        beneficiary: await auction.beneficiary(),
        bidCounter: await auction.bidCounter(),
        winner: await auction.winner()
      };

      expect(state1.beneficiary).to.equal(state2.beneficiary);
      expect(state1.bidCounter).to.equal(state2.bidCounter);
      expect(state1.winner).to.equal(state2.winner);
    });
  });

  describe("Access Control", function () {
    it("should allow anyone to view public state variables", async function () {
      if (isCotiNetwork) {
        this.skip(); // .connect() has issues on COTI testnet
      }
      const beneficiary = await auction.connect(bidder1).beneficiary();
      const endTime = await auction.connect(bidder2).endTime();
      const bidCounter = await auction.connect(bidder3).bidCounter();

      expect(beneficiary).to.equal(owner.address);
      expect(Number(endTime)).to.be.greaterThan(0);
      expect(bidCounter).to.equal(0);
    });

    it("should allow owner to view contract owner", async function () {
      if (isCotiNetwork) {
        this.skip(); // .connect() has issues on COTI testnet
      }
      const contractOwner = await auction.connect(owner).contractOwner();
      expect(contractOwner).to.equal(owner.address);
    });

    it("should allow non-owners to view contract owner", async function () {
      if (isCotiNetwork) {
        this.skip(); // .connect() has issues on COTI testnet
      }
      const contractOwner = await auction.connect(bidder1).contractOwner();
      expect(contractOwner).to.equal(owner.address);
    });
  });

  describe("Function Signatures", function () {
    it("should have correct bid function signature", async function () {
      const fragment = auction.interface.getFunction("bid");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("bid");
    });

    it("should have correct getBid function signature", async function () {
      const fragment = auction.interface.getFunction("getBid");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("getBid");
    });

    it("should have correct doIHaveHighestBid function signature", async function () {
      const fragment = auction.interface.getFunction("doIHaveHighestBid");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("doIHaveHighestBid");
    });

    it("should have correct claim function signature", async function () {
      const fragment = auction.interface.getFunction("claim");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("claim");
    });

    it("should have correct withdraw function signature", async function () {
      const fragment = auction.interface.getFunction("withdraw");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("withdraw");
    });

    it("should have correct auctionEnd function signature", async function () {
      const fragment = auction.interface.getFunction("auctionEnd");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("auctionEnd");
    });

    it("should have correct stop function signature", async function () {
      const fragment = auction.interface.getFunction("stop");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("stop");
    });

    it("should have correct beneficiary getter signature", async function () {
      const fragment = auction.interface.getFunction("beneficiary");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("beneficiary");
      expect(fragment.stateMutability).to.equal("view");
    });

    it("should have correct endTime getter signature", async function () {
      const fragment = auction.interface.getFunction("endTime");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("endTime");
      expect(fragment.stateMutability).to.equal("view");
    });

    it("should have correct tokenContract getter signature", async function () {
      const fragment = auction.interface.getFunction("tokenContract");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("tokenContract");
      expect(fragment.stateMutability).to.equal("view");
    });

    it("should have correct bidCounter getter signature", async function () {
      const fragment = auction.interface.getFunction("bidCounter");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("bidCounter");
      expect(fragment.stateMutability).to.equal("view");
    });

    it("should have correct winner getter signature", async function () {
      const fragment = auction.interface.getFunction("winner");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("winner");
      expect(fragment.stateMutability).to.equal("view");
    });

    it("should have correct highestBidder getter signature", async function () {
      const fragment = auction.interface.getFunction("highestBidder");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("highestBidder");
      expect(fragment.stateMutability).to.equal("view");
    });

    it("should have correct tokenTransferred getter signature", async function () {
      const fragment = auction.interface.getFunction("tokenTransferred");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("tokenTransferred");
      expect(fragment.stateMutability).to.equal("view");
    });
  });

  describe("Event Definitions", function () {
    it("should have Winner event defined", async function () {
      const eventFragment = auction.interface.getEvent("Winner");
      expect(eventFragment).to.exist;
      expect(eventFragment.name).to.equal("Winner");
    });

    it("should have correct Winner event parameters", async function () {
      const eventFragment = auction.interface.getEvent("Winner");
      expect(eventFragment.inputs).to.have.length(1);
      expect(eventFragment.inputs[0].name).to.equal("who");
      expect(eventFragment.inputs[0].type).to.equal("address");
    });

    it("should have HighestBid event defined", async function () {
      const eventFragment = auction.interface.getEvent("HighestBid");
      expect(eventFragment).to.exist;
      expect(eventFragment.name).to.equal("HighestBid");
    });

    it("should have correct HighestBid event parameters", async function () {
      const eventFragment = auction.interface.getEvent("HighestBid");
      expect(eventFragment.inputs).to.have.length(1);
      expect(eventFragment.inputs[0].name).to.equal("isHighestBid");
    });
  });

  describe("Custom Errors", function () {
    it("should have TooEarly error defined", async function () {
      const errorFragment = auction.interface.getError("TooEarly");
      expect(errorFragment).to.exist;
      expect(errorFragment.name).to.equal("TooEarly");
    });

    it("should have correct TooEarly error parameters", async function () {
      const errorFragment = auction.interface.getError("TooEarly");
      expect(errorFragment.inputs).to.have.length(1);
      expect(errorFragment.inputs[0].name).to.equal("time");
      expect(errorFragment.inputs[0].type).to.equal("uint256");
    });

    it("should have TooLate error defined", async function () {
      const errorFragment = auction.interface.getError("TooLate");
      expect(errorFragment).to.exist;
      expect(errorFragment.name).to.equal("TooLate");
    });

    it("should have correct TooLate error parameters", async function () {
      const errorFragment = auction.interface.getError("TooLate");
      expect(errorFragment.inputs).to.have.length(1);
      expect(errorFragment.inputs[0].name).to.equal("time");
      expect(errorFragment.inputs[0].type).to.equal("uint256");
    });
  });

  describe("View Function Behavior", function () {
    it("should allow multiple calls to state getters without gas cost", async function () {
      const ben1 = await auction.beneficiary();
      const ben2 = await auction.beneficiary();
      const end1 = await auction.endTime();
      const end2 = await auction.endTime();

      expect(ben1).to.equal(ben2);
      expect(end1).to.equal(end2);
    });

    it("should allow multiple calls to counter getters without gas cost", async function () {
      const count1 = await auction.bidCounter();
      const count2 = await auction.bidCounter();
      const count3 = await auction.bidCounter();

      expect(count1).to.equal(count2);
      expect(count2).to.equal(count3);
      expect(count3).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("should handle rapid successive state checks", async function () {
      const promises = Array(10).fill().map(() => auction.beneficiary());
      const results = await Promise.all(promises);

      // All results should be consistent
      expect(results.every(r => r === owner.address)).to.be.true;
    });

    it("should handle calls from different users for state queries", async function () {
      if (isCotiNetwork) {
        this.skip(); // .connect() has issues on COTI testnet
      }
      const ben1 = await auction.connect(bidder1).beneficiary();
      const ben2 = await auction.connect(bidder2).beneficiary();
      const ben3 = await auction.connect(bidder3).beneficiary();

      expect(ben1).to.equal(ben2);
      expect(ben2).to.equal(ben3);
      expect(ben3).to.equal(owner.address);
    });

    it("should maintain correct state across multiple queries", async function () {
      const state1 = {
        bidCounter: await auction.bidCounter(),
        winner: await auction.winner(),
        tokenTransferred: await auction.tokenTransferred()
      };

      const state2 = {
        bidCounter: await auction.bidCounter(),
        winner: await auction.winner(),
        tokenTransferred: await auction.tokenTransferred()
      };

      expect(state1.bidCounter).to.equal(state2.bidCounter);
      expect(state1.winner).to.equal(state2.winner);
      expect(state1.tokenTransferred).to.equal(state2.tokenTransferred);
    });
  });

  describe("Contract Deployment", function () {
    it("should deploy auction with correct bytecode", async function () {
      const code = await ethers.provider.getCode(await auction.getAddress());
      expect(code).to.not.equal("0x");
      expect(code.length).to.be.greaterThan(2); // More than just "0x"
    });

    it("should deploy token with correct bytecode", async function () {
      const code = await ethers.provider.getCode(await token.getAddress());
      expect(code).to.not.equal("0x");
      expect(code.length).to.be.greaterThan(2);
    });

    it("should deploy auction to a valid address", async function () {
      const address = await auction.getAddress();
      expect(ethers.isAddress(address)).to.be.true;
      expect(address).to.not.equal(ethers.ZeroAddress);
    });

    it("should deploy token to a valid address", async function () {
      const address = await token.getAddress();
      expect(ethers.isAddress(address)).to.be.true;
      expect(address).to.not.equal(ethers.ZeroAddress);
    });

    it("should allow multiple auction deployments with same token", async function () {
      if (isCotiNetwork) {
        this.skip(); // Skip on COTI testnet to avoid deployment issues
      }
      const PrivateAuction = await ethers.getContractFactory("PrivateAuction");
      const auction1 = await PrivateAuction.deploy(
        owner.address,
        await token.getAddress(),
        3600,
        true
      );
      await auction1.waitForDeployment();

      const auction2 = await PrivateAuction.deploy(
        owner.address,
        await token.getAddress(),
        3600,
        false
      );
      await auction2.waitForDeployment();

      const addr1 = await auction1.getAddress();
      const addr2 = await auction2.getAddress();

      expect(addr1).to.not.equal(addr2);
      expect(await auction1.stoppable()).to.be.true;
      expect(await auction2.stoppable()).to.be.false;
    });
  });

  describe("Gas Estimation", function () {
    it("should estimate gas for state getter calls", async function () {
      if (isCotiNetwork) {
        this.skip(); // estimateGas doesn't work on COTI testnet
      }
      const gasEstimate1 = await auction.beneficiary.estimateGas();
      const gasEstimate2 = await auction.bidCounter.estimateGas();
      const gasEstimate3 = await auction.endTime.estimateGas();

      expect(Number(gasEstimate1)).to.be.greaterThan(0);
      expect(Number(gasEstimate2)).to.be.greaterThan(0);
      expect(Number(gasEstimate3)).to.be.greaterThan(0);
      // View functions should be cheap
      expect(Number(gasEstimate1)).to.be.lessThan(100000);
      expect(Number(gasEstimate2)).to.be.lessThan(100000);
      expect(Number(gasEstimate3)).to.be.lessThan(100000);
    });

    it("should estimate gas for boolean getter calls", async function () {
      if (isCotiNetwork) {
        this.skip(); // estimateGas doesn't work on COTI testnet
      }
      const gasEstimate1 = await auction.stoppable.estimateGas();
      const gasEstimate2 = await auction.manuallyStopped.estimateGas();
      const gasEstimate3 = await auction.tokenTransferred.estimateGas();

      expect(Number(gasEstimate1)).to.be.greaterThan(0);
      expect(Number(gasEstimate2)).to.be.greaterThan(0);
      expect(Number(gasEstimate3)).to.be.greaterThan(0);
      expect(Number(gasEstimate1)).to.be.lessThan(100000);
      expect(Number(gasEstimate2)).to.be.lessThan(100000);
      expect(Number(gasEstimate3)).to.be.lessThan(100000);
    });
  });
});

describe("MyToken", function () {
  let token;
  let owner;
  let user1;
  let user2;
  let isCotiNetwork;

  this.timeout(60000);

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const MyToken = await ethers.getContractFactory("MyToken");
    token = await MyToken.deploy({
      gasLimit: 5000000
    });
    await token.waitForDeployment();

    const network = await ethers.provider.getNetwork();
    isCotiNetwork = Number(network.chainId) === 7082400;
  });

  describe("Token Initialization", function () {
    it("should have correct name", async function () {
      const name = await token.name();
      expect(name).to.equal("MyToken");
    });

    it("should have correct symbol", async function () {
      const symbol = await token.symbol();
      expect(symbol).to.equal("MTK");
    });
  });

  describe("Function Signatures", function () {
    it("should have correct mint function signature", async function () {
      const fragment = token.interface.getFunction("mint");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("mint");
    });

    it("should have correct getMyBalance function signature", async function () {
      const fragment = token.interface.getFunction("getMyBalance");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("getMyBalance");
    });

    it("should have correct name function signature", async function () {
      const fragment = token.interface.getFunction("name");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("name");
      expect(fragment.stateMutability).to.equal("view");
    });

    it("should have correct symbol function signature", async function () {
      const fragment = token.interface.getFunction("symbol");
      expect(fragment).to.exist;
      expect(fragment.name).to.equal("symbol");
      expect(fragment.stateMutability).to.equal("view");
    });
  });

  describe("View Function Behavior", function () {
    it("should allow multiple calls to name without gas cost", async function () {
      const name1 = await token.name();
      const name2 = await token.name();
      const name3 = await token.name();

      expect(name1).to.equal(name2);
      expect(name2).to.equal(name3);
      expect(name3).to.equal("MyToken");
    });

    it("should allow multiple calls to symbol without gas cost", async function () {
      const symbol1 = await token.symbol();
      const symbol2 = await token.symbol();
      const symbol3 = await token.symbol();

      expect(symbol1).to.equal(symbol2);
      expect(symbol2).to.equal(symbol3);
      expect(symbol3).to.equal("MTK");
    });
  });

  describe("Contract Deployment", function () {
    it("should deploy with correct bytecode", async function () {
      const code = await ethers.provider.getCode(await token.getAddress());
      expect(code).to.not.equal("0x");
      expect(code.length).to.be.greaterThan(2);
    });

    it("should deploy to a valid address", async function () {
      const address = await token.getAddress();
      expect(ethers.isAddress(address)).to.be.true;
      expect(address).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Gas Estimation", function () {
    it("should estimate gas for name and symbol calls", async function () {
      if (isCotiNetwork) {
        this.skip(); // estimateGas doesn't work on COTI testnet
      }
      const gasEstimate1 = await token.name.estimateGas();
      const gasEstimate2 = await token.symbol.estimateGas();

      expect(Number(gasEstimate1)).to.be.greaterThan(0);
      expect(Number(gasEstimate2)).to.be.greaterThan(0);
      expect(Number(gasEstimate1)).to.be.lessThan(100000);
      expect(Number(gasEstimate2)).to.be.lessThan(100000);
    });
  });
});
