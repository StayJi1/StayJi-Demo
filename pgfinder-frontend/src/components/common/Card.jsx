function Card({ children, className = '', ...props }) {
  return <div {...props} className={`min-w-0 rounded-2xl border border-slate-800/80 bg-surface-800/90 p-4 shadow-card sm:rounded-[2rem] sm:p-6 ${className}`}>{children}</div>
}

export default Card
