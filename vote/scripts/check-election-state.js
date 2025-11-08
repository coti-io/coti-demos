import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';

dotenv.config({ path: './client/.env' });

const CONTRACT_ABI = [
  "function getElectionStatus() external view returns (bool isOpen, uint256 voterCount, address electionOwner)",
  "function getVotingQuestion() external pure returns (string)",
  "function voterAddresses(uint256) external view returns (address)",
];

async function checkElectionState() {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';
  
  console.log('Contract Address:', contractAddress);
  console.log('RPC URL:', rpcUrl);
  console.log('');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

  // Check election status
  const status = await contract.getElectionStatus();
  console.log('Election Status:');
  console.log('  Is Open:', status.isOpen);
  console.log('  Voter Count:', status.voterCount.toString());
  console.log('  Owner:', status.electionOwner);
  console.log('');

  // Check voting question
  const question = await contract.getVotingQuestion();
  console.log('Voting Question:', question);
  console.log('');

  // List registered voters
  console.log('Registered Voters:');
  const voterCount = Number(status.voterCount);
  for (let i = 0; i < voterCount; i++) {
    try {
      const voterAddr = await contract.voterAddresses(i);
      console.log(`  ${i + 1}. ${voterAddr}`);
    } catch (error) {
      console.log(`  ${i + 1}. Error reading voter address`);
    }
  }
  console.log('');
  
  console.log('Summary:');
  console.log(`  Total Registered Voters: ${voterCount}`);
  console.log(`  Election Status: ${status.isOpen ? 'OPEN' : 'CLOSED'}`);
  console.log('');
  
  if (!status.isOpen) {
    console.log('✅ Election is closed - ready to fetch results');
    console.log('   Run: node scripts/test-results.js');
  } else {
    console.log('⚠️  Election is still open');
    console.log('   Close the election first to view results');
  }
}

checkElectionState()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
