import { ethers, Wallet } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';
dotenv.config({ path: './client/.env' });

async function reopenElection() {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';
  const ownerPK = process.env.VITE_DEPLOYER_PRIVATE_KEY;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const ownerWallet = new Wallet(ownerPK, provider);
  
  const abi = [
    'function toggleElection() external',
    'function getElectionStatus() external view returns (bool isOpen, uint256 voterCount, address electionOwner)',
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, ownerWallet);
  
  const status = await contract.getElectionStatus();
  console.log('Current status - Is Open:', status.isOpen);
  
  if (!status.isOpen) {
    console.log('Reopening election...');
    const tx = await contract.toggleElection({
      gasLimit: 15000000,
      gasPrice: ethers.parseUnits('10', 'gwei'),
    });
    await tx.wait();
    console.log('✓ Election reopened');
  } else {
    console.log('Election is already open');
  }
}

reopenElection()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
