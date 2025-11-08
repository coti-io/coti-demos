import { ethers, Wallet } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';
dotenv.config({ path: './client/.env' });

async function testViewResults() {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';
  const ownerPK = process.env.VITE_DEPLOYER_PRIVATE_KEY;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const ownerWallet = new Wallet(ownerPK, provider);
  
  const abi = [
    'function viewResults() external view returns (tuple(uint8 optionId, string optionLabel, uint64 voteCount)[4])',
    'function getElectionStatus() external view returns (bool isOpen, uint256 voterCount, address electionOwner)',
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, ownerWallet);
  
  console.log('Contract:', contractAddress);
  console.log('Owner:', ownerWallet.address);
  console.log('');
  
  const status = await contract.getElectionStatus();
  console.log('Election Status:');
  console.log('  Is Open:', status.isOpen);
  console.log('  Voter Count:', status.voterCount.toString());
  console.log('');
  
  console.log('Calling viewResults()...');
  try {
    const results = await contract.viewResults();
    console.log('✓ Success!');
    console.log('');
    console.log('Results:');
    results.forEach(r => {
      console.log(`  ${r.optionLabel}: ${r.voteCount.toString()} votes`);
    });
  } catch (error) {
    console.log('✗ Error:', error.message);
  }
}

testViewResults()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
