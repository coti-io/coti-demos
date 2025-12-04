const { ethers } = require('ethers');
const { Wallet } = require('@coti-io/coti-ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Contract ABIs
const AUCTION_ABI = [
    "function bid(tuple(uint256 ciphertext, bytes signature) itBid) external",
    "function getBid() public returns (uint256)",
    "function doIHaveHighestBid() public",
    "function withdraw() external",
    "function endTime() external view returns (uint256)",
    "function bidCounter() external view returns (uint256)",
    "function beneficiary() external view returns (address)",
    "function tokenContract() external view returns (address)",
    "function manuallyStopped() external view returns (bool)",
];

const TOKEN_ABI = [
    "function approve(address spender, tuple(uint256 ciphertext, bytes signature) amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function mint(address to, tuple(uint256 ciphertext, bytes signature) amount) external"
];

// Helper to deploy contracts
async function deployContracts(deployerWallet) {
    console.log('\n📝 Deploying contracts...');

    // Read contract artifacts
    const tokenArtifact = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../artifacts/contracts/MyToken.sol/MyToken.json'), 'utf8')
    );
    const auctionArtifact = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../artifacts/contracts/PrivateAuction.sol/PrivateAuction.json'), 'utf8')
    );

    // Deploy token
    console.log('  - Deploying token contract...');
    const TokenFactory = new ethers.ContractFactory(
        tokenArtifact.abi,
        tokenArtifact.bytecode,
        deployerWallet
    );
    const token = await TokenFactory.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log('    ✓ Token deployed:', tokenAddress);

    // Deploy auction (1 hour duration, stoppable)
    console.log('  - Deploying auction contract...');
    const AuctionFactory = new ethers.ContractFactory(
        auctionArtifact.abi,
        auctionArtifact.bytecode,
        deployerWallet
    );
    const auction = await AuctionFactory.deploy(
        deployerWallet.address, // beneficiary
        tokenAddress,
        3600, // 1 hour
        true  // stoppable
    );
    await auction.waitForDeployment();
    const auctionAddress = await auction.getAddress();
    console.log('    ✓ Auction deployed:', auctionAddress);

    return { token, auction, tokenAddress, auctionAddress };
}

// Helper to mint tokens
async function mintTokensToBidder(token, deployerWallet, bidderAddress, amount) {
    const mintFunction = token.interface.getFunction('mint');
    const selector = mintFunction.selector;

    const encryptedAmount = await deployerWallet.encryptValue(
        BigInt(amount),
        await token.getAddress(),
        selector
    );

    const tx = await token.connect(deployerWallet).mint(bidderAddress, encryptedAmount, {
        gasLimit: 500000
    });
    await tx.wait();
}

// Helper to place a bid
async function placeBid(bidderWallet, auctionAddress, tokenAddress, bidAmount) {
    const auction = new ethers.Contract(auctionAddress, AUCTION_ABI, bidderWallet);
    const token = new ethers.Contract(tokenAddress, TOKEN_ABI, bidderWallet);

    // Approve tokens
    console.log('      - Approving tokens...');
    const approveFunction = token.interface.getFunction('approve');
    const approveSelector = approveFunction.selector;
    const encryptedApproval = await bidderWallet.encryptValue(
        BigInt(100000),
        tokenAddress,
        approveSelector
    );

    const approveTx = await token.approve(auctionAddress, encryptedApproval, {
        gasLimit: 300000
    });
    await approveTx.wait();
    console.log('        ✓ Approved');

    // Encrypt bid
    console.log('      - Encrypting bid...');
    const bidFunction = auction.interface.getFunction('bid');
    const bidSelector = bidFunction.selector;
    const encryptedBid = await bidderWallet.encryptValue(
        BigInt(bidAmount),
        auctionAddress,
        bidSelector
    );
    console.log('        ✓ Encrypted');

    // Place bid
    console.log('      - Sending transaction...');
    const bidTx = await auction.bid(encryptedBid, {
        gasLimit: 2000000
    });
    console.log('        ✓ Tx sent:', bidTx.hash);

    const receipt = await bidTx.wait();
    console.log('        ✓ Confirmed in block:', receipt.blockNumber);
    console.log('        - Gas used:', receipt.gasUsed.toString());
    console.log('        - Status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');

    return { receipt, txHash: bidTx.hash };
}

