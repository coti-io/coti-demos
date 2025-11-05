// Simple API service for communicating with the server
const API_BASE_URL = 'http://localhost:3002/api'

export class ApiService {
  // Removed getSum - not needed for DateGame functionality

  // Store date on server
  static async storeDate(dateString) {
    try {
      const response = await fetch(`${API_BASE_URL}/store-date`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: dateString })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to store date')
      }
      
      return data
    } catch (error) {
      console.error('Error storing date:', error)
      throw error
    }
  }

  // Compare date on server (for testing with birthdates)
  static async compareDate(dateString, operation) {
    try {
      const response = await fetch(`${API_BASE_URL}/compare-date`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          date: dateString, 
          operation: operation 
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to compare date')
      }
      
      return data
    } catch (error) {
      console.error('Error comparing date:', error)
      throw error
    }
  }

  // Compare age directly (for UI)
  static async compareAge(age, operation) {
    try {
      const response = await fetch(`${API_BASE_URL}/compare-date`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          age: age, 
          operation: operation 
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to compare age')
      }
      
      return data
    } catch (error) {
      console.error('Error comparing age:', error)
      throw error
    }
  }

  // Check if date is set
  static async isDateSet() {
    try {
      const response = await fetch(`${API_BASE_URL}/is-date-set`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check date status')
      }
      
      return data.isDateSet
    } catch (error) {
      console.error('Error checking date status:', error)
      throw error
    }
  }

  // Get stored date (for debugging)
  static async getStoredDate() {
    try {
      const response = await fetch(`${API_BASE_URL}/get-stored-date`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get stored date')
      }
      
      return data.storedDate
    } catch (error) {
      console.error('Error getting stored date:', error)
      throw error
    }
  }

  // Debug date conversion
  static async debugDate(dateString) {
    try {
      const response = await fetch(`${API_BASE_URL}/debug-date`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: dateString })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to debug date')
      }
      
      return data
    } catch (error) {
      console.error('Error debugging date:', error)
      throw error
    }
  }

  // Health check
  static async healthCheck() {
    try {
      const response = await fetch('http://localhost:3002/health')
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Server health check failed:', error)
      throw error
    }
  }
}