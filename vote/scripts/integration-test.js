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

async function runIntegrationTest() {
  console.log('='.repeat(60));
  console.log('COTI VOTING CONTRACT - INTEGRATION TEST');
  console.log('='.repeat(60));
  console.log('');

  const contractAddress = process.env.VITE_CONTRACT_ADDRESS;
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';
  const ownerPK = process.env.VITE_DEPLOYER_PRIVATE_KEY;

  const voters = [
    { name: 'Bob', pk: process.env.VITE_BOB_PK, aesKey: process.env.VITE_BOB_AES_KEY, vote: 1 },
    { name: 'Bea', pk: process.env.VITE_BEA_PK, aesKey: process.env.VITE_BEA_AES_KEY, vote: 2 },
    { name: 'Charlie', pk: process.env.VITE_CHARLIE_PK, aesKey: process.env.VITE_CHARLIE_AES_KEY, vote: 1 },
    { name: 'David', pk: process.env.VITE_DAVID_PK, aesKey: process.env.VITE_DAVID_AES_KEY, vote: 3 },
    { name: 'Ethan', pk: process.env.VITE_ETHAN_PK, aesKey: process.env.VITE_ETHAN_AES_KEY, vote: 1 },
  ];

  const provider = new ethers.JsonRpcProvider(rpcUrl);

  // Test 1: Check initial election status
  console.log('TEST 1: Check Initial Election Status');
  console.log('-'.repeat(60));
  const ownerWallet = new Wallet(ownerPK, provider);
  const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, ownerWallet);
  
  let status = await contract.getElectionStatus();
  console.log(`✓ Election is open: ${status.isOpen}`);
  console.log(`✓ Voter count: ${status.voterCount}`);
  console.log(`✓ Owner: ${status.electionOwner}`);
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

  // Test 5: Get results
  console.log('TEST 5: Get Results (Aggregate and Decrypt)');
  console.log('-'.repeat(60));
  console.log('Calling getResults() - this will aggregate and decrypt votes...');
  
  try {
    const resultsTx = await contract.getResults({
      gasLimit: 15000000,
      gasPrice: ethers.parseUnits('10', 'gwei'),
    });
    
    console.log(`Transaction sent: ${resultsTx.hash}`);
    const resultsReceipt = await resultsTx.wait();
    console.log(`✓ Results transaction confirmed (block ${resultsReceipt.blockNumber})`);
    console.log(`  Status: ${resultsReceipt.status === 1 ? 'SUCCESS' : 'FAILED'}`);
    console.log('');

    if (resultsReceipt.status === 1) {
      // The results are returned in the transaction, but we can't easily parse them from the receipt
      // Instead, let's call getResults again with staticCall from the owner's perspective
      // But first, the owner needs to onboard
      // Parse the events from the transaction to get the decrypted results
      console.log('Parsing ResultsDecrypted events from transaction...');
      const resultsEvents = resultsReceipt.logs
        .map(log => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .filter(event => event && event.name === 'ResultsDecrypted');
      
      if (resultsEvents.length > 0) {
        console.log('');
        console.log('FINAL RESULTS:');
        console.log('='.repeat(60));
        
        let totalVotes = 0;
        const results = {};
        
        resultsEvents.forEach((event) => {
          const optionLabel = event.args.optionLabel;
          const voteCount = Number(event.args.voteCount);
          results[optionLabel] = voteCount;
          totalVotes += voteCount;
          console.log(`${optionLabel.padEnd(15)} : ${voteCount} votes`);
        });
        
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
      } else {
        console.log('❌ No ResultsDecrypted events found in transaction');
      }
    } else {
      console.log('❌ Results transaction failed!');
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
