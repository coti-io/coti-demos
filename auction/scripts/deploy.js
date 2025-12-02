import hre from "hardhat";
const { ethers } = hre;
import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

async function main() {
    console.log("Deploying Private Auction contracts to COTI Testnet...");

    // Get the deployer account
    const signers = await ethers.getSigners();
    if (signers.length === 0) {
        throw new Error("No signers available. Check your Hardhat configuration.");
    }
    const deployer = signers[0];
    console.log("Deploying with account:", deployer.address);

    // Get account balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Deploy Token first
    console.log("\nDeploying MyToken...");
    const MyToken = await ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy({
        gasLimit: 3000000,
        gasPrice: ethers.parseUnits("10", "gwei")
    });

    console.log("Transaction sent, waiting for confirmation...");
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    // Verify token deployment
    const tokenCode = await ethers.provider.getCode(tokenAddress);
    if (tokenCode === "0x") {
        console.error("❌ Token deployment failed - no code at contract address");
        process.exit(1);
    }

    console.log("✅ MyToken deployed to:", tokenAddress);

    // Deploy Auction
    console.log("\nDeploying PrivateAuction...");
    const PrivateAuction = await ethers.getContractFactory("PrivateAuction");
    const beneficiary = deployer.address; // For simplicity, deployer is beneficiary
    const biddingTime = 3600; // 1 hour
    const isStoppable = true;

    const auction = await PrivateAuction.deploy(
        beneficiary,
        tokenAddress,
        biddingTime,
        isStoppable,
        {
            gasLimit: 5000000,
            gasPrice: ethers.parseUnits("10", "gwei")
        }
    );

    console.log("Transaction sent, waiting for confirmation...");
    await auction.waitForDeployment();
    const auctionAddress = await auction.getAddress();

    // Verify auction deployment
    const auctionCode = await ethers.provider.getCode(auctionAddress);
    if (auctionCode === "0x") {
        console.error("❌ Auction deployment failed - no code at contract address");
        process.exit(1);
    }

    console.log("✅ PrivateAuction deployed to:", auctionAddress);

    // Save deployment info
    const deploymentInfo = {
        network: "cotiTestnet",
        tokenAddress: tokenAddress,
        auctionAddress: auctionAddress,
        beneficiary: beneficiary,
        biddingTime: biddingTime,
        isStoppable: isStoppable,
        deployerAddress: deployer.address,
        tokenTxHash: token.deploymentTransaction()?.hash,
        auctionTxHash: auction.deploymentTransaction()?.hash,
        timestamp: new Date().toISOString()
    };

    console.log("\n🎉 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📝 Next steps:");
    console.log("1. Save the contract addresses above");
    console.log("2. Update your .env file if needed");
    console.log("3. Test the auction functionality");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
