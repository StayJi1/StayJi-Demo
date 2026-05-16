function SectionHeading({ title, description, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent-500">{title}</p>
      <p className="max-w-2xl text-3xl font-semibold text-white sm:text-4xl">{description}</p>
    </div>
  )
}

export default SectionHeading
