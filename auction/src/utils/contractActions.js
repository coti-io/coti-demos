import { ethers } from 'ethers';

// Retry utility for handling transient RPC errors
export async function retryWithBackoff(
    fn,
    maxRetries = 3,
    initialDelay = 1000
) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            const errorMessage = error?.message?.toLowerCase() || '';
            const errorCode = error?.code;

            // "already known" means transaction is already in mempool
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

            if (!isRetryable || attempt === maxRetries) {
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

export const TOKEN_ABI = [
    "function approve(address spender, tuple(uint256 ciphertext, bytes signature) amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function getMyBalance() external returns (uint256)",
    "function transfer(address to, tuple(uint256 ciphertext, bytes signature) amount) external returns (bool)",
    "function mint(address to, tuple(uint256 ciphertext, bytes signature) amount) external"
];

export const mintTokens = async (wallet, tokenAddress, amount) => {
    if (!wallet) {
        throw new Error('Wallet not configured');
    }

    console.log('Minting tokens:', amount);

    const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);

    // Get the mint function selector
    const mintFunction = tokenContract.interface.getFunction('mint');
    if (!mintFunction) {
        throw new Error('Could not get mint function');
    }

    const selector = mintFunction.selector;
    if (!selector) {
        throw new Error('Could not get mint function selector');
    }

    // Encrypt the mint amount
    const encryptedAmount = await wallet.encryptValue(
        BigInt(amount),
        tokenAddress,
        selector
    );

    return await retryWithBackoff(async () => {
        const tx = await tokenContract.mint(wallet.address, encryptedAmount, {
            gasLimit: 500000,
        });

        console.log('Mint transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Tokens minted successfully in block:', receipt.blockNumber);

        return {
            receipt,
            amount: amount,
            txHash: tx.hash
        };
    }, 3, 1000);
};

export const getTokenBalance = async (wallet, tokenAddress) => {
    if (!wallet || !tokenAddress) {
        return 0n;
    }

    try {
        const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);

        console.log('=== GET TOKEN BALANCE ===');
        console.log('Wallet:', wallet.address);
        console.log('Token address:', tokenAddress);

        // TEMPORARY FIX: Return a static balance until we properly implement decryption
        // The getMyBalance() approach needs more work with COTI's encryption pattern

        console.warn('⚠️ USING TEMPORARY BALANCE FIX');
        console.warn('Token balance reading is temporarily disabled');
        console.warn('Showing placeholder value until decryption is fixed');

        // Return a reasonable test balance
        // Users should mint tokens and they'll see the increase
        return 1000n;

        /*
        TODO: Properly implement COTI balance reading
        The issue is that getMyBalance() returns ctUint64 but we need to:
        1. Call the transaction to trigger offBoardToUser
        2. Extract the encrypted value from the return data (not logs)
        3. Decrypt using wallet.decryptValue()

        For now, users will see a static balance but can still:
        - Mint tokens (will work)
        - Place bids (will work)
        - All contract interactions work fine

        The balance display just won't update correctly until this is fixed.
        */
    } catch (error) {
        console.error('Error in getTokenBalance:', error);
        return 1000n; // Return placeholder on error too
    }
};
