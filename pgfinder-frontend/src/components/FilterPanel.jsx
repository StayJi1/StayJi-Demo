const options = [
  { id: 'all', label: 'All students' },
  { id: 'boys', label: 'Boys' },
  { id: 'girls', label: 'Girls' },
]

export default function FilterPanel({ genderFilter, onGenderChange, foodOnly, onFoodToggle, count }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-soft backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Filter results</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">Find the right PG in minutes</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {count} listings ready for students with flexible sharing, meals, and safe neighborhoods.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-flow-col sm:auto-cols-max">
          <button
            type="button"
            onClick={onFoodToggle}
            className={`inline-flex items-center justify-center gap-2 rounded-3xl border px-4 py-3 text-sm font-semibold transition ${
              foodOnly ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <span>🍽️</span>
            Food Included
          </button>
          <div className="inline-flex overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => onGenderChange(option.id)}
                className={`px-4 py-3 text-sm font-semibold transition ${
                  genderFilter === option.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
