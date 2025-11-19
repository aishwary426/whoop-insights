'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, X, FileText, ShieldCheck } from 'lucide-react'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'
import NeonButton from '../../components/ui/NeonButton'
import { ParallaxBackground } from '../../components/ui/ParallaxBlob'
import { getCurrentUser } from '../../lib/supabase'
import { api } from '../../lib/api'

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
      // Simulate progress for better UX since we can't track real upload progress easily with fetch
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      await api.uploadWhoopData(file)

      clearInterval(progressInterval)
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
      <ParallaxBackground />
      <div className="relative z-10 w-full px-6 md:px-8 pt-28 pb-16 text-white">
        <div className="relative text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-primary/30 bg-neon-primary/10 text-xs font-semibold text-white/80">
            <ShieldCheck className="w-4 h-4 text-neon-primary" />
            Private upload · local parsing
          </div>
          <h1 className="text-[clamp(2.2rem,5vw,3.2rem)] font-semibold leading-tight">Upload your WHOOP export</h1>
          <p className="text-white/60 max-w-2xl mx-auto text-[15px]">
            Drop your ZIP. We unpack, parse, and sync with your dashboard instantly.
          </p>
        </div>

        <NeonCard className="p-8 border-white/10 bg-[#0A0A0A]">
          {!uploading ? (
            <>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput')?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-300 ${dragActive
                  ? 'border-neon-primary/60 bg-neon-primary/5'
                  : 'border-white/10 hover:border-neon-primary/40 hover:bg-white/5'
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
                    <FileText className="w-10 h-10 text-neon-primary" />
                    <div className="text-left">
                      <div className="font-semibold">{file.name}</div>
                      <div className="text-sm text-white/60">
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
                    <Upload className="w-14 h-14 mx-auto mb-4 text-white/60" />
                    <div className="text-xl font-semibold mb-2">
                      Drop your WHOOP ZIP file here
                    </div>
                    <div className="text-white/60 text-sm">
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
              <div className="w-14 h-14 border-4 border-neon-primary/15 border-t-neon-primary rounded-full animate-spin mx-auto mb-6" />
              <div className="text-xl font-semibold mb-4">Processing your data...</div>

              <div className="max-w-md mx-auto">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-neon-primary"
                  />
                </div>
                <div className="text-sm text-white/60">{progress}% complete</div>
              </div>
            </div>
          )}

          <div className="mt-8 p-6 rounded-xl bg-black/40 border border-white/5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span className="text-2xl">📱</span>
              How to export from WHOOP:
            </h3>
            <ol className="space-y-3 text-sm text-white/65">
              <li className="flex gap-3">
                <span className="font-bold text-neon-primary">1.</span>
                <span>Open the WHOOP mobile app</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-neon-primary">2.</span>
                <span>Go to Settings → Privacy → Export Data</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-neon-primary">3.</span>
                <span>Request export and wait for email</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-neon-primary">4.</span>
                <span>Download the ZIP file from email</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-neon-primary">5.</span>
                <span>Upload it here!</span>
              </li>
            </ol>
          </div>
        </NeonCard>
      </div>
    </AppLayout>
  )
}
