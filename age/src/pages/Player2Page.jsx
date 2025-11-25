import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useAgeContract } from '../hooks/useAgeContract.js'
import { ButtonAction, Button } from '../components/Button'
import {
  AppContainer,
  CardsContainer,
  Card,
  FormGroup,
  FormLabel,
  FormInput,
  StatusMessage,
  InfoBox,
  InfoTitle,
  Link,
  ButtonGroup
} from '../components/styles'

const PageTitle = styled.h1`
  color: ${props => props.theme.colors.text.default} !important;
  margin-top: 0;
  text-shadow: none;
  font-weight: 600;
  font-size: ${props => props.theme.fontSizes.title};
  text-align: center;
`;

const ContractDetail = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text.default} !important;
  line-height: 1.6;

  &:last-child {
    margin-bottom: 0;
  }
`;

const HistoryBox = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background-color: ${props => props.theme.colors.background.alternative};
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const HistoryTitle = styled.h3`
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.colors.text.default} !important;
  text-align: left;
`;

const HistoryScroll = styled.div`
  max-height: 300px;
  overflow-y: auto;
  font-size: 0.9rem;
`;

const GuessItem = styled.div`
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: ${props => props.theme.colors.card.default};
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: ${props => props.theme.colors.text.default} !important;
`;

const GuessHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 1rem;
  
  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const GuessDetail = styled.div`
  flex: 1;
  text-align: ${props => props.$align || 'left'};
  color: ${props => props.theme.colors.text.default} !important;
  
  ${({ theme }) => theme.mediaQueries.small} {
    text-align: left;
  }
`;

const GuessMetadata = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.default} !important;
  opacity: 0.7;
  margin-top: 0.5rem;
  word-break: break-all;
`;

