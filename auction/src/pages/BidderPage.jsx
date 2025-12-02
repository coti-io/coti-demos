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
import { useAuctionContract } from '../hooks/useAuctionContract';

const Title = styled.h2`
  color: ${props => props.theme.colors.text.default};
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;

  ${({ theme }) => theme.mediaQueries.small} {
    font-size: 2rem;
  }
`;

function BidderPage() {
    const navigate = useNavigate();
    const [bidAmount, setBidAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [statusVariant, setStatusVariant] = useState('info');
    const [auctionInfo, setAuctionInfo] = useState(null);
    const [tokenBalance, setTokenBalance] = useState('0');

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
                                ✅ Received 1000 test tokens! <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'underline'}}>View transaction</a>
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
                    ✅ Bid placed successfully! <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'underline'}}>View transaction</a>
                </>
            );
            setStatusVariant('success');
            setBidAmount('');

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

    const handleGetTokens = async () => {
        setLoading(true);
        setStatus('Minting test tokens...');
        setStatusVariant('info');

        try {
            const result = await mintTokens(1000);
            const explorerUrl = `https://testnet.cotiscan.io/tx/${result.txHash}`;
            setStatus(
                <>
                    ✅ Minted 1000 tokens! <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'underline'}}>View transaction</a>
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
        <AppContainer>
            <Title>🔨 Bidder Portal</Title>

            <CardsContainer>
                <Card $maxWidth="500px">
                    <ContentTitle>Place Your Bid</ContentTitle>

                    {walletAddress && (
                        <InfoSection>
                            <InfoRow>
                                <InfoLabel>Auction Contract:</InfoLabel>
                                <InfoValue>
                                    <a
                                        href={`https://testnet.cotiscan.io/address/${auctionAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{color: 'inherit', textDecoration: 'underline'}}
                                    >
                                        {auctionAddress?.substring(0, 10)}...{auctionAddress?.substring(auctionAddress.length - 8)}
                                    </a>
                                </InfoValue>
                            </InfoRow>
                            <InfoRow>
                                <InfoLabel>Your Wallet:</InfoLabel>
                                <InfoValue>{walletAddress.substring(0, 10)}...{walletAddress.substring(walletAddress.length - 8)}</InfoValue>
                            </InfoRow>
                            <InfoRow>
                                <InfoLabel>Token Balance:</InfoLabel>
                                <InfoValue>{tokenBalance} MTK</InfoValue>
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
                                        <InfoLabel>Total Bids:</InfoLabel>
                                        <InfoValue>{auctionInfo.bidCounter}</InfoValue>
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

                    <FormGroup>
                        <FormLabel>Bid Amount (Tokens)</FormLabel>
                        <FormInput
                            type="number"
                            placeholder="Enter bid amount"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            disabled={loading}
                            min="0"
                            step="1"
                        />
                    </FormGroup>

                    <ButtonGroup>
                        <ButtonAction
                            text={loading ? 'Processing...' : 'Place Bid'}
                            onClick={handlePlaceBid}
                            disabled={loading}
                            fullWidth
                        />
                    </ButtonGroup>

                    {status && (
                        <StatusMessage $variant={statusVariant}>
                            {status}
                        </StatusMessage>
                    )}
                </Card>

                <Card $maxWidth="500px">
                    <ContentTitle>Auction Actions</ContentTitle>

                    <ActionGroup>
                        <ButtonAction
                            text="🪙 Get Test Tokens (1000 MTK)"
                            onClick={handleGetTokens}
                            disabled={loading}
                            fullWidth
                        />
                        <ButtonAction
                            text="Check My Bid"
                            onClick={handleCheckBid}
                            disabled={loading}
                            fullWidth
                        />
                        <ButtonAction
                            text="Claim (Winner)"
                            onClick={handleClaim}
                            disabled={loading}
                            fullWidth
                        />
                        <ButtonAction
                            text="Withdraw Bid"
                            onClick={handleWithdraw}
                            disabled={loading}
                            fullWidth
                        />
                        <Button
                            text="← Back to Home"
                            onClick={() => navigate('/')}
                            fullWidth
                        />
                    </ActionGroup>

                    <InfoNote>
                        <strong>Private Auction with COTI MPC:</strong> Your bids are encrypted using
                        Multi-Party Computation, ensuring complete privacy. Other bidders cannot see
                        your bid amount, maintaining fair auction dynamics.
                    </InfoNote>
                </Card>
            </CardsContainer>
        </AppContainer>
    );
}

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
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
    border-bottom: none;
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

export default BidderPage;
