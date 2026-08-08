import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import adApi from '../../api/adApi'

function AdSlot({ placement = 'both', className = '' }) {
  const { data: ads = [] } = useQuery({
    queryKey: ['public-ads', placement],
    queryFn: () => adApi.active(placement),
    staleTime: 60_000,
  })
  if (!ads.length) return null

  return (
    <div className={`space-y-4 ${className}`} aria-label="Sponsored listings">
      {ads.map((ad) => (
        <AdCard key={ad._id || ad.id || `${ad.title}-${ad.agencyName}`} ad={ad} />
      ))}
    </div>
  )
}

function AdCard({ ad }) {
  useEffect(() => {
    if (ad._id || ad.id) adApi.impression(ad._id || ad.id)
  }, [ad._id, ad.id])

  return (
    <section className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-slate-950 text-white shadow-xl">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Sponsored</p>
            <p className="mt-1 text-xs text-slate-400">{ad.agencyName}</p>
          </div>
          {ad.imageUrl ? <div className="flex h-36 w-full items-center justify-center overflow-hidden bg-slate-900 sm:h-40"><img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-contain" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none' }} /></div> : null}
          <div className="p-4">
            <h2 className="font-semibold text-white">{ad.title}</h2>
            {ad.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{ad.description}</p> : null}
            {ad.targetUrl ? <a href={ad.targetUrl} target="_blank" rel="noreferrer" onClick={() => adApi.click(ad._id || ad.id)} className="mt-4 inline-flex rounded-full bg-cyan-300 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-200">Learn more</a> : null}
          </div>
    </section>
  )
}

export default AdSlot
