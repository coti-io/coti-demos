import { ethers } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';
dotenv.config();

async function testResults() {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS || '0xB2aB38FFf4Dd617EAa2EC1BD43E176A528E85BBF';
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';
  const bobPK = process.env.VITE_BOB_PK || process.env.BOB_PK;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(bobPK, provider);

  console.log('Testing contract at:', contractAddress);
  console.log('Using wallet:', wallet.address);

  const abi = [
    'function getElectionStatus() external view returns (bool isOpen, uint256 voterCount, address electionOwner)',
    'function getResults() external returns (tuple(uint8 optionId, string optionLabel, uint64 voteCount)[])',
    'function viewResults() external view returns (tuple(uint8 optionId, string optionLabel, uint64 voteCount)[])',
  ];

  const contract = new ethers.Contract(contractAddress, abi, wallet);

  try {
    // Check election status
    console.log('\n=== Election Status ===');
    const status = await contract.getElectionStatus();
    console.log('Is Open:', status.isOpen);
    console.log('Voter Count:', status.voterCount.toString());
    console.log('Owner:', status.electionOwner);

    if (status.isOpen) {
      console.log('\n⚠️  Election is still open. Close it first to see results.');
      return;
    }

    // Try to get results using staticCall
    console.log('\n=== Attempting to get results (staticCall) ===');
    try {
      const results = await contract.getResults.staticCall();
      console.log('Results:', results);
      
      results.forEach((result, index) => {
        console.log(`\nOption ${index + 1}:`);
        console.log('  ID:', result.optionId);
        console.log('  Label:', result.optionLabel);
        console.log('  Votes:', result.voteCount.toString());
      });
    } catch (error) {
      console.error('Error with staticCall:', error.message);
      
      // Try viewResults instead
      console.log('\n=== Trying viewResults (view function) ===');
      try {
        const viewResults = await contract.viewResults();
        console.log('View Results:', viewResults);
        
        viewResults.forEach((result, index) => {
          console.log(`\nOption ${index + 1}:`);
          console.log('  ID:', result.optionId);
          console.log('  Label:', result.optionLabel);
          console.log('  Votes:', result.voteCount.toString());
        });
      } catch (viewError) {
        console.error('Error with viewResults:', viewError.message);
        console.log('\n💡 You may need to call aggregateVotes() first');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testResults();
