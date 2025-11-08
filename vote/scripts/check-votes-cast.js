import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';

dotenv.config({ path: './client/.env' });

async function checkVotesCast() {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';

  const voterNames = ['Bob', 'Bea', 'Charlie', 'David', 'Ethan'];
  const voterKeys = [
    process.env.VITE_BOB_PK,
    process.env.VITE_BEA_PK,
    process.env.VITE_CHARLIE_PK,
    process.env.VITE_DAVID_PK,
    process.env.VITE_ETHAN_PK,
  ];

  console.log('Contract Address:', contractAddress);
  console.log('');

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // We need to use a custom ABI that matches the actual struct
  const abi = [
    'function voters(address) external view returns (string name, address voterId, uint256 encryptedVote, bool isRegistered, bool hasVoted, bool hasAuthorizedOwner)',
  ];

  const contract = new ethers.Contract(contractAddress, abi, provider);

  console.log('Checking vote status for each voter:');
  console.log('');

  let totalVoted = 0;
  let totalAuthorized = 0;

  for (let i = 0; i < voterNames.length; i++) {
    if (!voterKeys[i]) {
      console.log(`${voterNames[i]}: No private key configured`);
      continue;
    }

    const wallet = new ethers.Wallet(voterKeys[i]);
    
    try {
      const voterData = await contract.voters(wallet.address);
      
      console.log(`${voterNames[i]} (${wallet.address}):`);
      console.log(`  Registered: ${voterData.isRegistered}`);
      console.log(`  Has Voted: ${voterData.hasVoted}`);
      console.log(`  Authorized Owner: ${voterData.hasAuthorizedOwner}`);
      console.log(`  Encrypted Vote: ${voterData.encryptedVote}`);
      console.log('');

      if (voterData.hasVoted) totalVoted++;
      if (voterData.hasAuthorizedOwner) totalAuthorized++;
    } catch (error) {
      console.log(`  Error reading voter data: ${error.message}`);
      console.log('');
    }
  }

  console.log('Summary:');
  console.log(`  Total Voted: ${totalVoted}/${voterNames.length}`);
  console.log(`  Total Authorized Owner: ${totalAuthorized}/${voterNames.length}`);
  console.log('');

  if (totalVoted === 0) {
    console.log('❌ NO VOTES WERE CAST!');
    console.log('   This is why getResults() is failing.');
    console.log('   You need to cast votes before closing the election.');
  } else if (totalAuthorized < totalVoted) {
    console.log('⚠️  Some voters have not authorized the owner!');
    console.log('   Aggregation requires voters to authorize the owner to read their votes.');
  } else {
    console.log('✅ Votes were cast and voters authorized the owner.');
    console.log('   The issue must be something else.');
  }
}

checkVotesCast()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
