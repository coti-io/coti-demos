import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { ButtonAction } from '../components/Button'
import {
  AppContainer,
  CardsContainer,
  Card,
  ContentTitle,
  InfoBox,
  InfoTitle,
  InfoText,
  List,
  ListItem,
  Link,
  ButtonGroup
} from '../components/styles'

const PageTitle = styled.h1`
  margin-top: 0;
  color: ${props => props.theme.colors.text.default} !important;
  text-shadow: none;
  font-weight: 600;
  font-size: ${props => props.theme.fontSizes.title};
  text-align: center;
`;

const SectionTitle = styled.p`
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.text.default} !important;
  font-size: ${props => props.theme.fontSizes.small};
`;

const TextContent = styled.div`
  text-align: left;
  line-height: 1.8;
  color: ${props => props.theme.colors.text.default} !important;
`;

const ContractInfo = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: ${props => props.theme.colors.secondary.default10};
  border-radius: 12px;
  font-size: 0.9rem;
  text-align: left;
`;

const ContractDetail = styled.p`
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text.default} !important;
  line-height: 1.8;

  &:last-child {
    margin-bottom: 0;
  }
`;


function HomePage() {
  const navigate = useNavigate()
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729'

  return (
    <AppContainer>
      <CardsContainer $justifyContent="center">
        <Card $maxWidth="900px" $width="90%">
          <PageTitle>Age Guessing Game</PageTitle>

          <InfoBox style={{ marginTop: '3rem' }}>
            <InfoTitle>Privacy-Preserving Age Verification</InfoTitle>

            <ContractDetail>
              <strong>🔐 Privacy Guarantee:</strong> Player never sees the actual age - all comparisons happen on encrypted data using COTI's Garbling Circuit Technology.
            </ContractDetail>
            <ContractDetail>
              <strong>Contract:</strong>{' '}
              <Link
                href={`https://testnet.cotiscan.io/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {contractAddress}
              </Link>
            </ContractDetail>
            <ContractDetail>
              <Link
                href="https://github.com/coti-io/coti-contracts-examples/blob/main/contracts/DateGame.sol"
                target="_blank"
                rel="noopener noreferrer"
              >
                📄 Contract Source Code
              </Link>
            </ContractDetail>
            <ContractDetail><strong>Network:</strong> COTI Testnet</ContractDetail>
          </InfoBox>

          <TextContent>
            <SectionTitle>🎯 Admin:</SectionTitle>
            <List>
              <ListItem>Store your birth date (encrypted on-chain)</ListItem>
              <ListItem>Your age is encrypted and stored privately</ListItem>
            </List>

            <SectionTitle>🎮 Player:</SectionTitle>
            <List>
              <ListItem>Try to guess Admin's age</ListItem>
              <ListItem>Ask if they are OLDER or YOUNGER than your guess</ListItem>
              <ListItem>The answer is computed using encrypted comparison</ListItem>
              <ListItem>Keep guessing until you find the correct age!</ListItem>
            </List>
          </TextContent>

          <ButtonGroup $justifyContent="center" style={{ marginTop: '2rem' }}>
            <ButtonAction
              text="Start as Admin →"
              onClick={() => navigate('/admin')}
            />
            <ButtonAction
              text="Start as Player →"
              onClick={() => navigate('/player')}
            />
            <ButtonAction
              text="View YouTube Demo"
              onClick={() => window.open('https://www.youtube.com/watch?v=lcWQ8e6zQdM', '_blank')}
            />
          </ButtonGroup>
        </Card>
      </CardsContainer>
    </AppContainer>
  )
}

export default HomePage
