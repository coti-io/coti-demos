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
  InfoText,
  Link
} from '../components/styles'

const PageTitle = styled.h1`
  color: ${props => props.theme.colors.text.default} !important;
  margin-top: 0;
  text-shadow: none;
  font-weight: 600;
  font-size: ${props => props.theme.fontSizes.title};
  text-align: center;
`;

const ResultBox = styled.div`
  word-break: break-all;
  font-size: 0.875rem;
  padding: 1rem;
  background-color: ${props => props.$variant === 'warning'
    ? 'rgba(255, 193, 7, 0.2)'
    : props.theme.colors.background.alternative};
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid ${props => props.$variant === 'warning'
    ? 'rgba(255, 193, 7, 0.5)'
    : 'rgba(255, 255, 255, 0.2)'};
  color: ${props => props.theme.colors.text.default} !important;
`;

const MonospaceText = styled.div`
  font-family: monospace;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  color: ${props => props.theme.colors.text.default} !important;
`;

const SectionBox = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: ${props => props.theme.colors.background.alternative};
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SectionTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text.default} !important;
`;

const EncryptedAgeDisplay = styled.div`
  padding: 1rem;
  background-color: ${props => props.theme.colors.card.default};
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  word-break: break-all;
  font-family: monospace;
  font-size: 0.85rem;
  color: ${props => props.theme.colors.text.default} !important;
`;

const DisplayLabel = styled.strong`
  display: block;
  margin-bottom: 0.5rem;
  font-family: ${props => props.theme.fonts.default};
  color: ${props => props.theme.colors.text.default} !important;
`;

const ContractDetail = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: ${props => props.theme.colors.text.default} !important;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

function Player1Page() {
  const navigate = useNavigate()
  const { storeAge, getEncryptedAge, contractAddress, adminWallet } = useAgeContract()
  const [loading, setLoading] = useState(false)
  const [storeDate, setStoreDate] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('')
  const [storeStatus, setStoreStatus] = useState('')
  const [storeStatusVariant, setStoreStatusVariant] = useState('info')
  const [encryptedAge, setEncryptedAge] = useState(null)
  const [fetchingAge, setFetchingAge] = useState(false)

  useEffect(() => {
    checkContractConnection()
  }, [])

  const checkContractConnection = async () => {
    setConnectionStatus('🔄 Checking contract connection...')

    try {
      if (!contractAddress) {
        setConnectionStatus('❌ Contract address not configured. Please set VITE_CONTRACT_ADDRESS in .env')
        return
      }
      if (!adminWallet) {
        setConnectionStatus('❌ Admin wallet not configured. Please set VITE_ADMIN_PK and VITE_ADMIN_AES_KEY in .env')
        return
      }
      setConnectionStatus('✅ Connected to DateGame contract!')
    } catch (error) {
      console.error('Error connecting to contract:', error)
      setConnectionStatus('❌ Error connecting to contract: ' + error.message)
    }
  }

  const handleFetchAge = async () => {
    setFetchingAge(true)
    try {
      const encryptedCiphertext = await getEncryptedAge()
      if (encryptedCiphertext === null) {
        setEncryptedAge('No age stored yet')
      } else {
        setEncryptedAge(encryptedCiphertext)
      }
    } catch (error) {
      console.error('Error fetching age:', error)
      setEncryptedAge('Error: ' + error.message)
    } finally {
      setFetchingAge(false)
    }
  }

  const handleStoreDate = async () => {
    if (!storeDate) {
      setStoreStatus('Please select a birth date')
      setStoreStatusVariant('error')
      return
    }

    setLoading(true)
    setStoreStatus('Encrypting age and storing it on smart contract...')
    setStoreStatusVariant('info')

    try {
      console.log('Storing birth date:', storeDate)

      const result = await storeAge(storeDate)

      console.log('Store result:', result)
      const txHash = result.receipt.hash
      const explorerLink = `https://testnet.cotiscan.io/address/${contractAddress}?tab=txs`

      // Set a custom status message with structured data
      setStoreStatus(
        <div>
          <ResultBox $variant="warning">
            <strong>Age Stored (plain text):</strong> {result.age}
            <br />
            <br />
            <strong>Age Stored (Encrypted Ciphertext):</strong>
            <MonospaceText>
              {result.encryptedCiphertext ? `${result.encryptedCiphertext} 🔒` : 'N/A'}
            </MonospaceText>
          </ResultBox>
          <ResultBox>
            <strong>Transaction:</strong>
            <br />
            <Link href={explorerLink} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-block',
              marginTop: '0.5rem'
            }}>
              {txHash}
            </Link>
          </ResultBox>
        </div>
      )
      setStoreStatusVariant('success')

    } catch (error) {
      console.error('Error storing birth date:', error)
      setStoreStatus('❌ Error storing birth date: ' + (error.message || error.toString()))
      setStoreStatusVariant('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppContainer>
      <CardsContainer $justifyContent="center">
        <Card $maxWidth="600px">
          <PageTitle>Age Guessing Game - Admin</PageTitle>

          <InfoBox>
            <InfoTitle>🔐 Protected COTI MPC Core Encrypting using Admin AES Key</InfoTitle>
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
            <FormLabel>Select Birth Date:</FormLabel>
            <FormInput
              type="date"
              value={storeDate}
              onChange={(e) => setStoreDate(e.target.value)}
            />
          </FormGroup>

          <ButtonAction
            text={loading ? 'Storing...' : 'Store Age'}
            onClick={handleStoreDate}
            disabled={loading}
            fullWidth
          />

          {storeStatus && (
            <StatusMessage $variant={storeStatusVariant}>
              {storeStatus}
            </StatusMessage>
          )}

          <SectionBox>
            <SectionTitle>
              🔐 View Encrypted Age from Contract
            </SectionTitle>

            <ButtonAction
              text={fetchingAge ? 'Fetching...' : 'Fetch Encrypted Age'}
              onClick={handleFetchAge}
              disabled={fetchingAge}
              fullWidth
            />

            {encryptedAge && (
              <EncryptedAgeDisplay style={{ marginTop: '1rem' }}>
                <DisplayLabel>
                  Encrypted Age (Ciphertext):
                </DisplayLabel>
                {encryptedAge}
              </EncryptedAgeDisplay>
            )}
          </SectionBox>

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

export default Player1Page
