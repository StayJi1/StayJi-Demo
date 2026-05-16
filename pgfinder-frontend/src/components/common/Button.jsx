function Button({ children, className = '', variant = 'primary', type = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-3xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent-400/50'
  const variants = {
    primary: 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-glow hover:opacity-95',
    secondary: 'border border-slate-700 bg-slate-900/90 text-slate-100 hover:border-accent-500',
    ghost: 'bg-transparent text-slate-200 hover:text-white',
  }
  return (
    <button type={type} className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button
