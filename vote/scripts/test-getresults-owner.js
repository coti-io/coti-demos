import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';

dotenv.config({ path: './client/.env' });

async function testGetResultsWithOwner() {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';
  const ownerPK = process.env.VITE_DEPLOYER_PRIVATE_KEY;

  if (!ownerPK) {
    console.error('❌ VITE_DEPLOYER_PRIVATE_KEY not set');
    process.exit(1);
  }

  console.log('Contract:', contractAddress);
  console.log('');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const ownerWallet = new Wallet(ownerPK, provider);

  console.log('Using owner wallet:', ownerWallet.address);
  console.log('');

  // Try different ABI formats
  const abis = [
    {
      name: 'Fixed array [4]',
      abi: ['function getResults() external returns (tuple(uint8 optionId, string optionLabel, uint64 voteCount)[4])'],
    },
    {
      name: 'Dynamic array []',
      abi: ['function getResults() external returns (tuple(uint8 optionId, string optionLabel, uint64 voteCount)[])'],
    },
    {
      name: 'Public view',
      abi: ['function getResults() public view returns (tuple(uint8 optionId, string optionLabel, uint64 voteCount)[4])'],
    },
  ];

  for (const { name, abi } of abis) {
    console.log(`=== Testing with ABI: ${name} ===`);
    const contract = new ethers.Contract(contractAddress, abi, ownerWallet);

    try {
      console.log('Calling staticCall...');
      const results = await contract.getResults.staticCall({
        gasLimit: 15000000,
      });
      
      console.log('✅ SUCCESS!');
      console.log('Results:', results);
      console.log('');
      
      if (Array.isArray(results)) {
        results.forEach((result, index) => {
          console.log(`${result.optionLabel}: ${result.voteCount.toString()} votes`);
        });
      }
      console.log('');
      break; // Success, no need to try other ABIs
    } catch (error) {
      console.log('❌ Failed:', error.message);
      console.log('');
    }
  }

  // Also try calling it as a transaction
  console.log('=== Trying as transaction (not staticCall) ===');
  const contract = new ethers.Contract(
    contractAddress,
    ['function getResults() external returns (tuple(uint8 optionId, string optionLabel, uint64 voteCount)[4])'],
    ownerWallet
  );

  try {
    const tx = await contract.getResults({
      gasLimit: 15000000,
      gasPrice: ethers.parseUnits('10', 'gwei'),
    });
    
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');
    console.log('Status:', receipt.status);
    console.log('');
  } catch (error) {
    console.log('❌ Transaction failed:', error.message);
    console.log('');
  }
}

testGetResultsWithOwner()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
