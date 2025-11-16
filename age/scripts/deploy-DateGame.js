import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("Deploying DateGame contract to COTI Testnet...");

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

  // Deploy the DateGame contract
  const DateGame = await ethers.getContractFactory("DateGame");
  
  console.log("Deploying DateGame...");
  
  // Deploy with explicit gas settings for COTI Testnet
  const dateGame = await DateGame.deploy({
    gasLimit: 3000000,
    gasPrice: ethers.parseUnits("10", "gwei")
  });
  
  console.log("Transaction sent, waiting for confirmation...");
  
  // Wait for deployment to be mined
  await dateGame.waitForDeployment();
  
  const contractAddress = await dateGame.getAddress();
  console.log("DateGame deployed to:", contractAddress);
  
  // Verify deployment by checking if code exists at the address
  const deployedCode = await ethers.provider.getCode(contractAddress);
  if (deployedCode === "0x") {
    console.error("❌ Deployment failed - no code at contract address");
    process.exit(1);
  }
  
  console.log("✅ DateGame successfully deployed!");
  console.log("Contract address:", contractAddress);
  console.log("Transaction hash:", dateGame.deploymentTransaction()?.hash);
  
  // Save deployment info
  const deploymentInfo = {
    network: "cotiTestnet",
    contractName: "DateGame",
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    transactionHash: dateGame.deploymentTransaction()?.hash,
    timestamp: new Date().toISOString()
  };
  
  console.log("\nDeployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });