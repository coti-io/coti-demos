import { ethers } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';
dotenv.config();

async function checkVoterStatus() {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS || '0xB2aB38FFf4Dd617EAa2EC1BD43E176A528E85BBF';
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';
  const bobPK = process.env.VITE_BOB_PK || 'd157bf9f861c63a3d9e9e9e5c72375567015f6dd780ea109942bda749691800f';

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(bobPK, provider);

  console.log('Bob wallet address:', wallet.address);
  console.log('Contract address:', contractAddress);

  const abi = [
    'function isVoterRegistered(address voterId) external view returns (bool)',
    'function getElectionStatus() external view returns (bool isOpen, uint256 voterCount, address electionOwner)',
    'function voters(address) external view returns (string name, address voterId, bytes encryptedVote, bool isRegistered, bool hasVoted, bool hasAuthorizedOwner)'
  ];

  const contract = new ethers.Contract(contractAddress, abi, provider);

  try {
    const isRegistered = await contract.isVoterRegistered(wallet.address);
    const electionStatus = await contract.getElectionStatus();
    
    console.log('\nElection Status:');
    console.log('Is election open:', electionStatus.isOpen);
    console.log('Voter count:', electionStatus.voterCount.toString());
    console.log('Election owner:', electionStatus.electionOwner);
    
    console.log('\nVoter Status:');
    console.log('Is Bob registered:', isRegistered);
    
    if (isRegistered) {
      const voterData = await contract.voters(wallet.address);
      console.log('\nVoter Details:');
      console.log('Name:', voterData.name);
      console.log('Has voted:', voterData.hasVoted);
      console.log('Has authorized owner:', voterData.hasAuthorizedOwner);
    }
  } catch (error) {
    console.error('Error checking voter status:', error.message);
  }
}

checkVoterStatus();
