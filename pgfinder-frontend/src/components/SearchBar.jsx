export default function SearchBar({ query, onChange, onSearch, suggestions }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-4 shadow-soft backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <label htmlFor="location" className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Search city or locality
          </label>
          <div className="mt-3 flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm focus-within:border-brand-500">
            <span className="text-slate-400">📍</span>
            <input
              id="location"
              value={query}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && onSearch()}
              placeholder="Try Bangalore, Koramangala, Whitefield or HSR Layout"
              className="w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="inline-flex h-14 items-center justify-center rounded-3xl bg-brand-600 px-6 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Find stays
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onChange(suggestion)}
            className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 transition hover:border-brand-300 hover:bg-white"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
