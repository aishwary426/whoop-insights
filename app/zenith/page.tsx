'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import AppLayout from '../../components/layout/AppLayout'
import NeonCard from '../../components/ui/NeonCard'
import NeonButton from '../../components/ui/NeonButton'
import { getCurrentUser } from '../../lib/auth'
import { api, type DashboardSummary, type TrendsResponse } from '../../lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ZenithPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [userData, setUserData] = useState<{ summary: DashboardSummary | null; trends: TrendsResponse | null }>({
    summary: null,
    trends: null,
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadUserData()
      // Add welcome message
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: "Hello! I'm Zenith, your AI Performance Coach. I'm here to help you optimize your strain, sleep, recovery, and HRV based on your WHOOP data. What would you like to know?",
          timestamp: new Date(),
        },
      ])
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      if (messagesEndRef.current && messagesContainerRef.current) {
        // Scroll within the messages container, not the entire page
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }
    })
  }

  const checkUser = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
      setLoading(false)
    }
  }

  const loadUserData = async () => {
    try {
      const [summaryData, trendsData] = await Promise.all([
        api.getDashboardSummary().catch(() => null),
        api.getTrends().catch(() => null),
      ])
      setUserData({ summary: summaryData, trends: trendsData })
    } catch (error) {
      console.error('Failed to load user data:', error)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      const response = await api.zenithChat(userMessage.content, userData.summary, userData.trends)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message || 'Unable to process your request at this time. Please try again.'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = '48px'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }

  if (loading) {
    return (
      <AppLayout user={user}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-neon-primary" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout user={user}>
      <div className="relative min-h-screen pt-24 pb-20">
        <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-blue-600/10 dark:bg-neon-primary/10">
                <Sparkles className="w-6 h-6 text-blue-600 dark:text-neon-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-black">
                Zenith
              </h1>
            </div>
            <p className="text-black text-lg">
              Your AI Performance Coach for WHOOP data optimization
            </p>
          </motion.div>

          {/* Chat Container */}
          <NeonCard className="h-[calc(100vh-280px)] min-h-[600px] flex flex-col">
            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/10 dark:bg-neon-primary/10 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-blue-600 dark:text-neon-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 dark:bg-neon-primary text-black'
                          : 'bg-gray-100 dark:bg-gray-100 text-black'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="text-sm leading-relaxed text-black [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-xl font-bold mt-6 mb-3 text-black border-b border-gray-300 dark:border-gray-600 pb-2">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-lg font-bold mt-5 mb-2.5 text-black">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-base font-semibold mt-4 mb-2 text-black">
                                  {children}
                                </h3>
                              ),
                              h4: ({ children }) => (
                                <h4 className="text-sm font-semibold mt-3 mb-1.5 text-black">
                                  {children}
                                </h4>
                              ),
                              p: ({ children }) => (
                                <p className="my-3 text-black leading-relaxed text-sm">
                                  {children}
                                </p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-bold text-black">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-black">
                                  {children}
                                </em>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-outside my-3 space-y-2 text-black ml-4 pl-1">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-outside my-3 space-y-2 text-black ml-4 pl-1">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="text-black leading-relaxed text-sm pl-1">
                                  {children}
                                </li>
                              ),
                              code: ({ children, className, ...props }) => {
                                const isInline = !className
                                return isInline ? (
                                  <code className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs text-black font-mono break-words" {...props}>
                                    {children}
                                  </code>
                                ) : (
                                  <code className="block bg-gray-200 dark:bg-gray-800 p-3 rounded-lg text-xs text-black font-mono overflow-x-auto my-3" {...props}>
                                    {children}
                                  </code>
                                )
                              },
                              pre: ({ children }) => (
                                <pre className="bg-gray-200 dark:bg-gray-800 p-3 rounded-lg text-xs text-black font-mono overflow-x-auto my-3">
                                  {children}
                                </pre>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-blue-600 dark:border-neon-primary pl-4 my-3 italic text-black bg-blue-50 dark:bg-blue-950/20 py-2 rounded-r">
                                  {children}
                                </blockquote>
                              ),
                              a: ({ href, children }) => (
                                <a 
                                  href={href} 
                                  className="text-blue-600 dark:text-neon-primary underline hover:opacity-80 font-medium" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  {children}
                                </a>
                              ),
                              hr: () => (
                                <hr className="my-4 border-0 border-t border-gray-300 dark:border-gray-600" />
                              ),
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-4">
                                  <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                                    {children}
                                  </table>
                                </div>
                              ),
                              thead: ({ children }) => (
                                <thead className="bg-gray-100 dark:bg-gray-800">
                                  {children}
                                </thead>
                              ),
                              tbody: ({ children }) => (
                                <tbody>
                                  {children}
                                </tbody>
                              ),
                              tr: ({ children }) => (
                                <tr className="border-b border-gray-300 dark:border-gray-600">
                                  {children}
                                </tr>
                              ),
                              th: ({ children }) => (
                                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold text-black">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-black">
                                  {children}
                                </td>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-black">{message.content}</p>
                      )}
                      <p className="text-xs mt-2 opacity-60 text-black">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600 dark:text-white/60" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {sending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/10 dark:bg-neon-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-600 dark:text-neon-primary" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-100 rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-neon-primary" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 dark:border-white/10 p-4">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask me about your recovery, sleep, strain, HRV, or any performance questions..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-white placeholder-gray-500 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-600/50 dark:focus:ring-neon-primary/50 resize-none overflow-hidden"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  disabled={sending}
                />
                <NeonButton
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="px-6 py-3 flex-shrink-0"
                  variant="primary"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </NeonButton>
              </form>
              <p className="text-xs text-black mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </NeonCard>
        </div>
      </div>
    </AppLayout>
  )
}

