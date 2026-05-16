function Card({ children, className = '' }) {
  return <div className={`rounded-[2rem] border border-slate-800/80 bg-surface-800/90 p-6 shadow-card ${className}`}>{children}</div>
}

export default Card
