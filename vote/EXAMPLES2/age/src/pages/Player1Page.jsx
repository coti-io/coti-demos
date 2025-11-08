import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiService } from '../apiService.js'

function Player1Page() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [storeDate, setStoreDate] = useState('')
  const [storeStatus, setStoreStatus] = useState('')

  useEffect(() => {
    checkServerConnection()
  }, [])

  const checkServerConnection = async () => {
    setStoreStatus('🔄 Checking server connection...')
    
    try {
      await ApiService.healthCheck()
      setStoreStatus('✅ Connected to DateGame contract!')
    } catch (error) {
      console.error('Error connecting to server:', error)
      setStoreStatus('❌ Error connecting to server: ' + error.message)
    }
  }

  const handleStoreDate = async () => {
    if (!storeDate) {
      setStoreStatus('Please select a birth date')
      return
    }

    setLoading(true)
    setStoreStatus('Calculating age from birth date and storing encrypted...')

    try {
      console.log('Storing birth date:', storeDate)
      
      const result = await ApiService.storeDate(storeDate)
      
      console.log('Store result:', result)
      const txHash = result.transactionHash
      const contractAddress = '0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729'
      const explorerLink = `https://testnet.cotiscan.io/address/${contractAddress}?tab=txs`
      setStoreStatus(
        <div>
          ✅ Birth date stored and age calculated!
          <br />
          <strong>Encrypted Ciphertext:</strong>
          <br />
          <div style={{
            wordBreak: 'break-all',
            fontSize: '0.75rem',
            padding: '0.5rem',
            backgroundColor: '#fff3cd',
            borderRadius: '4px',
            marginTop: '0.5rem',
            fontFamily: 'monospace',
            border: '1px solid #ffc107'
          }}>
            {result.encryptedCiphertext || 'N/A'}
          </div>
          <strong style={{marginTop: '1rem', display: 'inline-block'}}>Transaction:</strong>
          <br />
          <div style={{
            wordBreak: 'break-all',
            fontSize: '0.85rem',
            padding: '0.5rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            marginTop: '0.5rem',
            fontFamily: 'monospace'
          }}>
            {txHash}
          </div>
          <a href={explorerLink} target="_blank" rel="noopener noreferrer" style={{
            color: '#007bff',
            textDecoration: 'underline',
            display: 'inline-block',
            marginTop: '0.5rem'
          }}>
            View on Coti Explorer →
          </a>
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
            <div style={{fontSize: '0.95rem', marginBottom: '0.25rem'}}>🔐 Server-side encryption with Coti MPC</div>
            <div style={{fontSize: '0.85rem', color: '#6c757d', wordBreak: 'break-all'}}>📍 Contract: 0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729</div>
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
        </div>
      </div>
    </div>
  )
}

export default Player1Page
