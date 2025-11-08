import { ethers, Wallet } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';
dotenv.config({ path: './client/.env' });

const CONTRACT_ABI = [
  "function castVote(tuple(uint256 ciphertext, bytes signature) encryptedVote) external",
  "function getElectionStatus() external view returns (bool isOpen, uint256 voterCount, address electionOwner)",
  "function toggleElection() external",
  "function getResults() external returns (tuple(uint8 optionId, string optionLabel, uint64 voteCount)[4])",
  "function voters(address) external view returns (string name, address voterId, uint256 encryptedVote, bool isRegistered, bool hasVoted, bool hasAuthorizedOwner)",
  "event ResultsDecrypted(uint8 indexed optionId, string optionLabel, uint64 voteCount)",
];

async function simpleTest() {
  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';
  const ownerPK = process.env.VITE_DEPLOYER_PRIVATE_KEY;
  const bobPK = process.env.VITE_BOB_PK;
  const bobAesKey = process.env.VITE_BOB_AES_KEY;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const ownerWallet = new Wallet(ownerPK, provider);
  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, ownerWallet);

  console.log('Simple Test: One voter, one vote');
  console.log('='.repeat(60));

  // Cast one vote (Bob votes for option 1 - Chocolate)
  const bobWallet = new Wallet(bobPK, provider);
  bobWallet.setUserOnboardInfo({ aesKey: bobAesKey });
  const bobContract = new ethers.Contract(contractAddress, CONTRACT_ABI, bobWallet);

  const castVoteFunction = bobContract.interface.getFunction('castVote');
  const selector = castVoteFunction.selector;
  const encryptedVote = await bobWallet.encryptValue(1, contractAddress, selector);

  console.log('Bob voting for option 1 (Chocolate)...');
  const tx = await bobContract.castVote(encryptedVote, {
    gasLimit: 15000000,
    gasPrice: ethers.parseUnits('10', 'gwei'),
  });
  await tx.wait();
  console.log('✓ Vote cast');

  // Close election
  console.log('Closing election...');
  const closeTx = await contract.toggleElection({
    gasLimit: 15000000,
    gasPrice: ethers.parseUnits('10', 'gwei'),
  });
  await closeTx.wait();
  console.log('✓ Election closed');

  // Get results
  console.log('Getting results...');
  const resultsTx = await contract.getResults({
    gasLimit: 15000000,
    gasPrice: ethers.parseUnits('10', 'gwei'),
  });
  const receipt = await resultsTx.wait();

  const resultsEvents = receipt.logs
    .map(log => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .filter(event => event && event.name === 'ResultsDecrypted');

  console.log('');
  console.log('Results:');
  resultsEvents.forEach((event) => {
    console.log(`${event.args.optionLabel}: ${event.args.voteCount} votes`);
  });
}

simpleTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
