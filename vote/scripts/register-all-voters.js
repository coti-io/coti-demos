import { ethers } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';
dotenv.config({ path: './client/.env' });

async function registerVoters() {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS || '0xB2aB38FFf4Dd617EAa2EC1BD43E176A528E85BBF';
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';
  const ownerPK = process.env.VITE_ALICE_PK; // Contract owner (Alice)

  if (!ownerPK) {
    console.error('Error: DEPLOYER_PRIVATE_KEY not found in .env file');
    return;
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const ownerWallet = new ethers.Wallet(ownerPK, provider);

  console.log('Contract owner address:', ownerWallet.address);
  console.log('Contract address:', contractAddress);

  const abi = [
    'function addVoter(string memory name, address voterId) public',
    'function isVoterRegistered(address voterId) external view returns (bool)',
    'function getElectionStatus() external view returns (bool isOpen, uint256 voterCount, address electionOwner)'
  ];

  const contract = new ethers.Contract(contractAddress, abi, ownerWallet);

  // Define voters to register
  const voters = [
    { name: 'Bob', pk: process.env.VITE_BOB_PK || process.env.BOB_PK },
    { name: 'Bea', pk: process.env.VITE_BEA_PK || process.env.BEA_PK },
    { name: 'Charlie', pk: process.env.VITE_CHARLIE_PK || process.env.CHARLIE_PK },
    { name: 'David', pk: process.env.VITE_DAVID_PK || process.env.DAVID_PK },
    { name: 'Ethan', pk: process.env.VITE_ETHAN_PK || process.env.ETHAN_PK },
  ];

  console.log('\nRegistering voters...\n');

  for (const voter of voters) {
    if (!voter.pk) {
      console.log(`⚠️  Skipping ${voter.name} - private key not found`);
      continue;
    }

    const voterWallet = new ethers.Wallet(voter.pk, provider);
    const voterAddress = voterWallet.address;

    try {
      // Check if already registered
      const isRegistered = await contract.isVoterRegistered(voterAddress);
      
      if (isRegistered) {
        console.log(`✓ ${voter.name} (${voterAddress}) - already registered`);
        continue;
      }

      // Register the voter
      console.log(`Registering ${voter.name} (${voterAddress})...`);
      const tx = await contract.addVoter(voter.name, voterAddress, {
        gasLimit: 500000,
        gasPrice: ethers.parseUnits('10', 'gwei'),
      });

      console.log(`  Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✓ ${voter.name} registered successfully (block ${receipt.blockNumber})\n`);

    } catch (error) {
      console.error(`✗ Error registering ${voter.name}:`, error.message, '\n');
    }
  }

  // Check final status
  const finalStatus = await contract.getElectionStatus();
  console.log('\n=== Final Status ===');
  console.log('Total voters registered:', finalStatus.voterCount.toString());
  console.log('Election is open:', finalStatus.isOpen);
}

registerVoters().catch(console.error);
