import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
    AppContainer,
    Card,
    CardsContainer,
    FormGroup,
    FormLabel,
    FormInput,
    StatusMessage,
    ContentTitle,
} from '../components/styles';
import { ButtonAction, Button } from '../components/Button';
import { IntroModal } from '../components/IntroModal';
import { BidModal } from '../components/BidModal';
import { useAuctionContract } from '../hooks/useAuctionContract';
import { deployContracts, displayDeploymentInfo } from '../utils/deployContracts';

const Title = styled.h2`
    color: white;
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 2rem;
    text-align: center;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
`;

function BidderPage() {
    const navigate = useNavigate();
    const [bidAmount, setBidAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [statusVariant, setStatusVariant] = useState('info');
    const [auctionInfo, setAuctionInfo] = useState(null);
    const [tokenBalance, setTokenBalance] = useState('0');
    const [showIntroModal, setShowIntroModal] = useState(true);
    const [showBidModal, setShowBidModal] = useState(false);
    const [tokenAddress, setTokenAddress] = useState('');

    const {
        placeBid,
        checkMyBid,
        checkIfHighestBid,
        claimAuction,
        withdrawBid,
        getAuctionInfo,
        getTokenBalance,
        mintTokens,
        walletAddress,
        auctionAddress
    } = useAuctionContract();

    // Load auction info and token balance on mount
    useEffect(() => {
        // Try to get token address from localStorage first, then fall back to environment
        const storedToken = localStorage.getItem('TOKEN_ADDRESS');
        const token = storedToken || import.meta.env.VITE_TOKEN_ADDRESS || '0xe53e1e154c67653f3b16A0308B875ccfe8A1272e';
        setTokenAddress(token);

        const loadInfo = async () => {
            try {
                const info = await getAuctionInfo();
                setAuctionInfo(info);

                const balance = await getTokenBalance();
                setTokenBalance(balance.toString());

                // Auto-mint tokens if balance is 0 or very low (first time setup)
                if (balance === 0n) {
                    console.log('No tokens detected, auto-minting 1000 tokens...');
                    try {
                        setStatus('🪙 Minting initial tokens for testing...');
                        setStatusVariant('info');
                        const result = await mintTokens(1000);
                        const newBalance = await getTokenBalance();
                        setTokenBalance(newBalance.toString());
                        const explorerUrl = `https://testnet.cotiscan.io/tx/${result.txHash}`;
                        setStatus(
                            <>
                                ✅ Received 1000 test tokens! <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>View transaction</a>
                            </>
                        );
                        setStatusVariant('success');
                    } catch (error) {
                        console.error('Error auto-minting tokens:', error);
                        setStatus('⚠️ Could not mint tokens. Use "Get Test Tokens" button below.');
                        setStatusVariant('info');
                    }
                }
            } catch (error) {
                console.error('Error loading info:', error);
            }
        };

        loadInfo();
        const interval = setInterval(() => {
            // Only refresh info, don't auto-mint on interval
            getAuctionInfo().then(setAuctionInfo).catch(console.error);
            getTokenBalance().then(b => setTokenBalance(b.toString())).catch(console.error);
        }, 10000); // Refresh every 10s

        return () => clearInterval(interval);
    }, []);

    const handlePlaceBidClick = () => {
        setShowBidModal(true);
    };

    const handlePlaceBid = async () => {
        if (!bidAmount || parseFloat(bidAmount) <= 0) {
            setStatus('Please enter a valid bid amount');
            setStatusVariant('error');
            return;
        }

        setLoading(true);
        setStatus('Placing bid... This may take a moment.');
        setStatusVariant('info');

        try {
            const result = await placeBid(bidAmount);
            const explorerUrl = `https://testnet.cotiscan.io/tx/${result.txHash}`;
            setStatus(
                <>
                    ✅ Bid placed successfully! <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>View transaction</a>
                </>
            );
            setStatusVariant('success');
            setBidAmount('');
            setShowBidModal(false);

            // Refresh auction info
            const info = await getAuctionInfo();
            setAuctionInfo(info);

            // Refresh balance
            const balance = await getTokenBalance();
            setTokenBalance(balance.toString());
        } catch (error) {
            console.error('Error placing bid:', error);
            setStatus('❌ Error placing bid: ' + error.message);
            setStatusVariant('error');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckBid = async () => {
        setLoading(true);
        setStatus('Checking if you have the highest bid...');
        setStatusVariant('info');

        try {
            const result = await checkIfHighestBid();
            if (result.isHighest) {
                setStatus('🎉 You currently have the highest bid!');
                setStatusVariant('success');
            } else {
                setStatus('📊 You do not have the highest bid currently.');
                setStatusVariant('info');
            }
        } catch (error) {
            console.error('Error checking bid:', error);
            setStatus('❌ Error: ' + error.message);
            setStatusVariant('error');
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async () => {
        setLoading(true);
        setStatus('Attempting to claim auction item...');
        setStatusVariant('info');

        try {
            const result = await claimAuction();
            if (result.success) {
                setStatus('🎉 Congratulations! You won the auction and claimed the item!');
                setStatusVariant('success');
            } else {
                setStatus('⚠️ ' + (result.message || 'Unable to claim. You may not be the winner or auction is still active.'));
                setStatusVariant('info');
            }
        } catch (error) {
            console.error('Error claiming:', error);
            setStatus('❌ Error: ' + error.message);
            setStatusVariant('error');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        setLoading(true);
        setStatus('Withdrawing bid...');
        setStatusVariant('info');

        try {
            const result = await withdrawBid();
            if (result.success) {
                setStatus('✅ Bid withdrawn successfully! Tokens returned to your wallet.');
                setStatusVariant('success');

                // Refresh balance
                const balance = await getTokenBalance();
                setTokenBalance(balance.toString());
            }
        } catch (error) {
            console.error('Error withdrawing:', error);
            setStatus('❌ Error: ' + error.message);
            setStatusVariant('error');
        } finally {
            setLoading(false);
        }
    };

    const handleRedeploy = async () => {
        // Confirmation dialog
        const confirmRedeploy = window.confirm(
            '⚠️ Redeploy Contract?\n\n' +
            'This will deploy new contracts and reset all bids.\n\n' +
            'All bidders will need to place their bids again.\n\n' +
            'Do you want to continue?'
        );

        if (!confirmRedeploy) {
            return;
        }

        setLoading(true);
        setStatus('📝 Preparing deployment...');
        setStatusVariant('info');

        try {
            // Get deployment credentials from environment
            const privateKey = import.meta.env.VITE_BIDDER_PK || import.meta.env.PRIVATE_KEY;
            const aesKey = import.meta.env.VITE_BIDDER_AES_KEY;
            const rpcUrl = import.meta.env.VITE_APP_NODE_HTTPS_ADDRESS;

            if (!privateKey || !aesKey) {
                setStatus('❌ Missing deployment credentials. Please configure VITE_BIDDER_PK and VITE_BIDDER_AES_KEY in .env');
                setStatusVariant('error');
                setLoading(false);
                return;
            }

            setStatus('🚀 Deploying contracts... This may take a few minutes.');

            const result = await deployContracts(privateKey, aesKey, rpcUrl);
            const info = displayDeploymentInfo(result);

            // Store addresses in localStorage
            localStorage.setItem('AUCTION_ADDRESS', result.auctionAddress);
            localStorage.setItem('TOKEN_ADDRESS', result.tokenAddress);

            setStatus(
                <>
                    ✅ Contracts deployed successfully! <br />
                    <small style={{ fontSize: '0.9em' }}>
                        Auction: <a href={`https://testnet.cotiscan.io/address/${result.auctionAddress}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{result.auctionAddress.substring(0, 10)}...</a><br />
                        Token: <a href={`https://testnet.cotiscan.io/address/${result.tokenAddress}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{result.tokenAddress.substring(0, 10)}...</a><br />
                        Page will reload in 3 seconds...
                    </small>
                </>
            );
            setStatusVariant('success');

            // Reload page after 3 seconds to use new contracts
            setTimeout(() => {
                window.location.reload();
            }, 3000);

        } catch (error) {
            console.error('Error redeploying contract:', error);
            setStatus(`❌ Deployment failed: ${error.message || 'Unknown error'}`);
            setStatusVariant('error');
        } finally {
            setLoading(false);
        }
    };

    const handleGetTokens = async () => {
        setLoading(true);
        setStatus('Minting test tokens...');
        setStatusVariant('info');

        try {
            const result = await mintTokens(1000);
            const explorerUrl = `https://testnet.cotiscan.io/tx/${result.txHash}`;
            setStatus(
                <>
                    ✅ Minted 1000 tokens! <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>View transaction</a>
                </>
            );
            setStatusVariant('success');

            // Refresh balance
            const balance = await getTokenBalance();
            setTokenBalance(balance.toString());
        } catch (error) {
            console.error('Error minting tokens:', error);
            setStatus('❌ Error minting tokens: ' + error.message);
            setStatusVariant('error');
        } finally {
            setLoading(false);
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
                onSubmit={handlePlaceBid}
                loading={loading}
            />
            <AppContainer>
                <Title>Private Auction</Title>

                <CardsContainer>
                    <Card $maxWidth="500px">
                        <ContentTitle>Bidders</ContentTitle>

                        {walletAddress && (
                            <InfoSection>
                                <InfoRow>
                                    <InfoLabel>Your Wallet:</InfoLabel>
                                    <InfoValue>{walletAddress}</InfoValue>
                                </InfoRow>
                                <TokenBalanceRow>
                                    <InfoLabel>Token Balance:</InfoLabel>
                                    <InfoValue>{tokenBalance} MTK</InfoValue>
                                    <SmallButton
                                        onClick={handleGetTokens}
                                        disabled={loading}
                                    >
                                        Get Tokens
                                    </SmallButton>
                                </TokenBalanceRow>
                                {auctionInfo && (
                                    <>
                                        <InfoRow>
                                            <InfoLabel>Total Bids:</InfoLabel>
                                            <InfoValue>{auctionInfo.bidCounter}</InfoValue>
                                        </InfoRow>
                                    </>
                                )}

                                <SmallButtonGroup style={{ marginTop: '1rem', paddingTop: '1rem' }}>
                                    <SmallButton
                                        onClick={handlePlaceBidClick}
                                        disabled={loading}
                                    >
                                        {loading ? 'Processing...' : 'Place'}
                                    </SmallButton>
                                    <SmallButton
                                        onClick={handleWithdraw}
                                        disabled={loading}
                                    >
                                        Withdraw
                                    </SmallButton>
                                    <SmallButton
                                        onClick={handleCheckBid}
                                        disabled={loading}
                                    >
                                        Check
                                    </SmallButton>
                                </SmallButtonGroup>
                            </InfoSection>
                        )}

                        {status && (
                            <StatusMessage $variant={statusVariant}>
                                {status}
                            </StatusMessage>
                        )}
                    </Card>

                    <Card $maxWidth="500px">
                        <ContentTitle>Auction Actions</ContentTitle>

                        {walletAddress && (
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
                                    </>
                                )}
                            </InfoSection>
                        )}

                        <ActionGroup>
                            <ButtonAction
                                text="Claim (Winner)"
                                onClick={handleClaim}
                                disabled={loading}
                                fullWidth
                            />
                            <ButtonAction
                                text="🔄 Redeploy Contract"
                                onClick={handleRedeploy}
                                disabled={loading}
                                fullWidth
                            />
                        </ActionGroup>
                    </Card>
                </CardsContainer>
            </AppContainer>
        </>
    );
}

const ButtonGroup = styled.div`
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
            flex-wrap: wrap;

            ${({ theme }) => theme.mediaQueries.small} {
                flex - direction: column;
  }
            `;

const ActionGroup = styled.div`
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1.5rem;
            `;

const InfoNote = styled.div`
            margin-top: 2rem;
            padding: 1rem;
            background-color: ${props => props.theme.colors.secondary.default10};
            border-radius: 12px;
            font-size: 1.2rem;
            color: ${props => props.theme.colors.text.default};
            line-height: 1.6;
            `;

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

            &:last-child {
                border - bottom: none;
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
            `;

const BalanceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SmallButton = styled.button`
  background-color: #1E29F6;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  font-family: ${({ theme }) => theme.fonts.default};
  font-size: 1rem;
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
`;

const TokenBalanceRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${props => props.theme.colors.secondary.default20};
`;

export default BidderPage;
