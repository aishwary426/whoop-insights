'use client'

import HelloTypewriter from '../../components/ui/HelloTypewriter'

export default function TestTypewriterPage() {
  return (
    <div className="min-h-screen bg-black dark:bg-black flex items-center justify-center p-8">
      {/* Grid background pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 143, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 143, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Main content */}
      <div className="relative z-10 text-center">
        <div className="text-6xl md:text-8xl font-bold">
          <HelloTypewriter />
        </div>
      </div>
    </div>
  )
}




