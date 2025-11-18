import { useMemo } from 'react';
import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';

// Retry utility for handling transient RPC errors
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  errorHandler?: (error: any, attempt: number) => boolean
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      const errorMessage = error?.message?.toLowerCase() || '';
      const errorCode = error?.code;
      
      // "already known" means transaction is already in mempool - not a real error
      if (errorMessage.includes('already known')) {
        console.log('Transaction already in mempool, waiting for confirmation...');
        // Wait a bit longer for the transaction to be mined
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
// itUint8 is a struct with (uint256 ciphertext, bytes signature)
const VOTING_CONTRACT_ABI = [
  "function castVote(tuple(uint256 ciphertext, bytes signature) encryptedVote) external",
  "function getVotingQuestion() external pure returns (string)",
  "function getVotingOptions() external view returns (tuple(uint8 id, string label)[])",
  "function isVoterRegistered(address voterId) external view returns (bool)",
  "function voters(address) external view returns (string name, address voterId, uint256 encryptedVote, bool isRegistered, bool hasVoted, bool hasAuthorizedOwner)",
  "function getElectionStatus() external view returns (bool isOpen, uint256 voterCount, address electionOwner)",
  "function getResults() external returns (tuple(uint8 optionId, string optionLabel, uint64 voteCount)[4])",
  "function aggregateVotes() external",
  "function toggleElection() external"
];

export interface VoterAccount {
  name: string;
  privateKey: string;
  aesKey: string;
  wallet?: Wallet;
}

export function useVotingContract() {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = import.meta.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';

  // Create wallets for each voter
  const voters = useMemo<VoterAccount[]>(() => {
    const voterAccounts = [
      {
        name: 'Bob',
        privateKey: import.meta.env.VITE_BOB_PK,
        aesKey: import.meta.env.VITE_BOB_AES_KEY,
      },
      {
        name: 'Bea',
        privateKey: import.meta.env.VITE_BEA_PK,
        aesKey: import.meta.env.VITE_BEA_AES_KEY,
      },
      {
        name: 'Charlie',
        privateKey: import.meta.env.VITE_CHARLIE_PK,
        aesKey: import.meta.env.VITE_CHARLIE_AES_KEY,
      },
      {
        name: 'David',
        privateKey: import.meta.env.VITE_DAVID_PK,
        aesKey: import.meta.env.VITE_DAVID_AES_KEY,
      },
      {
        name: 'Ethan',
        privateKey: import.meta.env.VITE_ETHAN_PK,
        aesKey: import.meta.env.VITE_ETHAN_AES_KEY,
      },
    ];

    return voterAccounts
      .filter(account => account.privateKey && account.aesKey)
      .map(account => {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new Wallet(account.privateKey, provider);
        wallet.setUserOnboardInfo({ aesKey: account.aesKey });
        
        return {
          ...account,
          wallet,
        };
      });
  }, [rpcUrl]);

  const getVoterWallet = (voterName: string): Wallet | undefined => {
    const voter = voters.find(v => v.name === voterName);
    return voter?.wallet;
  };

  const getContract = (wallet: Wallet) => {
    if (!contractAddress) {
      throw new Error('Contract address not set. Please set VITE_CONTRACT_ADDRESS in .env');
    }
    return new ethers.Contract(contractAddress, VOTING_CONTRACT_ABI, wallet);
  };

  const encryptVote = async (
    voteOption: number,
    wallet: Wallet,
  ) => {
    if (!contractAddress) {
      throw new Error('Contract address not set');
    }

    const contract = getContract(wallet);
    
    // Get the function selector from the contract interface
    const castVoteFunction = contract.interface.getFunction('castVote');
    if (!castVoteFunction) {
      throw new Error('Could not get castVote function');
    }
    
    const selector = castVoteFunction.selector;
    if (!selector) {
      throw new Error('Could not get castVote function selector');
    }

    // Encrypt the vote value using the wallet's encryptValue method
    const encryptedValue = await wallet.encryptValue(
      voteOption,
      contractAddress,
      selector,
    );

    return encryptedValue;
  };

  const castVote = async (voterName: string, voteOption: number) => {
    const wallet = getVoterWallet(voterName);
    if (!wallet) {
      throw new Error(`Wallet not found for voter: ${voterName}`);
    }

    // Encrypt the vote
    const encryptedVote = await encryptVote(voteOption, wallet);

    // Extract the ciphertext for display
    // encryptedVote is a tuple/object with ciphertext and signature
    let ciphertextDisplay = '';
    try {
      if (Array.isArray(encryptedVote)) {
        ciphertextDisplay = encryptedVote[0]?.toString() || '';
      } else if (encryptedVote.ciphertext) {
        ciphertextDisplay = encryptedVote.ciphertext.toString();
      } else {
        ciphertextDisplay = JSON.stringify(encryptedVote);
      }
    } catch (e) {
      ciphertextDisplay = 'encrypted';
    }

    // Get contract instance
    const contract = getContract(wallet);

    // Send transaction with retry logic
    const receipt = await retryWithBackoff(async () => {
      const tx = await contract.castVote(encryptedVote, {
        gasLimit: 15000000,
        gasPrice: ethers.parseUnits('10', 'gwei'),
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      return receipt;
    }, 3, 1000);

    // Return both receipt and encrypted ciphertext
    return {
      receipt,
      encryptedVote: ciphertextDisplay,
    };
  };

  const checkIfVoted = async (voterName: string): Promise<boolean> => {
    const wallet = getVoterWallet(voterName);
    if (!wallet || !contractAddress) {
      return false;
    }

    try {
      const contract = getContract(wallet);
      const voterData = await retryWithBackoff(
        async () => await contract.voters(wallet.address),
        3,
        500
      );
      return voterData.hasVoted;
    } catch (error) {
      console.error('Error checking vote status:', error);
      return false;
    }
  };

  const countVotesCast = async (): Promise<number> => {
    if (!contractAddress || voters.length === 0) {
      return 0;
    }

    try {
      let count = 0;
      for (const voter of voters) {
        if (!voter.wallet) continue;
        const contract = getContract(voter.wallet);
        const voterData = await contract.voters(voter.wallet.address);
        if (voterData.hasVoted) {
          count++;
        }
      }
      return count;
    } catch (error) {
      console.error('Error counting votes:', error);
      return 0;
    }
  };

  const getElectionStatus = async (): Promise<{ isOpen: boolean; voterCount: number } | null> => {
    if (!contractAddress || voters.length === 0) {
      return null;
    }

    try {
      // Use the first available voter's wallet to read contract state
      const wallet = voters[0].wallet;
      if (!wallet) return null;

      const contract = getContract(wallet);
      
      // Retry read operations
      const status = await retryWithBackoff(
        async () => await contract.getElectionStatus(),
        3,
        500
      );
      
      return {
        isOpen: status.isOpen,
        voterCount: Number(status.voterCount),
      };
    } catch (error) {
      console.error('Error getting election status:', error);
      return null;
    }
  };

  const aggregateVotes = async (): Promise<any> => {
    if (!contractAddress) {
      throw new Error('Contract not configured');
    }

    // Use Alice (owner) wallet for aggregation
    const ownerPK = import.meta.env.VITE_ALICE_PK;
    if (!ownerPK) {
      throw new Error('Owner private key not set. Please set VITE_ALICE_PK in .env');
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const ownerWallet = new Wallet(ownerPK, provider);
    const contract = getContract(ownerWallet);
    
    // Call aggregateVotes to compute tallies with retry logic
    return await retryWithBackoff(async () => {
      const tx = await contract.aggregateVotes({
        gasLimit: 15000000,
        gasPrice: ethers.parseUnits('10', 'gwei'),
      });

      const receipt = await tx.wait();
      return receipt;
    }, 3, 1000);
  };

  const getResults = async (): Promise<{ results: Array<{ optionId: number; optionLabel: string; voteCount: number }>; transactionHash: string } | null> => {
    if (!contractAddress || voters.length === 0) {
      return null;
    }

    try {
      // Check if election is closed first
      const status = await getElectionStatus();
      console.log('Election status:', status);
      
      if (!status || status.isOpen) {
        const message = status?.isOpen ? 'Election is still open' : 'Could not get election status';
        console.log(message + ' - results not available yet');
        throw new Error(message + '. Please close the election first.');
      }

      console.log('Election is closed, voter count:', status.voterCount);

      // Use Alice (owner) wallet with AES key for client-side decryption
      const ownerPK = import.meta.env.VITE_ALICE_PK;
      const ownerAesKey = import.meta.env.VITE_ALICE_AES_KEY;
      
      if (!ownerPK) {
        throw new Error('Owner private key not set. Please set VITE_ALICE_PK in .env');
      }
      
      if (!ownerAesKey) {
        throw new Error('Owner AES key not set. Please set VITE_ALICE_AES_KEY in .env');
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const ownerWallet = new Wallet(ownerPK, provider);
      ownerWallet.setUserOnboardInfo({ aesKey: ownerAesKey });
      
      // Updated ABI to match current contract
      const resultsAbi = [
        "function aggregateVotes() external",
        "function getEncryptedResult(uint8 optionId) external view returns (uint256)",
        "function getVotingOptions() external view returns (tuple(uint8 id, string label)[4])",
      ];
      const contract = new ethers.Contract(contractAddress, resultsAbi, ownerWallet);
      
      console.log('Step 1: Aggregating votes...');
      
      // Call aggregateVotes to compute encrypted tallies with retry logic
      const aggReceipt = await retryWithBackoff(async () => {
        const aggTx = await contract.aggregateVotes({
          gasLimit: 15000000,
          gasPrice: ethers.parseUnits('10', 'gwei'),
        });
        
        console.log('Aggregation transaction sent:', aggTx.hash);
        const receipt = await aggTx.wait();
        console.log('Votes aggregated (block', receipt.blockNumber, ')');

        if (receipt.status === 0) {
          throw new Error('Aggregation transaction failed');
        }
        
        return receipt;
      }, 3, 1000);
      
      console.log('Aggregation completed successfully');

      console.log('Step 2: Reading and decrypting results...');
      
      // Get voting options
      const options = await contract.getVotingOptions();
      
      // Read and decrypt each encrypted result
      const mappedResults = [];
      for (let i = 0; i < options.length; i++) {
        const optionId = Number(options[i].id);
        const optionLabel = options[i].label;
        
        let decryptedCount = 0;
        try {
          // Get encrypted result for this option
          const encryptedValue = await contract.getEncryptedResult(optionId);
          
          // Decrypt client-side using owner's wallet
          const decrypted = await ownerWallet.decryptValue(encryptedValue);
          decryptedCount = typeof decrypted === 'bigint' ? Number(decrypted) : Number(decrypted);
          console.log(`Option ${optionId} - ${optionLabel}: ${decryptedCount} votes`);
        } catch (decryptError) {
          console.error(`Error decrypting option ${optionId}:`, decryptError);
        }
        
        mappedResults.push({
          optionId: optionId,
          optionLabel: optionLabel,
          voteCount: decryptedCount,
        });
      }

      return {
        results: mappedResults,
        transactionHash: aggReceipt.hash,
      };
    } catch (error) {
      console.error('Error getting results:', error);
      throw error;
    }
  };

  const getVoterDataFromBlockchain = async (voterName: string) => {
    const wallet = getVoterWallet(voterName);
    if (!wallet) {
      throw new Error(`Wallet not found for voter: ${voterName}`);
    }

    console.log(`[getVoterData] Fetching voter data for ${voterName} from blockchain...`);
    console.log(`[getVoterData] Voter address: ${wallet.address}`);

    // Get contract instance
    const contract = getContract(wallet);

    try {
      // Read voter struct from public mapping
      console.log('[getVoterData] Calling contract.voters()...');
      const voterData = await contract.voters(wallet.address);

      console.log('[getVoterData] Raw voter data from blockchain:', voterData);
      console.log('[getVoterData] Voter details:', {
        name: voterData.name,
        voterId: voterData.voterId,
        isRegistered: voterData.isRegistered,
        hasVoted: voterData.hasVoted,
        hasAuthorizedOwner: voterData.hasAuthorizedOwner,
      });

      // The encryptedVote is a ctUint8 (uint256 in ABI)
      console.log('[getVoterData] Encrypted vote (ctUint8):', voterData.encryptedVote);
      console.log('[getVoterData] Encrypted vote type:', typeof voterData.encryptedVote);
      console.log('[getVoterData] Encrypted vote toString:', voterData.encryptedVote?.toString());

      return {
        name: voterData.name,
        voterId: voterData.voterId,
        isRegistered: voterData.isRegistered,
        hasVoted: voterData.hasVoted,
        hasAuthorizedOwner: voterData.hasAuthorizedOwner,
        encryptedVote: voterData.encryptedVote?.toString() || 'No vote cast',
      };
    } catch (error) {
      console.error('[getVoterData] Error reading voter data:', error);
      throw error;
    }
  };

  const toggleElection = async (): Promise<any> => {
    if (!contractAddress) {
      throw new Error('Contract address not set');
    }

    // Use Alice (owner) wallet
    const ownerPK = import.meta.env.VITE_ALICE_PK;
    if (!ownerPK) {
      throw new Error('Owner private key not set. Please set VITE_ALICE_PK in .env');
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const ownerWallet = new Wallet(ownerPK, provider);
    const contract = getContract(ownerWallet);

    // Send transaction with retry logic
    return await retryWithBackoff(async () => {
      const tx = await contract.toggleElection({
        gasLimit: 15000000,
        gasPrice: ethers.parseUnits('10', 'gwei'),
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      return receipt;
    }, 3, 1000);
  };

  return {
    voters,
    castVote,
    checkIfVoted,
    countVotesCast,
    getElectionStatus,
    getResults,
    aggregateVotes,
    toggleElection,
    getVoterDataFromBlockchain,
    contractAddress,
  };
}
