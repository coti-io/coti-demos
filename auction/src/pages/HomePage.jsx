import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
    AppContainer,
    Card,
    CardsContainer,
    ContentTitle,
    ContentText,
    InfoBox,
    InfoTitle,
    InfoText,
    List,
    ListItem,
    Link,
    StatusMessage
} from '../components/styles';
import { ButtonAction, Button } from '../components/Button';
import { deployContracts, displayDeploymentInfo } from '../utils/deployContracts';

const Title = styled.h1`
  color: ${props => props.theme.colors.text.default};
  font-size: 3.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1rem;

  ${({ theme }) => theme.mediaQueries.small} {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.default};
  font-size: 1.8rem;
  text-align: center;
  margin-bottom: 3rem;
  opacity: 0.9;

  ${({ theme }) => theme.mediaQueries.small} {
    font-size: 1.4rem;
  }
`;

const ContractInfo = styled.div`
  text-align: center;
  margin-top: 2rem;
  font-size: 1.2rem;
  color: ${props => props.theme.colors.text.default};
`;

function HomePage() {
    const navigate = useNavigate();
    const [auctionAddress, setAuctionAddress] = useState('');
    const [tokenAddress, setTokenAddress] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployStatus, setDeployStatus] = useState('');

    useEffect(() => {
        // Try to get contract addresses from localStorage first, then fall back to environment
        const storedAuction = localStorage.getItem('AUCTION_ADDRESS');
        const storedToken = localStorage.getItem('TOKEN_ADDRESS');

        const auction = storedAuction || import.meta.env.VITE_AUCTION_ADDRESS || '0x975A20aa4547e4120b07bA7ff0576A1cBC619d31';
        const token = storedToken || import.meta.env.VITE_TOKEN_ADDRESS || '0xe53e1e154c67653f3b16A0308B875ccfe8A1272e';

        setAuctionAddress(auction);
        setTokenAddress(token);
    }, []);

    const handleRedeploy = async () => {
        setIsDeploying(true);
        setDeployStatus('📝 Preparing deployment...');

        try {
            // Get deployment credentials from environment
            const privateKey = import.meta.env.VITE_BIDDER_PK || import.meta.env.PRIVATE_KEY;
            const aesKey = import.meta.env.VITE_BIDDER_AES_KEY;
            const rpcUrl = import.meta.env.VITE_APP_NODE_HTTPS_ADDRESS;

            if (!privateKey || !aesKey) {
                setDeployStatus('❌ Missing deployment credentials. Please configure VITE_BIDDER_PK and VITE_BIDDER_AES_KEY in .env');
                setIsDeploying(false);
                return;
            }

            setDeployStatus('🚀 Deploying contracts... This may take a few minutes.');

            const result = await deployContracts(privateKey, aesKey, rpcUrl);
            const info = displayDeploymentInfo(result);

            // Store addresses in localStorage
            localStorage.setItem('AUCTION_ADDRESS', result.auctionAddress);
            localStorage.setItem('TOKEN_ADDRESS', result.tokenAddress);

            // Update local state with new addresses
            setAuctionAddress(result.auctionAddress);
            setTokenAddress(result.tokenAddress);

            setDeployStatus(
                <div style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>
                    <div style={{ marginBottom: '1rem' }}>{info.message}</div>
                    <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                        {info.instructions}
                    </div>
                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(46, 204, 113, 0.2)', borderRadius: '4px' }}>
                        ✅ Contract addresses saved to browser localStorage. Page will reload automatically.
                    </div>
                </div>
            );

            // Reload page after 3 seconds to use new contracts
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        } catch (error) {
            console.error('Error during deployment:', error);
            setDeployStatus(`❌ Deployment failed: ${error.message || 'Unknown error'}`);
        } finally {
            setIsDeploying(false);
        }
    };

    const handleResetToDefault = () => {
        // Clear localStorage
        localStorage.removeItem('AUCTION_ADDRESS');
        localStorage.removeItem('TOKEN_ADDRESS');

        // Show confirmation message
        setDeployStatus('🔄 Reset to default contracts. Page will reload...');

        // Reload page to use default addresses
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    return (
        <AppContainer>
            <Title>🔨 Private Auction</Title>
            <Subtitle>Secure Bidding with COTI MPC</Subtitle>

            <CardsContainer>
                <Card $maxWidth="800px">
                    <InfoBox>
                        <InfoTitle>How It Works</InfoTitle>
                        <List>
                            <ListItem>
                                <strong>Step 1:</strong> Bidders submit encrypted bids using private tokens
                            </ListItem>
                            <ListItem>
                                <strong>Step 2:</strong> All bids remain confidential on-chain
                            </ListItem>
                            <ListItem>
                                <strong>Step 3:</strong> After auction ends, winner can claim the item
                            </ListItem>
                            <ListItem>
                                <strong>Step 4:</strong> Losers can withdraw their bids
                            </ListItem>
                            <ListItem style={{ marginTop: '1rem' }}>
                                <strong>Auction Contract:</strong>{' '}
                                <Link
                                    href={`https://testnet.cotiscan.io/address/${auctionAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {auctionAddress}
                                </Link>
                            </ListItem>
                            <ListItem>
                                <strong>Token Contract:</strong>{' '}
                                <Link
                                    href={`https://testnet.cotiscan.io/address/${tokenAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {tokenAddress}
                                </Link>
                            </ListItem>
                        </List>
                    </InfoBox>

                    <ContentTitle>Key Features</ContentTitle>
                    <InfoText>
                        ✅ Privacy-preserving bidding<br />
                        ✅ Encrypted bid amounts<br />
                        ✅ Automatic highest bid tracking<br />
                        ✅ Secure claim and withdrawal
                    </InfoText>

                    <ButtonGroup>
                        <ButtonAction
                            text="Enter as Bidder"
                            onClick={() => navigate('/bidder')}
                            fullWidth
                        />
                    </ButtonGroup>

                    <ButtonGroup style={{ marginTop: '1rem' }}>
                        <ButtonAction
                            text={isDeploying ? 'Redeploying...' : 'Redeploy Contracts'}
                            onClick={handleRedeploy}
                            disabled={isDeploying}
                            fullWidth
                        />
                    </ButtonGroup>

                    <ButtonGroup style={{ marginTop: '1rem' }}>
                        <ButtonAction
                            text="Reset to Default Contracts"
                            onClick={handleResetToDefault}
                            disabled={isDeploying}
                            fullWidth
                        />
                    </ButtonGroup>

                    {deployStatus && (
                        <StatusMessage $variant="info" style={{ marginTop: '1rem' }}>
                            {deployStatus}
                        </StatusMessage>
                    )}

                    {(localStorage.getItem('AUCTION_ADDRESS') || localStorage.getItem('TOKEN_ADDRESS')) && (
                        <StatusMessage $variant="success" style={{ marginTop: '1rem' }}>
                            📍 Using custom deployed contracts from localStorage
                        </StatusMessage>
                    )}

                    <InfoBox style={{ marginTop: '2rem' }}>
                        <InfoTitle>About This Demo</InfoTitle>
                        <InfoText>
                            This private auction demonstrates COTI's Multi-Party Computation (MPC)
                            capabilities. Bids are encrypted and processed on-chain without revealing
                            individual bid amounts to other participants.
                        </InfoText>
                    </InfoBox>
                </Card>
            </CardsContainer>
        </AppContainer>
    );
}

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

export default HomePage;
