'use client'

import { useRef, useState } from 'react'
import { Download, Share2, X } from 'lucide-react'
import html2canvas from 'html2canvas'
import NeonButton from './ui/NeonButton'

interface SocialShareCardProps {
  recovery: number
  strain: number
  sleep: number
  hrv: number
  date: string
  onClose: () => void
}

export default function SocialShareCard({ recovery, strain, sleep, hrv, date, onClose }: SocialShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    if (!cardRef.current) return
    
    setIsGenerating(true)
    try {
      // Wait a bit for fonts to load/render
      await document.fonts.ready
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Retina quality
        backgroundColor: '#000000',
        useCORS: true,
        logging: false,
      })
      
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `whoop-insights-${date.replace(/\s+/g, '-').toLowerCase()}.png`
      link.click()
    } catch (err) {
      console.error('Failed to generate image:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  // Determine color based on recovery
  const getRecoveryColor = (score: number) => {
    if (score >= 67) return 'text-green-400 border-green-500/50 shadow-[0_0_30px_rgba(74,222,128,0.3)]'
    if (score >= 34) return 'text-yellow-400 border-yellow-500/50 shadow-[0_0_30px_rgba(250,204,21,0.3)]'
    return 'text-red-400 border-red-500/50 shadow-[0_0_30px_rgba(248,113,113,0.3)]'
  }

  const getRecoveryBg = (score: number) => {
    if (score >= 67) return 'bg-green-500/10'
    if (score >= 34) return 'bg-yellow-500/10'
    return 'bg-red-500/10'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header / Controls */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 size={18} className="text-neon-primary" />
            Share Your Stats
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview Area */}
        <div className="p-6 flex justify-center bg-[#050505]">
          {/* The Actual Card to Capture */}
          <div 
            ref={cardRef}
            className="w-[350px] aspect-[4/5] relative bg-black flex flex-col p-6 rounded-xl border border-white/10 overflow-hidden"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15), transparent 70%)'
            }}
          >
            {/* Branding */}
            <div className="flex justify-between items-center mb-8">
              <div className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">
                Whoop Insights
              </div>
              <div className="text-xs font-medium text-white/40">
                {date}
              </div>
            </div>

            {/* Main Stat: Recovery */}
            <div className="flex-1 flex flex-col items-center justify-center mb-8">
              <div className={`relative w-40 h-40 rounded-full flex items-center justify-center border-4 ${getRecoveryColor(recovery)} ${getRecoveryBg(recovery)}`}>
                <div className="text-center">
                  <div className="text-5xl font-black text-white tracking-tighter">
                    {Math.round(recovery)}<span className="text-2xl text-white/60">%</span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-white/60 mt-1">
                    Recovery
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Strain</div>
                <div className="text-xl font-bold text-white">{strain.toFixed(1)}</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">HRV</div>
                <div className="text-xl font-bold text-white">{Math.round(hrv)}</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Sleep</div>
                <div className="text-xl font-bold text-white">{sleep.toFixed(1)}h</div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neon-primary animate-pulse" />
                <span className="text-[10px] font-medium text-neon-primary uppercase tracking-wider">
                  AI Powered Analysis
                </span>
              </div>
              <div className="text-[10px] text-white/30">
                data-insights.cloud
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-[#0A0A0A]">
          <NeonButton 
            onClick={handleDownload} 
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>
                <Download size={18} />
                Download Image
              </>
            )}
          </NeonButton>
          <p className="text-center text-xs text-white/40 mt-3">
            Perfect for sharing on Reddit, Twitter, or Instagram Stories.
          </p>
        </div>
      </div>
    </div>
  )
}
