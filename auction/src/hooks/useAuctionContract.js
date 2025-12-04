import { useMemo } from 'react';
import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';

import { retryWithBackoff, TOKEN_ABI, mintTokens as mintTokensAction, getTokenBalance as getTokenBalanceAction } from '../utils/contractActions';

// Retry utility for handling transient RPC errors
// Moved to utils/contractActions.js


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
    "function winner() external view returns (address)",
    "event Winner(address who)",
    "event HighestBid(uint256 isHighestBid)"
];



export function useAuctionContract() {
    // Check localStorage first, then fall back to environment variables
    const auctionAddress = localStorage.getItem('AUCTION_ADDRESS') || import.meta.env.VITE_AUCTION_ADDRESS;
    const tokenAddress = localStorage.getItem('TOKEN_ADDRESS') || import.meta.env.VITE_TOKEN_ADDRESS;
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

    const getAuctionContract = (readOnly = false) => {
        if (!auctionAddress) {
            throw new Error('Auction address not set. Please set VITE_AUCTION_ADDRESS in .env');
        }
        if (readOnly) {
            return new ethers.Contract(auctionAddress, AUCTION_ABI, provider);
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
        console.log('  - Token contract:', tokenAddress);
        console.log('  - Spender (auction contract):', auctionAddress);
        console.log('  - Wallet address:', wallet.address);

        const tokenContract = getTokenContract();

        // Approve a large amount (100000 tokens) to handle multiple bids
        const approveAmount = 100000;
        console.log('  - Approval amount:', approveAmount);

        // Get the approve function selector
        const approveFunction = tokenContract.interface.getFunction('approve');
        if (!approveFunction) {
            throw new Error('Could not get approve function');
        }

        const selector = approveFunction.selector;
        if (!selector) {
            throw new Error('Could not get approve function selector');
        }

        console.log('  - Function selector:', selector);

        // Encrypt the approval amount
        console.log('  - Encrypting approval amount...');
        const encryptedAmount = await wallet.encryptValue(
            BigInt(approveAmount),
            tokenAddress,
            selector
        );
        console.log('  - Encrypted amount:', encryptedAmount);

        return await retryWithBackoff(async () => {
            console.log('  - Sending approval transaction...');
            const tx = await tokenContract.approve(auctionAddress, encryptedAmount, {
                gasLimit: 300000,
            });

            console.log('  - Approval tx sent:', tx.hash);
            console.log('  - Approval tx to:', tx.to);
            console.log('  - Waiting for confirmation...');
            const receipt = await tx.wait();

            if (receipt.status === 0) {
                throw new Error('Approval transaction reverted');
            }

            console.log(`  ✓ Approved ${approveAmount} tokens in block:`, receipt.blockNumber);

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

        console.log('=== BID PLACEMENT DEBUG ===');
        console.log('Bidder wallet address:', wallet.address);
        console.log('Auction contract address:', auctionAddress);
        console.log('Token contract address:', tokenAddress);
        console.log('Bid amount:', bidAmount);
        console.log('=========================');

        // Check auction status
        const auctionInfo = await getAuctionInfo();
        if (auctionInfo) {
            console.log('Auction Status:');
            console.log('  - Is Active:', auctionInfo.isActive);
            console.log('  - End Time:', new Date(auctionInfo.endTime * 1000).toISOString());
            console.log('  - Current Time:', new Date().toISOString());
            console.log('  - Manually Stopped:', auctionInfo.manuallyStopped);
            console.log('  - Time Remaining:', auctionInfo.timeRemaining, 'seconds');

            if (!auctionInfo.isActive) {
                if (auctionInfo.manuallyStopped) {
                    throw new Error('Auction has been manually stopped');
                }
                throw new Error(`Auction has ended. It ended at ${new Date(auctionInfo.endTime * 1000).toLocaleString()}`);
            }
        }

        // Check token balance first
        const balance = await getTokenBalance();
        console.log('Current token balance:', balance.toString());

        if (balance < BigInt(bidAmount)) {
            throw new Error(`Insufficient balance. You have ${balance} tokens but need ${bidAmount}`);
        }

        // Step 1: Approve tokens (one-time large approval)
        try {
            console.log('Step 1: Approving tokens for auction contract...');
            console.log('  - Approving to address:', auctionAddress);
            await approveBidAmount(bidAmount);
            console.log('  ✓ Approval successful');
        } catch (error) {
            console.error('❌ Approval failed:', error);
            throw new Error(`Token approval failed: ${error.message}`);
        }

        // Step 2: Encrypt the bid
        try {
            console.log('Step 2: Encrypting bid amount...');
            const encryptedBid = await encryptBidAmount(bidAmount);
            console.log('  ✓ Encryption successful');
            console.log('  - Encrypted value:', encryptedBid);

            // Step 3: Place the bid
            const contract = getAuctionContract();

            return await retryWithBackoff(async () => {
                console.log('Step 3: Sending bid transaction to auction contract...');
                console.log('  - Target contract:', auctionAddress);
                const tx = await contract.bid(encryptedBid, {
                    gasLimit: 2000000,
                });

                console.log('  ✓ Bid transaction sent:', tx.hash);
                console.log('  - Waiting for confirmation...');
                const receipt = await tx.wait();

                if (receipt.status === 0) {
                    throw new Error('Bid transaction reverted');
                }

                console.log('  ✓ Bid placed successfully in block:', receipt.blockNumber);

                return {
                    receipt,
                    amount: bidAmount,
                    txHash: tx.hash
                };
            }, 3, 1000);
        } catch (error) {
            console.error('❌ Bid placement failed:', error);
            throw error;
        }
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
            const contract = getAuctionContract(true);

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
        return await getTokenBalanceAction(wallet, tokenAddress);
    };

    const mintTokens = async (amount) => {
        return await mintTokensAction(wallet, tokenAddress, amount);
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