function Player2Page() {
  const navigate = useNavigate()
  const { compareAge, checkAgeStatus, contractAddress, playerWallet } = useAgeContract()
  const [loading, setLoading] = useState(false)
  const [compareDate, setCompareDate] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('')
  const [compareStatus, setCompareStatus] = useState('')
  const [compareStatusVariant, setCompareStatusVariant] = useState('info')
  const [guessHistory, setGuessHistory] = useState([])

  useEffect(() => {
    checkIfAgeStored()
  }, [])

  const checkIfAgeStored = async () => {
    setCompareStatus('🔄 Checking if age is stored...')
    setCompareStatusVariant('info')

    try {
      if (!contractAddress) {
        setCompareStatus('❌ Contract address not configured. Please set VITE_CONTRACT_ADDRESS in .env')
        setCompareStatusVariant('error')
        return
      }
      if (!playerWallet) {
        setCompareStatus('❌ Player wallet not configured. Please set VITE_PLAYER_PK and VITE_PLAYER_AES_KEY in .env')
        setCompareStatusVariant('error')
        return
      }

      const isSet = await checkAgeStatus()

      if (!isSet) {
        setCompareStatus('⚠️ No age has been stored yet. Player 1 needs to store their birth date first.')
        setCompareStatusVariant('error')
      } else {
        setCompareStatus('✅ Ready to guess! Enter an age and start guessing.')
        setCompareStatusVariant('success')
      }
    } catch (error) {
      console.error('Error checking age status:', error)
      setCompareStatus('❌ Error connecting to contract: ' + error.message)
      setCompareStatusVariant('error')
    }
  }

  const handleCompareDate = async (operation) => {
    if (!compareDate) {
      setCompareStatus('Please enter an age')
      setCompareStatusVariant('error')
      return
    }

    setLoading(true)
    setCompareStatus(`Encrypting and comparing age (${operation})...`)
    setCompareStatusVariant('info')

    try {
      console.log('Comparing age:', compareDate, 'operation:', operation)

      const result = await compareAge(compareDate, operation)

      console.log('Compare result:', result)

      // Check if the result is valid
      if (result.result === null || result.result === undefined) {
        throw new Error('Comparison returned no result. Please try again.')
      }

      // operation 'greater' means stored > guessed (i.e., actual person is OLDER than guess)
      // operation 'less' means stored < guessed (i.e., actual person is YOUNGER than guess)
      const booleanResult = result.result === true

      let statusMessage
      let guessResult
      if (operation === 'greater') {
        // Asked: Is actual person OLDER? Contract returned: Is stored > guess?
        statusMessage = `✅ Is the person OLDER than ${compareDate}? ${booleanResult ? 'YES' : 'NO'}`
        guessResult = booleanResult ? 'YES' : 'NO'
      } else {
        // Asked: Is actual person YOUNGER? Contract returned: Is stored < guess?
        statusMessage = `✅ Is the person YOUNGER than ${compareDate}? ${booleanResult ? 'YES' : 'NO'}`
        guessResult = booleanResult ? 'YES' : 'NO'
      }

      // Add to guess history
      const guessEntry = {
        age: compareDate,
        operation: operation === 'greater' ? 'OLDER?' : 'YOUNGER?',
        result: guessResult,
        timestamp: new Date().toLocaleTimeString(),
        transactionHash: result.transactionHash,
        encryptedCiphertext: result.encryptedCiphertext
      }
      setGuessHistory(prev => [...prev, guessEntry])

      setCompareStatus(statusMessage)
      setCompareStatusVariant('success')

    } catch (error) {
      console.error('Error comparing age:', error)
      setCompareStatus('❌ Error comparing age: ' + (error.message || error.toString()))
      setCompareStatusVariant('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppContainer>
      <CardsContainer $justifyContent="center">
        <Card $maxWidth="600px">
          <PageTitle>Age Guessing Game - Player</PageTitle>

          <InfoBox>
            <InfoTitle>Guessing implemented by Encrypted Data Computing by COTI MPC</InfoTitle>
            {connectionStatus && (
              <InfoText style={{ marginBottom: '1rem' }}>{connectionStatus}</InfoText>
            )}
            <ContractDetail>
              <strong>Contract:</strong>{' '}
              <Link
                href={`https://testnet.cotiscan.io/address/${contractAddress || '0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729'}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {contractAddress || '0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729'}
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
          </InfoBox>

          <FormGroup>
            <FormLabel>Enter Age to Compare:</FormLabel>
            <FormInput
              type="number"
              placeholder="Enter age (e.g., 25)"
              min="0"
              max="150"
              value={compareDate}
              onChange={(e) => setCompareDate(e.target.value)}
            />
          </FormGroup>

          <ButtonGroup>
            <ButtonAction
              text={loading ? 'Comparing...' : 'OLDER?'}
              onClick={() => handleCompareDate('greater')}
              disabled={loading}
              fullWidth
            />

            <ButtonAction
              text={loading ? 'Comparing...' : 'YOUNGER?'}
              onClick={() => handleCompareDate('less')}
              disabled={loading}
              fullWidth
            />
          </ButtonGroup>

          {compareStatus && (
            <StatusMessage $variant={compareStatusVariant}>
              {compareStatus}
            </StatusMessage>
          )}

          {guessHistory.length > 0 && (
            <HistoryBox id="guess-history">
              <HistoryTitle>
                📊 GUESSES
              </HistoryTitle>
              <HistoryScroll>
                {guessHistory.map((guess, index) => (
                  <GuessItem key={index}>
                    <GuessHeader>
                      <GuessDetail>
                        <strong>Guess #{index + 1}:</strong> {guess.age} years
                      </GuessDetail>
                      <GuessDetail $align="center">
                        {guess.operation}
                      </GuessDetail>
                      <GuessDetail $align="right">
                        {guess.result}
                      </GuessDetail>
                    </GuessHeader>
                    {guess.encryptedCiphertext && (
                      <GuessMetadata>
                        <strong>Encrypted age:</strong> {guess.encryptedCiphertext} 🔒
                      </GuessMetadata>
                    )}
                    {guess.transactionHash && (
                      <GuessMetadata>
                        <strong>TX:</strong>{' '}
                        <Link
                          href={`https://testnet.cotiscan.io/tx/${guess.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {guess.transactionHash}
                        </Link>
                      </GuessMetadata>
                    )}
                  </GuessItem>
                ))}
              </HistoryScroll>
            </HistoryBox>
          )}

          <Button
            text="← Back to Home"
            onClick={() => navigate('/')}
            fullWidth
            primary
          />
        </Card>
      </CardsContainer>
    </AppContainer>
  )
}

export default Player2Page
