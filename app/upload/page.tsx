'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, X, FileText } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'
import NeonButton from '../../components/ui/NeonButton'
import ConnectWhoopButton from '../../components/ConnectWhoopButton'
import { getCurrentUser } from '../../lib/auth'
import { api } from '../../lib/api'

export default function UploadPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('Preparing upload...')
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
      } else {
        setUser(currentUser)
      }
    }
    checkUser()
  }, [router])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.zip')) {
        if (droppedFile.size > 4.5 * 1024 * 1024) {
          setError('File too large. Vercel limits uploads to 4.5MB. Please contact support or try a smaller export.')
          setFile(null)
        } else {
          setFile(droppedFile)
          setError('')
        }
      } else {
        setError('Please upload a .zip file')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.name.endsWith('.zip')) {
        if (selectedFile.size > 4.5 * 1024 * 1024) {
          setError('File too large. Vercel limits uploads to 4.5MB. Please contact support or try a smaller export.')
          setFile(null)
          // Reset input so user can select same file again if they want to see error again
          e.target.value = ''
        } else {
          setFile(selectedFile)
          setError('')
        }
      } else {
        setError('Please upload a .zip file')
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !user) return

    setUploading(true)
    setProgress(0)
    setProgressMessage('Uploading and processing... This may take a minute or two.')
    setError('')

    try {
      // Synchronous upload - this call waits until ALL processing is complete:
      // 1. File upload
      // 2. Data parsing  
      // 3. Feature engineering (94% progress)
      // 4. Model training (96% progress) - including Calorie GPS model
      // The API only returns when everything is done, so we wait here until complete
      setProgressMessage('Uploading file and processing data...')
      const response = await api.uploadWhoopData(file)

      // If we get here, upload AND training are complete
      console.log('Upload and training successful:', response)
      setProgress(100)
      setProgressMessage('Upload complete! All models trained successfully. Redirecting...')

      // Wait a bit longer to ensure database commit is fully propagated
      // This helps prevent race conditions where dashboard queries before data is visible
      setTimeout(() => {
        setUploading(false)
        setFile(null) // Clear the file
        // Redirect with timestamp to force refresh
        router.push(`/dashboard?uploaded=${Date.now()}`)
      }, 2500) // Increased delay to ensure database commit propagation

    } catch (error: any) {
      console.error('Upload error:', error)

      // Extract error message with fallbacks
      let errorMessage = ''

      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error?.message) {
        errorMessage = error.message
      } else {
        errorMessage = 'Upload failed. Please check your file and connection.'
      }

      // Clean up the message
      errorMessage = errorMessage.trim()
      if (errorMessage.startsWith('Error: ')) {
        errorMessage = errorMessage.substring('Error: '.length)
      }

      setError(errorMessage)
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <AppLayout user={user}>
      <div className="relative z-10 w-full px-6 md:px-8 pt-28 pb-16 text-gray-900 dark:text-white">
        <div className="relative text-center space-y-3 mb-10">
          <h1 className="text-[clamp(2.2rem,5vw,3.2rem)] font-semibold leading-tight text-gray-900 dark:text-white">Upload your WHOOP export</h1>
          <p className="text-gray-600 dark:text-white/60 max-w-2xl mx-auto text-[15px]">
            Drop your ZIP. We unpack, parse, and sync with your dashboard instantly.
          </p>
        </div>

        <NeonCard className="p-8 border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A]">
          {!uploading ? (
            <>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 ${dragActive
                  ? 'border-blue-600/60 dark:border-neon-primary/60 bg-blue-600/5 dark:bg-neon-primary/5'
                  : 'border-gray-300 dark:border-white/10 hover:border-blue-600/40 dark:hover:border-neon-primary/40 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
              >
                <input
                  id="fileInput"
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="flex items-center justify-center gap-4">
                    <FileText className="w-10 h-10 text-blue-600 dark:text-neon-primary" />
                    <div className="text-left">
                      <div className="font-semibold">{file.name}</div>
                      <div className="text-sm text-gray-500 dark:text-white/60">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-14 h-14 mx-auto mb-4 text-gray-400 dark:text-white/60" />
                    <div className="text-xl font-semibold mb-2">
                      Drop your WHOOP ZIP file here
                    </div>
                    <div className="text-gray-500 dark:text-white/60 text-sm">
                      or click to browse
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                  {error}
                </div>
              )}

              {file && (
                <NeonButton
                  onClick={handleUpload}
                  className="w-full mt-6 text-lg"
                >
                  Upload & Analyze
                </NeonButton>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-14 h-14 border-4 border-blue-600/15 dark:border-neon-primary/15 border-t-blue-600 dark:border-t-neon-primary rounded-full animate-spin mx-auto mb-6" />
              <div className="text-xl font-semibold mb-1">Processing your data...</div>
              <div className="text-sm text-gray-500 dark:text-white/60 mb-4">{progressMessage}</div>

              <div className="max-w-md mx-auto">
                <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 20, ease: "linear", repeat: Infinity }}
                    className="h-full bg-blue-600 dark:bg-neon-primary"
                  />
                </div>
                <div className="text-sm text-gray-500 dark:text-white/60">Please wait...</div>
              </div>
            </div>
          )}

          <div className="mt-8 p-6 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📱</span>
              How to export from WHOOP:
            </h3>
            <ol className="space-y-3 text-sm text-gray-600 dark:text-white/65">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-neon-primary">1.</span>
                <span>Open the WHOOP mobile app</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-neon-primary">2.</span>
                <span>Go to Settings → Privacy → Export Data</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-neon-primary">3.</span>
                <span>Request export and wait for email</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-neon-primary">4.</span>
                <span>Download the ZIP file from email</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 dark:text-neon-primary">5.</span>
                <span>Upload it here!</span>
              </li>
            </ol>
          </div>

          <div className="mt-8 text-center">
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-white/40 text-sm">OR</span>
              <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
            </div>
            <p className="mb-4 text-gray-600 dark:text-white/60">Connect directly to fetch your data automatically</p>
            
            <div className="mb-4 p-4 rounded-xl bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/30 text-left max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <span className="text-lg">ℹ️</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">
                    Data Limitation Notice
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-500/80 leading-relaxed">
                    Connecting through Whoop API will display approximately <strong>25 days</strong> of recent data. 
                    For complete historical data, please <strong>upload a ZIP file</strong> instead.
                  </p>
                </div>
              </div>
            </div>
            
            <ConnectWhoopButton />
          </div>
        </NeonCard>
      </div>
    </AppLayout>
  )
}
