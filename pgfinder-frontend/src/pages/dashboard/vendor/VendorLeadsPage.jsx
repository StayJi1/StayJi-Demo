import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiMail, FiCalendar, FiBookmark } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import dashboardService from '../../../services/dashboardService'
import { useAuth } from '../../../context/AuthContext'

function OwnerLeadsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const selectedPropertyId = searchParams.get('propertyId')
  const [leads, setLeads] = useState({ visits: [], inquiries: [], shortlists: [], totalLeads: 0, shortlistCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const markConverted = async (type, id) => {
    try {
      await dashboardService.markLeadConverted({ type, id })
      setLeads((current) => ({
        ...current,
        visits: type === 'visit' ? current.visits.map((item) => ((item._id || item.id) === id ? { ...item, isConverted: true, leadStage: 'converted' } : item)) : current.visits,
        inquiries: type === 'inquiry' ? current.inquiries.map((item) => ((item._id || item.id) === id ? { ...item, isConverted: true, leadStage: 'converted' } : item)) : current.inquiries,
      }))
    } catch (err) {
      setError(err?.message || 'Unable to mark lead converted.')
    }
  }
  const updateVisit = async (id, payload) => {
    try {
      const updated = await dashboardService.updateVisit(id, payload)
      setLeads((current) => ({
        ...current,
        visits: current.visits.map((item) => ((item._id || item.id) === id ? { ...item, ...updated } : item)),
      }))
    } catch (err) {
      setError(err?.message || 'Unable to update visit.')
    }
  }

  const rescheduleVisit = async (visit) => {
    const currentDate = visit.visitDate ? new Date(visit.visitDate).toISOString().slice(0, 10) : ''
    const visitDate = window.prompt('New visit date (YYYY-MM-DD)', currentDate)
    if (!visitDate) return
    const visitTime = window.prompt('New visit time', visit.visitTime && visit.visitTime !== '-' ? visit.visitTime : '')
    await updateVisit(visit._id || visit.id, { action: 'approve', visitDate, visitTime: visitTime || '-' })
  }

  useEffect(() => {
    const loadLeads = async () => {
      try {
        if (!user?._id) return
        const data = await dashboardService.getOwnerLeads(user._id)
        if (selectedPropertyId) {
          const matchesProperty = (item) => {
            const propertyId = item.propertyIDFK?._id || item.propertyIDFK || item.property?._id || item.propertyId || item.property?.id
            return propertyId?.toString() === selectedPropertyId
          }
          setLeads({
            ...data,
            visits: data.visits.filter(matchesProperty),
            inquiries: data.inquiries.filter(matchesProperty),
            shortlists: data.shortlists.filter(matchesProperty),
            totalLeads: data.visits.filter(matchesProperty).length + data.inquiries.filter(matchesProperty).length,
            shortlistCount: data.shortlists.filter(matchesProperty).reduce((sum, item) => sum + (Number(item.wishlistCount) || 0), 0),
          })
        } else {
          setLeads(data)
        }
      } catch {
        setError('Unable to load your leads. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    loadLeads()
  }, [selectedPropertyId, user?._id])

  return (
    <div className="space-y-8">
      <header className="rounded-[1.5rem] border border-slate-800/80 bg-surface-800/90 p-5 shadow-card sm:rounded-[2rem] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Owner leads</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Student leads and visit requests</h1>
            <p className="mt-3 max-w-3xl text-slate-400">Review every student who expressed interest or requested a visit for your properties.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => navigate('/dashboard/owner')}>Back to dashboard</Button>
            <Button onClick={() => navigate('/dashboard/owner/properties')}>My properties</Button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-4">
        {[
          { label: 'Total leads', value: leads.totalLeads, note: 'Qualified leads only: visits and owner-contact requests.', target: 'owner-lead-visits' },
          { label: 'Visit requests', value: leads.visits.length, note: 'Students who scheduled a property visit.', target: 'owner-lead-visits' },
          { label: 'Interest messages', value: leads.inquiries.length, note: 'Students who expressed interest in your properties.', target: 'owner-lead-interest' },
          { label: 'Wishlist saves', value: leads.shortlistCount, note: 'Analytics only. User phone numbers stay private at this stage.', target: 'owner-lead-wishlist' },
        ].map((item) => (
          <button key={item.label} type="button" onClick={() => document.getElementById(item.target)?.scrollIntoView({ behavior: 'smooth' })} className="text-left">
            <Card className="h-full p-8 transition hover:border-accent-500">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-400">{item.label}</p>
              <p className="mt-4 text-5xl font-semibold text-white">{loading ? '...' : item.value}</p>
              <p className="mt-4 text-sm text-slate-400">{item.note}</p>
            </Card>
          </button>
        ))}
      </div>

      {error ? (
        <Card className="p-8 text-center text-rose-300">{error}</Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card id="owner-lead-visits">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Visit requests</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Recent visit leads</h2>
              </div>
              <FiCalendar className="h-8 w-8 text-accent-400" />
            </div>
            <div className="mt-6 space-y-4">
              {loading ? (
                <p className="text-slate-400">Loading visit requests…</p>
              ) : leads.visits.length ? (
                leads.visits.map((visit) => (
                  <div key={`${visit._id || visit.id}-${visit.visitDate || ''}`} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Student</p>
                        <p className="text-lg font-semibold text-white">{visit.visituser?.userFname || visit.user?.userFname || visit.visituser?.userName || visit.user?.name || 'Unknown student'} {visit.visituser?.userLname || visit.user?.userLname || ''}</p>
                        <p className="text-sm text-slate-400">{visit.visituser?.contact || visit.user?.contact || visit.visituser?.userEmail || visit.user?.email || 'No contact available'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Visit date</p>
                        <p className="mt-2 font-semibold text-white">{visit.visitDate ? new Date(visit.visitDate).toLocaleString() : 'TBD'}</p>
                        <p className="mt-1 text-sm text-slate-400">Move-in: {visit.moveInPreference || 'Not shared'}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">Status: {visit.statusLabel || visit.status || 'Pending'}</p>
                    <button type="button" onClick={() => markConverted('visit', visit._id || visit.id)} className="mt-4 rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/10">
                      {visit.isConverted ? 'Converted' : 'Mark converted'}
                    </button>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => updateVisit(visit._id || visit.id, { action: 'approve' })} className="rounded-full border border-cyan-500/60 px-3 py-2 text-xs text-cyan-200">Approve visit</button>
                      <button type="button" onClick={() => updateVisit(visit._id || visit.id, { action: 'reject' })} className="rounded-full border border-rose-500/60 px-3 py-2 text-xs text-rose-200">Reject visit</button>
                      <button type="button" onClick={() => rescheduleVisit(visit)} className="rounded-full border border-amber-500/60 px-3 py-2 text-xs text-amber-100">Reschedule</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No visit requests yet.</p>
              )}
            </div>
          </Card>

          <Card id="owner-lead-interest">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Interest leads</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Recent student interest</h2>
              </div>
              <FiMail className="h-8 w-8 text-accent-400" />
            </div>
            <div className="mt-6 space-y-4">
              {loading ? (
                <p className="text-slate-400">Loading interest leads…</p>
              ) : leads.inquiries.length ? (
                leads.inquiries.map((inquiry) => (
                  <div key={`${inquiry._id || inquiry.id}-${inquiry.subject || inquiry.addedOn}`} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Student</p>
                        <p className="text-lg font-semibold text-white">{inquiry.inquiryuser?.userFname || inquiry.inquiryuser?.userName || 'Unknown student'} {inquiry.inquiryuser?.userLname || ''}</p>
                        <p className="text-sm text-slate-400">{inquiry.inquiryuser?.contact || inquiry.inquiryuser?.userEmail || 'No contact available'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Property</p>
                        <p className="mt-2 font-semibold text-white">{inquiry.property?.propertyName || 'Unknown property'}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-slate-300">{inquiry.subject || 'Interested in this property'}</p>
                    <p className="mt-2 text-sm text-slate-400">Preferred visit: {inquiry.preferredVisitTime || 'Not shared'} • Move-in: {inquiry.moveInPreference || 'Not shared'}</p>
                    <button type="button" onClick={() => markConverted('inquiry', inquiry._id || inquiry.id)} className="mt-4 rounded-full border border-emerald-500/60 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/10">
                      {inquiry.isConverted ? 'Converted' : 'Mark converted'}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No interest messages yet.</p>
              )}
            </div>
          </Card>
          <Card id="owner-lead-wishlist">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Wishlist leads</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Recent wishlist activity</h2>
              </div>
              <FiBookmark className="h-8 w-8 text-accent-400" />
            </div>
            <div className="mt-6 space-y-4">
              {loading ? (
                <p className="text-slate-400">Loading wishlist saves…</p>
              ) : leads.shortlists.length ? (
                leads.shortlists.map((save) => (
                  <div key={`${save.propertyId || save.property?._id}`} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Wishlist analytics</p>
                        <p className="text-lg font-semibold text-white">{save.wishlistCount || 0} users shortlisted</p>
                        <p className="text-sm text-slate-400">Contact details unlock only after callback, visit, chat, or owner-contact.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Property</p>
                        <p className="mt-2 font-semibold text-white">{save.property?.propertyName || 'Unknown property'}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No wishlist saves yet.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default OwnerLeadsPage
