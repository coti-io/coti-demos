import { ethers } from 'ethers'
import { JsonRpcApiProvider, Wallet, getDefaultProvider } from '@coti-io/coti-ethers'

// Server-based Coti operations using stored private key
export class CotiService {
  constructor(contractAddress) {
    this.contractAddress = contractAddress
    this.cotiProvider = null
    this.cotiWallet = null
    this.contract = null
  }

  // Initialize Coti provider and wallet with server-stored private key
  async initialize() {
    try {
      console.log('Initializing Coti service...')
      
      // Create Coti provider
      console.log('Creating Coti provider...')
      // Try using getDefaultProvider for Coti testnet
      this.cotiProvider = getDefaultProvider('https://testnet.coti.io/rpc')
      console.log('Coti provider created successfully')
      
      // Use your private key stored on server
      const privateKey = 'ae7f54c98460fed4c2ecb2e143f0e8110db534d390940f9f7b7048b94d614306'
      
      // Create Coti wallet with your private key
      console.log('Creating Coti wallet...')
      this.cotiWallet = new Wallet(privateKey, this.cotiProvider)
      console.log('Coti wallet created with address:', this.cotiWallet.address)
      
      // Create contract instance
      console.log('Creating contract instance...')
      const DateGameABI = [
        {
          "inputs": [{"components": [{"internalType": "ctUint64", "name": "ciphertext", "type": "uint256"}, {"internalType": "bytes", "name": "signature", "type": "bytes"}], "internalType": "struct itUint64", "name": "birthdate", "type": "tuple"}],
          "name": "setAge",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{"components": [{"internalType": "ctUint64", "name": "ciphertext", "type": "uint256"}, {"internalType": "bytes", "name": "signature", "type": "bytes"}], "internalType": "struct itUint64", "name": "value", "type": "tuple"}],
          "name": "greaterThan",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{"components": [{"internalType": "ctUint64", "name": "ciphertext", "type": "uint256"}, {"internalType": "bytes", "name": "signature", "type": "bytes"}], "internalType": "struct itUint64", "name": "value", "type": "tuple"}],
          "name": "lessThan",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "isDateSet",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "getStoredDateClear",
          "outputs": [{"internalType": "uint64", "name": "", "type": "uint64"}],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ]
      
      this.contract = new ethers.Contract(this.contractAddress, DateGameABI, this.cotiWallet)
      console.log('Contract instance created successfully')
      
      // Test the connection by calling a view function
      console.log('Testing contract connection...')
      const sum = await this.contract.sum()
      console.log('Contract connection test successful. Sum:', sum.toString())
      
      console.log('✅ Coti service initialized successfully!')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize Coti service:', error)
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
      return false
    }
  }

  // Store encrypted date using server-side operations
  async storeDate(dateString) {
    console.log('Storing date:', dateString)
    
    try {
      // Initialize if not already done
      if (!this.cotiWallet) {
        const initialized = await this.initialize()
        if (!initialized) {
          throw new Error('Failed to initialize Coti service')
        }
      }
      
      // Convert date to days since epoch
      const daysSinceEpoch = CotiService.dateToEpochDays(dateString)
      const bigIntValue = BigInt(daysSinceEpoch)
      
      console.log('Converting date to days since epoch:', daysSinceEpoch)
      
      // Encrypt using Coti wallet
      console.log('Encrypting value with server wallet...')
      const encryptedValue = await this.cotiWallet.encryptValue(
        bigIntValue,
        this.contractAddress,
        'setAge(tuple)'
      )
      
      console.log('Encryption successful, sending transaction...')
      
      // Send transaction using server wallet
      const tx = await this.contract.setAge(encryptedValue, {
        gasLimit: 500000
      })
      
      console.log('Transaction sent:', tx.hash)
      
      // Wait for confirmation
      const receipt = await tx.wait()
      console.log('Transaction confirmed:', receipt)
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      }
      
    } catch (error) {
      console.error('Failed to store date:', error)
      throw new Error('Failed to store date: ' + error.message)
    }
  }

  // Compare encrypted date using server-side operations
  async compareDate(dateString, operation) {
    console.log('Comparing date:', dateString, 'operation:', operation)
    
    try {
      // Initialize if not already done
      if (!this.cotiWallet) {
        const initialized = await this.initialize()
        if (!initialized) {
          throw new Error('Failed to initialize Coti service')
        }
      }
      
      // Convert date to days since epoch
      const daysSinceEpoch = CotiService.dateToEpochDays(dateString)
      const bigIntValue = BigInt(daysSinceEpoch)
      
      console.log('Converting date to days since epoch:', daysSinceEpoch)
      
      // Encrypt using Coti wallet
      console.log('Encrypting comparison value with server wallet...')
      const encryptedValue = await this.cotiWallet.encryptValue(
        bigIntValue,
        this.contractAddress,
        operation === 'greater' ? 'greaterThan(tuple)' : 'lessThan(tuple)'
      )
      
      console.log('Encryption successful, calling comparison function...')
      
      // Call comparison function using server wallet
      let result
      if (operation === 'greater') {
        result = await this.contract.greaterThan(encryptedValue)
      } else {
        result = await this.contract.lessThan(encryptedValue)
      }
      
      console.log('Comparison result:', result)
      
      return {
        success: true,
        result: result,
        operation: operation
      }
      
    } catch (error) {
      console.error('Failed to compare date:', error)
      throw new Error('Failed to compare date: ' + error.message)
    }
  }

  // Get contract sum (view function)
  async getSum() {
    try {
      // Initialize if not already done
      if (!this.contract) {
        const initialized = await this.initialize()
        if (!initialized) {
          throw new Error('Failed to initialize Coti service')
        }
      }
      
      const sum = await this.contract.sum()
      return sum.toString()
      
    } catch (error) {
      console.error('Failed to get sum:', error)
      throw new Error('Failed to get sum: ' + error.message)
    }
  }

  // Convert date to days since epoch for better handling
  static dateToEpochDays(dateString) {
    const selectedDate = new Date(dateString)
    const epochDate = new Date('1970-01-01')
    return Math.floor((selectedDate - epochDate) / (1000 * 60 * 60 * 24))
  }

  // Convert epoch days back to date string
  static epochDaysToDate(days) {
    const epochDate = new Date('1970-01-01')
    const targetDate = new Date(epochDate.getTime() + (days * 24 * 60 * 60 * 1000))
    return targetDate.toISOString().split('T')[0]
  }
}

// Contract address
export const CONTRACT_ADDRESS = '0xAF7Fe476CE3bFd05b39265ecEd13a903Bb738729'