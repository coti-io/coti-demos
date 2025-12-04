// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@coti-io/coti-contracts/contracts/token/PrivateERC20/PrivateERC20.sol";
import "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

contract MyToken is PrivateERC20 {
    constructor() PrivateERC20("MyToken", "MTK") {}

    // Public mint function for testnet - allows anyone to mint tokens for testing
    function mint(address to, itUint64 calldata amount) external {
        gtUint64 gtAmount = MpcCore.validateCiphertext(amount);
        _mint(to, gtAmount);
    }

    // Get caller's balance in encrypted form that they can decrypt
    function getMyBalance() public returns (ctUint64) {
        return balanceOfMe();
    }
}
