import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgeContract } from '../hooks/useAgeContract.js'

function Player1Page() {
  const navigate = useNavigate()
  const { storeAge, getEncryptedAge, contractAddress, adminWallet } = useAgeContract()
  const [loading, setLoading] = useState(false)
  const [storeDate, setStoreDate] = useState('')
  const [storeStatus, setStoreStatus] = useState('')
  const [encryptedAge, setEncryptedAge] = useState(null)
  const [fetchingAge, setFetchingAge] = useState(false)

  useEffect(() => {
    checkContractConnection()
  }, [])

  const checkContractConnection = async () => {
    setStoreStatus('🔄 Checking contract connection...')
    
    try {
      if (!contractAddress) {
        setStoreStatus('❌ Contract address not configured. Please set VITE_CONTRACT_ADDRESS in .env')
        return
      }
      if (!adminWallet) {
        setStoreStatus('❌ Admin wallet not configured. Please set VITE_ADMIN_PK and VITE_ADMIN_AES_KEY in .env')
        return
      }
      setStoreStatus('✅ Connected to DateGame contract!')
    } catch (error) {
      console.error('Error connecting to contract:', error)
      setStoreStatus('❌ Error connecting to contract: ' + error.message)
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
      return
    }

    setLoading(true)
    setStoreStatus('Encrypting age and storing it on smart contract...')

    try {
      console.log('Storing birth date:', storeDate)

      const result = await storeAge(storeDate)
      
      console.log('Store result:', result)
      const txHash = result.receipt.hash
      const explorerLink = `https://testnet.cotiscan.io/address/${contractAddress}?tab=txs`
      setStoreStatus(
        <div>
          <div style={{
            wordBreak: 'break-all',
            fontSize: '0.875rem',
            padding: '1rem',
            backgroundColor: '#fff3cd',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid #ffc107'
          }}>
            <strong>Age Stored (plain text):</strong> {result.age}
            <br />
            <br />
            <strong>Age Stored (Encrypted Ciphertext):</strong>
            <br />
            <div style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              marginTop: '0.5rem'
            }}>
              {result.encryptedCiphertext ? `${result.encryptedCiphertext} 🔒` : 'N/A'}
            </div>
          </div>
          <div style={{
            wordBreak: 'break-all',
            fontSize: '0.85rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}>
            <strong>Transaction:</strong>
            <br />
            <a href={explorerLink} target="_blank" rel="noopener noreferrer" style={{
              color: '#007bff',
              textDecoration: 'none',
              display: 'inline-block',
              marginTop: '0.5rem'
            }}>
              {txHash}
            </a>
          </div>
        </div>
      )
      
    } catch (error) {
      console.error('Error storing birth date:', error)
      setStoreStatus('❌ Error storing birth date: ' + (error.message || error.toString()))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="cards-container" style={{justifyContent: 'center'}}>
        <div className="card" style={{maxWidth: '600px'}}>
          <h1 className="title" style={{color: '#000', marginTop: 0, textShadow: 'none', fontWeight: '600'}}>Age Guessing Game - Admin</h1>

          <div style={{
            textAlign: 'left',
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{fontSize: '0.95rem', marginBottom: '0.25rem'}}>🔐 Protected COTI MPC Core Encrypting using Admin AES Key</div>
            <div style={{fontSize: '0.85rem', color: '#6c757d'}}>
              📍 Contract:{' '}
              <a 
                href={`https://testnet.cotiscan.io/address/${contractAddress || '0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729'}`}
                target="_blank" 
                rel="noopener noreferrer"
                style={{color: '#0066cc', textDecoration: 'none', wordBreak: 'break-all'}}
                onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.target.style.textDecoration = 'none'}
              >
                {contractAddress || '0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729'}
              </a>
            </div>
            <div style={{marginTop: '0.5rem'}}>
              <a 
                href="https://github.com/coti-io/coti-contracts-examples/blob/main/contracts/DateGame.sol" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{color: '#0066cc', textDecoration: 'none', fontSize: '0.85rem'}}
                onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.target.style.textDecoration = 'none'}
              >
                📄 Contract Source Code
              </a>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Select Birth Date:</label>
            <input
              type="date"
              className="form-input"
              value={storeDate}
              onChange={(e) => setStoreDate(e.target.value)}
            />
          </div>
          
          <button
            className="btn btn-primary"
            onClick={handleStoreDate}
            disabled={loading}
          >
            {loading ? 'Storing...' : 'Store Age'}
          </button>
          
          {storeStatus && (
            <div className={`status-message ${typeof storeStatus === 'string' && storeStatus.includes('Error') ? 'status-error' : typeof storeStatus === 'string' && storeStatus.includes('success') ? 'status-success' : 'status-info'}`}>
              {storeStatus}
            </div>
          )}

          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem'}}>
              🔐 View Encrypted Age from Contract
            </h3>

            <button
              className="btn btn-primary"
              onClick={handleFetchAge}
              disabled={fetchingAge}
              style={{width: '100%', marginBottom: '1rem'}}
            >
              {fetchingAge ? 'Fetching...' : 'Fetch Encrypted Age'}
            </button>

            {encryptedAge && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fff',
                borderRadius: '4px',
                border: '1px solid #dee2e6',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                fontSize: '0.85rem'
              }}>
                <strong style={{display: 'block', marginBottom: '0.5rem', fontFamily: 'system-ui'}}>
                  Encrypted Age (Ciphertext):
                </strong>
                {encryptedAge}
              </div>
            )}
          </div>

          <button
            className="btn"
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              marginTop: '1.5rem',
              width: '100%'
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default Player1Page
