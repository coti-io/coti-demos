import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useMillionaireContract } from '../hooks/useMillionaireContract.js'
import { ButtonAction } from '../components/Button'
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

const ResultBox = styled.div`
  word-break: break-all;
  font-size: 1.1rem;
  padding: 1rem;
  background-color: ${props => props.theme.colors.secondary.default10};
  border-radius: 12px;
  margin-bottom: 1rem;
  border: 1px solid ${props => props.theme.colors.primary.default};
  color: ${props => props.theme.colors.text.default} !important;
  line-height: 1.6;
  text-align: left;
`;

const MonospaceText = styled.div`
  font-family: monospace;
  font-size: 1.05rem;
  margin-top: 0.75rem;
  color: ${props => props.theme.colors.text.default} !important;
  line-height: 1.6;
  opacity: 0.85;
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

function BobPage() {
    const navigate = useNavigate()
    const {
        submitBobWealth,
        performComparison,
        getBobComparisonResult,
        checkWealthStatus,
        resetContract,
        contractAddress,
        bobWallet
    } = useMillionaireContract()

    const [loading, setLoading] = useState(false)
    const [wealth, setWealth] = useState('')
    const [connectionStatus, setConnectionStatus] = useState('')
    const [submitStatus, setSubmitStatus] = useState('')
    const [submitStatusVariant, setSubmitStatusVariant] = useState('info')
    const [comparisonResult, setComparisonResult] = useState(null)
    const [wealthSubmitted, setWealthSubmitted] = useState(false)

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
            if (!bobWallet) {
                setConnectionStatus('❌ Bob wallet not configured. Please set VITE_BOB_PK and VITE_BOB_AES_KEY in .env')
                return
            }

            // Check if wealth already submitted
            const status = await checkWealthStatus()
            if (status.bobSet) {
                setWealthSubmitted(true)
                setConnectionStatus('✅ Connected! Your wealth is already submitted.')
            } else {
                setConnectionStatus('✅ Connected to MillionaireComparison contract!')
            }
        } catch (error) {
            console.error('Error connecting to contract:', error)
            setConnectionStatus('❌ Error connecting to contract: ' + error.message)
        }
    }

    const handleSubmitWealth = async () => {
        if (!wealth) {
            setSubmitStatus('Please enter your wealth amount')
            setSubmitStatusVariant('error')
            return
        }

        setLoading(true)
        setSubmitStatus('Encrypting wealth and storing on smart contract...')
        setSubmitStatusVariant('info')

        try {
            console.log('Submitting wealth:', wealth)

            const result = await submitBobWealth(wealth)

            console.log('Submit result:', result)
            const txHash = result.receipt.hash
            const explorerLink = `https://testnet.cotiscan.io/tx/${txHash}`

            setSubmitStatus(
                <ResultBox>
                    <div style={{ marginBottom: '1rem' }}>
                        <strong>✅ Wealth Submitted Successfully!</strong>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <strong>Amount (plain text):</strong> ${result.wealth.toLocaleString()}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <strong>Encrypted Ciphertext:</strong>
                        <MonospaceText>
                            {result.encryptedCiphertext ? `${result.encryptedCiphertext} 🔒` : 'N/A'}
                        </MonospaceText>
                    </div>
                    <div>
                        <strong>Transaction:</strong>
                        <MonospaceText>
                            <Link href={explorerLink} target="_blank" rel="noopener noreferrer">
                                {txHash}
                            </Link>
                        </MonospaceText>
                    </div>
                </ResultBox>
            )
            setSubmitStatusVariant('success')
            setWealthSubmitted(true)

        } catch (error) {
            console.error('Error submitting wealth:', error)
            setSubmitStatus('❌ Error submitting wealth: ' + (error.message || error.toString()))
            setSubmitStatusVariant('error')
        } finally {
            setLoading(false)
        }
    }

    const handleCompare = async () => {
        setLoading(true)
        setSubmitStatus('Performing comparison...')
        setSubmitStatusVariant('info')

        try {
            await performComparison(bobWallet, 'Bob')

            // Get the result
            const result = await getBobComparisonResult()

            setComparisonResult(result.text)
            setSubmitStatus('✅ Comparison complete! Check result below.')
            setSubmitStatusVariant('success')
        } catch (error) {
            console.error('Error performing comparison:', error)
            setSubmitStatus('❌ Error: ' + (error.message || error.toString()))
            setSubmitStatusVariant('error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AppContainer>
            <CardsContainer $justifyContent="center">
                <Card $maxWidth="900px">
                    <PageTitle>Millionaires' Problem - Bob</PageTitle>

                    <InfoBox>
                        <InfoTitle>💰 Yao's Millionaires' Problem - Secure Private Comparison</InfoTitle>
                        {connectionStatus && (
                            <InfoText style={{ marginBottom: '1rem' }}>{connectionStatus}</InfoText>
                        )}
                        <InfoText style={{ marginBottom: '1rem' }}>
                            Submit your wealth amount. It will be encrypted using COTI's MPC technology,
                            ensuring Alice cannot see your actual wealth value.
                        </InfoText>
                        <ContractDetail>
                            <strong>Contract:</strong>{' '}
                            <Link
                                href={`https://testnet.cotiscan.io/address/${contractAddress || '0x...'}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {contractAddress || 'Not deployed'}
                            </Link>
                        </ContractDetail>
                    </InfoBox>

                    <FormGroup>
                        <FormLabel>Your Wealth Amount (USD):</FormLabel>
                        <FormInput
                            type="number"
                            placeholder="Enter your wealth (e.g., 2000000)"
                            min="0"
                            value={wealth}
                            onChange={(e) => setWealth(e.target.value)}
                            disabled={wealthSubmitted}
                        />
                    </FormGroup>

                    <ButtonGroup>
                        <ButtonAction
                            text={loading ? 'Submitting...' : 'Submit'}
                            onClick={handleSubmitWealth}
                            disabled={loading || wealthSubmitted}
                        />
                        <ButtonAction
                            text={loading ? 'Comparing...' : 'Compare'}
                            onClick={handleCompare}
                            disabled={loading || !wealthSubmitted}
                        />
                        <ButtonAction
                            text="← Alice"
                            onClick={() => navigate('/alice')}
                        />
                        <ButtonAction
                            text="← Home"
                            onClick={() => navigate('/')}
                        />
                    </ButtonGroup>

                    {submitStatus && (
                        <StatusMessage $variant={submitStatusVariant}>
                            {submitStatus}
                        </StatusMessage>
                    )}

                    {comparisonResult && (
                        <ResultBox style={{ marginTop: '1.5rem' }}>
                            <div>
                                <strong>🎯 Comparison Result:</strong>
                                <div style={{ fontSize: '1.5rem', marginTop: '1rem', textAlign: 'center' }}>
                                    {comparisonResult}
                                </div>
                            </div>
                        </ResultBox>
                    )}
                </Card>
            </CardsContainer>
        </AppContainer>
    )
}

export default BobPage
