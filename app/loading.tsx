export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-bgDark">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-blue-600/15 dark:border-neon-primary/15 border-t-blue-600 dark:border-t-neon-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-white/60 text-sm">Loading...</p>
      </div>
    </div>
  )
}

