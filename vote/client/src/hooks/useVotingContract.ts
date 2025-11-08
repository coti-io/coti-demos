import { useMemo } from 'react';
import { ethers, Wallet } from '@coti-io/coti-ethers';

// Contract ABI - only the functions we need
const VOTING_CONTRACT_ABI = [
  "function castVote(tuple(bytes ciphertext, bytes signature) encryptedVote) external",
  "function getVotingQuestion() external pure returns (string)",
  "function getVotingOptions() external view returns (tuple(uint8 id, string label)[])",
  "function isVoterRegistered(address voterId) external view returns (bool)",
  "function voters(address) external view returns (string name, address voterId, bytes encryptedVote, bool isRegistered, bool hasVoted, bool hasAuthorizedOwner)"
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
    const castVoteSelector = contract.interface.getFunction('castVote')?.selector;
    
    if (!castVoteSelector) {
      throw new Error('Could not get castVote function selector');
    }

    // Encrypt the vote value using the wallet's encryptValue method
    const encryptedValue = await wallet.encryptValue(
      voteOption,
      contractAddress,
      castVoteSelector,
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

  return {
    voters,
    castVote,
    checkIfVoted,
    contractAddress,
  };
}
