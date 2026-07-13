/**
 * Shared `@coti-io/pod-sdk` wiring for the Millionaire PoD demo.
 *
 * PoD inbox flows (`compareWealth`): `PodContract` + `PodRequest`.
 * Normal app-chain txs (`setAliceWealth` / `setBobWealth`): `CotiPodCrypto` encrypt + ethers `Contract`.
 *
 * @see https://github.com/coti-io/coti-sdk-pod/tree/main/skills/pod-dapp-builder
 */

import { ethers } from 'ethers';
import {
    PodContract,
    PodRequest,
    CotiPodCrypto,
    DataType,
    COTI_TESTNET_DEFAULT_INBOX_ADDRESS,
    SEPOLIA_DEFAULT_INBOX_ADDRESS,
    FUJI_DEFAULT_INBOX_ADDRESS,
} from '@coti-io/pod-sdk';
import { readEnv } from '../envRead.js';
import { COTI_TESTNET_CHAIN_ID } from './defaults.js';
import { getPodNetwork, resolvePodRpcUrl } from './network.js';

const INBOX_MIN_GAS_PRICE_WEI = 2_000_000_000n;
const MAX_UINT64 = (1n << 64n) - 1n;

const WEALTH_IFACE = new ethers.Interface([
    'function setAliceWealth(tuple(uint256 ciphertext, bytes signature) wealth) external',
    'function setBobWealth(tuple(uint256 ciphertext, bytes signature) wealth) external',
]);

/** Fee estimation inputs for `compareWealth` (two-way PoD). */
export const COMPARE_WEALTH_FEE_CONFIG = {
    forwardGasLimit: 300_000n,
    callBackGasLimit: 300_000n,
    callBackDataSize: 128n,
};

function hex(v) {
    const t = String(v).trim();
    return t.startsWith('0x') ? t : `0x${t}`;
}

export function resolveEncryptionNetwork() {
    return readEnv('VITE_POD_ENCRYPTION_URL') || readEnv('VITE_POD_ENCRYPTION_NETWORK') || 'testnet';
}

/** Same gas price floor + resolution used by `PodContract.estimateFee`. */
export async function resolvePodGasPrice(provider) {
    const fd = await provider.getFeeData();
    const raw = fd.maxFeePerGas ?? fd.gasPrice ?? INBOX_MIN_GAS_PRICE_WEI;
    return raw < INBOX_MIN_GAS_PRICE_WEI ? INBOX_MIN_GAS_PRICE_WEI : raw;
}

export function buildPodSdkConfig(networkId) {
    const podCfg = getPodNetwork(networkId);
    const appRpc = resolvePodRpcUrl(podCfg);
    const cotiRpc =
        readEnv('COTI_TESTNET_RPC_URL') ||
        readEnv('VITE_COTI_RPC_URL') ||
        readEnv('VITE_COTI_APP_NODE_HTTPS_ADDRESS') ||
        'https://testnet.coti.io/rpc';

    const appInbox =
        readEnv('POD_INBOX_ADDRESS') ||
        (networkId === 'sepolia' ? SEPOLIA_DEFAULT_INBOX_ADDRESS : FUJI_DEFAULT_INBOX_ADDRESS);
    const cotiInbox = readEnv('VITE_POD_COTI_INBOX_ADDRESS') || COTI_TESTNET_DEFAULT_INBOX_ADDRESS;

    return {
        chains: [
            { chainId: podCfg.appChainId, inboxAddress: appInbox, rpcUrl: appRpc },
            { chainId: COTI_TESTNET_CHAIN_ID, inboxAddress: cotiInbox, rpcUrl: cotiRpc },
        ],
        encryptionNetwork: resolveEncryptionNetwork(),
    };
}

export function createPodContract(contractAddress, abi, wallet, networkId) {
    return new PodContract(contractAddress, abi, wallet, { config: buildPodSdkConfig(networkId) });
}

export function createPodRequest(networkId) {
    return new PodRequest(buildPodSdkConfig(networkId));
}

/** @param {import('@coti-io/pod-sdk').RequestTrackingResponse | null | undefined} t */
export function findExecutionErrorInTree(t) {
    if (!t) return null;
    if (t.execution) return t.execution;
    return findExecutionErrorInTree(t.response);
}

export function parseUint64Wealth(raw) {
    const s = String(raw ?? '')
        .trim()
        .replace(/,/g, '');
    if (!s) throw new Error('Amount is required');
    if (!/^\d+$/.test(s)) throw new Error('PoD wealth must be a whole number');
    const value = BigInt(s);
    if (value > MAX_UINT64) throw new Error('Amount exceeds 64-bit range');
    return value;
}

/**
 * Client-side encrypt for a normal `setAliceWealth` / `setBobWealth` tx (not a PoD inbox call).
 * @returns {Promise<{ ciphertext: bigint, signature: string }>}
 */
export async function encryptItUint64Wealth(wealthValue, methodName, contractAddress, userAddress) {
    const enc = await CotiPodCrypto.encrypt(
        wealthValue.toString(),
        resolveEncryptionNetwork(),
        DataType.itUint64,
        {
            contractAddress,
            functionSelector: WEALTH_IFACE.getFunction(methodName).selector,
            userAddress,
        }
    );
    return {
        ciphertext: BigInt(hex(enc.ciphertext)),
        signature: hex(enc.signature),
    };
}
