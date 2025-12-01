import { useMemo } from 'react';
import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';

// Retry utility for handling transient RPC errors
async function retryWithBackoff(
    fn,
    maxRetries = 3,
    initialDelay = 1000,
    errorHandler
) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Check if error is retryable
            const errorMessage = error?.message?.toLowerCase() || '';
            const errorCode = error?.code;

            // "already known" means transaction is already in mempool - not a real error
            if (errorMessage.includes('already known')) {
                console.log('Transaction already in mempool, waiting for confirmation...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                continue;
            }

            // Other retryable errors
            const isRetryable =
                errorMessage.includes('timeout') ||
                errorMessage.includes('network') ||
                errorMessage.includes('connection') ||
                errorMessage.includes('econnrefused') ||
                errorMessage.includes('nonce') ||
                errorCode === 'NETWORK_ERROR' ||
                errorCode === 'TIMEOUT' ||
                errorCode === 'SERVER_ERROR' ||
                errorCode === -32000;

            // Allow custom error handler to decide
            const shouldRetry = errorHandler ? errorHandler(error, attempt) : isRetryable;

            if (!shouldRetry || attempt === maxRetries) {
                throw error;
            }

            // Exponential backoff
            const delay = initialDelay * Math.pow(2, attempt - 1);
            console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

// Contract ABI - only the functions we need
const MILLIONAIRE_COMPARISON_ABI = [
    "function setAliceWealth(tuple(uint256 ciphertext, bytes signature) wealth) external",
    "function setBobWealth(tuple(uint256 ciphertext, bytes signature) wealth) external",
    "function compareWealth() external",
    "function isAliceWealthSet() external view returns (bool)",
    "function isBobWealthSet() external view returns (bool)",
    "function areBothWealthsSet() external view returns (bool)",
    "function getAliceResult() external view returns (uint256)",
    "function getBobResult() external view returns (uint256)",
    "function getAliceAddress() external view returns (address)",
    "function getBobAddress() external view returns (address)",
    "function reset() external"
];

export function useMillionaireContract() {
    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    const rpcUrl = import.meta.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';

    // Create wallets for Alice and Bob
    const { aliceWallet, bobWallet } = useMemo(() => {
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        const alicePK = import.meta.env.VITE_ALICE_PK;
        const aliceAesKey = import.meta.env.VITE_ALICE_AES_KEY;
        const bobPK = import.meta.env.VITE_BOB_PK;
        const bobAesKey = import.meta.env.VITE_BOB_AES_KEY;

        let alice = null;
        let bob = null;

        if (alicePK && aliceAesKey) {
            alice = new Wallet(alicePK, provider);
            alice.setUserOnboardInfo({ aesKey: aliceAesKey });
        }

        if (bobPK && bobAesKey) {
            bob = new Wallet(bobPK, provider);
            bob.setUserOnboardInfo({ aesKey: bobAesKey });
        }

        return {
            aliceWallet: alice,
            bobWallet: bob
        };
    }, [rpcUrl]);

    const getContract = (wallet) => {
        if (!contractAddress) {
            throw new Error('Contract address not set. Please set VITE_CONTRACT_ADDRESS in .env');
        }
        return new ethers.Contract(contractAddress, MILLIONAIRE_COMPARISON_ABI, wallet);
    };

    const encryptWealth = async (wealth, wallet, functionName) => {
        if (!contractAddress) {
            throw new Error('Contract address not set');
        }

        const contract = getContract(wallet);

        // Get the function selector from the contract interface
        const targetFunction = contract.interface.getFunction(functionName);
        if (!targetFunction) {
            throw new Error(`Could not get ${functionName} function`);
        }

        const selector = targetFunction.selector;
        if (!selector) {
            throw new Error(`Could not get ${functionName} function selector`);
        }

        // Encrypt the wealth value using the wallet's encryptValue method
        const encryptedValue = await wallet.encryptValue(
            BigInt(wealth),
            contractAddress,
            selector,
        );

        return encryptedValue;
    };

    const submitAliceWealth = async (wealth) => {
        if (!aliceWallet) {
            throw new Error('Alice wallet not configured. Please set VITE_ALICE_PK and VITE_ALICE_AES_KEY in .env');
        }

        const wealthInt = parseInt(wealth, 10);
        if (isNaN(wealthInt) || wealthInt < 0) {
            throw new Error('Invalid wealth value');
        }

        console.log('Alice submitting wealth:', wealthInt);

        // Encrypt the wealth
        const encryptedWealth = await encryptWealth(wealthInt, aliceWallet, 'setAliceWealth');

        // Get contract instance
        const contract = getContract(aliceWallet);

        // Send transaction with retry logic
        return await retryWithBackoff(async () => {
            const tx = await contract.setAliceWealth(encryptedWealth, {
                gasLimit: 500000,
            });

            console.log('Transaction sent:', tx.hash);

            // Wait for transaction to be mined
            const receipt = await tx.wait();
            console.log('Alice wealth stored successfully in block:', receipt.blockNumber);

            return {
                receipt,
                wealth: wealthInt,
                encryptedCiphertext: encryptedWealth.ciphertext?.toString() || encryptedWealth[0]?.toString() || 'N/A'
            };
        }, 3, 1000);
    };

    const submitBobWealth = async (wealth) => {
        if (!bobWallet) {
            throw new Error('Bob wallet not configured. Please set VITE_BOB_PK and VITE_BOB_AES_KEY in .env');
        }

        const wealthInt = parseInt(wealth, 10);
        if (isNaN(wealthInt) || wealthInt < 0) {
            throw new Error('Invalid wealth value');
        }

        console.log('Bob submitting wealth:', wealthInt);

        // Encrypt the wealth
        const encryptedWealth = await encryptWealth(wealthInt, bobWallet, 'setBobWealth');

        // Get contract instance
        const contract = getContract(bobWallet);

        // Send transaction with retry logic
        return await retryWithBackoff(async () => {
            const tx = await contract.setBobWealth(encryptedWealth, {
                gasLimit: 500000,
            });

            console.log('Transaction sent:', tx.hash);

            // Wait for transaction to be mined
            const receipt = await tx.wait();
            console.log('Bob wealth stored successfully in block:', receipt.blockNumber);

            return {
                receipt,
                wealth: wealthInt,
                encryptedCiphertext: encryptedWealth.ciphertext?.toString() || encryptedWealth[0]?.toString() || 'N/A'
            };
        }, 3, 1000);
    };

    const performComparison = async (wallet, walletName) => {
        if (!wallet) {
            throw new Error(`${walletName} wallet not configured`);
        }

        const contract = getContract(wallet);

        // Check if both wealths are set
        const bothSet = await contract.areBothWealthsSet();
        console.log('Are both wealths set:', bothSet);

        if (!bothSet) {
            throw new Error('Both Alice and Bob must submit their wealth before comparison');
        }

        // Trigger the comparison
        console.log(`${walletName} triggering comparison...`);
        const tx = await retryWithBackoff(async () => {
            const transaction = await contract.compareWealth({ gasLimit: 1000000 });
            console.log('Comparison transaction sent:', transaction.hash);
            const receipt = await transaction.wait();
            console.log('Comparison completed in block:', receipt.blockNumber);
            return { transaction, receipt };
        }, 3, 1000);

        return tx;
    };

    const getAliceComparisonResult = async () => {
        if (!aliceWallet) {
            throw new Error('Alice wallet not configured');
        }

        const contract = getContract(aliceWallet);

        // Get the encrypted result
        const ctResult = await contract.getAliceResult();
        console.log('Got encrypted result for Alice:', ctResult.toString());

        // Decrypt the result
        const clearResult = await aliceWallet.decryptValue(ctResult);
        console.log('Decrypted result for Alice:', clearResult);

        // Result encoding: 0 = Alice richer, 1 = Bob richer, 2 = Equal
        let resultText;
        if (clearResult === 0n || clearResult === BigInt(0)) {
            resultText = 'Alice is richer';
        } else if (clearResult === 1n || clearResult === BigInt(1)) {
            resultText = 'Bob is richer';
        } else if (clearResult === 2n || clearResult === BigInt(2)) {
            resultText = 'Equal wealth';
        } else {
            resultText = 'Unknown result';
        }

        return {
            raw: clearResult,
            text: resultText
        };
    };

    const getBobComparisonResult = async () => {
        if (!bobWallet) {
            throw new Error('Bob wallet not configured');
        }

        const contract = getContract(bobWallet);

        // Get the encrypted result
        const ctResult = await contract.getBobResult();
        console.log('Got encrypted result for Bob:', ctResult.toString());

        // Decrypt the result
        const clearResult = await bobWallet.decryptValue(ctResult);
        console.log('Decrypted result for Bob:', clearResult);

        // Result encoding: 0 = Alice richer, 1 = Bob richer, 2 = Equal
        let resultText;
        if (clearResult === 0n || clearResult === BigInt(0)) {
            resultText = 'Alice is richer';
        } else if (clearResult === 1n || clearResult === BigInt(1)) {
            resultText = 'Bob is richer';
        } else if (clearResult === 2n || clearResult === BigInt(2)) {
            resultText = 'Equal wealth';
        } else {
            resultText = 'Unknown result';
        }

        return {
            raw: clearResult,
            text: resultText
        };
    };

    const checkWealthStatus = async () => {
        if (!contractAddress) {
            return { aliceSet: false, bobSet: false, bothSet: false };
        }

        try {
            // Use alice wallet if available, otherwise bob wallet
            const wallet = aliceWallet || bobWallet;
            if (!wallet) {
                return { aliceSet: false, bobSet: false, bothSet: false };
            }

            const contract = getContract(wallet);
            const aliceSet = await retryWithBackoff(
                async () => await contract.isAliceWealthSet(),
                3,
                500
            );
            const bobSet = await retryWithBackoff(
                async () => await contract.isBobWealthSet(),
                3,
                500
            );
            const bothSet = await retryWithBackoff(
                async () => await contract.areBothWealthsSet(),
                3,
                500
            );

            return { aliceSet, bobSet, bothSet };
        } catch (error) {
            console.error('Error checking wealth status:', error);
            return { aliceSet: false, bobSet: false, bothSet: false };
        }
    };

    const resetContract = async () => {
        if (!aliceWallet) {
            throw new Error('Alice wallet not configured');
        }

        const contract = getContract(aliceWallet);

        return await retryWithBackoff(async () => {
            const tx = await contract.reset({ gasLimit: 200000 });
            console.log('Reset transaction sent:', tx.hash);
            const receipt = await tx.wait();
            console.log('Contract reset successfully in block:', receipt.blockNumber);
            return { receipt };
        }, 3, 1000);
    };

    return {
        submitAliceWealth,
        submitBobWealth,
        performComparison,
        getAliceComparisonResult,
        getBobComparisonResult,
        checkWealthStatus,
        resetContract,
        contractAddress,
        aliceWallet,
        bobWallet
    };
}
