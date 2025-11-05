import React from 'react'
import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="app">
      <h1 className="title">Age Guessing Game</h1>

      <div className="cards-container" style={{justifyContent: 'center'}}>
        <div className="card" style={{maxWidth: '600px'}}>
          <h2 className="card-title">How to Play</h2>
          
          <div style={{
            textAlign: 'center', 
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{fontSize: '1.1rem', marginBottom: '0.5rem'}}>🔐 Privacy-Preserving Age Verification</div>
            <div style={{fontSize: '0.9rem', color: '#6c757d'}}>Powered by Coti's MPC Technology</div>
          </div>
          
          <div style={{textAlign: 'left', lineHeight: '1.8'}}>
            <p><strong>🎯 Admin:</strong></p>
            <ul style={{marginLeft: '1.5rem'}}>
              <li>Store your birth date (encrypted on-chain)</li>
              <li>Your age is calculated and stored privately</li>
            </ul>
            
            <p style={{marginTop: '1.5rem'}}><strong>🎮 Player:</strong></p>
            <ul style={{marginLeft: '1.5rem'}}>
              <li>Try to guess Admin's age</li>
              <li>Ask if they are OLDER or YOUNGER than your guess</li>
              <li>The answer is computed using encrypted comparison</li>
              <li>Keep guessing until you find the correct age!</li>
            </ul>

            <p style={{marginTop: '1.5rem', padding: '1rem', backgroundColor: '#e7f3ff', borderRadius: '8px', fontSize: '0.9rem'}}>
              <strong>🔐 Privacy Guarantee:</strong> Player never sees the actual age - all comparisons happen on encrypted data using Coti's Multi-Party Computation (MPC).
            </p>

            <div style={{marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '0.85rem', color: '#6c757d', textAlign: 'center'}}>
              <p style={{margin: '0 0 0.5rem 0'}}><strong>Contract:</strong> 0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729</p>
              <p style={{margin: 0}}><strong>Network:</strong> Coti Testnet</p>
            </div>
          </div>

          <div style={{marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/admin')}
              style={{minWidth: '150px'}}
            >
              Start as Admin →
            </button>
            <button
              className="btn btn-success"
              onClick={() => navigate('/player')}
              style={{minWidth: '150px'}}
            >
              Start as Player →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
