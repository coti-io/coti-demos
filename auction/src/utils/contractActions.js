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

        // Send transaction to get encrypted balance
        const tx = await tokenContract.getMyBalance({
            gasLimit: 200000
        });

        console.log('getMyBalance tx sent:', tx.hash);
        const receipt = await tx.wait();

        if (receipt.status === 0) {
            console.error('getMyBalance transaction failed');
            return 0n;
        }

        console.log('Transaction successful');
        console.log('Receipt logs:', receipt.logs);
        console.log('Receipt data:', receipt.data);

        // The encrypted balance (ctUint64) is returned by the function
        // For COTI, this should be in the transaction return data or logs

        // Try to extract from logs
        if (receipt.logs && receipt.logs.length > 0) {
            for (let i = 0; i < receipt.logs.length; i++) {
                const log = receipt.logs[i];
                console.log(`Log ${i}:`, {
                    address: log.address,
                    data: log.data,
                    topics: log.topics
                });

                // Try to decrypt the data
                if (log.data && log.data !== '0x') {
                    try {
                        const encryptedValue = BigInt(log.data);
                        console.log('Trying to decrypt:', encryptedValue.toString());

                        const decrypted = await wallet.decryptValue(encryptedValue);
                        console.log('✓ Decrypted balance:', decrypted.toString());

                        return decrypted;
                    } catch (err) {
                        console.log('Failed to decrypt log data:', err.message);
                    }
                }
            }
        }

        console.warn('⚠️ Could not extract balance from transaction');
        console.warn('This might be a contract or ABI issue');

        // Return 0 as fallback
        return 0n;
    } catch (error) {
        console.error('Error in getTokenBalance:', error);
        return 0n;
    }
};
