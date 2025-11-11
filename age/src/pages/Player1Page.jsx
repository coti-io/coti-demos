import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAgeContract } from '../hooks/useAgeContract.js'

function Player1Page() {
  const navigate = useNavigate()
  const { storeAge, contractAddress, adminWallet } = useAgeContract()
  const [loading, setLoading] = useState(false)
  const [storeDate, setStoreDate] = useState('')
  const [storeStatus, setStoreStatus] = useState('')

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

  const handleStoreDate = async () => {
    if (!storeDate) {
      setStoreStatus('Please select a birth date')
      return
    }

    setLoading(true)
    setStoreStatus('Calculating age from birth date and encrypting...')

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
              {result.encryptedCiphertext || 'N/A'}
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
      <h1 className="title">Age Guessing Game - Admin</h1>
      
      <div className="cards-container" style={{justifyContent: 'center'}}>
        <div className="card" style={{maxWidth: '500px'}}>
          <h2 className="card-title">Store Birth Date</h2>
          
          <div style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{fontSize: '0.95rem', marginBottom: '0.25rem'}}>🔐 Client-side encryption with Coti MPC</div>
            <div style={{fontSize: '0.85rem', color: '#6c757d', wordBreak: 'break-all'}}>📍 Contract: {contractAddress || '0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729'}</div>
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
            {loading ? 'Storing...' : 'Store Birth Date'}
          </button>
          
          {storeStatus && (
            <div className={`status-message ${typeof storeStatus === 'string' && storeStatus.includes('Error') ? 'status-error' : typeof storeStatus === 'string' && storeStatus.includes('success') ? 'status-success' : 'status-info'}`}>
              {storeStatus}
            </div>
          )}

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
