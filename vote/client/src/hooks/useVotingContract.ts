import { useMemo } from 'react';
import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';

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

    // Get contract instance
    const contract = getContract(wallet);

    // Send transaction
    const tx = await contract.castVote(encryptedVote, {
      gasLimit: 15000000,
      gasPrice: ethers.parseUnits('10', 'gwei'),
    });

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return receipt;
  };

  const checkIfVoted = async (voterName: string): Promise<boolean> => {
    const wallet = getVoterWallet(voterName);
    if (!wallet || !contractAddress) {
      return false;
    }

    try {
      const contract = getContract(wallet);
      const voterData = await contract.voters(wallet.address);
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
      const status = await contract.getElectionStatus();
      
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

    try {
      // Use owner wallet for aggregation (has more funds)
      const ownerPK = import.meta.env.VITE_DEPLOYER_PRIVATE_KEY;
      if (!ownerPK) {
        throw new Error('Owner private key not set. Please set VITE_DEPLOYER_PRIVATE_KEY in .env');
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const ownerWallet = new Wallet(ownerPK, provider);
      const contract = getContract(ownerWallet);
      
      // Call aggregateVotes to compute tallies
      const tx = await contract.aggregateVotes({
        gasLimit: 15000000,
        gasPrice: ethers.parseUnits('10', 'gwei'),
      });

      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Error aggregating votes:', error);
      throw error;
    }
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

      // Use owner wallet with AES key for client-side decryption
      const ownerPK = import.meta.env.VITE_DEPLOYER_PRIVATE_KEY;
      const ownerAesKey = import.meta.env.VITE_ALICE_AES_KEY;
      
      if (!ownerPK) {
        throw new Error('Owner private key not set. Please set VITE_DEPLOYER_PRIVATE_KEY in .env');
      }
      
      if (!ownerAesKey) {
        throw new Error('Owner AES key not set. Please set VITE_ALICE_AES_KEY in .env');
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const ownerWallet = new Wallet(ownerPK, provider);
      ownerWallet.setUserOnboardInfo({ aesKey: ownerAesKey });
      
      // Add getResultsForOwner to ABI
      const resultsAbi = [
        "function getResultsForOwner() external returns (uint256[4])",
        "function getVotingOptions() external view returns (tuple(uint8 id, string label)[])",
      ];
      const contract = new ethers.Contract(contractAddress, resultsAbi, ownerWallet);
      
      console.log('Calling getResultsForOwner() to get encrypted tallies...');
      
      // Call getResultsForOwner() - returns encrypted tallies FOR the owner
      const tx = await contract.getResultsForOwner({
        gasLimit: 15000000,
        gasPrice: ethers.parseUnits('10', 'gwei'),
      });
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Results transaction completed:', receipt.hash);

      if (receipt.status === 0) {
        throw new Error('Transaction failed - check if votes were cast');
      }

      // Now call again with staticCall to get the encrypted results
      const encryptedResults = await contract.getResultsForOwner.staticCall({
        gasLimit: 15000000,
      });
      
      console.log('Encrypted results received:', encryptedResults);
      
      // Get voting options to map labels
      const options = await contract.getVotingOptions();
      
      // Decrypt each result client-side
      const mappedResults = [];
      for (let i = 0; i < encryptedResults.length; i++) {
        const encryptedCount = encryptedResults[i];
        
        // Decrypt the count using the owner's wallet
        let decryptedCount = 0;
        try {
          // The encrypted value is already FOR the owner, so we can decrypt it
          const decrypted = await ownerWallet.decryptValue(encryptedCount);
          decryptedCount = typeof decrypted === 'bigint' ? Number(decrypted) : Number(decrypted);
          console.log(`Decrypted count for option ${i + 1}:`, decryptedCount);
        } catch (decryptError) {
          console.error(`Error decrypting option ${i + 1}:`, decryptError);
        }
        
        mappedResults.push({
          optionId: Number(options[i].id),
          optionLabel: options[i].label,
          voteCount: decryptedCount,
        });
      }

      return {
        results: mappedResults,
        transactionHash: receipt.hash,
      };
    } catch (error) {
      console.error('Error getting results:', error);
      throw error;
    }
  };

  const toggleElection = async (): Promise<any> => {
    if (!contractAddress) {
      throw new Error('Contract address not set');
    }

    // Use owner wallet (DEPLOYER_PRIVATE_KEY from .env)
    const ownerPK = import.meta.env.VITE_DEPLOYER_PRIVATE_KEY;
    if (!ownerPK) {
      throw new Error('Owner private key not set. Please set VITE_DEPLOYER_PRIVATE_KEY in .env');
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const ownerWallet = new Wallet(ownerPK, provider);
    const contract = getContract(ownerWallet);

    // Send transaction
    const tx = await contract.toggleElection({
      gasLimit: 15000000,
      gasPrice: ethers.parseUnits('10', 'gwei'),
    });

    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return receipt;
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
    contractAddress,
  };
}
