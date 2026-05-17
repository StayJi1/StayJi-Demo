function Button({ children, className = '', variant = 'primary', type = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-3xl px-5 py-3 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-60'
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-glow hover:-translate-y-0.5 hover:shadow-blue-500/25',
    secondary: 'border border-white/20 bg-white/10 text-white backdrop-blur-xl hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-white/15',
    ghost: 'bg-transparent text-slate-200 hover:text-white',
  }
  return (
    <button type={type} className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button
