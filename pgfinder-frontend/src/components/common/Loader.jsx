function Loader({ message = 'Loading…' }) {
  return (
    <div className="min-h-[240px] rounded-[2rem] border border-white/10 bg-white/10 p-6 text-slate-300 shadow-soft backdrop-blur-2xl">
      <div className="grid gap-4">
        <div className="h-44 animate-pulse rounded-[1.5rem] bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-700/80" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-800/90" />
        <p className="pt-2 text-sm text-slate-300">{message}</p>
      </div>
    </div>
  )
}

export default Loader
