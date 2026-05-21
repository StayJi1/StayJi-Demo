import { useState } from 'react'
import { Link } from 'react-router-dom'

function SeoContentCard({ item, to, eyebrow }) {
  const [open, setOpen] = useState(false)
  const summary = item.summary || item.description || item.answer || ''

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p> : null}
      <h3 className="mt-2 text-lg font-semibold text-slate-950">{item.title || item.question}</h3>
      <p className={`${open ? '' : 'line-clamp-3'} mt-3 text-sm leading-6 text-slate-600`}>{summary}</p>
      {open ? (
        <div className="mt-3 text-sm leading-6 text-slate-600">
          {(item.highlights || []).slice(0, 3).map((point) => <p key={point} className="mt-2">{point}</p>)}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setOpen((current) => !current)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
          {open ? 'Show Less' : 'Preview'}
        </button>
        <Link to={to} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Read More</Link>
      </div>
    </article>
  )
}

export default SeoContentCard
