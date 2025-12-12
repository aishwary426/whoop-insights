'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
        if (this.props.fallback) {
            return this.props.fallback;
        }

      return (
        <div className="p-6 m-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-center">
            <div className="flex flex-col items-center gap-2">
                <AlertTriangle className="w-8 h-8"/>
                <h2 className="text-lg font-bold">Something went wrong</h2>
                <p className="text-sm opacity-80">{this.state.error?.message || 'An unexpected error occurred'}</p>
                <button 
                    onClick={() => this.setState({ hasError: false, error: null })}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
