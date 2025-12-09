import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet } from '@coti-io/coti-ethers';
import styled from 'styled-components';
import {
    AppContainer,
    CardsContainer,
    Card,
    ContentTitle,
    StatusMessage,
} from '../components/styles';
import { ButtonAction } from '../components/Button';
import { BidderCard } from '../components/BidderCard';
import { IntroModal } from '../components/IntroModal';
import { BidModal } from '../components/BidModal';
import { DeploymentModal } from '../components/DeploymentModal';
import { useMultipleBidders } from '../hooks/useMultipleBidders';
import { useAuctionContract } from '../hooks/useAuctionContract';
import { deployContracts, displayDeploymentInfo } from '../utils/deployContracts';
import { mintTokens, getTokenBalance, retryWithBackoff, TOKEN_ABI } from '../utils/contractActions';

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
    "function highestBidder() external view returns (address)",
    "event Winner(address who)",
    "event HighestBid(uint256 isHighestBid)"
];

const Title = styled.h2`
    color: white;
    font-size: 1.75rem;
    font-weight: bold;
    margin-bottom: 2rem;
    text-align: center;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7)`;

const BiddersGrid = styled(CardsContainer)`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    gap: 2rem;
    width: 100%;
    max-width: 1400px;

    ${({ theme }) => theme.mediaQueries.small} {
        grid-template-columns: 1fr;
    }
`;

const TwoColumnLayout = styled.div`
    display: grid;
    grid-template-columns: 1fr 500px;
    gap: 2rem;
    width: 100%;
    max-width: 1400px;
    align-items: start;

    ${({ theme }) => theme.mediaQueries.small} {
        grid-template-columns: 1fr;

        /* Reverse order on mobile: Auction Actions first, Bidders second */
        & > *:nth-child(1) {
            order: 2;
        }
        & > *:nth-child(2) {
            order: 1;
        }
    }
`;

const BiddersContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2rem;
`;

const BidderSection = styled.div`
    padding: 1.5rem;
    background-color: ${props => props.theme.colors.secondary.default10};
    border-radius: 12px;
    border: 1px solid ${props => props.theme.colors.secondary.default20};
    opacity: ${props => props.$disabled ? 0.5 : 1};
    pointer-events: ${props => props.$disabled ? 'none' : 'auto'};
    transition: opacity 0.3s ease;
    position: relative;

    ${props => props.$disabled && `
        &::after {
            content: '🔒 Auction ${props.$status || 'Ended'}';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            white-space: nowrap;
            z-index: 10;
        }
    `}
`;

const BidderName = styled.h3`
    color: ${props => props.theme.colors.text.default};
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
`;

const SmallButton = styled.button`
    background-color: #1E29F6;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-family: ${({ theme }) => theme.fonts.default};
    font-size: 0.875rem;
    font-weight: 500;
    color: #FFFFFF;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    white-space: nowrap;

    &:hover:not(:disabled) {
        background-color: rgba(30, 41, 246, 0.8);
        transform: translateY(-1px);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
        background-color: rgba(30, 41, 246, 0.8);
    }
`;

const SmallButtonGroup = styled.div`
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 1rem;
`;

const TransactionDivider = styled.div`
    border-top: 1px solid ${props => props.theme.colors.secondary.default20};
    margin: 1rem 0 0.5rem 0;
`;

const TransactionTitle = styled.div`
    color: ${props => props.theme.colors.text.default};
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    padding-top: 0.5rem;
`;

const TransactionList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
`;

const TransactionItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem;
    background-color: ${props => props.theme.colors.background.default};
    border-radius: 8px;
    border: 1px solid ${props => props.theme.colors.secondary.default20};
`;

const TransactionType = styled.div`
    color: ${props => props.theme.colors.text.default};
    font-size: 0.75rem;
    font-weight: 600;
`;

const TransactionLink = styled.a`
    color: ${props => props.theme.colors.primary.default};
    font-size: 0.75rem;
    font-family: 'Courier New', monospace;
    text-decoration: none;
    transition: opacity 0.2s ease;

    &:hover {
        opacity: 0.7;
        text-decoration: underline;
    }
`;

const TransactionTime = styled.div`
    color: ${props => props.theme.colors.text.muted};
    font-size: 0.7rem;
    font-style: italic;
