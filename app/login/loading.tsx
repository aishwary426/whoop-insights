export default function LoginLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bgDark flex items-center justify-center">
      <div className="relative z-10 text-center">
        <div className="w-14 h-14 border-4 border-blue-600/15 dark:border-neon-primary/15 border-t-blue-600 dark:border-t-neon-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60 text-sm">Loading login page...</p>
      </div>
    </div>
  )
}

