const { expect } = require("chai");
const { ethers } = require("hardhat");
require("dotenv").config();

describe("PrivateAuction - Multiple Bidders", function () {
    let auction;
    let token;
    let deployer;
    let alice, bob, bea, charlie, david, ethan;
    let auctionAddress, tokenAddress;

    // Timeout for tests (5 minutes for network operations)
    this.timeout(300000);

    before(async function () {
        console.log("\n🔧 Setting up test environment...\n");

        // Get deployer from hardhat config
        const signers = await ethers.getSigners();
        deployer = signers[0];
        console.log("Deployer address:", deployer.address);

        // Load wallet credentials from .env
        const wallets = [
            { name: "Alice", pk: process.env.VITE_ALICE_PK, aesKey: process.env.VITE_ALICE_AES_KEY },
            { name: "Bob", pk: process.env.VITE_BOB_PK, aesKey: process.env.VITE_BOB_AES_KEY },
            { name: "Bea", pk: process.env.VITE_BEA_PK, aesKey: process.env.VITE_BEA_AES_KEY },
            { name: "Charlie", pk: process.env.VITE_CHARLIE_PK, aesKey: process.env.VITE_CHARLIE_AES_KEY },
            { name: "David", pk: process.env.VITE_DAVID_PK, aesKey: process.env.VITE_DAVID_AES_KEY },
            { name: "Ethan", pk: process.env.VITE_ETHAN_PK, aesKey: process.env.VITE_ETHAN_AES_KEY },
        ];

        // Verify all credentials are loaded
        for (const w of wallets) {
            if (!w.pk || !w.aesKey) {
                throw new Error(`${w.name} credentials not found in .env file`);
            }
        }

        // Create wallet instances connected to the testnet
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://testnet.coti.io/rpc");

        alice = new ethers.Wallet(wallets[0].pk, provider);
        bob = new ethers.Wallet(wallets[1].pk, provider);
        bea = new ethers.Wallet(wallets[2].pk, provider);
        charlie = new ethers.Wallet(wallets[3].pk, provider);
        david = new ethers.Wallet(wallets[4].pk, provider);
        ethan = new ethers.Wallet(wallets[5].pk, provider);

        console.log("\n👥 Test Bidders:");
        console.log("  Alice:", alice.address);
        console.log("  Bob:", bob.address);
        console.log("  Bea:", bea.address);
        console.log("  Charlie:", charlie.address);
        console.log("  David:", david.address);
        console.log("  Ethan:", ethan.address);

        // Deploy contracts
        console.log("\n📝 Deploying contracts...");

        // Deploy token contract
        const MyToken = await ethers.getContractFactory("MyToken", deployer);
        token = await MyToken.deploy();
        await token.waitForDeployment();
        tokenAddress = await token.getAddress();
        console.log("  ✓ Token deployed at:", tokenAddress);

        // Deploy auction contract (1 hour bidding time, stoppable)
        const PrivateAuction = await ethers.getContractFactory("PrivateAuction", deployer);
        auction = await PrivateAuction.deploy(
            deployer.address, // beneficiary
            tokenAddress,
            3600, // 1 hour
            true  // stoppable
        );
        await auction.waitForDeployment();
        auctionAddress = await auction.getAddress();
        console.log("  ✓ Auction deployed at:", auctionAddress);

        // Mint tokens to all bidders
        console.log("\n💰 Minting tokens to bidders...");
        const bidders = [alice, bob, bea, charlie, david, ethan];
        const bidderNames = ["Alice", "Bob", "Bea", "Charlie", "David", "Ethan"];

        for (let i = 0; i < bidders.length; i++) {
            const mintAmount = 10000; // 10,000 tokens each
            const tx = await token.connect(deployer).mint(bidders[i].address, mintAmount);
            await tx.wait();
            const balance = await token.balanceOf(bidders[i].address);
            console.log(`  ✓ ${bidderNames[i]}: ${balance.toString()} tokens`);
        }

        console.log("\n✅ Setup complete!\n");
    });

    describe("Sequential Bidding Tests", function () {
        it("Should allow Alice to place the first bid (10 tokens)", async function () {
            console.log("\n🎯 Test 1: Alice bids 10 tokens");

            const bidAmount = 10;
            console.log("  - Bid amount:", bidAmount);
            console.log("  - Bidder:", alice.address);

            // Approve tokens
            console.log("  - Approving tokens...");
            const approveTx = await token.connect(alice).approve(auctionAddress, 10000);
            await approveTx.wait();
            console.log("    ✓ Approval successful");

            // Place bid
            console.log("  - Placing bid...");
            const bidTx = await auction.connect(alice).bid(bidAmount);
            const receipt = await bidTx.wait();

            console.log("    ✓ Bid placed successfully");
            console.log("    - Transaction:", receipt.hash);
            console.log("    - Gas used:", receipt.gasUsed.toString());
            console.log("    - Block:", receipt.blockNumber);

            // Verify bid counter
            const bidCounter = await auction.bidCounter();
            expect(bidCounter).to.equal(1);
            console.log("    ✓ Bid counter:", bidCounter.toString());
        });

        it("Should allow Bob to place a second bid (20 tokens)", async function () {
            console.log("\n🎯 Test 2: Bob bids 20 tokens");

            const bidAmount = 20;
            console.log("  - Bid amount:", bidAmount);
            console.log("  - Bidder:", bob.address);

            // Approve tokens
            console.log("  - Approving tokens...");
            const approveTx = await token.connect(bob).approve(auctionAddress, 10000);
            await approveTx.wait();
            console.log("    ✓ Approval successful");

            // Place bid
            console.log("  - Placing bid...");
            const bidTx = await auction.connect(bob).bid(bidAmount);
            const receipt = await bidTx.wait();

            console.log("    ✓ Bid placed successfully");
            console.log("    - Transaction:", receipt.hash);
            console.log("    - Gas used:", receipt.gasUsed.toString());
            console.log("    - Block:", receipt.blockNumber);

            // Verify bid counter
            const bidCounter = await auction.bidCounter();
            expect(bidCounter).to.equal(2);
            console.log("    ✓ Bid counter:", bidCounter.toString());
        });

        it("Should allow Bea to place a third bid (15 tokens)", async function () {
            console.log("\n🎯 Test 3: Bea bids 15 tokens");

            const bidAmount = 15;
            console.log("  - Bid amount:", bidAmount);
            console.log("  - Bidder:", bea.address);

            // Approve tokens
            console.log("  - Approving tokens...");
            const approveTx = await token.connect(bea).approve(auctionAddress, 10000);
            await approveTx.wait();
            console.log("    ✓ Approval successful");

            // Place bid
            console.log("  - Placing bid...");
            const bidTx = await auction.connect(bea).bid(bidAmount);
            const receipt = await bidTx.wait();

            console.log("    ✓ Bid placed successfully");
            console.log("    - Transaction:", receipt.hash);
            console.log("    - Gas used:", receipt.gasUsed.toString());
            console.log("    - Block:", receipt.blockNumber);

            // Verify bid counter
            const bidCounter = await auction.bidCounter();
            expect(bidCounter).to.equal(3);
            console.log("    ✓ Bid counter:", bidCounter.toString());
        });

        it("Should allow Charlie to place a fourth bid (25 tokens)", async function () {
            console.log("\n🎯 Test 4: Charlie bids 25 tokens");

            const bidAmount = 25;
            console.log("  - Bid amount:", bidAmount);
            console.log("  - Bidder:", charlie.address);

            // Approve tokens
            console.log("  - Approving tokens...");
            const approveTx = await token.connect(charlie).approve(auctionAddress, 10000);
            await approveTx.wait();
            console.log("    ✓ Approval successful");

            // Place bid
            console.log("  - Placing bid...");
            const bidTx = await auction.connect(charlie).bid(bidAmount);
            const receipt = await bidTx.wait();

            console.log("    ✓ Bid placed successfully");
            console.log("    - Transaction:", receipt.hash);
            console.log("    - Gas used:", receipt.gasUsed.toString());
            console.log("    - Block:", receipt.blockNumber);

            // Verify bid counter
            const bidCounter = await auction.bidCounter();
            expect(bidCounter).to.equal(4);
            console.log("    ✓ Bid counter:", bidCounter.toString());
        });

        it("Should allow David to place a fifth bid (30 tokens)", async function () {
            console.log("\n🎯 Test 5: David bids 30 tokens");

            const bidAmount = 30;
            console.log("  - Bid amount:", bidAmount);
            console.log("  - Bidder:", david.address);

            // Approve tokens
            console.log("  - Approving tokens...");
            const approveTx = await token.connect(david).approve(auctionAddress, 10000);
            await approveTx.wait();
            console.log("    ✓ Approval successful");

            // Place bid
            console.log("  - Placing bid...");
            const bidTx = await auction.connect(david).bid(bidAmount);
            const receipt = await bidTx.wait();

            console.log("    ✓ Bid placed successfully");
            console.log("    - Transaction:", receipt.hash);
            console.log("    - Gas used:", receipt.gasUsed.toString());
            console.log("    - Block:", receipt.blockNumber);

            // Verify bid counter
            const bidCounter = await auction.bidCounter();
            expect(bidCounter).to.equal(5);
            console.log("    ✓ Bid counter:", bidCounter.toString());
        });

        it("Should allow Ethan to place a sixth bid (35 tokens)", async function () {
            console.log("\n🎯 Test 6: Ethan bids 35 tokens");

            const bidAmount = 35;
            console.log("  - Bid amount:", bidAmount);
            console.log("  - Bidder:", ethan.address);

            // Approve tokens
            console.log("  - Approving tokens...");
            const approveTx = await token.connect(ethan).approve(auctionAddress, 10000);
            await approveTx.wait();
            console.log("    ✓ Approval successful");

            // Place bid
            console.log("  - Placing bid...");
            const bidTx = await auction.connect(ethan).bid(bidAmount);
            const receipt = await bidTx.wait();

            console.log("    ✓ Bid placed successfully");
            console.log("    - Transaction:", receipt.hash);
            console.log("    - Gas used:", receipt.gasUsed.toString());
            console.log("    - Block:", receipt.blockNumber);

            // Verify bid counter
            const bidCounter = await auction.bidCounter();
            expect(bidCounter).to.equal(6);
            console.log("    ✓ Bid counter:", bidCounter.toString());
        });
    });

    describe("Bid Verification Tests", function () {
        it("Should verify all bidders have placed bids", async function () {
            console.log("\n📊 Verifying all bids...");

            const bidCounter = await auction.bidCounter();
            console.log("  Total bids placed:", bidCounter.toString());
            expect(bidCounter).to.equal(6);
            console.log("  ✓ All 6 bidders successfully placed bids");
        });
    });

    after(function () {
        console.log("\n" + "=".repeat(60));
        console.log("🎉 All tests completed!");
        console.log("=".repeat(60) + "\n");
    });
});
