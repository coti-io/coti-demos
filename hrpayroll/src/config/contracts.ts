import { InboxFeeManagerAbi } from "../abis/InboxFeeManager";
import { PayrollCampaignFacadeAbi } from "../abis/PayrollCampaignFacade";
import { PayrollCampaignFactoryAbi } from "../abis/PayrollCampaignFactory";
import { PayrollVaultAbi } from "../abis/PayrollVault";
import { PodClaimStoreAbi } from "../abis/PodClaimStore";
import { PodErc20MintableAbi } from "../abis/PodErc20Mintable";
import { PrivatePayrollCotiAbi } from "../abis/PrivatePayrollCoti";

// Live testnet deployment (Avalanche Fuji = client chain, COTI testnet = MPC server chain).
// Redeployed 2026-07-27 17:11 UTC — same iteration-10 contract code as the 2026-07-22 deploy
// (deployments/production-payroll-avalancheFuji.json). Address rotation only: every contract's
// function-selector set is unchanged on-chain, PayrollVault and PodClaimStore runtime bytecode
// is byte-identical to the old instances, and the factory/facade differ only in their embedded
// addresses — so nothing under src/abis/ needed regeneration.
//   fundPath: public pToken.transfer(facade) → requestCreditPool → COTI creditPool
//   claimPath: claim(7 args) → COTI verifyAndCredit → public payoutTo(to, amount, callbackFeeWei)
// iter10 removed ALL on-chain fee estimation (vault.estimateFee is gone): claim/claimTo take
// four caller-quoted fee args (inboxTotal/inboxCallback/pTokenTotal/pTokenCallback wei) which
// the vault escrows per-request; clawback gained the two pToken fee args. Quote live via the
// inbox's calculateTwoWayFeeRequiredInLocalToken (podFees.ts gas/size heuristics).
// The claim inbox leg is paid from facade float; the payout-callback pToken leg from vault
// float (both pre-funded with native AVAX — see tests/testnet/helpers.ts claim flow).
export const AVAX_CHAIN_ID = 43113; // Avalanche Fuji
export const COTI_TESTNET_CHAIN_ID = 7082400;

export const avaxContracts = {
  payrollVault: {
    address: "0x112e261bd663518bbf72d653c3e08ab78cdc0c63",
    abi: PayrollVaultAbi,
  },
  // Single entrypoint for campaign creation. Fees are never stored here — callers quote
  // the inbox's calculateTwoWayFeeRequiredInLocalToken live at use time (podFees.ts).
  payrollCampaignFactory: {
    address: "0x48cee4fae529fb494ac97366c123babb575f9818",
    abi: PayrollCampaignFactoryAbi,
  },
  payrollCampaignFacade: {
    // ABI host + reference campaign facade from the 2026-07-27 deploy (runId 1, pMTT).
    // Employee claims resolve the target facade from the claim package's facadeAddress —
    // this address is not the only campaign the UI can talk to. Activity scans every
    // vault-linked facade.
    address: "0xfc2471caeB69392eF513285D7daBEf181932416a",
    abi: PayrollCampaignFacadeAbi,
  },
  payrollClaimStore: {
    address: "0x652ea39e4d86492ce5813b2106ca415f78361185",
    abi: PodClaimStoreAbi,
  },
  pToken: {
    // pMTT ("Private MyTestToken") — deployed as an EIP-1167 minimal proxy to the same
    // PodErc20MintableInitializable implementation as the previous pUSDC deployment
    // (0xcee95959573618ee8464526c591fe70ae56ab293), so the existing ABI still applies.
    // Unlike pUSDC (6 decimals), pMTT uses 18 — see PTOKEN_DECIMALS in the pages that display it.
    // Redeployed 2026-07-27 as a fresh proxy instance behind the same implementation
    // (0xa7e4838327317f4ce6cc8b5ab07a57fdba842c77), so decimals/ABI are unchanged — the new
    // proxy still reports symbol pMTT, name "Private MyTestToken", decimals 18.
    address: "0x7BE9Cd10b51eFf6FFCE8f620EA17f6C4dc37a379",
    abi: PodErc20MintableAbi,
  },
  comptroller: {
    address: "0xcb3070637cfb3465d5335d859151232de585a655",
  },
  // Same address as cotiTestnetContracts.inbox — PoD inbox contracts deploy deterministically
  // to identical addresses across chains. Used by the fund flow's pToken fee computation.
  inbox: {
    address: "0x3b8B70819f27e0438cBcE7f31894f799da52648F",
    abi: InboxFeeManagerAbi,
  },
} as const;

export const cotiTestnetContracts = {
  privatePayrollCoti: {
    address: "0xa178f7f189be327dc69a7667db0d93bfebc612a5",
    abi: PrivatePayrollCotiAbi,
  },
  mpcExecutor: {
    address: "0x6804961167c3c8ef2bf6839ddcf51ec1fbe800c3",
  },
  inbox: {
    address: "0x3b8B70819f27e0438cBcE7f31894f799da52648F",
  },
} as const;
