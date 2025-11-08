import { ethers, Wallet } from '@coti-io/coti-ethers';
import dotenv from 'dotenv';
dotenv.config({ path: './client/.env' });

// Simple contract to test MPC operations
const TEST_CONTRACT = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

contract MPCTest {
    ctUint8 public storedValue;
    
    function storeValue(itUint8 calldata encryptedValue) public {
        gtUint8 validated = MpcCore.validateCiphertext(encryptedValue);
        storedValue = MpcCore.offBoard(validated);
    }
    
    function getValue() public view returns (uint8) {
        gtUint8 loaded = MpcCore.onBoard(storedValue);
        return MpcCore.decrypt(loaded);
    }
}
`;

console.log('This would require deploying a test contract.');
console.log('The issue is likely in how we\'re using MPC operations.');
console.log('');
console.log('Let me check the aggregation logic more carefully...');
