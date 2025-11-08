import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';

dotenv.config({ path: './client/.env' });

async function aggregateAndFetch() {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';
  const ownerPK = process.env.VITE_DEPLOYER_PRIVATE_KEY;

  if (!ownerPK) {
    console.error('❌ VITE_DEPLOYER_PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  console.log('Contract Address:', contractAddress);
  console.log('RPC URL:', rpcUrl);
  console.log('');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const ownerWallet = new Wallet(ownerPK, provider);

  console.log('Using owner wallet:', ownerWallet.address);
  console.log('');

  const abi = [
    'function getElectionStatus() external view returns (bool isOpen, uint256 voterCount, address electionOwner)',
    'function aggregateVotes() external',
    'function getResults() external returns (tuple(uint8 optionId, string optionLabel, uint64 voteCount)[4])',
    'function viewResults() external view returns (tuple(uint8 optionId, string optionLabel, uint64 voteCount)[4])',
  ];

  const contract = new ethers.Contract(contractAddress, abi, ownerWallet);

  try {
    // Check election status
    console.log('=== Checking Election Status ===');
    const status = await contract.getElectionStatus();
    console.log('Is Open:', status.isOpen);
    console.log('Voter Count:', status.voterCount.toString());
    console.log('Owner:', status.electionOwner);
    console.log('');

    if (status.isOpen) {
      console.log('❌ Election is still open. Close it first.');
      process.exit(1);
    }

    // Step 1: Call aggregateVotes
    console.log('=== Step 1: Calling aggregateVotes() ===');
    try {
      const aggTx = await contract.aggregateVotes({
        gasLimit: 15000000,
        gasPrice: ethers.parseUnits('10', 'gwei'),
      });
      
      console.log('Transaction sent:', aggTx.hash);
      console.log('Waiting for confirmation...');
      
      const aggReceipt = await aggTx.wait();
      console.log('✅ Aggregation completed!');
      console.log('Block:', aggReceipt.blockNumber);
      console.log('Gas used:', aggReceipt.gasUsed.toString());
      console.log('');
    } catch (aggError) {
      console.log('⚠️  Aggregation failed (may already be done):', aggError.message);
      console.log('Continuing to fetch results...');
      console.log('');
    }

    // Step 2: Try viewResults (read-only)
    console.log('=== Step 2: Calling viewResults() ===');
    try {
      const viewResults = await contract.viewResults();
      console.log('✅ Results retrieved!');
      console.log('');
      
      viewResults.forEach((result, index) => {
        console.log(`${result.optionLabel}:`);
        console.log(`  Votes: ${result.voteCount.toString()}`);
      });
      console.log('');
    } catch (viewError) {
      console.log('❌ viewResults failed:', viewError.message);
      console.log('');
    }

    // Step 3: Call getResults (state-changing, returns decrypted values)
    console.log('=== Step 3: Calling getResults() ===');
    try {
      // First try staticCall to see the data
      const results = await contract.getResults.staticCall({
        gasLimit: 15000000,
      });
      
      console.log('✅ Results (via staticCall):');
      console.log('');
      
      results.forEach((result, index) => {
        console.log(`${result.optionLabel}:`);
        console.log(`  Votes: ${result.voteCount.toString()}`);
      });
      console.log('');

      // Now send the actual transaction
      console.log('Sending getResults transaction...');
      const tx = await contract.getResults({
        gasLimit: 15000000,
        gasPrice: ethers.parseUnits('10', 'gwei'),
      });
      
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed!');
      console.log('Block:', receipt.blockNumber);
      console.log('');
      
    } catch (resultsError) {
      console.log('❌ getResults failed:', resultsError.message);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

aggregateAndFetch()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
