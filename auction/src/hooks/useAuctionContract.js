import { useMemo } from 'react';
import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';

// Retry utility for handling transient RPC errors
async function retryWithBackoff(
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

// Contract ABIs
const AUCTION_ABI = [
    "function bid(tuple(uint256 ciphertext, bytes signature) itBid) external",
    "function getBid() public returns (uint256)",
    "function doIHaveHighestBid() public",
    "function claim() external",
    "function withdraw() external",
    "function auctionEnd() external",
    "function endTime() external view returns (uint256)",
    "function bidCounter() external view returns (uint256)",
    "function beneficiary() external view returns (address)",
    "function tokenContract() external view returns (address)",
    "function tokenTransferred() external view returns (bool)",
    "function manuallyStopped() external view returns (bool)",
    "event Winner(address who)",
    "event HighestBid(uint256 isHighestBid)"
];

const TOKEN_ABI = [
    "function approve(address spender, tuple(uint256 ciphertext, bytes signature) amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, tuple(uint256 ciphertext, bytes signature) amount) external returns (bool)",
    "function mint(address to, tuple(uint256 ciphertext, bytes signature) amount) external"
];

export function useAuctionContract() {
    const auctionAddress = import.meta.env.VITE_AUCTION_ADDRESS;
    const tokenAddress = import.meta.env.VITE_TOKEN_ADDRESS;
    const rpcUrl = import.meta.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc';

    // Create wallet for the bidder
    const { wallet, provider } = useMemo(() => {
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        const privateKey = import.meta.env.VITE_BIDDER_PK;
        const aesKey = import.meta.env.VITE_BIDDER_AES_KEY;

        let bidderWallet = null;

        if (privateKey && aesKey) {
            bidderWallet = new Wallet(privateKey, provider);
            bidderWallet.setUserOnboardInfo({ aesKey: aesKey });
        }

        return {
            wallet: bidderWallet,
            provider: provider
        };
    }, [rpcUrl]);

    const getAuctionContract = () => {
        if (!auctionAddress) {
            throw new Error('Auction address not set. Please set VITE_AUCTION_ADDRESS in .env');
        }
        if (!wallet) {
            throw new Error('Wallet not configured. Please set VITE_BIDDER_PK and VITE_BIDDER_AES_KEY in .env');
        }
        return new ethers.Contract(auctionAddress, AUCTION_ABI, wallet);
    };

    const getTokenContract = () => {
        if (!tokenAddress) {
            throw new Error('Token address not set. Please set VITE_TOKEN_ADDRESS in .env');
        }
        if (!wallet) {
            throw new Error('Wallet not configured');
        }
        return new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);
    };

    const encryptBidAmount = async (amount) => {
        if (!auctionAddress) {
            throw new Error('Auction address not set');
        }

        const contract = getAuctionContract();

        // Get the bid function selector
        const bidFunction = contract.interface.getFunction('bid');
        if (!bidFunction) {
            throw new Error('Could not get bid function');
        }

        const selector = bidFunction.selector;
        if (!selector) {
            throw new Error('Could not get bid function selector');
        }

        // Encrypt the bid amount
        const encryptedValue = await wallet.encryptValue(
            BigInt(amount),
            auctionAddress,
            selector
        );

        return encryptedValue;
    };

    const approveBidAmount = async (amount) => {
        if (!wallet) {
            throw new Error('Wallet not configured');
        }

        console.log('Approving tokens for auction contract...');

        const tokenContract = getTokenContract();

        // Approve a large amount (100000 tokens) to handle multiple bids
        const approveAmount = 100000;

        // Get the approve function selector
        const approveFunction = tokenContract.interface.getFunction('approve');
        if (!approveFunction) {
            throw new Error('Could not get approve function');
        }

        const selector = approveFunction.selector;
        if (!selector) {
            throw new Error('Could not get approve function selector');
        }

        // Encrypt the approval amount
        const encryptedAmount = await wallet.encryptValue(
            BigInt(approveAmount),
            tokenAddress,
            selector
        );

        return await retryWithBackoff(async () => {
            const tx = await tokenContract.approve(auctionAddress, encryptedAmount, {
                gasLimit: 300000,
            });

            console.log('Approval transaction sent:', tx.hash);
            const receipt = await tx.wait();
            console.log(`Approved ${approveAmount} tokens successfully in block:`, receipt.blockNumber);

            return { receipt, approved: true };
        }, 3, 1000);
    };

    const placeBid = async (amount) => {
        if (!wallet) {
            throw new Error('Wallet not configured');
        }

        const bidAmount = parseInt(amount, 10);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            throw new Error('Invalid bid amount');
        }

        console.log('Placing bid:', bidAmount);

        // Check token balance first
        const balance = await getTokenBalance();
        console.log('Current balance:', balance.toString());

        if (balance < BigInt(bidAmount)) {
            throw new Error(`Insufficient balance. You have ${balance} tokens but need ${bidAmount}`);
        }

        // Step 1: Approve tokens (one-time large approval)
        console.log('Approving tokens...');
        await approveBidAmount(bidAmount);

        // Step 2: Encrypt the bid
        console.log('Encrypting bid amount...');
        const encryptedBid = await encryptBidAmount(bidAmount);
        console.log('Encrypted bid:', encryptedBid);

        // Step 3: Place the bid
        const contract = getAuctionContract();

        return await retryWithBackoff(async () => {
            console.log('Sending bid transaction to contract...');
            const tx = await contract.bid(encryptedBid, {
                gasLimit: 2000000,
            });

            console.log('Bid transaction sent:', tx.hash);
            const receipt = await tx.wait();
            console.log('Bid placed successfully in block:', receipt.blockNumber);

            return {
                receipt,
                amount: bidAmount,
                txHash: tx.hash
            };
        }, 3, 1000);
    };

    const checkMyBid = async () => {
        if (!wallet) {
            throw new Error('Wallet not configured');
        }

        const contract = getAuctionContract();

        // Call getBid to get the encrypted bid
        const encryptedBid = await retryWithBackoff(async () => {
            const tx = await contract.getBid({
                gasLimit: 200000,
            });
            const receipt = await tx.wait();
            return receipt;
        }, 3, 1000);

        // Get the bid value from events or contract state
        // For now, return a placeholder
        return {
            success: true,
            message: 'Bid retrieved successfully'
        };
    };

    const checkIfHighestBid = async () => {
        if (!wallet) {
            throw new Error('Wallet not configured');
        }

        const contract = getAuctionContract();

        return await retryWithBackoff(async () => {
            const tx = await contract.doIHaveHighestBid({
                gasLimit: 300000,
            });

            console.log('Check highest bid transaction sent:', tx.hash);
            const receipt = await tx.wait();
            console.log('Check completed in block:', receipt.blockNumber);

            // Parse the HighestBid event
            const event = receipt.logs.find(log => {
                try {
                    const parsed = contract.interface.parseLog(log);
                    return parsed?.name === 'HighestBid';
                } catch {
                    return false;
                }
            });

            if (event) {
                const parsed = contract.interface.parseLog(event);
                const isHighestCt = parsed.args.isHighestBid;

                // Decrypt the result
                const isHighest = await wallet.decryptValue(isHighestCt);
                console.log('Is highest bid:', isHighest);

                return {
                    isHighest: isHighest === 1n || isHighest === true,
                    receipt
                };
            }

            return {
                isHighest: false,
                receipt
            };
        }, 3, 1000);
    };

    const claimAuction = async () => {
        if (!wallet) {
            throw new Error('Wallet not configured');
        }

        const contract = getAuctionContract();

        return await retryWithBackoff(async () => {
            const tx = await contract.claim({
                gasLimit: 500000,
            });

            console.log('Claim transaction sent:', tx.hash);
            const receipt = await tx.wait();
            console.log('Claim processed in block:', receipt.blockNumber);

            // Check for Winner event
            const winnerEvent = receipt.logs.find(log => {
                try {
                    const parsed = contract.interface.parseLog(log);
                    return parsed?.name === 'Winner';
                } catch {
                    return false;
                }
            });

            if (winnerEvent) {
                const parsed = contract.interface.parseLog(winnerEvent);
                return {
                    success: true,
                    winner: parsed.args.who,
                    receipt
                };
            }

            return {
                success: false,
                message: 'You are not the winner or auction is still active',
                receipt
            };
        }, 3, 1000);
    };

    const withdrawBid = async () => {
        if (!wallet) {
            throw new Error('Wallet not configured');
        }

        const contract = getAuctionContract();

        return await retryWithBackoff(async () => {
            const tx = await contract.withdraw({
                gasLimit: 500000,
            });

            console.log('Withdraw transaction sent:', tx.hash);
            const receipt = await tx.wait();
            console.log('Withdraw completed in block:', receipt.blockNumber);

            return {
                success: true,
                receipt
            };
        }, 3, 1000);
    };

    const getAuctionInfo = async () => {
        if (!auctionAddress) {
            return null;
        }

        try {
            const contract = getAuctionContract();

            const endTime = await contract.endTime();
            const bidCounter = await contract.bidCounter();
            const beneficiary = await contract.beneficiary();
            const tokenTransferred = await contract.tokenTransferred();
            const manuallyStopped = await contract.manuallyStopped();

            const now = Math.floor(Date.now() / 1000);
            const isActive = now < Number(endTime) && !manuallyStopped;

            return {
                endTime: Number(endTime),
                bidCounter: Number(bidCounter),
                beneficiary,
                tokenTransferred,
                manuallyStopped,
                isActive,
                timeRemaining: isActive ? Number(endTime) - now : 0
            };
        } catch (error) {
            console.error('Error fetching auction info:', error);
            return null;
        }
    };

    const getTokenBalance = async () => {
        if (!wallet || !tokenAddress) {
            return 0n;
        }

        try {
            const tokenContract = getTokenContract();
            const encryptedBalance = await tokenContract.balanceOf(wallet.address);

            // Decrypt the balance
            const decryptedBalance = await wallet.decryptValue(encryptedBalance);
            console.log('Decrypted balance:', decryptedBalance.toString());

            return decryptedBalance;
        } catch (error) {
            console.error('Error fetching token balance:', error);
            return 0n;
        }
    };

    const mintTokens = async (amount) => {
        if (!wallet) {
            throw new Error('Wallet not configured');
        }

        console.log('Minting tokens:', amount);

        const tokenContract = getTokenContract();

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

    return {
        placeBid,
        checkMyBid,
        checkIfHighestBid,
        claimAuction,
        withdrawBid,
        getAuctionInfo,
        getTokenBalance,
        mintTokens,
        auctionAddress,
        tokenAddress,
        wallet,
        walletAddress: wallet?.address
    };
}
