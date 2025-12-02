// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@coti-io/coti-contracts/contracts/token/PrivateERC20/PrivateERC20.sol";

contract MyToken is PrivateERC20 {
    constructor() PrivateERC20("MyToken", "MTK") {}
}
