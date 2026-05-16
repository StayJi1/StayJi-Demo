function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm shadow-slate-200 ring-1 ring-slate-200">
      {children}
    </span>
  )
}

export default function PGCard({ home, saved, onToggleSave }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-72 overflow-hidden bg-slate-100 sm:h-80">
        <img
          src={home.image}
          alt={home.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex flex-wrap gap-2 p-4">
          {home.foodIncluded && <Badge>Food Included</Badge>}
          <Badge>{home.sharing}</Badge>
          <Badge>{home.gender}</Badge>
        </div>
      </div>
      <div className="space-y-5 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{home.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{home.location}</p>
          </div>
          <button
            type="button"
            onClick={() => onToggleSave(home.id)}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
              saved ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600'
            }`}
            aria-label={saved ? 'Remove from shortlist' : 'Save to shortlist'}
          >
            <span className="text-lg">{saved ? '♥' : '♡'}</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
            <span className="text-slate-400">👥</span>
            {home.availableRooms} rooms
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
            <span className="text-slate-400">⭐</span>
            {home.rating} rating
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-500">{home.distance} km from campus</span>
        </div>
        <p className="text-sm leading-6 text-slate-600">{home.description}</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold text-slate-900">₹{home.rent}</p>
            <p className="text-sm text-slate-500">per month / {home.gender.toLowerCase()}</p>
          </div>
          <button className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700">
            Contact Owner
          </button>
        </div>
      </div>
    </article>
  )
}