async function main() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 Testing Multiple Bidders on Private Auction');
    console.log('='.repeat(60));

    // Setup provider
    const rpcUrl = process.env.RPC_URL || 'https://testnet.coti.io/rpc';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    console.log('\n🔗 Connected to:', rpcUrl);

    // Setup deployer (Alice will deploy)
    const deployerPK = process.env.VITE_ALICE_PK;
    const deployerAES = process.env.VITE_ALICE_AES_KEY;

    if (!deployerPK || !deployerAES) {
        throw new Error('Deployer credentials not found in .env');
    }

    const deployer = new Wallet(deployerPK, provider);
    deployer.setUserOnboardInfo({ aesKey: deployerAES });
    console.log('👤 Deployer:', deployer.address);

    // Setup bidders
    const bidders = [
        {
            name: 'Alice',
            wallet: deployer, // Alice is also deployer
            bidAmount: 10
        },
        {
            name: 'Bob',
            pk: process.env.VITE_BOB_PK,
            aesKey: process.env.VITE_BOB_AES_KEY,
            bidAmount: 20
        },
        {
            name: 'Bea',
            pk: process.env.VITE_BEA_PK,
            aesKey: process.env.VITE_BEA_AES_KEY,
            bidAmount: 15
        },
        {
            name: 'Charlie',
            pk: process.env.VITE_CHARLIE_PK,
            aesKey: process.env.VITE_CHARLIE_AES_KEY,
            bidAmount: 25
        },
        {
            name: 'David',
            pk: process.env.VITE_DAVID_PK,
            aesKey: process.env.VITE_DAVID_AES_KEY,
            bidAmount: 30
        }
    ];

    // Initialize wallets
    console.log('\n👥 Initializing bidders...');
    for (const bidder of bidders) {
        if (!bidder.wallet) {
            if (!bidder.pk || !bidder.aesKey) {
                throw new Error(`${bidder.name} credentials not found in .env`);
            }
            bidder.wallet = new Wallet(bidder.pk, provider);
            bidder.wallet.setUserOnboardInfo({ aesKey: bidder.aesKey });
        }
        console.log(`  - ${bidder.name}: ${bidder.wallet.address}`);
    }

    // Deploy contracts
    const { token, auction, tokenAddress, auctionAddress } = await deployContracts(deployer);

    // Mint tokens to all bidders
    console.log('\n💰 Minting tokens to bidders...');
    for (const bidder of bidders) {
        console.log(`  - Minting 10,000 tokens to ${bidder.name}...`);
        await mintTokensToBidder(token, deployer, bidder.wallet.address, 10000);
        console.log('    ✓ Minted');
    }

    // Test sequential bidding
    console.log('\n🎯 Testing Sequential Bidding...');
    console.log('='.repeat(60));

    const results = [];
    for (let i = 0; i < bidders.length; i++) {
        const bidder = bidders[i];
        console.log(`\n  Test ${i + 1}: ${bidder.name} bids ${bidder.bidAmount} tokens`);
        console.log('  ' + '-'.repeat(50));

        try {
            const result = await placeBid(
                bidder.wallet,
                auctionAddress,
                tokenAddress,
                bidder.bidAmount
            );

            results.push({
                name: bidder.name,
                amount: bidder.bidAmount,
                success: result.receipt.status === 1,
                txHash: result.txHash,
                gasUsed: result.receipt.gasUsed.toString()
            });

            console.log(`  ✅ ${bidder.name}'s bid SUCCEEDED`);

        } catch (error) {
            console.log(`  ❌ ${bidder.name}'s bid FAILED`);
            console.log('  Error:', error.message);

            results.push({
                name: bidder.name,
                amount: bidder.bidAmount,
                success: false,
                error: error.message
            });
        }

        // Check bid counter
        const bidCounter = await auction.bidCounter();
        console.log(`  📊 Total bids in contract: ${bidCounter.toString()}`);

        // Small delay between bids
        if (i < bidders.length - 1) {
            console.log('  ⏳ Waiting 3 seconds before next bid...');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    console.log('\n✅ Successful Bids:');
    const successful = results.filter(r => r.success);
    if (successful.length === 0) {
        console.log('  None');
    } else {
        successful.forEach(r => {
            console.log(`  - ${r.name}: ${r.amount} tokens (Gas: ${r.gasUsed})`);
            console.log(`    TX: https://testnet.cotiscan.io/tx/${r.txHash}`);
        });
    }

    console.log('\n❌ Failed Bids:');
    const failed = results.filter(r => !r.success);
    if (failed.length === 0) {
        console.log('  None');
    } else {
        failed.forEach(r => {
            console.log(`  - ${r.name}: ${r.amount} tokens`);
            console.log(`    Error: ${r.error}`);
        });
    }

    const finalBidCounter = await auction.bidCounter();
    console.log('\n📈 Final Statistics:');
    console.log(`  - Total attempts: ${results.length}`);
    console.log(`  - Successful: ${successful.length}`);
    console.log(`  - Failed: ${failed.length}`);
    console.log(`  - Bid counter: ${finalBidCounter.toString()}`);

    console.log('\n🔗 Contract Addresses:');
    console.log(`  - Token: https://testnet.cotiscan.io/address/${tokenAddress}`);
    console.log(`  - Auction: https://testnet.cotiscan.io/address/${auctionAddress}`);

    console.log('\n' + '='.repeat(60));
    console.log(successful.length === results.length ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
    console.log('='.repeat(60) + '\n');

    process.exit(successful.length === results.length ? 0 : 1);
}

main().catch(error => {
    console.error('\n❌ Fatal Error:', error);
    process.exit(1);
});
