import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowUpRight, FiMessageCircle, FiMessageSquare, FiSend, FiStar, FiX } from 'react-icons/fi'
import axiosClient from '../../api/axiosClient'
import { useAuth } from '../../context/AuthContext'

const quickPrompts = [
  'Hi',
  'Find PG near Whitefield',
  'Girls PG under 12k',
  'Need support',
]

const buildFallbackReply = (input) => {
  const message = (input || '').toLowerCase()

  if (!message || /(hi|hello|hey|good morning|good evening|namaste)/.test(message)) {
    return 'Hi! I am StayJi Assistant. I can help you find PGs, hostels, and flats in Bangalore and guide you toward the right area and budget.'
  }

  if (/(budget|under|rent|price|cheap|affordable)/.test(message)) {
    return 'Tell me your preferred area and budget, and I can suggest suitable PGs or flat options to check first.'
  }

  if (/(boys|girls|unisex|male|female|gender)/.test(message)) {
    return 'I can help narrow results by gender. Share the area and your budget, and I will point you to the most relevant options.'
  }

  if (/(pg|hostel|flat|room|property|stay)/.test(message)) {
    return 'I can help you search for PGs, hostels, and flats in Bangalore. Try asking for a locality such as Whitefield, HSR, Electronic City, or your preferred budget.'
  }

  if (/(support|human|agent|talk to someone|need help|contact)/.test(message)) {
    return 'For support, please use the normal StayJi support flow: login or sign up first, then use the in-app chat or messages area. If you are already a user, owner, or admin, the app will guide you to the correct dashboard after login.'
  }

  if (/(thank|thanks)/.test(message)) {
    return 'You are welcome! I can help with PG searches, nearby stays, and quick property guidance.'
  }

  return 'I can help with PG searches, locality suggestions, budget filters, and general StayJi guidance. Try asking for a budget, area, or gender preference.'
}

const authGuidance = {
  message: 'Please sign in or create an account before using the assistant for support, property help, or direct chat follow-ups.',
  steps: [
    'Students / tenants: go to Login and sign in with your user account.',
    'Owners / vendors: go to Sign up and select Owner, then create your property account.',
    'Admin access: use Admin Login for dashboard-only access.',
  ],
  actions: [
    { label: 'Login', to: '/login' },
    { label: 'User signup', to: '/signup' },
    { label: 'Owner signup', to: '/signup?role=owner' },
    { label: 'Admin login', to: '/admin-login' },
  ],
}

const extractAssistantReply = (payload) => {
  const directResponse = payload?.data?.response || payload?.response || payload?.data?.reply || payload?.reply
  if (typeof directResponse === 'string' && directResponse.trim()) {
    return directResponse
  }

  if (typeof payload?.msg === 'string' && payload.msg.trim()) {
    return payload.msg
  }

  if (Array.isArray(payload?.data?.propertyMatches) && payload.data.propertyMatches.length) {
    return payload.data.propertyMatches
      .slice(0, 3)
      .map((property) => `${property.name || 'Property'} in ${property.area || property.city || 'Bangalore'} · ₹${property.rent || 'N/A'}`)
      .join('\n')
  }

  return 'I am ready to help you find the right stay.'
}

function ChatAssistant() {
  const { isAuthenticated, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I am StayJi Assistant. Ask me for PGs, prices, localities, or help getting started.',
    },
  ])

  const addAuthHelp = (reason = 'You need to sign in to continue.') => {
    const authMessage = {
      id: `${Date.now()}-auth-guide`,
      role: 'assistant',
      text: `${reason} ${authGuidance.message}`,
      steps: authGuidance.steps,
      actions: authGuidance.actions,
    }
    setMessages((current) => [...current, authMessage])
  }
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const promptText = useMemo(
    () => (user?.name ? `Hi ${user.name.split(' ')[0]}!` : 'Hi!'),
    [user?.name],
  )

  const sendMessage = async (messageText) => {
    const trimmed = (messageText || '').trim()
    if (!trimmed) return

    const userMessage = { id: `${Date.now()}-user`, role: 'user', text: trimmed }
    setMessages((current) => [...current, userMessage])
    setInput('')

    if (!isAuthenticated) {
      const authReason = /(support|human|agent|talk to someone|need help|contact)/.test(trimmed.toLowerCase())
        ? 'For support and human help, please sign in first.'
        : 'Please log in to use the AI assistant.'
      addAuthHelp(authReason)
      return
    }

    setIsSending(true)

    try {
      const response = await axiosClient.post('/api/ai/chat', { message: trimmed })
      const reply = extractAssistantReply(response?.data)
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-assistant`, role: 'assistant', text: reply },
      ])
    } catch (error) {
      const replySource = error?.response?.data || error?.response || {}
      const fallbackReply = extractAssistantReply(replySource)
      const finalReply = fallbackReply && fallbackReply !== 'I am ready to help you find the right stay.'
        ? fallbackReply
        : buildFallbackReply(trimmed)

      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-assistant`, role: 'assistant', text: finalReply },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <div
        className={`w-[min(92vw,22rem)] overflow-hidden rounded-[1.5rem] border border-slate-700/80 bg-slate-950/95 shadow-2xl backdrop-blur-xl transition-all duration-300 ${isOpen ? 'max-h-[32rem] opacity-100 translate-y-0' : 'pointer-events-none max-h-0 opacity-0 translate-y-4'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-cyan-500/90 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <FiMessageCircle className="text-lg" />
            </div>
            <div>
              <p className="text-sm font-semibold">StayJi Assistant</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-100/80">Online</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
            aria-label="Close chat"
          >
            <FiX />
          </button>
        </div>

        <div className="flex max-h-[23rem] flex-col gap-3 overflow-y-auto bg-slate-950/80 p-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${message.role === 'user'
                ? 'ml-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                : 'mr-auto border border-slate-800 bg-slate-900 text-slate-100'
                }`}
            >
              <div>{message.text}</div>
              {message.steps?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">
                  {message.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              ) : null}
              {message.actions?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.actions.map((action) => (
                    <Link
                      key={action.to}
                      to={action.to}
                      className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-400/25"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="border-t border-slate-800 bg-slate-950/95 p-3">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={isSending}
                className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage(input)
            }}
            className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={isAuthenticated ? 'Ask about PGs, budgets, or localities...' : 'Sign in to chat with the assistant'}
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              disabled={isSending || !isAuthenticated}
            />
            <button
              type="submit"
              disabled={isSending || !input.trim() || !isAuthenticated}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send message"
            >
              <FiSend />
            </button>
          </form>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-xl text-slate-950 shadow-2xl transition hover:scale-105"
        aria-label="Open StayJi assistant"
      >
        {isOpen ? <FiX /> : <FiMessageSquare />}
      </button>

    </div>
  )
}

export default ChatAssistant