`;

// Helper functions for contract interactions
const getBidderWallet = (bidder, provider) => {
    if (!bidder.pk || !bidder.aesKey) {
        throw new Error(`Bidder ${bidder.name} credentials missing`);
    }
    const wallet = new Wallet(bidder.pk, provider);
    wallet.setUserOnboardInfo({ aesKey: bidder.aesKey });
    return wallet;
};

const encryptBidAmount = async (wallet, amount, auctionAddress) => {
    const contract = new ethers.Contract(auctionAddress, AUCTION_ABI, wallet);
    const bidFunction = contract.interface.getFunction('bid');
    if (!bidFunction) {
        throw new Error('Could not get bid function');
    }
    const selector = bidFunction.selector;
    const encryptedValue = await wallet.encryptValue(
        BigInt(amount),
        auctionAddress,
        selector
    );
    return encryptedValue;
};

const approveBidAmount = async (wallet, tokenAddress, auctionAddress) => {
    console.log('Approving tokens for auction contract...');
    const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);
    const approveAmount = 100000;

    const approveFunction = tokenContract.interface.getFunction('approve');
    if (!approveFunction) {
        throw new Error('Could not get approve function');
    }
    const selector = approveFunction.selector;

    const encryptedAmount = await wallet.encryptValue(
        BigInt(approveAmount),
        tokenAddress,
        selector
    );

    return await retryWithBackoff(async () => {
        const tx = await tokenContract.approve(auctionAddress, encryptedAmount, {
            gasLimit: 300000,
        });
        const receipt = await tx.wait();
        if (receipt.status === 0) {
            throw new Error('Approval transaction reverted');
        }
        console.log(`✓ Approved ${approveAmount} tokens in block:`, receipt.blockNumber);
        return { receipt, approved: true };
    }, 3, 1000);
};

function MultiBidderPage() {
    const [showIntroModal, setShowIntroModal] = useState(true);
    const [showBidModal, setShowBidModal] = useState(false);
    const [currentBidder, setCurrentBidder] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [tokenAddress, setTokenAddress] = useState('');
    const [auctionAddress, setAuctionAddress] = useState('');
    const [auctionInfo, setAuctionInfo] = useState(null);
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminStatus, setAdminStatus] = useState('');
    const [adminStatusVariant, setAdminStatusVariant] = useState('info');
    const [winnerInfo, setWinnerInfo] = useState({
        address: null,
        objectClaimed: false,
        tokenTransferred: false,
        beneficiary: null
    });

    // Track if we've already warned about missing winner variable
    const [hasWarnedAboutWinner, setHasWarnedAboutWinner] = useState(false);

    // Deployment modal states
    const [showDeploymentModal, setShowDeploymentModal] = useState(false);
    const [deploymentStatus, setDeploymentStatus] = useState('');
    const [deploymentVariant, setDeploymentVariant] = useState('info');
    const [deploymentStep, setDeploymentStep] = useState(0);

    // Auction configuration
    const [auctionDurationMinutes, setAuctionDurationMinutes] = useState(5); // Default: 5 minutes for testing

    // State for each bidder
    const [bidderStates, setBidderStates] = useState({});

    const { bidders } = useMultipleBidders();

    const {
        getAuctionInfo,
        auctionAddress: contractAddress,
        walletAddress
    } = useAuctionContract();

    // Initialize provider
    const provider = new ethers.JsonRpcProvider(
        import.meta.env.VITE_APP_NODE_HTTPS_ADDRESS || 'https://testnet.coti.io/rpc'
    );

    useEffect(() => {
        // Get contract addresses from localStorage or environment
        const storedAuction = localStorage.getItem('AUCTION_ADDRESS');
        const storedToken = localStorage.getItem('TOKEN_ADDRESS');
        const auction = storedAuction || import.meta.env.VITE_AUCTION_ADDRESS || '0x975A20aa4547e4120b07bA7ff0576A1cBC619d31';
        const token = storedToken || import.meta.env.VITE_TOKEN_ADDRESS || '0xe53e1e154c67653f3b16A0308B875ccfe8A1272e';

        setAuctionAddress(auction);
        setTokenAddress(token);

        // Load auction info and bidder balances
        const loadInitialData = async () => {
            try {
                // Load auction info
                const info = await getAuctionInfo();
                setAuctionInfo(info);


                // Initialize state for each bidder and load their balances
                if (bidders.length > 0 && Object.keys(bidderStates).length === 0) {
                    const initialStates = {};

                    // Load balances for all bidders
                    await Promise.all(bidders.map(async (bidder) => {
                        try {
                            const wallet = getBidderWallet(bidder, provider);
                            const balance = await getTokenBalance(wallet, token);
                            initialStates[bidder.name] = {
                                tokenBalance: balance.toString(),
                                transactions: [],
                                loading: false,
                                status: '',
                                statusVariant: 'info'
                            };
                        } catch (error) {
                            console.error(`Error loading balance for ${bidder.name}:`, error);
                            initialStates[bidder.name] = {
                                tokenBalance: '0',
                                transactions: [],
                                loading: false,
                                status: '',
                                statusVariant: 'info'
                            };
                        }
                    }));

                    setBidderStates(initialStates);
                }
            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        };

        loadInitialData();
    }, []); // Empty dependency array - only run once on mount

    // Auto-refresh auction info every 10 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const info = await getAuctionInfo();
                setAuctionInfo(info);

                // Fetch winner information if auction has ended
                if (info && !info.isActive) {
                    await fetchWinnerInfo();
                }
            } catch (error) {
                console.error('Error refreshing auction info:', error);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Function to fetch winner information
    const fetchWinnerInfo = async () => {
        try {
            // Validation checks
            if (bidders.length === 0) {
                console.log('No bidders available to fetch winner info');
                return;
            }

            if (!auctionAddress || auctionAddress === '') {
                // Silently return if auction address not set
                return;
            }

            const wallet = getBidderWallet(bidders[0], provider);
            const contract = new ethers.Contract(auctionAddress, AUCTION_ABI, wallet);

            console.log('=== FETCHING WINNER INFO ===');
            console.log('Auction address:', auctionAddress);

            // Get beneficiary address
            const beneficiary = await contract.beneficiary();
            console.log('Beneficiary:', beneficiary);

            // Get token transfer status
            const tokenTransferred = await contract.tokenTransferred();
            console.log('Tokens transferred:', tokenTransferred);

            // Read winner directly from the contract's public winner variable
            let winnerAddress = null;
            try {
                winnerAddress = await contract.winner();
                console.log('Winner address from contract:', winnerAddress);
            } catch (winnerError) {
                // Only warn once to avoid console spam
                if (!hasWarnedAboutWinner) {
                    console.warn('⚠️ Could not read winner variable from contract:', winnerError.message);
                    console.warn('This contract was deployed before the winner variable was added.');
                    console.warn('Please REDEPLOY the contract to enable winner tracking.');
                    setHasWarnedAboutWinner(true);
                }
            }

            // Check if winner is the zero address (no winner yet)
            const hasWinner = winnerAddress && winnerAddress !== ethers.ZeroAddress;
            console.log('Has winner:', hasWinner);

            setWinnerInfo({
                address: hasWinner ? winnerAddress : null,
                objectClaimed: hasWinner, // If winner is set, object was claimed
                tokenTransferred: tokenTransferred,
                beneficiary: beneficiary
            });

            console.log('Winner info updated:', {
                address: hasWinner ? winnerAddress : null,
                objectClaimed: hasWinner,
                tokenTransferred: tokenTransferred
            });

        } catch (error) {
            console.error('Error fetching winner info:', error);
        }
    };

    // Fetch winner info when auction becomes inactive
    useEffect(() => {
        if (auctionInfo && !auctionInfo.isActive && auctionAddress && bidders.length > 0) {
            fetchWinnerInfo();
        }
    }, [auctionInfo?.isActive, auctionAddress, bidders.length]);

    const updateBidderState = (bidderName, updates) => {
        setBidderStates(prev => ({
            ...prev,
            [bidderName]: {
                ...prev[bidderName],
                ...updates
            }
        }));
    };

    const handlePlaceBid = (bidderName) => {
        setCurrentBidder(bidderName);
        setShowBidModal(true);
    };

    const handleSubmitBid = async () => {
        if (!currentBidder || !bidAmount || parseFloat(bidAmount) <= 0) {
            return;
        }

        const bidder = bidders.find(b => b.name === currentBidder);
        if (!bidder) {
            return;
        }

        updateBidderState(currentBidder, { loading: true, status: 'Placing bid...', statusVariant: 'info' });

        try {
            const wallet = getBidderWallet(bidder, provider);
            const bidAmountInt = parseInt(bidAmount, 10);

            console.log(`=== ${currentBidder} BID PLACEMENT ===`);
            console.log('Wallet address:', wallet.address);
            console.log('Bid amount:', bidAmountInt);

            // Check auction status first
            const currentAuctionInfo = await getAuctionInfo();
            console.log('Auction Status:');
            console.log('  - Is Active:', currentAuctionInfo?.isActive);
            console.log('  - Time Remaining:', currentAuctionInfo?.timeRemaining, 'seconds');
            console.log('  - Manually Stopped:', currentAuctionInfo?.manuallyStopped);

            if (!currentAuctionInfo?.isActive) {
                if (currentAuctionInfo?.manuallyStopped) {
                    throw new Error('Auction has been manually stopped');
                }
                throw new Error('Auction has ended. Cannot place bid.');
            }

            // Check for existing bid on this auction contract
            const contract = new ethers.Contract(auctionAddress, AUCTION_ABI, wallet);
            let hasExistingBid = false;
            let existingBidValue = null;

            try {
                console.log('Checking for existing bid on this auction...');
                const existingBidTx = await contract.getBid({ gasLimit: 200000 });
                const receipt = await existingBidTx.wait();

                // Try to decrypt the existing bid value
                try {
                    // Look for the bid value in the transaction result
                    // The getBid function returns an encrypted value to the caller
                    console.log('  - Transaction succeeded, checking for bid value...');

                    // If we got here without reverting, there IS an existing bid
                    hasExistingBid = true;

                    console.log('⚠️  WARNING: You have an existing bid on this auction contract!');
                    console.log('  - Contract may reject new bids unless your existing bid is the highest');
                    console.log('  - If your bid fails, try using the "Withdraw" button first');

                } catch (decryptError) {
                    console.log('  - Could not decrypt bid value');
                }
            } catch (error) {
                // getBid reverts if there's no bid - this is expected for new bidders
                const errorMsg = error.message?.toLowerCase() || '';
                if (errorMsg.includes('revert') || errorMsg.includes('execution reverted')) {
                    console.log('  ✓ No existing bid found (this is good for placing your first bid)');
                } else {
                    console.log('  - Error checking bid:', error.message);
                }
            }

            // Check token balance
            const balance = await getTokenBalance(wallet, tokenAddress);
            console.log('Current token balance:', balance.toString());

            if (balance < BigInt(bidAmountInt)) {
                throw new Error(`Insufficient balance. You have ${balance} tokens but need ${bidAmountInt}`);
            }

            // Step 1: Approve tokens
            console.log('Step 1: Approving tokens...');
            try {
                await approveBidAmount(wallet, tokenAddress, auctionAddress);
                console.log('✓ Approval successful');
            } catch (approveError) {
                console.error('❌ Approval failed:', approveError);
                throw new Error(`Token approval failed: ${approveError.message}`);
            }

            // Step 2: Encrypt the bid
            console.log('Step 2: Encrypting bid amount...');
            let encryptedBid;
            try {
                encryptedBid = await encryptBidAmount(wallet, bidAmountInt, auctionAddress);
                console.log('✓ Encryption successful');
                console.log('  - Encrypted bid:', encryptedBid);
            } catch (encryptError) {
                console.error('❌ Encryption failed:', encryptError);
                throw new Error(`Bid encryption failed: ${encryptError.message}`);
            }

            // Step 3: Place the bid
            const result = await retryWithBackoff(async () => {
                console.log('Step 3: Sending bid transaction...');
                console.log('  - Auction address:', auctionAddress);
                console.log('  - From wallet:', wallet.address);

                try {
                    console.log('  - About to send bid transaction...');
                    console.log('  - Encrypted bid ciphertext:', encryptedBid.ciphertext);
                    console.log('  - Gas limit:', 2000000);

                    const tx = await contract.bid(encryptedBid, {
                        gasLimit: 2000000,
                    });
                    console.log('✓ Bid transaction sent:', tx.hash);
                    console.log('  - Waiting for receipt...');

                    const receipt = await tx.wait();

                    console.log('  - Receipt status:', receipt.status);
                    console.log('  - Gas used:', receipt.gasUsed.toString());
                    console.log('  - Gas limit:', tx.gasLimit?.toString());
                    console.log('  - Block number:', receipt.blockNumber);
                    console.log('  - Number of logs:', receipt.logs.length);

                    if (receipt.status === 0) {
                        // Try to get more details about the revert
                        console.error('❌ Transaction reverted');
                        console.error('  - Logs:', receipt.logs);
                        console.error('  - Gas used:', receipt.gasUsed.toString());

                        let errorMsg = '❌ Bid Rejected by Contract\n\n';

                        if (hasExistingBid) {
                            errorMsg += '🔍 ROOT CAUSE: You have an EXISTING bid on this auction.\n\n';
                            errorMsg += '📋 The contract only allows bid updates if your current bid IS the highest bid.\n';
                            errorMsg += 'Since your existing bid is NOT the highest, the contract rejected your new bid.\n\n';
                            errorMsg += '✅ SOLUTION:\n';
                            errorMsg += '1. Wait for the auction to end (or ask admin to stop it)\n';
                            errorMsg += '2. Click the "Withdraw" button to retrieve your existing bid\n';
                            errorMsg += '3. Then you can place a new bid in the next auction';
                        } else {
                            errorMsg += '🔍 Possible reasons:\n';
                            errorMsg += '• The auction ended right before your bid was submitted\n';
                            errorMsg += '• The token transfer failed (check your token balance and approval)\n';
                            errorMsg += '• The contract encountered an encryption/decryption error\n\n';
                            errorMsg += '✅ Try:\n';
                            errorMsg += '• Check the auction status above\n';
                            errorMsg += '• Try clicking "Withdraw" first, then bid again\n';
                            errorMsg += '• If issues persist, ask admin to start a new auction';
                        }

                        throw new Error(errorMsg);
                    }

                    console.log('✓ Bid placed successfully in block:', receipt.blockNumber);
                    return { receipt, amount: bidAmountInt, txHash: tx.hash };
                } catch (txError) {
                    console.error('❌ Transaction error:', txError);
                    // Extract more meaningful error message
                    if (txError.message.includes('reverted')) {
                        throw new Error('Bid was rejected by the contract. Check auction status and bid requirements.');
                    }
                    throw txError;
                }
            }, 3, 1000);

            // Refresh balance
            const newBalance = await getTokenBalance(wallet, tokenAddress);

            updateBidderState(currentBidder, {
                tokenBalance: newBalance.toString(),
                transactions: [
                    {
                        type: 'Bid Placed',
                        amount: bidAmount,
                        txHash: result.txHash,
                        timestamp: new Date().toLocaleString()
                    },
                    ...bidderStates[currentBidder].transactions
                ],
                loading: false,
                status: '',
                statusVariant: 'success'
            });

            setBidAmount('');
            setShowBidModal(false);

            // Refresh auction info
            const info = await getAuctionInfo();
            setAuctionInfo(info);
        } catch (error) {
            console.error('Error placing bid:', error);
            updateBidderState(currentBidder, {
                loading: false,
                status: '❌ Error placing bid: ' + error.message,
                statusVariant: 'error'
            });
        }
    };

    const handleWithdraw = async (bidderName) => {
        const bidder = bidders.find(b => b.name === bidderName);
        if (!bidder) {
            return;
        }

        updateBidderState(bidderName, { loading: true, status: 'Withdrawing bid...', statusVariant: 'info' });

        try {
            const wallet = getBidderWallet(bidder, provider);
            const contract = new ethers.Contract(auctionAddress, AUCTION_ABI, wallet);

            console.log(`=== ${bidderName} WITHDRAW ===`);
            console.log('Wallet address:', wallet.address);

            const result = await retryWithBackoff(async () => {
                const tx = await contract.withdraw({
                    gasLimit: 500000,
                });
                console.log('Withdraw transaction sent:', tx.hash);
                const receipt = await tx.wait();

                if (receipt.status === 0) {
                    throw new Error('Withdraw transaction reverted');
                }

                console.log('Withdraw completed in block:', receipt.blockNumber);
                return { receipt, txHash: tx.hash };
            }, 3, 1000);

            // Refresh balance
            const newBalance = await getTokenBalance(wallet, tokenAddress);

            updateBidderState(bidderName, {
                tokenBalance: newBalance.toString(),
                transactions: [
                    {
                        type: 'Bid Withdrawn',
                        txHash: result.txHash,
                        timestamp: new Date().toLocaleString()
                    },
                    ...bidderStates[bidderName].transactions
                ],
                loading: false,
                status: '✅ Bid withdrawn successfully! Tokens returned to your wallet.',
                statusVariant: 'success'
            });
        } catch (error) {
            console.error('Error withdrawing:', error);
            updateBidderState(bidderName, {
                loading: false,
                status: '❌ Error: ' + error.message,
                statusVariant: 'error'
            });
        }
    };

    const handleCheckBid = async (bidderName) => {
        const bidder = bidders.find(b => b.name === bidderName);
        if (!bidder) {
            return;
        }

        updateBidderState(bidderName, { loading: true, status: 'Checking if you have the highest bid...', statusVariant: 'info' });

        try {
            const wallet = getBidderWallet(bidder, provider);
            const contract = new ethers.Contract(auctionAddress, AUCTION_ABI, wallet);

            console.log(`=== ${bidderName} CHECK BID ===`);
            console.log('Wallet address:', wallet.address);

            const result = await retryWithBackoff(async () => {
                const tx = await contract.doIHaveHighestBid({
                    gasLimit: 300000,
                });
                console.log('Check highest bid transaction sent:', tx.hash);
                const receipt = await tx.wait();

                if (receipt.status === 0) {
                    throw new Error('Check transaction reverted');
                }

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
                        receipt,
                        txHash: tx.hash
                    };
                }

                return {
                    isHighest: false,
                    receipt,
                    txHash: tx.hash
                };
            }, 3, 1000);

            // Add transaction to list
            const newTransactions = result.txHash ? [
                {
                    type: 'Check Highest Bid',
                    result: result.isHighest ? 'Yes' : 'No',
                    txHash: result.txHash,
                    timestamp: new Date().toLocaleString()
                },
                ...bidderStates[bidderName].transactions
            ] : bidderStates[bidderName].transactions;

            updateBidderState(bidderName, {
                transactions: newTransactions,
                loading: false,
                status: result.isHighest ? '🎉 You currently have the highest bid!' : '📊 You do not have the highest bid currently.',
                statusVariant: result.isHighest ? 'success' : 'info'
            });
        } catch (error) {
            console.error('Error checking bid:', error);
            updateBidderState(bidderName, {
                loading: false,
                status: '❌ Error: ' + error.message,
                statusVariant: 'error'
            });
        }
    };

    const handleGetTokens = async (bidderName) => {
        const bidder = bidders.find(b => b.name === bidderName);
        if (!bidder) {
            return;
        }

        updateBidderState(bidderName, { loading: true, status: 'Minting tokens...', statusVariant: 'info' });

        try {
            const wallet = getBidderWallet(bidder, provider);

            console.log(`=== ${bidderName} MINT TOKENS ===`);
            console.log('Wallet address:', wallet.address);
            console.log('Minting amount: 1000');

            const result = await mintTokens(wallet, tokenAddress, 1000);
            console.log('Mint transaction hash:', result.txHash);

            // Refresh balance from blockchain
            const newBalance = await getTokenBalance(wallet, tokenAddress);

            updateBidderState(bidderName, {
                tokenBalance: newBalance.toString(),
                transactions: [
                    {
                        type: 'Mint Tokens',
                        txHash: result.txHash,
                        timestamp: new Date().toLocaleString()
                    },
                    ...bidderStates[bidderName].transactions
                ],
                loading: false,
                status: '',
                statusVariant: 'success'
            });
        } catch (error) {
            console.error('Error minting tokens:', error);
            updateBidderState(bidderName, {
                loading: false,
                status: '❌ Error minting tokens: ' + error.message,
                statusVariant: 'error'
            });
        }
    };

    const handleClaim = async (bidderName) => {
        const bidder = bidders.find(b => b.name === bidderName);
        if (!bidder) {
            return;
        }

        updateBidderState(bidderName, { loading: true, status: 'Attempting to claim auction item...', statusVariant: 'info' });

        try {
            const wallet = getBidderWallet(bidder, provider);
            const contract = new ethers.Contract(auctionAddress, AUCTION_ABI, wallet);

            console.log(`=== ${bidderName} CLAIM AUCTION ===`);
            console.log('Wallet address:', wallet.address);

            const result = await retryWithBackoff(async () => {
                const tx = await contract.claim({
                    gasLimit: 500000,
                });
                console.log('Claim transaction sent:', tx.hash);
                const receipt = await tx.wait();

                if (receipt.status === 0) {
                    throw new Error('Claim transaction reverted. You may not be the winner or the item was already claimed.');
                }

                console.log('Claim completed in block:', receipt.blockNumber);
                return { receipt, txHash: tx.hash };
            }, 3, 1000);

            updateBidderState(bidderName, {
                transactions: [
                    {
                        type: 'Claim Auction',
                        txHash: result.txHash,
                        timestamp: new Date().toLocaleString()
                    },
                    ...bidderStates[bidderName].transactions
                ],
                loading: false,
                status: '🎉 Congratulations! You won the auction and claimed the item!',
                statusVariant: 'success'
            });

            // Refresh winner info
            await fetchWinnerInfo();

        } catch (error) {
            console.error('Error claiming:', error);

            // Parse error to provide user-friendly message
            let errorMessage = 'Claim failed. ';

            if (error.message?.includes('reverted') || error.code === 'CALL_EXCEPTION') {
                errorMessage += 'You are not the winner or the item has already been claimed.';
            } else if (error.message?.includes('user rejected')) {
                errorMessage += 'Transaction was rejected.';
            } else if (error.message?.includes('insufficient funds')) {
                errorMessage += 'Insufficient funds for gas.';
            } else if (error.message?.toLowerCase().includes('claim transaction reverted')) {
                errorMessage += 'You may not be the winner or the item was already claimed.';
            } else {
                errorMessage += 'Please try again or contact support.';
            }

            updateBidderState(bidderName, {
                loading: false,
                status: '❌ ' + errorMessage,
                statusVariant: 'error'
            });
        }
    };

    const handleRedeploy = async () => {
        // Confirmation dialog
        const confirmRedeploy = window.confirm(
            '⚠️ Start New Auction?\n\n' +
            'This will deploy new contracts and reset all bids.\n\n' +
            `Auction Duration: ${auctionDurationMinutes} minutes\n\n` +
            'All bidders will need to place their bids again.\n\n' +
            'Do you want to continue?'
        );

        if (!confirmRedeploy) {
            return;
        }

        // Show deployment modal
        setShowDeploymentModal(true);
        setDeploymentStep(0);
        setDeploymentStatus('Preparing deployment...');
        setDeploymentVariant('info');

        try {
            // Get deployment credentials from environment
            const privateKey = import.meta.env.VITE_ALICE_PK || import.meta.env.VITE_BIDDER_PK || import.meta.env.PRIVATE_KEY;
            const aesKey = import.meta.env.VITE_ALICE_AES_KEY || import.meta.env.VITE_BIDDER_AES_KEY;
            const rpcUrl = import.meta.env.VITE_APP_NODE_HTTPS_ADDRESS;

            if (!privateKey || !aesKey) {
                setDeploymentStatus('❌ Missing deployment credentials. Please configure bidder credentials in .env');
                setDeploymentVariant('error');
                setTimeout(() => setShowDeploymentModal(false), 5000);
                return;
            }

            // Collect bidder addresses from the useMultipleBidders hook
            const bidderAddresses = bidders.map(bidder => bidder.address);
            console.log('Minting initial tokens to bidders:', bidderAddresses);

            const result = await deployContracts(privateKey, aesKey, rpcUrl, (step, message) => {
                // Update progress based on deployment callbacks
                if (step === 'preparing') {
                    setDeploymentStep(0);
                    setDeploymentStatus(message);
                } else if (step === 'token') {
                    setDeploymentStep(1);
                    setDeploymentStatus(message);
                } else if (step === 'minting') {
                    setDeploymentStep(2);
                    setDeploymentStatus(message);
                } else if (step === 'auction') {
                    setDeploymentStep(3);
                    setDeploymentStatus(message);
                } else if (step === 'verify') {
                    setDeploymentStep(4);
                    setDeploymentStatus(message);
                }
            }, auctionDurationMinutes, bidderAddresses); // Pass auction duration and bidder addresses

            // Step 5: Saving addresses
            setDeploymentStep(5);
            setDeploymentStatus('Saving contract addresses...');

            // Store addresses in localStorage
            localStorage.setItem('AUCTION_ADDRESS', result.auctionAddress);
            localStorage.setItem('TOKEN_ADDRESS', result.tokenAddress);

            // Success
            setDeploymentVariant('success');
            setDeploymentStatus(
                <>
                    Contracts deployed successfully! <br />
                    <small>
                        Auction: <a href={`https://testnet.cotiscan.io/address/${result.auctionAddress}`} target="_blank" rel="noopener noreferrer">{result.auctionAddress.substring(0, 10)}...</a><br />
                        Token: <a href={`https://testnet.cotiscan.io/address/${result.tokenAddress}`} target="_blank" rel="noopener noreferrer">{result.tokenAddress.substring(0, 10)}...</a><br /><br />
                        Page will reload in 3 seconds...
                    </small>
                </>
            );

            // Reload page after 3 seconds to use new contracts
            setTimeout(() => {
                window.location.reload();
            }, 3000);

        } catch (error) {
            console.error('Error redeploying contract:', error);
            setDeploymentStatus(`Deployment failed: ${error.message || 'Unknown error'}. Click outside to close.`);
            setDeploymentVariant('error');
            // Allow closing modal after 3 seconds on error
            setTimeout(() => {
                // Don't auto-close, let user close manually
            }, 3000);
        }
    };

    return (
        <>
            <IntroModal
                isOpen={showIntroModal}
                onClose={() => setShowIntroModal(false)}
                auctionAddress={auctionAddress}
                tokenAddress={tokenAddress}
            />
            <BidModal
                isOpen={showBidModal}
                onClose={() => setShowBidModal(false)}
                bidAmount={bidAmount}
                setBidAmount={setBidAmount}
                onSubmit={handleSubmitBid}
                loading={currentBidder && bidderStates[currentBidder]?.loading}
            />
            <DeploymentModal
                isOpen={showDeploymentModal}
                status={deploymentStatus}
                variant={deploymentVariant}
                currentStep={deploymentStep}
            />
            <AppContainer>
                <Title>Private Auction</Title>

                <TwoColumnLayout>
                    <Card $maxWidth="800px">
                        <ContentTitle>Bidders</ContentTitle>

                        <BiddersContainer>
                            {bidders.map(bidder => {
                                const isAuctionInactive = !auctionInfo?.isActive;
                                const isObjectClaimed = winnerInfo.objectClaimed || winnerInfo.address !== null;
                                const statusMessage = isObjectClaimed ? 'Object Claimed 🏆' : 'Ended';
                                const isDisabled = isAuctionInactive || bidderStates[bidder.name]?.loading;

                                return (
                                    <BidderSection
                                        key={bidder.name}
                                        $disabled={isObjectClaimed}
                                        $status={statusMessage}
                                    >
                                        <BidderName>{bidder.name}</BidderName>

                                        <InfoSection>
                                            <InfoRow>
                                                <InfoLabel>Wallet:</InfoLabel>
                                                <InfoValue>{bidder.address}</InfoValue>
                                            </InfoRow>
                                            <InfoRow>
                                                <InfoLabel>Token Balance:</InfoLabel>
                                                <InfoValue>{bidderStates[bidder.name]?.tokenBalance || '0'} TPS02</InfoValue>
                                            </InfoRow>
                                            <InfoRow>
                                                <InfoLabel>Total Bids:</InfoLabel>
                                                <InfoValue>{bidderStates[bidder.name]?.transactions.filter(tx => tx.type === 'Bid Placed').length || 0}</InfoValue>
                                            </InfoRow>
                                        </InfoSection>

                                        <SmallButtonGroup>
                                            <SmallButton
                                                onClick={() => handlePlaceBid(bidder.name)}
                                                disabled={isAuctionInactive || bidderStates[bidder.name]?.loading}
                                            >
                                                Place
                                            </SmallButton>
                                            <SmallButton
                                                onClick={() => handleClaim(bidder.name)}
                                                disabled={!isAuctionInactive || bidderStates[bidder.name]?.loading || isObjectClaimed}
                                            >
                                                Claim
                                            </SmallButton>
                                        </SmallButtonGroup>

                                        {bidderStates[bidder.name]?.status && (
                                            <StatusMessage $variant={bidderStates[bidder.name]?.statusVariant}>
                                                {bidderStates[bidder.name]?.status}
                                            </StatusMessage>
                                        )}

                                        {bidderStates[bidder.name]?.transactions.length > 0 && (
                                            <>
                                                <TransactionDivider />
                                                <TransactionTitle>Recent Transactions</TransactionTitle>
                                                <TransactionList>
                                                    {bidderStates[bidder.name]?.transactions.slice(0, 3).map((tx, index) => (
                                                        <TransactionItem key={index}>
                                                            <TransactionType>{tx.type}</TransactionType>
                                                            <TransactionLink
                                                                href={`https://testnet.cotiscan.io/tx/${tx.txHash}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {tx.txHash.substring(0, 10)}...{tx.txHash.substring(tx.txHash.length - 8)}
                                                            </TransactionLink>
                                                            <TransactionTime>{tx.timestamp}</TransactionTime>
                                                        </TransactionItem>
                                                    ))}
                                                </TransactionList>
                                            </>
                                        )}
                                    </BidderSection>
                                );
                            })}
                        </BiddersContainer>
                    </Card>

                    <Card $maxWidth="500px">
                        <ContentTitle>Auction Actions</ContentTitle>

                        {hasWarnedAboutWinner && (
                            <StatusMessage $variant="error">
                                ⚠️ This contract was deployed before winner tracking was added. Please start a new auction to enable proper winner display.
                            </StatusMessage>
                        )}

                        <InfoSection>
                            <InfoRow>
                                <InfoLabel>Auction Contract:</InfoLabel>
                                <InfoValue>
                                    <a
                                        href={`https://testnet.cotiscan.io/address/${auctionAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'inherit', textDecoration: 'underline' }}
                                    >
                                        {auctionAddress?.substring(0, 10)}...{auctionAddress?.substring(auctionAddress.length - 8)}
                                    </a>
                                </InfoValue>
                            </InfoRow>
                            <InfoRow>
                                <InfoLabel>Token Contract (TPS02):</InfoLabel>
                                <InfoValue>
                                    <a
                                        href={`https://testnet.cotiscan.io/address/${tokenAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'inherit', textDecoration: 'underline' }}
                                    >
                                        {tokenAddress?.substring(0, 10)}...{tokenAddress?.substring(tokenAddress.length - 8)}
                                    </a>
                                </InfoValue>
                            </InfoRow>
                            {auctionInfo && (
                                <>
                                    <InfoRow>
                                        <InfoLabel>Auction Status:</InfoLabel>
                                        <InfoValue $active={auctionInfo.isActive}>
                                            {auctionInfo.isActive ? '🟢 Active' : '🔴 Ended'}
                                        </InfoValue>
                                    </InfoRow>
                                    <InfoRow>
                                        <InfoLabel>Time Remaining:</InfoLabel>
                                        <InfoValue>
                                            {auctionInfo.isActive && auctionInfo.timeRemaining > 0
                                                ? `${Math.floor(auctionInfo.timeRemaining / 60)} minutes`
                                                : 'Auction ended'}
                                        </InfoValue>
                                    </InfoRow>

                                    {/* Winner Information - Only show when auction has ended */}
                                    {!auctionInfo.isActive && (
                                        <>
                                            <InfoRow>
                                                <InfoLabel>Winner:</InfoLabel>
                                                <InfoValue>
                                                    {winnerInfo.address ? (
                                                        <a
                                                            href={`https://testnet.cotiscan.io/address/${winnerInfo.address}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: 'inherit', textDecoration: 'underline' }}
                                                        >
                                                            {winnerInfo.address.substring(0, 10)}...{winnerInfo.address.substring(winnerInfo.address.length - 8)}
                                                        </a>
                                                    ) : (
                                                        'Not claimed yet'
                                                    )}
                                                </InfoValue>
                                            </InfoRow>
                                            <InfoRow>
                                                <InfoLabel>Object Claimed:</InfoLabel>
                                                <InfoValue>
                                                    {winnerInfo.objectClaimed ? '✅ Yes' : '❌ No'}
                                                </InfoValue>
                                            </InfoRow>
                                            <InfoRow>
                                                <InfoLabel>Tokens Transferred:</InfoLabel>
                                                <InfoValue>
                                                    {winnerInfo.tokenTransferred ? '✅ Yes' : '❌ No'}
                                                </InfoValue>
                                            </InfoRow>
                                            <InfoRow>
                                                <InfoLabel>Beneficiary:</InfoLabel>
                                                <InfoValue>
                                                    {winnerInfo.beneficiary ? (
                                                        <a
                                                            href={`https://testnet.cotiscan.io/address/${winnerInfo.beneficiary}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: 'inherit', textDecoration: 'underline' }}
                                                        >
                                                            {winnerInfo.beneficiary.substring(0, 10)}...{winnerInfo.beneficiary.substring(winnerInfo.beneficiary.length - 8)}
                                                        </a>
                                                    ) : (
                                                        'Loading...'
                                                    )}
                                                </InfoValue>
                                            </InfoRow>
                                        </>
                                    )}
                                </>
                            )}
                        </InfoSection>

                        <ConfigSection>
                            <ConfigTitle>Auction Configuration</ConfigTitle>
                            <ConfigRow>
                                <ConfigLabel>Auction Duration:</ConfigLabel>
                                <DurationInputGroup>
                                    <DurationInput
                                        type="number"
                                        min="1"
                                        max="1440"
                                        value={auctionDurationMinutes}
                                        onChange={(e) => setAuctionDurationMinutes(parseInt(e.target.value) || 5)}
                                    />
                                    <DurationUnit>minutes</DurationUnit>
                                </DurationInputGroup>
                            </ConfigRow>
                            <ConfigHelp>Recommended: 5-10 minutes for testing, 60+ for production</ConfigHelp>
                        </ConfigSection>

                        <ActionGroup>
                            <ButtonAction
                                text="Start New Auction"
                                onClick={handleRedeploy}
                                disabled={adminLoading}
                                fullWidth
                            />
                        </ActionGroup>

                        {adminStatus && (
                            <StatusMessage $variant={adminStatusVariant}>
                                {adminStatus}
                            </StatusMessage>
                        )}
                    </Card>
                </TwoColumnLayout>
            </AppContainer>
        </>
    );
}

const InfoSection = styled.div`
  background-color: ${props => props.theme.colors.secondary.default10};
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.secondary.default20};
  gap: 1rem;
  min-width: 0;

  &:last-child {
    border-bottom: none;
  }

  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const InfoLabel = styled.span`
  color: ${props => props.theme.colors.text.muted};
  font-size: 1.2rem;
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: ${props => props.$active !== undefined
        ? (props.$active ? props.theme.colors.success : props.theme.colors.error)
        : props.theme.colors.text.default};
  font-size: 1.2rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  word-break: break-all;
  overflow-wrap: break-word;
  max-width: 100%;
`;

const ActionGroup = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;

  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
  }
`;

const ConfigSection = styled.div`
  background-color: ${props => props.theme.colors.secondary.default10};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ConfigTitle = styled.h3`
  color: ${props => props.theme.colors.text.default};
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`;

const ConfigRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;

  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ConfigLabel = styled.span`
  color: ${props => props.theme.colors.text.muted};
  font-size: 1.1rem;
  font-weight: 500;
`;

const DurationInputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const DurationInput = styled.input`
  background-color: ${props => props.theme.colors.background.default};
  border: 2px solid ${props => props.theme.colors.secondary.default20};
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.default};
  width: 100px;
  text-align: center;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary.default};
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    opacity: 1;
  }
`;

const DurationUnit = styled.span`
  color: ${props => props.theme.colors.text.muted};
  font-size: 1rem;
  font-weight: 500;
`;

const ConfigHelp = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.9rem;
  font-style: italic;
  margin-top: 0.5rem;
`;

export default MultiBidderPage;
