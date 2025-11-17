'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, X, FileText } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import { getCurrentUser, supabase } from '../../lib/supabase'
import JSZip from 'jszip'

export default function UploadPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

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
        setFile(droppedFile)
        setError('')
      } else {
        setError('Please upload a .zip file')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.name.endsWith('.zip')) {
        setFile(selectedFile)
        setError('')
      } else {
        setError('Please upload a .zip file')
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !user) return

    setUploading(true)
    setProgress(10)

    try {
      const zip = new JSZip()
      const zipData = await zip.loadAsync(file)
      setProgress(30)

      const csvFiles: Record<string, string> = {}
      const fileNames = ['workouts.csv', 'sleeps.csv', 'physiological_cycles.csv', 'journal_entries.csv']
      
      for (const fileName of fileNames) {
        const zipFile = zipData.file(fileName)
        if (zipFile) {
          csvFiles[fileName] = await zipFile.async('text')
        }
      }

      setProgress(50)

      const uploadId = `${user.id}_${Date.now()}`
      let uploadedCount = 0
      
      for (const [fileName, content] of Object.entries(csvFiles)) {
        const { error: uploadError } = await supabase.storage
          .from('whoop-data')
          .upload(`${uploadId}/${fileName}`, content, {
            contentType: 'text/csv',
          })

        if (uploadError) throw uploadError
        uploadedCount++
        setProgress(50 + (uploadedCount / Object.keys(csvFiles).length) * 40)
      }

      setProgress(100)
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)

    } catch (error: any) {
      console.error('Upload error:', error)
      setError(error.message || 'Upload failed')
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <AppLayout user={user}>
      <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-20">
        <div className="gradient-blob w-96 h-96 bg-purple-500 top-0 left-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Upload Your WHOOP Data</h1>
            <p className="text-xl text-slate-400">
              Export your data from the WHOOP app and drop the ZIP file here
            </p>
          </div>

          <div className="glass-card p-8">
            {!uploading ? (
              <>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput')?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ${
                    dragActive 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'
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
                      <FileText className="w-12 h-12 text-green-400" />
                      <div className="text-left">
                        <div className="font-semibold">{file.name}</div>
                        <div className="text-sm text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setFile(null)
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                      <div className="text-xl font-semibold mb-2">
                        Drop your WHOOP ZIP file here
                      </div>
                      <div className="text-slate-400">
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
                  <button
                    onClick={handleUpload}
                    className="btn-primary w-full mt-6 text-lg"
                  >
                    Upload & Analyze
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-6" />
                <div className="text-xl font-semibold mb-4">Processing your data...</div>
                
                <div className="max-w-md mx-auto">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  </div>
                  <div className="text-sm text-slate-400">{progress}% complete</div>
                </div>
              </div>
            )}

            <div className="mt-8 p-6 rounded-xl bg-white/5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">📱</span>
                How to export from WHOOP:
              </h3>
              <ol className="space-y-3 text-sm text-slate-400">
                <li className="flex gap-3">
                  <span className="font-bold text-purple-400">1.</span>
                  <span>Open the WHOOP mobile app</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-purple-400">2.</span>
                  <span>Go to Settings → Privacy → Export Data</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-purple-400">3.</span>
                  <span>Request export and wait for email</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-purple-400">4.</span>
                  <span>Download the ZIP file from email</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-purple-400">5.</span>
                  <span>Upload it here!</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
