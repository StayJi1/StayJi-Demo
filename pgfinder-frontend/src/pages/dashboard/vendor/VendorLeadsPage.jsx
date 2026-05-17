import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiMail, FiPhone, FiUser, FiUsers, FiCalendar, FiBookmark } from 'react-icons/fi'
import Button from '../../../components/common/Button'
import Card from '../../../components/common/Card'
import dashboardService from '../../../services/dashboardService'
import { useAuth } from '../../../context/AuthContext'

function VendorLeadsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [leads, setLeads] = useState({ visits: [], inquiries: [], shortlists: [], totalLeads: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadLeads = async () => {
      try {
        if (!user?._id) return
        const data = await dashboardService.getVendorLeads(user._id)
        setLeads(data)
      } catch (err) {
        console.error(err)
        setError('Unable to load your leads. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    loadLeads()
  }, [user?._id])

  return (
    <div className="space-y-8">
      <header className="rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-8 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-accent-400">Vendor leads</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Student leads and visit requests</h1>
            <p className="mt-3 max-w-3xl text-slate-400">Review every student who expressed interest or requested a visit for your properties.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => navigate('/dashboard/vendor')}>Back to dashboard</Button>
            <Button onClick={() => navigate('/dashboard/vendor/properties')}>My properties</Button>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-4">
        <Card className="p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Total leads</p>
          <p className="mt-4 text-5xl font-semibold text-white">{loading ? '…' : leads.totalLeads}</p>
          <p className="mt-4 text-sm text-slate-400">Includes visit requests, inquiries, and wishlist saves.</p>
        </Card>
        <Card className="p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Visit requests</p>
          <p className="mt-4 text-5xl font-semibold text-white">{loading ? '…' : leads.visits.length}</p>
          <p className="mt-4 text-sm text-slate-400">Students who scheduled a property visit.</p>
        </Card>
        <Card className="p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Interest messages</p>
          <p className="mt-4 text-5xl font-semibold text-white">{loading ? '…' : leads.inquiries.length}</p>
          <p className="mt-4 text-sm text-slate-400">Students who expressed interest in your properties.</p>
        </Card>
        <Card className="p-8">
          <p className="text-sm uppercase tracking-[0.24em] text-accent-400">Wishlist saves</p>
          <p className="mt-4 text-5xl font-semibold text-white">{loading ? '…' : leads.shortlists.length}</p>
          <p className="mt-4 text-sm text-slate-400">Students who added your property to their wishlist.</p>
        </Card>
      </div>

      {error ? (
        <Card className="p-8 text-center text-rose-300">{error}</Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
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
                        <p className="text-lg font-semibold text-white">{visit.visituser?.userFname || visit.visituser?.userName || 'Unknown student'} {visit.visituser?.userLname || ''}</p>
                        <p className="text-sm text-slate-400">{visit.visituser?.contact || visit.visituser?.userEmail || 'No contact available'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Visit date</p>
                        <p className="mt-2 font-semibold text-white">{visit.visitDate ? new Date(visit.visitDate).toLocaleString() : 'TBD'}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No visit requests yet.</p>
              )}
            </div>
          </Card>

          <Card>
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
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No interest messages yet.</p>
              )}
            </div>
          </Card>
          <Card>
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
                  <div key={`${save._id || save.id}-${save.propertyIDFK?._id || save.propertyIDFK?.id}`} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Student</p>
                        <p className="text-lg font-semibold text-white">{save.userIDFK?.userFname || 'Unknown'} {save.userIDFK?.userLname || ''}</p>
                        <p className="text-sm text-slate-400">{save.userIDFK?.contact || save.userIDFK?.userEmail || 'No contact available'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Property</p>
                        <p className="mt-2 font-semibold text-white">{save.propertyIDFK?.propertyName || 'Unknown property'}</p>
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

export default VendorLeadsPage
