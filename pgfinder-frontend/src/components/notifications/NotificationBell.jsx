import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBell } from 'react-icons/fi'
import notificationApi from '../../api/notificationApi'
import { useAuth } from '../../context/AuthContext'

function NotificationBell() {
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const { user, role, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const userId = user?._id || user?.id
  const enabled = Boolean(isAuthenticated && userId)

  const loadNotifications = useCallback(async () => {
    if (!enabled) return
    try {
      const data = await notificationApi.list({ userId, role })
      setItems(data.items || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      setItems([])
      setUnreadCount(0)
    }
  }, [enabled, role, userId])

  useEffect(() => {
    if (!enabled) return undefined
    window.setTimeout(loadNotifications, 0)
    const timer = window.setInterval(loadNotifications, 15000)
    return () => window.clearInterval(timer)
  }, [enabled, loadNotifications])

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const visibleItems = useMemo(() => items.slice(0, 8), [items])

  if (!enabled) return null

  const handleOpenNotification = async (notification) => {
    if (!notification.readAt) {
      await notificationApi.markRead(notification._id)
    }
    setOpen(false)
    loadNotifications()
    navigate(notification.link || '/')
  }

  const handleMarkAllRead = async () => {
    await notificationApi.markAllRead({ userId, role })
    loadNotifications()
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 text-slate-200 transition hover:border-cyan-300 hover:text-white"
        aria-label="Notifications"
      >
        <FiBell />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[11px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-[min(92vw,24rem)] overflow-hidden rounded-2xl border border-slate-800 bg-surface-900 shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-4">
            <p className="text-sm font-semibold text-white">Notifications</p>
            <button type="button" onClick={handleMarkAllRead} className="text-xs font-semibold text-accent-400 hover:text-accent-300">
              Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {visibleItems.length ? visibleItems.map((notification) => (
              <button
                key={notification._id}
                type="button"
                onClick={() => handleOpenNotification(notification)}
                className="block w-full border-b border-slate-800/70 p-4 text-left transition hover:bg-slate-800/70"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.readAt ? 'bg-slate-700' : 'bg-accent-500'}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{notification.title}</span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-400">{notification.message}</span>
                    <span className="mt-2 block text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      {notification.addedOn ? new Date(notification.addedOn).toLocaleString() : 'Now'}
                    </span>
                  </span>
                </div>
              </button>
            )) : (
              <p className="p-5 text-sm text-slate-400">No notifications yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default NotificationBell
