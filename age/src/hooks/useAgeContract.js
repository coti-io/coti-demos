import { useMemo } from 'react';
import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';

// Retry utility for handling transient RPC errors
async function retryWithBackoff(
  fn,
  maxRetries = 3,
  initialDelay = 1000,
  errorHandler
) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      const errorMessage = error?.message?.toLowerCase() || '';
      const errorCode = error?.code;
      
      // "already known" means transaction is already in mempool - not a real error
      if (errorMessage.includes('already known')) {
        console.log('Transaction already in mempool, waiting for confirmation...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      
      // Other retryable errors
      const isRetryable = 
        errorMessage.includes('timeout') ||
        errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('econnrefused') ||
        errorMessage.includes('nonce') ||
        errorCode === 'NETWORK_ERROR' ||
        errorCode === 'TIMEOUT' ||
        errorCode === 'SERVER_ERROR' ||
        errorCode === -32000;
      
      // Allow custom error handler to decide
      const shouldRetry = errorHandler ? errorHandler(error, attempt) : isRetryable;
      
      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Contract ABI - only the functions we need
const DATE_GAME_ABI = [
  "function setAge(tuple(uint256 ciphertext, bytes signature) age) external",
  "function greaterThan(tuple(uint256 ciphertext, bytes signature) value) external",
  "function lessThan(tuple(uint256 ciphertext, bytes signature) value) external",
  "function isAgeSet() external view returns (bool)",
  "function comparisonResult() external view returns (uint256)"
];

export function useAgeContract() {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = import.meta.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';

  // Create wallets for admin and player
  const { adminWallet, playerWallet } = useMemo(() => {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const adminPK = import.meta.env.VITE_ADMIN_PK;
    const adminAesKey = import.meta.env.VITE_ADMIN_AES_KEY;
    const playerPK = import.meta.env.VITE_PLAYER_PK;
    const playerAesKey = import.meta.env.VITE_PLAYER_AES_KEY;

    let admin = null;
    let player = null;

    if (adminPK && adminAesKey) {
      admin = new Wallet(adminPK, provider);
      admin.setUserOnboardInfo({ aesKey: adminAesKey });
    }

    if (playerPK && playerAesKey) {
      player = new Wallet(playerPK, provider);
      player.setUserOnboardInfo({ aesKey: playerAesKey });
    }

    return {
      adminWallet: admin,
      playerWallet: player
    };
  }, [rpcUrl]);

  const getContract = (wallet) => {
    if (!contractAddress) {
      throw new Error('Contract address not set. Please set VITE_CONTRACT_ADDRESS in .env');
    }
    return new ethers.Contract(contractAddress, DATE_GAME_ABI, wallet);
  };

  // Convert birth date to age in years
  const calculateAge = (birthDateString) => {
    const birthDate = new Date(birthDateString);
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year yet
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const encryptAge = async (age, wallet, functionName) => {
    if (!contractAddress) {
      throw new Error('Contract address not set');
    }

    const contract = getContract(wallet);
    
    // Get the function selector from the contract interface
    const targetFunction = contract.interface.getFunction(functionName);
    if (!targetFunction) {
      throw new Error(`Could not get ${functionName} function`);
    }
    
    const selector = targetFunction.selector;
    if (!selector) {
      throw new Error(`Could not get ${functionName} function selector`);
    }

    // Encrypt the age value using the wallet's encryptValue method
    const encryptedValue = await wallet.encryptValue(
      BigInt(age),
      contractAddress,
      selector,
    );

    return encryptedValue;
  };

  const storeAge = async (birthDateString) => {
    if (!adminWallet) {
      throw new Error('Admin wallet not configured. Please set VITE_ADMIN_PK and VITE_ADMIN_AES_KEY in .env');
    }

    // Calculate age from birth date
    const age = calculateAge(birthDateString);
    console.log('Calculated age:', age);

    // Encrypt the age
    const encryptedAge = await encryptAge(age, adminWallet, 'setAge');

    // Get contract instance
    const contract = getContract(adminWallet);

    // Send transaction with retry logic
    return await retryWithBackoff(async () => {
      const tx = await contract.setAge(encryptedAge, {
        gasLimit: 500000,
      });

      console.log('Transaction sent:', tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log('Age stored successfully in block:', receipt.blockNumber);
      
      return {
        receipt,
        age,
        encryptedCiphertext: encryptedAge.ciphertext?.toString() || encryptedAge[0]?.toString() || 'N/A'
      };
    }, 3, 1000);
  };

  const compareAge = async (age, operation) => {
    if (!playerWallet) {
      throw new Error('Player wallet not configured. Please set VITE_PLAYER_PK and VITE_PLAYER_AES_KEY in .env');
    }

    const ageInt = parseInt(age, 10);
    if (isNaN(ageInt) || ageInt < 0) {
      throw new Error('Invalid age value');
    }

    console.log('Comparing age:', ageInt, 'operation:', operation);

    // Encrypt the age for comparison
    const functionName = operation === 'greater' ? 'greaterThan' : 'lessThan';
    const encryptedAge = await encryptAge(ageInt, playerWallet, functionName);

    // Get contract instance
    const contract = getContract(playerWallet);

    // First check if age is set
    const isAgeSet = await contract.isAgeSet();
    console.log('Is age set:', isAgeSet);

    if (!isAgeSet) {
      throw new Error('No age has been stored yet. Please store an age first.');
    }

    // Step 1: Call the comparison function (transaction)
    console.log('Calling comparison transaction...');
    const tx = await retryWithBackoff(async () => {
      let transaction;
      if (operation === 'greater') {
        transaction = await contract.greaterThan(encryptedAge, { gasLimit: 500000 });
      } else {
        transaction = await contract.lessThan(encryptedAge, { gasLimit: 500000 });
      }
      console.log('Transaction sent:', transaction.hash);
      const receipt = await transaction.wait();
      console.log('Transaction confirmed in block:', receipt.blockNumber);
      return { transaction, receipt };
    }, 3, 1000);

    // Step 2: Read the result using view function
    console.log('Reading comparison result from view function...');
    const ctResult = await contract.comparisonResult();
    console.log('Got encrypted result (ctUint8):', ctResult.toString());

    // Step 3: Decrypt the result
    const clearResult = await playerWallet.decryptValue(ctResult);
    console.log('Decrypted clear value:', clearResult);
    
    // Convert to boolean (1 = true, 0 = false)
    const boolResult = clearResult === 1n || clearResult === BigInt(1);
    console.log('Boolean result:', boolResult);
    
    return {
      result: boolResult,
      operation: operation,
      age: ageInt,
      transactionHash: tx.transaction.hash,
      encryptedCiphertext: encryptedAge.ciphertext?.toString() || encryptedAge[0]?.toString() || 'N/A'
    };
  };

  const checkAgeStatus = async () => {
    if (!contractAddress) {
      return false;
    }

    try {
      // Use admin wallet if available, otherwise player wallet
      const wallet = adminWallet || playerWallet;
      if (!wallet) {
        return false;
      }

      const contract = getContract(wallet);
      const isSet = await retryWithBackoff(
        async () => await contract.isAgeSet(),
        3,
        500
      );
      return isSet;
    } catch (error) {
      console.error('Error checking age status:', error);
      return false;
    }
  };

  return {
    storeAge,
    compareAge,
    checkAgeStatus,
    contractAddress,
    adminWallet,
    playerWallet
  };
}
