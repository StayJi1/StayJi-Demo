import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { FiHeart, FiMapPin, FiStar } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import propertyService from '../../services/propertyService'
import { formatDistance } from '../../utils/distance'

function PropertyCard({ property, saved: savedProp = false, onToggleSave, hideSave = false }) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [internalSaved, setInternalSaved] = useState(Boolean(savedProp))
  const [saving, setSaving] = useState(false)
  const saved = onToggleSave ? Boolean(savedProp) : internalSaved

  const propertyPath = `/properties/${property.id || property._id || 'detail'}`

  const openProperty = () => {
    sessionStorage.setItem('stayji-properties-scroll', String(window.scrollY || 0))
    navigate(propertyPath)
  }

  const handleShortlist = async (event) => {
    event.stopPropagation()
    if (!isAuthenticated || !user?._id) {
      navigate('/login', { replace: true })
      return
    }

    const propertyIDFK = property._id || property.id
    setSaving(true)
    try {
      if (onToggleSave) {
        await onToggleSave(propertyIDFK, !saved)
      } else {
        if (saved) {
          await propertyService.removeShortlistProperty({ userIDFK: user._id, propertyIDFK })
          setInternalSaved(false)
        } else {
          await propertyService.shortlistProperty({ userIDFK: user._id, propertyIDFK })
          setInternalSaved(true)
        }
      }
    } catch {
      alert('Unable to update this PG in your wishlist.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.article
      layout
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      role="button"
      tabIndex={0}
      onClick={openProperty}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') openProperty()
      }}
      className="group min-w-0 cursor-pointer overflow-hidden rounded-[1.5rem] border border-slate-800/70 bg-slate-950/90 shadow-card sm:rounded-[2rem]"
    >
      <div className="relative overflow-hidden">
        {property.displayBadges?.length ? (
          <div className="absolute left-4 top-4 z-20 flex max-w-[70%] flex-wrap gap-2">
            {property.displayBadges.map((badge) => (
              <span key={badge} className="rounded-full border border-amber-300/50 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-100 backdrop-blur-xl">
                {badge}
              </span>
            ))}
          </div>
        ) : null}
        <div className="absolute right-4 top-4 z-20 rounded-full bg-slate-950/70 px-3 py-2 text-xs font-semibold text-white backdrop-blur-xl">
          {property.availableBeds ? `${property.availableBeds} beds live` : property.vacancyStatus || property.status || 'Verified'}
        </div>
        <img
          src={property.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'}
          alt={property.name}
          loading="lazy"
          className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent-500">{property.category || property.type || 'PG'}</p>
            <h3 className="mt-2 line-clamp-2 text-xl font-semibold text-white">{property.name}</h3>
          </div>
          {hideSave ? null : (
            <button
              type="button"
              onClick={handleShortlist}
              disabled={saving}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-3xl shadow-soft transition ${
                saved ? 'bg-rose-500 text-white' : 'bg-slate-900 text-slate-200 hover:text-rose-300'
              }`}
              aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <FiHeart />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <FiMapPin className="h-4 w-4" />
          <span className="truncate">{property.locationLabel || property.city}</span>
          {property.distanceKm !== undefined ? <span>• {formatDistance(property.distanceKm)}</span> : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <span className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">{property.gender || 'Co-ed'}</span>
          <span className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">{property.rent ? `₹${property.rent}/mo` : '₹8,500'}</span>
          <span className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">{property.depositAmount ? `₹${property.depositAmount} deposit` : 'No deposit'}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <span className="rounded-3xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {property.vacancyStatus || (property.availableBeds ? `${property.availableBeds} beds available` : 'Live vacancy')}
          </span>
          <span className="rounded-3xl bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {property.sharingAvailability || property.sharing || 'Sharing options'}
          </span>
        </div>
        {property.perDayCheckIn ? (
          <p className="rounded-3xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Per-day check-in available{property.dailyRate ? ` at ₹${property.dailyRate}/day` : ''}
          </p>
        ) : null}
        {property.mealsAvailable?.length ? (
          <p className="rounded-3xl bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Food: {property.mealsAvailable.join(', ')}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3 text-slate-300">
          <div className="inline-flex items-center gap-2 text-sm">
            <FiStar className="text-amber-400" />
            {property.rating || 4.8}
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              openProperty()
            }}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-400"
          >
            View details
          </button>
        </div>
      </div>
    </motion.article>
  )
}

export default PropertyCard
