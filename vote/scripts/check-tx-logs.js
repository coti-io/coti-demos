import { ethers, Wallet } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';
dotenv.config({ path: './client/.env' });

async function checkTxLogs() {
  const txHash = '0xe0ee47804103ef1706795c128ce0104f18a05f338737b2395ba541ffb131b23c';
  const rpcUrl = process.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const receipt = await provider.getTransactionReceipt(txHash);
  
  console.log('Transaction Receipt:');
  console.log('Status:', receipt.status);
  console.log('Logs count:', receipt.logs.length);
  console.log('');
  
  receipt.logs.forEach((log, index) => {
    console.log(`Log ${index}:`);
    console.log('  Address:', log.address);
    console.log('  Topics:', log.topics);
    console.log('  Data:', log.data);
    console.log('');
  });
}

checkTxLogs()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
