'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, supabase } from '../../lib/supabase'
import JSZip from 'jszip'

export default function UploadPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.name.endsWith('.zip')) {
      setFile(selectedFile)
      setError('')
    } else {
      setError('Please select a valid ZIP file')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.zip')) {
      setFile(droppedFile)
      setError('')
    } else {
      setError('Please drop a valid ZIP file')
    }
  }

  const handleUpload = async () => {
    if (!file || !user) return

    setUploading(true)
    setProgress(10)
    setStatus('Extracting ZIP file...')

    try {
      // Read ZIP file
      const zip = new JSZip()
      const zipData = await zip.loadAsync(file)
      setProgress(30)

      // Extract CSVs
      setStatus('Finding CSV files...')
      const csvFiles = {}
      const fileNames = ['workouts.csv', 'sleeps.csv', 'physiological_cycles.csv', 'journal_entries.csv']
      
      for (const fileName of fileNames) {
        const file = zipData.file(fileName)
        if (file) {
          csvFiles[fileName] = await file.async('text')
        }
      }

      setProgress(50)
      setStatus('Uploading to storage...')

      // Upload to Supabase Storage
      const uploadId = `${user.id}_${Date.now()}`
      let uploadedCount = 0
      
      for (const [fileName, content] of Object.entries(csvFiles)) {
        const { error: uploadError } = await supabase.storage
          .from('whoop-data')
          .upload(`${uploadId}/${fileName}`, content, {
            contentType: 'text/csv',
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw uploadError
        }
        uploadedCount++
        setProgress(50 + (uploadedCount / Object.keys(csvFiles).length) * 40)
      }

      setProgress(100)
      setStatus('Upload complete!')

      // Show success message
      setTimeout(() => {
        alert(`✅ Successfully uploaded ${Object.keys(csvFiles).length} files!\n\n📊 Files uploaded:\n${Object.keys(csvFiles).map(f => `• ${f}`).join('\n')}\n\n🎯 Now try the Calorie-Burn GPS!`)
        router.push('/dashboard')
      }, 1000)

    } catch (error) {
      console.error('Upload error:', error)
      setError(error.message || 'Failed to upload file. Please try again.')
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700">
      {/* Header */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <div className="text-white text-2xl font-bold">
            🎯 Whoop Insights Pro
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white hover:text-purple-200 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Upload Your Whoop Data
          </h1>
          <p className="text-purple-100 text-lg">
            Export your data from the Whoop app and upload the ZIP file here
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!uploading ? (
            <>
              {/* Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-4 border-dashed border-purple-300 rounded-xl p-12 text-center hover:border-purple-500 transition-all duration-300 cursor-pointer hover:bg-purple-50"
                onClick={() => document.getElementById('fileInput').click()}
              >
                <div className="text-6xl mb-4">📦</div>
                <p className="text-xl font-semibold text-gray-700 mb-2">
                  {file ? file.name : 'Drop your Whoop ZIP file here'}
                </p>
                <p className="text-gray-500">
                  or click to browse
                </p>
                <input
                  id="fileInput"
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="mt-6 bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                  ❌ {error}
                </div>
              )}

              {/* Instructions */}
              <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-xl">📱</span>
                  How to export from Whoop:
                </h3>
                <ol className="space-y-2 text-gray-600">
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-600">1.</span>
                    <span>Open the Whoop mobile app</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-600">2.</span>
                    <span>Go to Settings → Privacy → Export Data</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-600">3.</span>
                    <span>Request export and wait for email</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-600">4.</span>
                    <span>Download the ZIP file</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-purple-600">5.</span>
                    <span>Upload it here!</span>
                  </li>
                </ol>
              </div>

              {/* Upload Button */}
              {file && (
                <button
                  onClick={handleUpload}
                  className="btn-primary w-full mt-6 text-lg"
                >
                  🚀 Upload & Analyze My Data
                </button>
              )}
            </>
          ) : (
            /* Progress Screen */
            <div className="text-center py-12">
              <div className="text-6xl mb-6 animate-bounce">🔄</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {status}
              </h3>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-6 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-4 rounded-full transition-all duration-500 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
              </div>

              <p className="text-gray-600 mb-4 text-lg font-semibold">{progress}% complete</p>

              {progress === 100 && (
                <div className="flex items-center justify-center gap-2 text-green-600 animate-bounce">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-bold text-xl">Upload Complete!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* What Happens Next */}
        {!uploading && (
          <div className="mt-12 text-center text-white">
            <h3 className="text-xl font-semibold mb-6">What happens after upload?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="feature-card">
                <div className="text-4xl mb-3">🔬</div>
                <p className="text-sm font-medium">Files stored securely in Supabase</p>
              </div>
              <div className="feature-card">
                <div className="text-4xl mb-3">🤖</div>
                <p className="text-sm font-medium">Ready for ML analysis</p>
              </div>
              <div className="feature-card">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-sm font-medium">Use Calorie-Burn GPS now!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
