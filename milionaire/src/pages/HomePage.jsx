import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { ButtonAction } from '../components/Button'
import IntroModal from '../components/IntroModal'
import {
    AppContainer,
    CardsContainer,
    Card,
    InfoBox,
    InfoTitle,
    InfoText,
    List,
    ListItem,
    Link
} from '../components/styles'

const Title = styled.h1`
  color: ${props => props.theme.colors.text.default} !important;
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 3rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
`;

const SubTitle = styled.h2`
  color: ${props => props.theme.colors.text.default} !important;
  font-size: 1.8rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 2rem;
  opacity: 0.95;
  
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: 1.4rem;
  }
`;

const CardTitle = styled.h3`
  color: ${props => props.theme.colors.text.default} !important;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const Emoji = styled.span`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
  text-align: center;
`;

function HomePage() {
    const navigate = useNavigate()

    return (
        <AppContainer>
            <IntroModal />
            <Title>💰 The Millionaires' Problem</Title>
            <SubTitle>Secure Multi-Party Computation with COTI MPC</SubTitle>

            <CardsContainer>
                {/* Alice Card */}
                <Card>
                    <Emoji>👩‍💼</Emoji>
                    <CardTitle>Alice's Portal</CardTitle>
                    <InfoText style={{ marginBottom: '1.5rem' }}>
                        Enter as Alice to submit your encrypted wealth and compare with Bob.
                    </InfoText>
                    <ButtonContainer>
                        <ButtonAction
                            text="Enter as Alice →"
                            onClick={() => navigate('/alice')}
                            fullWidth
                        />
                    </ButtonContainer>
                </Card>

                {/* Bob Card */}
                <Card>
                    <Emoji>👨‍💼</Emoji>
                    <CardTitle>Bob's Portal</CardTitle>
                    <InfoText style={{ marginBottom: '1.5rem' }}>
                        Enter as Bob to submit your encrypted wealth and compare with Alice.
                    </InfoText>
                    <ButtonContainer>
                        <ButtonAction
                            text="Enter as Bob →"
                            onClick={() => navigate('/bob')}
                            fullWidth
                        />
                    </ButtonContainer>
                </Card>
            </CardsContainer>

            {/* How it Works Card */}
            <CardsContainer style={{ marginTop: '2rem' }}>
                <Card $maxWidth="900px">
                    <InfoBox>
                        <InfoTitle>🔧 How It Works</InfoTitle>
                        <List>
                            <ListItem>
                                <strong>Step 1:</strong> Alice encrypts her wealth using her private key and submits it to the smart contract
                            </ListItem>
                            <ListItem>
                                <strong>Step 2:</strong> Bob encrypts his wealth using his private key and submits it to the smart contract
                            </ListItem>
                            <ListItem>
                                <strong>Step 3:</strong> Either party triggers the comparison function
                            </ListItem>
                            <ListItem>
                                <strong>Step 4:</strong> The smart contract performs the comparison using COTI's MPC Core
                            </ListItem>
                            <ListItem>
                                <strong>Step 5:</strong> Each party can decrypt their own result to learn who is richer
                            </ListItem>
                            <ListItem>
                                <strong>Result:</strong> Both know the comparison result, but neither learns the other's actual wealth! 🎉
                            </ListItem>
                        </List>
                        <InfoText style={{ marginTop: '1.5rem' }}>
                            <strong>Key Features:</strong>
                        </InfoText>
                        <List>
                            <ListItem>✅ Privacy-preserving comparison</ListItem>
                            <ListItem>✅ On-chain computation with encrypted data</ListItem>
                            <ListItem>✅ No trusted third party required</ListItem>
                            <ListItem>✅ Mathematically proven security using MPC</ListItem>
                        </List>
                    </InfoBox>
                </Card>
            </CardsContainer>
        </AppContainer>
    )
}

export default HomePage
