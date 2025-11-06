import { ethers } from "ethers";

// Utility function to retry RPC calls with exponential backoff
export async function retryRpcCall(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = i === maxRetries - 1;
      
      // Check if it's a retryable error
      const isRetryableError = 
        error.message.includes("pending block is not available") ||
        error.message.includes("timeout") ||
        error.message.includes("network error") ||
        error.message.includes("connection refused") ||
        error.code === "NETWORK_ERROR" ||
        error.code === "TIMEOUT";
      
      if (!isRetryableError || isLastAttempt) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`RPC call failed (attempt ${i + 1}/${maxRetries}), retrying in ${delay}ms...`);
      console.log(`Error: ${error.message}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Utility function to wait for transaction with retry logic
export async function waitForTransactionWithRetry(tx, maxRetries = 5) {
  return retryRpcCall(async () => {
    console.log(`Waiting for transaction ${tx.hash} to be mined...`);
    const receipt = await tx.wait(1); // Wait for 1 confirmation
    console.log(`Transaction mined in block ${receipt.blockNumber}`);
    return receipt;
  }, maxRetries, 2000);
}

// Utility function to send transaction with retry logic
export async function sendTransactionWithRetry(contract, methodName, args = [], options = {}) {
  return retryRpcCall(async () => {
    console.log(`Sending transaction: ${methodName}`);
    
    // Set default gas settings if not provided
    const txOptions = {
      gasLimit: 300000,
      gasPrice: ethers.parseUnits("10", "gwei"),
      ...options
    };
    
    const tx = await contract[methodName](...args, txOptions);
    console.log(`Transaction sent: ${tx.hash}`);
    
    return tx;
  }, 3, 1000);
}

// Utility function to check network connectivity
export async function checkNetworkConnectivity(provider) {
  try {
    console.log("Checking network connectivity...");
    
    const network = await retryRpcCall(() => provider.getNetwork(), 3, 500);
    console.log(`✓ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
    
    const blockNumber = await retryRpcCall(() => provider.getBlockNumber(), 3, 500);
    console.log(`✓ Current block number: ${blockNumber}`);
    
    return true;
  } catch (error) {
    console.error("✗ Network connectivity check failed:", error.message);
    return false;
  }
}