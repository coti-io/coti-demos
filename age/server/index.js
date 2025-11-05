import express from 'express'
import cors from 'cors'
import { ethers } from 'ethers'
import { Contract, CotiNetwork, getDefaultProvider, Wallet } from '@coti-io/coti-ethers'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3002

// Middleware
app.use(cors())
app.use(express.json())

// Contract configuration
const DATE_GAME_ADDRESS = '0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729'
const PRIVATE_KEY = 'ae7f54c98460fed4c2ecb2e143f0e8110db534d390940f9f7b7048b94d614306'
const AES_KEY = '8d41ade6e238d837bdbd44bac75dfac4'

// Load ABI from file
const DateGameABIFile = JSON.parse(readFileSync(join(__dirname, 'DateGameABI.json'), 'utf8'))
const DateGameABI = DateGameABIFile.abi

// Initialize Coti provider and wallet
let cotiProvider, cotiWallet, contract

async function initializeCoti() {
  try {
    console.log('Initializing Coti provider...')
    cotiProvider = getDefaultProvider(CotiNetwork.Testnet)

    console.log('Creating Coti wallet...')
    cotiWallet = new Wallet(PRIVATE_KEY, cotiProvider)
    cotiWallet.setAesKey(AES_KEY)
    console.log('Wallet address:', cotiWallet.address)

    console.log('Creating contract instance...')
    contract = new Contract(DATE_GAME_ADDRESS, DateGameABI, cotiWallet)

    console.log('✅ Coti service initialized successfully!')
    return true
  } catch (error) {
    console.error('❌ Failed to initialize Coti:', error)
    return false
  }
}

// Helper function to convert date to epoch days
function dateToEpochDays(dateString) {
  const selectedDate = new Date(dateString)
  const epochDate = new Date('1970-01-01')
  return Math.floor((selectedDate - epochDate) / (1000 * 60 * 60 * 24))
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Coti Date Game Server is running' })
})

// Removed sum endpoint - not needed for DateGame functionality

// Store encrypted date
app.post('/api/store-date', async (req, res) => {
  try {
    const { date } = req.body

    if (!date) {
      return res.status(400).json({ error: 'Date is required' })
    }

    if (!contract) {
      const initialized = await initializeCoti()
      if (!initialized) {
        return res.status(500).json({ error: 'Failed to initialize Coti service' })
      }
    }

    console.log('Storing date:', date)

    // Calculate age in years on the server side
    const birthDate = new Date(date)
    const now = new Date()
    let age = now.getFullYear() - birthDate.getFullYear()
    const monthDiff = now.getMonth() - birthDate.getMonth()
    
    // Adjust age if birthday hasn't occurred this year yet
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age--
    }
    
    const bigIntValue = BigInt(age)

    console.log('Birth date:', birthDate.toISOString())
    console.log('Calculated age in years:', age)
    console.log('BigInt value for storage:', bigIntValue.toString())

    // Encrypt using Coti wallet
    console.log('Encrypting value...')
    const encryptedValue = await cotiWallet.encryptValue(
      bigIntValue,
      DATE_GAME_ADDRESS,
      contract.setAge.fragment.selector
    )

    console.log('Sending transaction...')
    const tx = await contract.setAge(encryptedValue, {
      gasLimit: 500000
    })

    console.log('Transaction sent:', tx.hash)
    const receipt = await tx.wait()
    console.log('Age stored successfully. Calculated age:', age)

    res.json({
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      date: date,
      age: age,
      encryptedCiphertext: encryptedValue.ciphertext?.toString() || encryptedValue[0]?.toString() || 'N/A'
    })

  } catch (error) {
    console.error('Error storing date:', error)
    res.status(500).json({ error: 'Failed to store date: ' + error.message })
  }
})

// Check if date is set
app.get('/api/is-date-set', async (req, res) => {
  try {
    if (!contract) {
      const initialized = await initializeCoti()
      if (!initialized) {
        return res.status(500).json({ error: 'Failed to initialize Coti service' })
      }
    }

    const isSet = await contract.isAgeSet()
    res.json({ isAgeSet: isSet })
  } catch (error) {
    console.error('Error checking if date is set:', error)
    res.status(500).json({ error: 'Failed to check date status' })
  }
})

// Get stored date (for debugging)
// Debug date conversion
app.post('/api/debug-date', async (req, res) => {
  try {
    const { date } = req.body

    if (!date) {
      return res.status(400).json({ error: 'Date is required' })
    }

    const daysSinceEpoch = dateToEpochDays(date)

    // Let's also test some known dates
    const testDates = [
      '2024-01-01',
      '2025-01-01',
      '2025-10-23',
      '2025-10-30'
    ]

    const testResults = testDates.map(testDate => ({
      date: testDate,
      daysSinceEpoch: dateToEpochDays(testDate)
    }))

    res.json({
      inputDate: date,
      daysSinceEpoch: daysSinceEpoch,
      testDates: testResults
    })

  } catch (error) {
    console.error('Error debugging date:', error)
    res.status(500).json({ error: 'Failed to debug date: ' + error.message })
  }
})

