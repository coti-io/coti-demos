import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';

dotenv.config();

const contractAddress = process.env.CONTRACT || '0xCc30E5c9d49b50316F0f9A4731E39434f082FAbf';
const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';
const ownerPK = process.env.ALICE_PK;

const abi = [
  'function addVoter(string memory name, address voterId) public',
  'function isVoterRegistered(address voterId) external view returns (bool)'
];

async function registerAllVoters() {
  if (!ownerPK) {
    console.error('Error: ALICE_PK not found in .env file');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const ownerWallet = new Wallet(ownerPK, provider);
  const contract = new ethers.Contract(contractAddress, abi, ownerWallet);

  const voters = [
    { name: 'Bob', address: process.env.BOB_ADDRESS },
    { name: 'Bea', address: process.env.BEA_ADDRESS },
    { name: 'Charlie', address: process.env.CHARLIE_ADDRESS },
    { name: 'David', address: process.env.DAVID_ADDRESS },
    { name: 'Ethan', address: process.env.ETHAN_ADDRESS }
  ];

  console.log(`Registering voters on contract: ${contractAddress}\n`);

  for (const voter of voters) {
    if (!voter.address) {
      console.log(`⚠️  Skipping ${voter.name} - address not found in .env`);
      continue;
    }

    try {
      // Check if already registered
      const isRegistered = await contract.isVoterRegistered(voter.address);
      
      if (isRegistered) {
        console.log(`✓ ${voter.name} (${voter.address}) - already registered`);
        continue;
      }

      console.log(`Registering ${voter.name} (${voter.address})...`);
      
      const tx = await contract.addVoter(voter.name, voter.address, {
        gasLimit: 15000000,
        gasPrice: ethers.parseUnits('10', 'gwei'),
      });

      console.log(`  Transaction: ${tx.hash}`);
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`  ✓ ${voter.name} registered successfully!\n`);
      } else {
        console.log(`  ✗ ${voter.name} registration failed\n`);
      }
    } catch (error) {
      console.error(`  ✗ Error registering ${voter.name}:`, error.message, '\n');
    }
  }

  console.log('Registration complete!');
}

registerAllVoters().catch(console.error);
