import hre from "hardhat";
const { ethers } = hre;
import { retryRpcCall, waitForTransactionWithRetry, checkNetworkConnectivity } from "./utils/rpc-utils.js";

async function main() {
  console.log("Deploying COTIVotingContract to COTI Testnet...");

  // Check network connectivity first
  const isConnected = await checkNetworkConnectivity(ethers.provider);
  if (!isConnected) {
    throw new Error("Cannot connect to COTI testnet. Please check your network configuration.");
  }

  // Get the deployer account
  const signers = await retryRpcCall(() => ethers.getSigners());
  if (signers.length === 0) {
    throw new Error("No signers available. Check your Hardhat configuration.");
  }
  const deployer = signers[0];
  console.log("Deploying with account:", deployer.address);

  // Get account balance with retry
  const balance = await retryRpcCall(() => ethers.provider.getBalance(deployer.address));
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the COTIVotingContract
  const COTIVotingContract = await retryRpcCall(() => ethers.getContractFactory("COTIVotingContract"));
  
  console.log("Deploying COTIVotingContract...");
  
  // Deploy with explicit gas settings for COTI Testnet and retry logic
  const votingContract = await retryRpcCall(async () => {
    return await COTIVotingContract.deploy({
      gasLimit: 3000000,
      gasPrice: ethers.parseUnits("10", "gwei")
    });
  }, 3, 2000);
  
  console.log("Transaction sent, waiting for confirmation...");
  
  // Wait for deployment to be mined with retry logic
  await retryRpcCall(() => votingContract.waitForDeployment(), 5, 3000);
  
  const contractAddress = await retryRpcCall(() => votingContract.getAddress());
  console.log("COTIVotingContract deployed to:", contractAddress);
  
  // Verify deployment by checking if code exists at the address
  const deployedCode = await retryRpcCall(() => ethers.provider.getCode(contractAddress));
  if (deployedCode === "0x") {
    console.error("❌ Deployment failed - no code at contract address");
    process.exit(1);
  }
  
  // Verify deployment by calling view functions with retry logic
  console.log("Verifying deployment...");
  const votingQuestion = await retryRpcCall(() => votingContract.getVotingQuestion());
  console.log("Voting question:", votingQuestion);

  const votingOptions = await retryRpcCall(() => votingContract.getVotingOptions());
  console.log("Voting options:");
  for (let i = 0; i < votingOptions.length; i++) {
    console.log(`  ${votingOptions[i].id}: ${votingOptions[i].label}`);
  }

  const isElectionOpen = await retryRpcCall(() => votingContract.electionOpened());
  console.log("Election is open:", isElectionOpen);
  
  console.log("✅ COTIVotingContract successfully deployed!");
  console.log("Contract address:", contractAddress);
  console.log("Transaction hash:", votingContract.deploymentTransaction()?.hash);
  
  // Save deployment info
  const deploymentInfo = {
    network: "cotiTestnet",
    contractName: "COTIVotingContract",
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    transactionHash: votingContract.deploymentTransaction()?.hash,
    timestamp: new Date().toISOString()
  };
  
  console.log("\nDeployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  return contractAddress;
}

main()
  .then((address) => {
    console.log("Deployment script completed. Contract address:", address);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });