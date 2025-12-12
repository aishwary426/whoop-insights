'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Bot, User, History, Plus, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
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

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
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
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadUserData()
      loadChatHistory()
      createNewChat()
    }
  }, [user])

  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      saveChatToHistory()
    }
  }, [messages, currentChatId])

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

  const getStorageKey = () => {
    return user ? `zenith_chat_history_${user.id}` : 'zenith_chat_history'
  }

  const loadChatHistory = () => {
    try {
      const stored = localStorage.getItem(getStorageKey())
      if (stored) {
        const history = JSON.parse(stored).map((chat: any) => ({
          ...chat,
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
        }))
        setChatHistory(history)
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const saveChatToHistory = () => {
    if (!currentChatId || messages.length === 0) return

    // Only save to history if there's at least one user message
    const firstUserMessage = messages.find(m => m.role === 'user')
    if (!firstUserMessage) return

    try {
      const title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')

      const chatSession: ChatSession = {
        id: currentChatId,
        title,
        messages,
        createdAt: chatHistory.find(c => c.id === currentChatId)?.createdAt || new Date(),
        updatedAt: new Date(),
      }

      const updatedHistory = [
        chatSession,
        ...chatHistory.filter(c => c.id !== currentChatId),
      ].slice(0, 50) // Keep last 50 chats

      setChatHistory(updatedHistory)
      localStorage.setItem(getStorageKey(), JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Failed to save chat history:', error)
    }
  }

  const createNewChat = () => {
    const newChatId = `chat_${Date.now()}`
    setCurrentChatId(newChatId)
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm Zenith, your AI Performance Coach. I'm here to help you optimize your strain, sleep, recovery, and HRV based on your WHOOP data. What would you like to know?",
        timestamp: new Date(),
      },
    ])
  }

  const loadChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages)
      setShowHistory(false)
    }
  }

  const deleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updatedHistory = chatHistory.filter(c => c.id !== chatId)
    setChatHistory(updatedHistory)
    localStorage.setItem(getStorageKey(), JSON.stringify(updatedHistory))
    
    if (currentChatId === chatId) {
      createNewChat()
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

  const toggleSidebar = () => {
    // Check if mobile
    if (window.innerWidth < 640) {
      setShowHistory(!showHistory)
    } else {
      setIsSidebarOpen(!isSidebarOpen)
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

  const SidebarContent = () => (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chat History</h2>
        <button
          onClick={() => setShowHistory(false)}
          className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
      <button
        onClick={createNewChat}
        className="m-4 px-4 py-2.5 rounded-xl bg-gradient-to-br from-neon-light to-blue-600 dark:from-neon-primary dark:to-green-500 text-white dark:text-black font-medium flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-neon-light/20 dark:shadow-neon-primary/20"
      >
        <Plus className="w-4 h-4 text-white dark:text-black" />
        <span className="truncate">New Chat</span>
      </button>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {chatHistory.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No chat history yet
          </p>
        ) : (
          <div className="space-y-2">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                onClick={() => loadChat(chat.id)}
                className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  currentChatId === chat.id
                    ? 'bg-neon-light/10 dark:bg-neon-primary/10 border border-neon-light/30 dark:border-neon-primary/30'
                    : 'bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate pr-8">
                  {chat.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(chat.updatedAt).toLocaleDateString()}
                </p>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
                  title="Delete chat"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <AppLayout user={user}>
      <div className="flex h-screen pt-20 overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-[#0a0a0a] dark:to-[#0f0f0f]">
        
        {/* Desktop Sidebar */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="hidden sm:flex flex-col border-r border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-[#0f0f0f]/50 backdrop-blur-xl overflow-hidden whitespace-nowrap"
            >
              <SidebarContent />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Sidebar Drawer */}
        <AnimatePresence>
          {showHistory && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40 sm:hidden"
              />
              <motion.div
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed left-0 top-20 bottom-0 w-80 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 z-50 shadow-2xl overflow-hidden flex flex-col sm:hidden"
              >
                <SidebarContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Header */}
          <div className="flex-shrink-0 py-4 px-6 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between bg-white/30 dark:bg-[#0a0a0a]/30 backdrop-blur-md z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <PanelLeftOpen className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <div>
                <h1 className="text-xl font-bold text-neon-light dark:text-neon-primary tracking-tight">
                  ZENITH
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-widest uppercase hidden sm:block">
                  Your personal coach
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Additional header actions can go here */}
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex flex-col gap-2 mb-6 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-3xl px-6 py-4 shadow-lg transition-all duration-200 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-neon-light to-blue-600 dark:from-neon-primary dark:to-green-500 text-white rounded-br-md shadow-neon-light/30 dark:shadow-neon-primary/30'
                        : 'bg-white/80 dark:bg-[#1a1a1a]/90 backdrop-blur-sm text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200/50 dark:border-gray-800/50 shadow-gray-200/50 dark:shadow-black/50'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="text-[15px] leading-[1.7] text-gray-900 dark:text-gray-100 text-left [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-700 pb-2">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-lg font-bold mt-5 mb-2.5 text-gray-900 dark:text-gray-100">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-base font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-sm font-semibold mt-3 mb-1.5 text-gray-900 dark:text-gray-100">
                                {children}
                              </h4>
                            ),
                            p: ({ children }) => (
                              <p className="my-3 text-gray-900 dark:text-gray-100 leading-[1.7]">
                                {children}
                              </p>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-gray-900 dark:text-gray-100">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-gray-900 dark:text-gray-100">
                                {children}
                              </em>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-outside my-3 space-y-1.5 text-gray-900 dark:text-gray-100 ml-5 pl-1">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-outside my-3 space-y-1.5 text-gray-900 dark:text-gray-100 ml-5 pl-1">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-gray-900 dark:text-gray-100 leading-relaxed pl-1">
                                {children}
                              </li>
                            ),
                            code: ({ children, className, ...props }) => {
                              const isInline = !className
                              return isInline ? (
                                <code className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs text-gray-900 dark:text-gray-100 font-mono break-words" {...props}>
                                  {children}
                                </code>
                              ) : (
                                <code className="block bg-gray-200 dark:bg-gray-800 p-3 rounded-lg text-xs text-gray-900 dark:text-gray-100 font-mono overflow-x-auto my-3" {...props}>
                                  {children}
                                </code>
                              )
                            },
                            pre: ({ children }) => (
                              <pre className="bg-gray-200 dark:bg-gray-800 p-3 rounded-lg text-xs text-gray-900 dark:text-gray-100 font-mono overflow-x-auto my-3">
                                {children}
                              </pre>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-neon-light dark:border-neon-primary pl-4 my-3 italic text-gray-900 dark:text-gray-100 bg-neon-light/10 dark:bg-neon-primary/5 py-2 rounded-r">
                                {children}
                              </blockquote>
                            ),
                            a: ({ href, children }) => (
                              <a 
                                href={href} 
                                className="text-neon-light dark:text-neon-primary underline hover:opacity-80 font-medium" 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                            hr: () => (
                              <hr className="my-4 border-0 border-t border-gray-300 dark:border-gray-700" />
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-4">
                                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-700">
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
                              <tr className="border-b border-gray-300 dark:border-gray-700">
                                {children}
                              </tr>
                            ),
                            th: ({ children }) => (
                              <th className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100">
                                {children}
                              </td>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                    <p className="text-[15px] leading-[1.7] whitespace-pre-wrap text-white dark:text-black text-left">{message.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {sending && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex justify-start mb-6"
              >
                <div className="bg-white/80 dark:bg-[#1a1a1a]/90 backdrop-blur-sm rounded-3xl rounded-bl-md px-6 py-4 border border-gray-200/50 dark:border-gray-800/50 shadow-lg shadow-gray-200/50 dark:shadow-black/50">
                  <Loader2 className="w-5 h-5 animate-spin text-neon-light dark:text-neon-primary" />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-xl px-4 md:px-8 py-6">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-4 items-end w-full max-w-6xl mx-auto">
              <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                  placeholder="Ask anything"
                  className="w-full px-5 py-4 pr-14 rounded-2xl bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-light/30 dark:focus:ring-neon-primary/30 focus:border-neon-light dark:focus:border-neon-primary resize-none overflow-hidden break-words shadow-lg shadow-gray-200/30 dark:shadow-black/30 transition-all duration-200"
                rows={1}
                  style={{ minHeight: '60px', maxHeight: '200px', wordWrap: 'break-word', overflowWrap: 'break-word' }}
                disabled={sending}
              />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-neon-light to-blue-600 dark:from-neon-primary dark:to-green-500 hover:from-neon-light/90 hover:to-blue-500 dark:hover:from-neon-primary/90 dark:hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg shadow-neon-light/30 dark:shadow-neon-primary/30 hover:shadow-xl hover:shadow-neon-light/40 dark:hover:shadow-neon-primary/40 hover:scale-105 active:scale-95"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
