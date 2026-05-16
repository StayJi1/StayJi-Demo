function Loader({ message = 'Loading…' }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-800/70 bg-slate-950/80 p-8 text-center text-slate-300 shadow-soft">
      <div>
        <div className="mb-4 inline-flex h-14 w-14 animate-spin items-center justify-center rounded-full border-4 border-slate-700 border-t-accent-400" />
        <p className="text-sm text-slate-300">{message}</p>
      </div>
    </div>
  )
}

export default Loader
