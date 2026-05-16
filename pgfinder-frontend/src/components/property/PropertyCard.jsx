import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { FiHeart, FiMapPin, FiStar } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import propertyService from '../../services/propertyService'

function PropertyCard({ property }) {
  const { user, isAuthenticated } = useAuth()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleShortlist = async () => {
    if (!isAuthenticated || !user?._id) {
      alert('Please login to add this PG to your wishlist.')
      return
    }

    setSaving(true)
    try {
      await propertyService.shortlistProperty({ userIDFK: user._id, propertyIDFK: property._id || property.id })
      setSaved(true)
    } catch {
      alert('Unable to add this PG to your wishlist.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.article
      layout
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className="group overflow-hidden rounded-[2rem] border border-slate-800/70 bg-slate-950/90 shadow-card"
    >
      <div className="relative overflow-hidden">
        <div className="absolute right-4 top-4 z-20 rounded-full bg-slate-950/70 px-3 py-2 text-xs font-semibold text-white backdrop-blur-xl">
          {property.status || 'Verified'}
        </div>
        <img
          src={property.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80'}
          alt={property.name}
          className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent-500">{property.type || 'PG / Hostel'}</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{property.name}</h3>
          </div>
          <button
            type="button"
            onClick={handleShortlist}
            disabled={saving}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-3xl shadow-soft transition ${
              saved ? 'bg-rose-500 text-white' : 'bg-slate-900 text-slate-200 hover:text-rose-300'
            }`}
            aria-label="Add to wishlist"
          >
            <FiHeart />
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <FiMapPin className="h-4 w-4" />
          <span>{property.locationLabel || property.city}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <span className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">{property.gender || 'Co-ed'}</span>
          <span className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">{property.rent ? `₹${property.rent}/mo` : '₹8,500'}</span>
          <span className="rounded-3xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300">{property.foodIncluded ? 'Food included' : 'No food'}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-slate-300">
          <div className="inline-flex items-center gap-2 text-sm">
            <FiStar className="text-amber-400" />
            {property.rating || 4.8}
          </div>
          <Link
            to={`/properties/${property.id || property._id || 'detail'}`}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-brand-400"
          >
            View details
          </Link>
        </div>
      </div>
    </motion.article>
  )
}

export default PropertyCard