// Compare date
app.post('/api/compare-date', async (req, res) => {
  try {
    const { date, age, operation } = req.body

    if (!operation) {
      return res.status(400).json({ error: 'Operation is required' })
    }

    if (!['greater', 'less'].includes(operation)) {
      return res.status(400).json({ error: 'Operation must be "greater" or "less"' })
    }

    if (!contract) {
      const initialized = await initializeCoti()
      if (!initialized) {
        return res.status(500).json({ error: 'Failed to initialize Coti service' })
      }
    }

    // Support both formats: direct age number OR birthdate
    let ageValue
    if (age !== undefined && age !== null && age !== '') {
      // Direct age provided (from UI)
      ageValue = parseInt(age, 10)
      if (isNaN(ageValue) || ageValue < 0) {
        return res.status(400).json({ error: 'Invalid age value' })
      }
      console.log('Comparing with age:', ageValue, 'operation:', operation)
    } else if (date) {
      // Birthdate provided (from tests) - calculate age
      const birthDate = new Date(date)
      const today = new Date()
      ageValue = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        ageValue--
      }
      console.log('Comparing with birthdate:', date, 'calculated age:', ageValue, 'operation:', operation)
    } else {
      return res.status(400).json({ error: 'Either age or date is required' })
    }
    
    const bigIntValue = BigInt(ageValue)

    console.log('Calculated age for comparison:', ageValue)
    console.log('BigInt value for comparison:', bigIntValue.toString())
    
    // Get the stored age for debugging
    try {
      const storedAge = await contract.isAgeSet() ? 'set' : 'not set'
      console.log('Date set status:', storedAge)
    } catch (e) {
      console.log('Could not check date status')
    }

    // Encrypt using Coti wallet
    console.log('Encrypting comparison value...')
    const functionSelector = operation === 'greater' ?
      contract.greaterThan.fragment.selector :
      contract.lessThan.fragment.selector

    const encryptedValue = await cotiWallet.encryptValue(
      bigIntValue,
      DATE_GAME_ADDRESS,
      functionSelector
    )

    // First check if date is set
    const isAgeSet = await contract.isAgeSet()
    console.log('Is age set before comparison:', isAgeSet)

    if (!isAgeSet) {
      return res.status(400).json({ error: 'No date has been stored yet. Please store a date first.' })
    }

    // Step 1: Call the comparison function (transaction) - following Counter.add() pattern
    console.log('Calling comparison transaction...')
    let tx
    try {
      if (operation === 'greater') {
        tx = await contract.greaterThan(encryptedValue, { gasLimit: 500000 })
      } else {
        tx = await contract.lessThan(encryptedValue, { gasLimit: 500000 })
      }
      console.log('Transaction sent:', tx.hash)
      const receipt = await tx.wait()
      console.log('Transaction confirmed in block:', receipt.blockNumber)
    } catch (txError) {
      console.error('Transaction failed:', txError)
      return res.status(500).json({ error: 'Transaction failed: ' + txError.message })
    }

    // Step 2: Read the result using view function - following Counter.sum() pattern
    console.log('Reading comparison result from view function...')
    const ctResult = await contract.comparisonResult()
    console.log('Got encrypted result (ctUint8):', ctResult.toString())

    // Step 3: Decrypt the result - following Counter example
    const clearResult = await cotiWallet.decryptValue(ctResult)
    console.log('Decrypted clear value:', clearResult)
    
    // Convert to boolean (1 = true, 0 = false)
    const boolResult = clearResult === 1n || clearResult === BigInt(1)
    console.log('Boolean result:', boolResult)
    
    res.json({
      success: true,
      result: boolResult,
      operation: operation,
      age: ageValue,
      transactionHash: tx.hash
    })

  } catch (error) {
    console.error('Error comparing age:', error)
    res.status(500).json({ error: 'Failed to compare age: ' + error.message })
  }
})

// Initialize and start server
async function startServer() {
  const initialized = await initializeCoti()
  if (!initialized) {
    console.error('Failed to initialize Coti service. Server will start but API calls may fail.')
  }

  app.listen(PORT, () => {
    console.log(`🚀 Coti Date Game Server running on port ${PORT}`)
    console.log(`📍 Health check: http://localhost:${PORT}/health`)
  })
}

startServer()