// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import { InboxUser } from "@coti-io/coti-contracts/contracts/pod/InboxUser.sol";
import { ctBool, gtBool, gtUint64, MpcCore } from "@coti-io/coti-contracts/contracts/utils/mpc/MpcCore.sol";

/**
 * @title MillionaireComparisonCoti
 * @notice COTI-side private logic for the Millionaires' Problem PoD demo.
 */
contract MillionaireComparisonCoti is InboxUser {
    event ComparisonComputed(address indexed alice, address indexed bob);

    constructor(address inbox_) {
        setInbox(inbox_);
    }

    function compareWealth(gtUint64 aliceWealth, gtUint64 bobWealth, address alice, address bob) external onlyInbox {
        gtBool aliceIsRicher = MpcCore.gt(aliceWealth, bobWealth);
        ctBool aliceResult = MpcCore.offBoardToUser(aliceIsRicher, alice);
        ctBool bobResult = MpcCore.offBoardToUser(aliceIsRicher, bob);

        emit ComparisonComputed(alice, bob);
        inbox.respond(abi.encode(aliceResult, bobResult));
    }
}
