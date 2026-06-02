import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiMessageSquare, FiSend } from 'react-icons/fi'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import dashboardService from '../../services/dashboardService'
import { useAuth } from '../../context/AuthContext'

const personName = (person = {}) => person.name || [person.userFname, person.userLname].filter(Boolean).join(' ') || person.userEmail || 'StayJi user'
const propertyName = (property = {}) => property.propertyName || property.name || 'Property conversation'

function MessagesPage() {
  const { role } = useAuth()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(searchParams.get('conversationId') || '')
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const normalizedRole = role === 'owner' ? 'owner' : 'user'
  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId || item._id === activeId),
    [activeId, conversations],
  )

  const loadConversations = async (nextActiveId = activeId) => {
    setError('')
    const data = await dashboardService.chats(nextActiveId ? { conversationId: nextActiveId } : {})
    const nextConversations = data.conversations || []
    setConversations(nextConversations)
    const resolvedActiveId = nextActiveId || nextConversations[0]?.id || nextConversations[0]?._id || ''
    setActiveId(resolvedActiveId)
    if (resolvedActiveId && (!nextActiveId || resolvedActiveId !== nextActiveId)) {
      const activeData = await dashboardService.chats({ conversationId: resolvedActiveId })
      setConversations(activeData.conversations || nextConversations)
      setMessages(activeData.messages || [])
    } else {
      setMessages(data.messages || [])
    }
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        await loadConversations(searchParams.get('conversationId') || '')
      } catch (err) {
        if (active) setError(err?.message || 'Unable to load messages.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    const timer = window.setInterval(() => {
      loadConversations(activeId).catch(() => {})
    }, 15000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const openConversation = async (conversationId) => {
    setActiveId(conversationId)
    try {
      await loadConversations(conversationId)
    } catch (err) {
      setError(err?.message || 'Unable to open this conversation.')
    }
  }

  const sendMessage = async (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !activeConversation) return
    setSending(true)
    setError('')
    try {
      const payload = normalizedRole === 'owner'
        ? { conversationId: activeConversation.id || activeConversation._id, message: text }
        : { propertyId: activeConversation.propertyId?._id || activeConversation.propertyId, message: text }
      const result = await dashboardService.sendChat(payload)
      setDraft('')
      setMessages((current) => [...current, result.message].filter(Boolean))
      await loadConversations(activeConversation.id || activeConversation._id)
    } catch (err) {
      setError(err?.message || 'Unable to send message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-[1.5rem] border border-slate-800/80 bg-surface-800/90 p-5 shadow-card sm:rounded-[2rem] sm:p-8">
        <div className="flex items-center gap-3">
          <FiMessageSquare className="text-accent-400" />
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Messages</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{normalizedRole === 'owner' ? 'Reply to users' : 'Talk to property owners'}</h1>
          </div>
        </div>
      </header>

      {error ? <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="p-0">
          <div className="border-b border-slate-800 p-4">
            <p className="text-sm font-semibold text-white">{conversations.reduce((sum, item) => sum + Number(normalizedRole === 'owner' ? item.unreadByOwner : item.unreadByUser || 0), 0)} unread</p>
          </div>
          <div className="max-h-[620px] overflow-y-auto">
            {loading ? <p className="p-4 text-sm text-slate-400">Loading conversations...</p> : null}
            {conversations.map((conversation) => {
              const id = conversation.id || conversation._id
              const unread = Number(normalizedRole === 'owner' ? conversation.unreadByOwner : conversation.unreadByUser) || 0
              const otherPerson = normalizedRole === 'owner' ? conversation.userId : conversation.ownerId
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => openConversation(id)}
                  className={`block w-full border-b border-slate-800 p-4 text-left transition hover:bg-slate-900/70 ${activeId === id ? 'bg-slate-900/80' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{personName(otherPerson)}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{propertyName(conversation.propertyId)}</p>
                    </div>
                    {unread ? <span className="rounded-full bg-accent-500 px-2 py-1 text-xs font-semibold text-slate-950">{unread}</span> : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-400">{conversation.lastMessagePreview || 'No messages yet.'}</p>
                </button>
              )
            })}
            {!loading && !conversations.length ? <p className="p-4 text-sm text-slate-400">No conversations yet.</p> : null}
          </div>
        </Card>

        <Card className="flex min-h-[620px] flex-col p-0">
          {activeConversation ? (
            <>
              <div className="border-b border-slate-800 p-5">
                <p className="text-sm uppercase tracking-[0.2em] text-accent-400">{propertyName(activeConversation.propertyId)}</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{personName(normalizedRole === 'owner' ? activeConversation.userId : activeConversation.ownerId)}</h2>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {messages.map((message) => {
                  const mine = message.senderRole === normalizedRole
                  return (
                    <div key={message.id || message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${mine ? 'bg-accent-500 text-slate-950' : 'bg-slate-950 text-slate-200'}`}>
                        <p>{message.text}</p>
                        <p className={`mt-2 text-[11px] ${mine ? 'text-slate-800' : 'text-slate-500'}`}>{message.addedOn ? new Date(message.addedOn).toLocaleString() : ''}</p>
                      </div>
                    </div>
                  )
                })}
                {!messages.length ? <p className="text-sm text-slate-400">Start the conversation below.</p> : null}
              </div>
              <form onSubmit={sendMessage} className="grid gap-3 border-t border-slate-800 p-4 sm:grid-cols-[1fr_auto]">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={1000}
                  placeholder={normalizedRole === 'owner' ? 'Reply to this user' : 'Message the owner'}
                  className="rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none focus:border-accent-400"
                />
                <Button type="submit" disabled={!draft.trim() || sending}><FiSend /> Send</Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-400">
              Select a conversation to read and reply.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default MessagesPage
