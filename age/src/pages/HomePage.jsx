import React from 'react'
import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate()
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729'

  return (
    <div className="app">
      <div className="cards-container" style={{justifyContent: 'center'}}>
        <div className="card" style={{maxWidth: '900px', width: '90%'}}>
          <h1 className="title" style={{marginTop: 0, color: '#000', textShadow: 'none', fontWeight: '600'}}>Age Guessing Game</h1>

          <div style={{
            textAlign: 'left',
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{fontSize: '1.1rem', marginBottom: '0.5rem'}}>🔐 Privacy-Preserving Age Verification</div>
            <div style={{fontSize: '0.9rem', color: '#6c757d'}}>Powered by COTI's GC Technology</div>
          </div>
          
          <div style={{textAlign: 'left', lineHeight: '1.8'}}>
            <p><strong>🎯 Admin:</strong></p>
            <ul style={{marginLeft: '1.5rem'}}>
              <li>Store your birth date (encrypted on-chain)</li>
              <li>Your age is encrypted and stored privately</li>
            </ul>
            
            <p style={{marginTop: '1.5rem'}}><strong>🎮 Player:</strong></p>
            <ul style={{marginLeft: '1.5rem'}}>
              <li>Try to guess Admin's age</li>
              <li>Ask if they are OLDER or YOUNGER than your guess</li>
              <li>The answer is computed using encrypted comparison</li>
              <li>Keep guessing until you find the correct age!</li>
            </ul>

            <div style={{marginTop: '1.5rem', padding: '1rem', backgroundColor: '#e7f3ff', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'left'}}>
              <p style={{margin: '0 0 1rem 0'}}>
                <strong>🔐 Privacy Guarantee:</strong> Player never sees the actual age - all comparisons happen on encrypted data using COTI's Garbling Circuit Technology.
              </p>
              <p style={{margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#6c757d'}}>
                <strong>Contract:</strong>{' '}
                <a
                  href={`https://testnet.cotiscan.io/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{color: '#0066cc', textDecoration: 'none', wordBreak: 'break-all'}}
                  onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                >
                  {contractAddress}
                </a>
              </p>
              <p style={{margin: '0 0 0.5rem 0', fontSize: '0.85rem'}}>
                <a
                  href="https://github.com/coti-io/coti-contracts-examples/blob/main/contracts/DateGame.sol"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{color: '#0066cc', textDecoration: 'none'}}
                  onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                >
                  📄 Contract Source Code
                </a>
              </p>
              <p style={{margin: 0, fontSize: '0.85rem', color: '#6c757d'}}><strong>Network:</strong> COTI Testnet</p>
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
