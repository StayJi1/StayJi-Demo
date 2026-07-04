function Input({ label, className = '', error, ...props }) {
  return (
    <label className={`block text-sm text-slate-200 ${className}`}>
      {label ? <span className="mb-2 inline-block text-slate-300">{label}</span> : null}
      <input
        className="w-full rounded-3xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      {error ? <span className="mt-2 block text-xs text-rose-300">{error}</span> : null}
    </label>
  )
}

export default Input
