import { useCallback, useEffect, useState } from 'react'
import { FiBell } from 'react-icons/fi'
import notificationApi from '../../api/notificationApi'
import Button from '../../components/common/Button'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'

function NotificationsPage() {
  const { user, role } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const userId = user?._id || user?.id
  const label = role === 'admin' ? 'Admin' : role === 'owner' ? 'Owner' : 'User'

  const load = useCallback(async () => {
    if (!userId) return
    try {
      setLoading(true)
      const data = await notificationApi.list({ userId, role, limit: 50 })
      setItems(data.items || [])
    } catch (error) {
      setMessage(error?.message || 'Unable to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [role, userId])

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const markAllRead = async () => {
    await notificationApi.markAllRead({ userId, role })
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })))
  }

  return (
    <main className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm uppercase tracking-[0.2em] text-accent-400">Private inbox</p><h1 className="mt-2 text-3xl font-semibold text-white">{label} notifications</h1><p className="mt-2 text-slate-400">Only events relevant to your account and role appear here.</p></div>
        <Button variant="secondary" onClick={markAllRead}>Mark all read</Button>
      </div>
      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-800 bg-surface-900/70">
        {loading ? <div className="p-8"><Loader message="Loading notifications..." /></div> : items.length ? items.map((item) => (
          <article key={item._id} className={`border-b border-slate-800 p-5 last:border-0 ${item.readAt ? '' : 'bg-accent-500/5'}`}>
            <div className="flex gap-3"><FiBell className={item.readAt ? 'mt-1 text-slate-500' : 'mt-1 text-accent-400'} /><div><h2 className="font-semibold text-white">{item.title}</h2><p className="mt-1 text-sm text-slate-300">{item.message}</p><p className="mt-2 text-xs text-slate-500">{item.addedOn ? new Date(item.addedOn).toLocaleString() : 'Now'}</p></div></div>
          </article>
        )) : <p className="p-8 text-slate-400">No notifications for your account.</p>}
      </section>
      {message ? <p className="mt-4 text-sm text-rose-300">{message}</p> : null}
    </main>
  )
}

export default NotificationsPage
