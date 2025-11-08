import { ethers } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';
dotenv.config();

async function authorizeAllVoters() {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS || '0xB2aB38FFf4Dd617EAa2EC1BD43E176A528E85BBF';
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';

  const voters = [
    { name: 'Bob', pk: process.env.VITE_BOB_PK || process.env.BOB_PK },
    { name: 'Bea', pk: process.env.VITE_BEA_PK || process.env.BEA_PK },
    { name: 'Charlie', pk: process.env.VITE_CHARLIE_PK || process.env.CHARLIE_PK },
    { name: 'David', pk: process.env.VITE_DAVID_PK || process.env.DAVID_PK },
    { name: 'Ethan', pk: process.env.VITE_ETHAN_PK || process.env.ETHAN_PK },
  ];

  const abi = [
    'function authorizeOwnerToReadVote() external',
    'function voters(address) external view returns (string name, address voterId, uint256 encryptedVote, bool isRegistered, bool hasVoted, bool hasAuthorizedOwner)',
  ];

  console.log('Authorizing all voters to allow owner to read votes...\n');

  for (const voter of voters) {
    if (!voter.pk) {
      console.log(`⚠️  Skipping ${voter.name} - private key not found`);
      continue;
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(voter.pk, provider);
    const contract = new ethers.Contract(contractAddress, abi, wallet);

    try {
      // Check current authorization status
      const voterData = await contract.voters(wallet.address);
      
      console.log(`${voter.name} (${wallet.address}):`);
      console.log(`  Has voted: ${voterData.hasVoted}`);
      console.log(`  Has authorized owner: ${voterData.hasAuthorizedOwner}`);

      if (voterData.hasAuthorizedOwner) {
        console.log(`  ✓ Already authorized\n`);
        continue;
      }

      if (!voterData.hasVoted) {
        console.log(`  ⚠️  Has not voted yet, skipping authorization\n`);
        continue;
      }

      // Authorize owner
      console.log(`  Authorizing...`);
      const tx = await contract.authorizeOwnerToReadVote({
        gasLimit: 500000,
        gasPrice: ethers.parseUnits('10', 'gwei'),
      });

      console.log(`  Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`  ✓ Authorized successfully (block ${receipt.blockNumber})\n`);

    } catch (error) {
      console.error(`  ✗ Error: ${error.message}\n`);
    }
  }

  console.log('=== Authorization Complete ===');
}

authorizeAllVoters().catch(console.error);
