import { ethers, Wallet } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';
dotenv.config({ path: './client/.env' });

const CONTRACT_ABI = [
  "function castVote(tuple(uint256 ciphertext, bytes signature) encryptedVote) external",
  "function getElectionStatus() external view returns (bool isOpen, uint256 voterCount, address electionOwner)",
  "function toggleElection() external",
  "function aggregateVotes() external",
  "function getEncryptedResult(uint8 optionId) external view returns (uint256)",
  "function getVotingOptions() external view returns (tuple(uint8 id, string label)[4])",
  "function voters(address) external view returns (string name, address voterId, uint256 encryptedVote, bool isRegistered, bool hasVoted, bool hasAuthorizedOwner)",
];

async function runIntegrationTest() {
  console.log('='.repeat(60));
  console.log('COTI VOTING CONTRACT - INTEGRATION TEST');
  console.log('='.repeat(60));
  console.log('');

  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';
  // Use Alice as owner since she's the one with the AES key for decryption
  const ownerPK = process.env.VITE_ALICE_PK;

  const voters = [
    { name: 'Bob', pk: process.env.VITE_BOB_PK, aesKey: process.env.VITE_BOB_AES_KEY, vote: 1 },
    { name: 'Bea', pk: process.env.VITE_BEA_PK, aesKey: process.env.VITE_BEA_AES_KEY, vote: 2 },
    { name: 'Charlie', pk: process.env.VITE_CHARLIE_PK, aesKey: process.env.VITE_CHARLIE_AES_KEY, vote: 1 },
    { name: 'David', pk: process.env.VITE_DAVID_PK, aesKey: process.env.VITE_DAVID_AES_KEY, vote: 3 },
    { name: 'Ethan', pk: process.env.VITE_ETHAN_PK, aesKey: process.env.VITE_ETHAN_AES_KEY, vote: 1 },
  ];

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Test 1: Reset election state to ensure clean start
  console.log('TEST 1: Reset Election State');
  console.log('-'.repeat(60));
  const ownerWallet = new Wallet(ownerPK, provider);
  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, ownerWallet);
  
  let status = await contract.getElectionStatus();
  console.log(`Initial state - Election is open: ${status.isOpen}`);
  console.log(`Voter count: ${status.voterCount}`);
  console.log(`Owner: ${status.electionOwner}`);
  
  // Always close and reopen to ensure clean state (clears old votes and tallies)
  if (status.isOpen) {
    console.log('Closing election to reset state...');
    const closeTx = await contract.toggleElection({
      gasLimit: 15000000,
      gasPrice: ethers.parseUnits('10', 'gwei'),
    });
    await closeTx.wait();
  }
  
  console.log('Opening election (this resets all votes and tallies)...');
  const openTx = await contract.toggleElection({
    gasLimit: 15000000,
    gasPrice: ethers.parseUnits('10', 'gwei'),
  });
  await openTx.wait();
  
  status = await contract.getElectionStatus();
  console.log(`✓ Election is now open: ${status.isOpen}`);
  console.log('');

  // Test 2: Cast votes
  console.log('TEST 2: Cast Votes');
  console.log('-'.repeat(60));
  
  for (const voter of voters) {
    const voterWallet = new Wallet(voter.pk, provider);
    voterWallet.setUserOnboardInfo({ aesKey: voter.aesKey });
    const voterContract = new ethers.Contract(contractAddress, CONTRACT_ABI, voterWallet);
    
    // Get function selector
    const castVoteFunction = voterContract.interface.getFunction('castVote');
    const selector = castVoteFunction.selector;
    
    // Encrypt vote
    const encryptedVote = await voterWallet.encryptValue(voter.vote, contractAddress, selector);
    
    // Cast vote
    console.log(`Casting vote for ${voter.name} (option ${voter.vote})...`);
    const tx = await voterContract.castVote(encryptedVote, {
      gasLimit: 15000000,
      gasPrice: ethers.parseUnits('10', 'gwei'),
    });
    
    const receipt = await tx.wait();
    console.log(`✓ ${voter.name} voted successfully (tx: ${receipt.hash.slice(0, 10)}...)`);
    
    // Verify vote was recorded
    const voterData = await contract.voters(voterWallet.address);
    console.log(`  - Has voted: ${voterData.hasVoted}`);
    console.log(`  - Authorized owner: ${voterData.hasAuthorizedOwner}`);
  }
  console.log('');

  // Test 3: Verify all votes were cast
  console.log('TEST 3: Verify All Votes Cast');
  console.log('-'.repeat(60));
  let totalVoted = 0;
  for (const voter of voters) {
    const voterWallet = new Wallet(voter.pk, provider);
    const voterData = await contract.voters(voterWallet.address);
    if (voterData.hasVoted) totalVoted++;
  }
  console.log(`✓ Total votes cast: ${totalVoted}/${voters.length}`);
  console.log('');

  // Test 4: Close election
  console.log('TEST 4: Close Election');
  console.log('-'.repeat(60));
  console.log('Closing election...');
  const closeTx = await contract.toggleElection({
    gasLimit: 15000000,
    gasPrice: ethers.parseUnits('10', 'gwei'),
  });
  await closeTx.wait();
  
  status = await contract.getElectionStatus();
  console.log(`✓ Election is now closed: ${!status.isOpen}`);
  console.log('');

  // Test 5: Get results (client-side decryption)
  console.log('TEST 5: Get Results (Client-Side Decryption)');
  console.log('-'.repeat(60));
  
  // Setup owner wallet with AES key for decryption
  const ownerAesKey = process.env.VITE_ALICE_AES_KEY;
  if (!ownerAesKey) {
    throw new Error('VITE_ALICE_AES_KEY not set');
  }
  ownerWallet.setUserOnboardInfo({ aesKey: ownerAesKey });
  console.log('Owner wallet configured with AES key');
  
  try {
    // Step 1: Aggregate votes
    console.log('Calling aggregateVotes()...');
    const aggTx = await contract.aggregateVotes({
      gasLimit: 15000000,
      gasPrice: ethers.parseUnits('10', 'gwei'),
    });
    await aggTx.wait();
    console.log('✓ Votes aggregated');
    console.log('');
    
    // Step 2: Get voting options
    const options = await contract.getVotingOptions();
    
    // Step 3: Read and decrypt each encrypted result
    console.log('Reading and decrypting results...');
    console.log('');
    console.log('FINAL RESULTS:');
    console.log('='.repeat(60));
    
    let totalVotes = 0;
    const results = {};
    
    for (let i = 0; i < options.length; i++) {
      const optionId = Number(options[i].id);
      const optionLabel = options[i].label;
      
      try {
        // Get encrypted result for this option
        const encryptedValue = await contract.getEncryptedResult(optionId);
        
        // Decrypt client-side
        const decrypted = await ownerWallet.decryptValue(encryptedValue);
        const voteCount = typeof decrypted === 'bigint' ? Number(decrypted) : Number(decrypted);
        results[optionLabel] = voteCount;
        totalVotes += voteCount;
        console.log(`Option ${optionId} - ${optionLabel.padEnd(12)} : ${voteCount} votes`);
      } catch (decryptError) {
        console.log(`Option ${optionId} - ${optionLabel.padEnd(12)} : Error - ${decryptError.message}`);
        results[optionLabel] = 0;
      }
    }
    
    console.log('-'.repeat(60));
    console.log(`Total votes counted: ${totalVotes}`);
    console.log('');

    // Verify expected results
    const expectedResults = {
      'Chocolate': 3,  // Bob, Charlie, Ethan
      'Raspberry': 1,  // Bea
      'Sandwich': 1,   // David
      'Mango': 0
    };

    console.log('VERIFICATION:');
    console.log('-'.repeat(60));
    let allCorrect = true;
    Object.keys(expectedResults).forEach((optionLabel) => {
      const expected = expectedResults[optionLabel];
      const actual = results[optionLabel] || 0;
      const match = expected === actual;
      allCorrect = allCorrect && match;
      console.log(`${optionLabel.padEnd(15)} : Expected ${expected}, Got ${actual} ${match ? '✓' : '✗'}`);
    });
    
    console.log('');
    if (allCorrect) {
      console.log('✅ ALL TESTS PASSED!');
    } else {
      console.log('❌ SOME TESTS FAILED!');
    }
  } catch (error) {
    console.log('❌ Error getting results:', error.message);
    throw error;
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('INTEGRATION TEST COMPLETE');
  console.log('='.repeat(60));
}

runIntegrationTest()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
