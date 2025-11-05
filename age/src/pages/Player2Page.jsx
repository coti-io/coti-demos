import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiService } from '../apiService.js'

function Player2Page() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [compareDate, setCompareDate] = useState('')
  const [compareStatus, setCompareStatus] = useState('')
  const [guessHistory, setGuessHistory] = useState([])

  useEffect(() => {
    checkIfAgeStored()
  }, [])

  const checkIfAgeStored = async () => {
    setCompareStatus('🔄 Checking if age is stored...')
    
    try {
      const isSet = await ApiService.isDateSet()
      
      if (!isSet) {
        setCompareStatus('⚠️ No age has been stored yet. Player 1 needs to store their birth date first.')
      } else {
        setCompareStatus('✅ Ready to guess! Enter an age and start guessing.')
      }
    } catch (error) {
      console.error('Error checking age status:', error)
      setCompareStatus('❌ Error connecting to server: ' + error.message)
    }
  }

  const handleCompareDate = async (operation) => {
    if (!compareDate) {
      setCompareStatus('Please enter an age')
      return
    }

    setLoading(true)
    setCompareStatus(`Encrypting and comparing age (${operation})...`)

    try {
      console.log('Comparing age:', compareDate, 'operation:', operation)
      
      // Pass age directly as a number (not a date)
      const result = await ApiService.compareAge(parseInt(compareDate, 10), operation)
      
      console.log('Compare result:', result)
      
      // Check if the result is valid
      if (result.result === null || result.result === undefined) {
        throw new Error('Comparison returned no result. Please try again.')
      }
      
      // operation 'greater' means stored > guessed (i.e., actual person is OLDER than guess)
      // operation 'less' means stored < guessed (i.e., actual person is YOUNGER than guess)
      const booleanResult = result.result === 'true' || result.result === true
      
      let statusMessage
      let guessResult
      if (operation === 'greater') {
        // Asked: Is actual person OLDER? Contract returned: Is stored > guess?
        statusMessage = `✅ Is the person OLDER than ${compareDate}? ${booleanResult ? 'YES (guess higher) ⬆️' : 'NO (guess lower) ⬇️'}`
        guessResult = booleanResult ? 'YES ⬆️' : 'NO ⬇️'
      } else {
        // Asked: Is actual person YOUNGER? Contract returned: Is stored < guess?
        statusMessage = `✅ Is the person YOUNGER than ${compareDate}? ${booleanResult ? 'YES (guess lower) ⬇️' : 'NO (guess higher) ⬆️'}`
        guessResult = booleanResult ? 'YES ⬇️' : 'NO ⬆️'
      }
      
      // Add to guess history
      const guessEntry = {
        age: compareDate,
        operation: operation === 'greater' ? 'OLDER?' : 'YOUNGER?',
        result: guessResult,
        timestamp: new Date().toLocaleTimeString(),
        transactionHash: result.transactionHash
      }
      setGuessHistory(prev => [...prev, guessEntry])
      
      // Add debugging info if available
      if (result.storedValue && result.comparedValue) {
        statusMessage += `\n📊 Debug: Stored=${result.storedValue}, Compared=${result.comparedValue}`
      }
      
      setCompareStatus(statusMessage)
      
    } catch (error) {
      console.error('Error comparing age:', error)
      setCompareStatus('❌ Error comparing age: ' + (error.message || error.toString()))
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="app">
      <h1 className="title">Age Guessing Game - Player</h1>
      
      <div style={{
        textAlign: 'center',
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffc107',
        maxWidth: '800px',
        margin: '0 auto 1rem auto'
      }}>
        💰 Need test tokens? Get them from the <a href="https://discord.com/invite/Z4r8D6ez49" target="_blank" rel="noopener noreferrer">COTI Testnet Faucet</a>
      </div>

      <div className="cards-container" style={{justifyContent: 'center'}}>
        <div className="card" style={{maxWidth: '500px'}}>
          <h2 className="card-title">Guess Age</h2>
          
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
            <label className="form-label">Enter Age to Compare:</label>
            <input
              type="number"
              className="form-input"
              placeholder="Enter age (e.g., 25)"
              min="0"
              max="150"
              value={compareDate}
              onChange={(e) => setCompareDate(e.target.value)}
            />
          </div>
          
          <div className="button-group">
            <button
              className="btn btn-success"
              onClick={() => handleCompareDate('greater')}
              disabled={loading}
            >
              {loading ? 'Comparing...' : 'OLDER?'}
            </button>
            
            <button
              className="btn btn-warning"
              onClick={() => handleCompareDate('less')}
              disabled={loading}
            >
              {loading ? 'Comparing...' : 'YOUNGER?'}
            </button>
          </div>
          
          {compareStatus && (
            <div className={`status-message ${typeof compareStatus === 'string' && compareStatus.includes('Error') ? 'status-error' : typeof compareStatus === 'string' && compareStatus.includes('Result') ? 'status-success' : 'status-info'}`}>
              {compareStatus}
            </div>
          )}

          {guessHistory.length > 0 && (
            <div id="guess-history" style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                marginBottom: '1rem',
                color: '#495057',
                textAlign: 'center'
              }}>
                📊 GUESSES
              </h3>
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                fontSize: '0.9rem'
              }}>
                {guessHistory.map((guess, index) => (
                  <div key={index} style={{
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{flex: 1}}>
                        <strong>Guess #{index + 1}:</strong> {guess.age} years
                      </div>
                      <div style={{flex: 1, textAlign: 'center'}}>
                        {guess.operation}
                      </div>
                      <div style={{flex: 1, textAlign: 'right'}}>
                        {guess.result}
                      </div>
                    </div>
                    {guess.transactionHash && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6c757d',
                        wordBreak: 'break-all',
                        marginTop: '0.25rem'
                      }}>
                        <strong>TX:</strong> <a 
                          href={`https://testnet.cotiscan.io/tx/${guess.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{color: '#0066cc', textDecoration: 'none'}}
                        >
                          {guess.transactionHash}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Player2Page
