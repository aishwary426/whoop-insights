'use client'

import { useState } from 'react'
import NeonButton from './ui/NeonButton'
import { api } from '../lib/api'

export default function ConnectWhoopButton() {
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    console.log('Connect button clicked')
    setLoading(true)
    try {
      console.log('Calling getWhoopAuthUrl')
      const response = await api.getWhoopAuthUrl()
      console.log('Got auth URL response:', response)
      if (response && response.url) {
        console.log('Redirecting to:', response.url)
        window.location.href = response.url
      } else {
        console.error('Failed to get auth URL', response)
      }
    } catch (error: any) {
      console.error('Error connecting to Whoop:', error)
      alert(`Failed to connect to Whoop: ${error.message || 'Unknown error'}. Please try again later.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <NeonButton 
      onClick={handleConnect} 
      disabled={loading}
      className="w-full"
    >
      {loading ? 'Connecting...' : 'Connect with WHOOP'}
    </NeonButton>
  )
}
