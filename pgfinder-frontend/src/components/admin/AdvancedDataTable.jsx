import { useMemo, useState } from 'react'
import { FiChevronDown, FiChevronUp, FiDownload, FiSearch } from 'react-icons/fi'

const pageSizeOptions = [10, 20, 50, 100]

const valueText = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(valueText).join(' ')
  return Object.values(value).map(valueText).join(' ')
}

const escapeCsv = (value) => `"${valueText(value).replace(/"/g, '""')}"`

function AdvancedDataTable({
  title,
  eyebrow = 'Operations table',
  rows = [],
  columns = [],
  rowId = (row) => row.id || row._id,
  searchPlaceholder = 'Search records',
  initialSort,
  actions,
  onRowClick,
  emptyMessage = 'No records found.',
  loading = false,
  minWidth = '980px',
}) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState(initialSort || { key: columns[0]?.key, direction: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState([])

  const searchableRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filtered = needle
      ? rows.filter((row) => columns.some((column) => valueText(column.searchValue ? column.searchValue(row) : column.value?.(row)).toLowerCase().includes(needle)))
      : rows
    return [...filtered].sort((a, b) => {
      const column = columns.find((item) => item.key === sort.key)
      if (!column || column.sortable === false) return 0
      const aValue = column.sortValue ? column.sortValue(a) : column.value?.(a)
      const bValue = column.sortValue ? column.sortValue(b) : column.value?.(b)
      const result = valueText(aValue).localeCompare(valueText(bValue), undefined, { numeric: true, sensitivity: 'base' })
      return sort.direction === 'desc' ? -result : result
    })
  }, [columns, query, rows, sort])

  const totalPages = Math.max(1, Math.ceil(searchableRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const visibleRows = searchableRows.slice((safePage - 1) * pageSize, safePage * pageSize)
  const allVisibleSelected = visibleRows.length && visibleRows.every((row) => selected.includes(rowId(row)))

  const toggleSort = (column) => {
    if (column.sortable === false) return
    setSort((current) => ({
      key: column.key,
      direction: current.key === column.key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const toggleRow = (id) => {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const toggleVisible = () => {
    const visibleIds = visibleRows.map(rowId)
    setSelected((current) => (
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    ))
  }

  const exportCsv = () => {
    const headers = ['S.No', ...columns.map((column) => column.label)]
    const body = searchableRows.map((row, index) => [
      index + 1,
      ...columns.map((column) => column.exportValue ? column.exportValue(row) : column.value?.(row)),
    ])
    const csv = [headers, ...body].map((line) => line.map(escapeCsv).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(title || 'stayji-table').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-slate-800/80 bg-surface-800/90 shadow-card sm:rounded-[2rem]">
      <div className="flex min-w-0 flex-col gap-4 border-b border-slate-800 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.12em] text-accent-400 sm:tracking-[0.2em]">{eyebrow}</p>
          <h2 className="mt-2 break-words text-xl font-semibold text-white sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{searchableRows.length} records · {selected.length} selected</p>
        </div>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 text-slate-300 sm:min-w-[280px] sm:rounded-3xl">
            <FiSearch />
            <input
              type="search"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1) }}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent py-3 text-sm text-slate-100 outline-none"
            />
          </label>
          <button type="button" onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200 hover:border-accent-500 sm:rounded-3xl">
            <FiDownload /> CSV
          </button>
        </div>
      </div>

      {actions ? <div className="border-b border-slate-800 p-4 sm:p-5">{actions({ selected, setSelected, visibleRows, allRows: searchableRows })}</div> : null}

      <div className="grid gap-3 p-4 sm:hidden">
        {visibleRows.map((row, index) => {
          const id = rowId(row)
          return (
            <article key={id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <label className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                  <input type="checkbox" checked={selected.includes(id)} onChange={() => toggleRow(id)} />
                  #{(safePage - 1) * pageSize + index + 1}
                </label>
                {onRowClick ? (
                  <button type="button" onClick={() => onRowClick(row)} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200">
                    Open
                  </button>
                ) : null}
              </div>
              <dl className="mt-3 grid gap-3">
                {columns.map((column) => (
                  <div key={column.key} className="min-w-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{column.label}</dt>
                    <dd className="mt-1 break-words text-sm leading-6 text-slate-200">
                      {column.render ? column.render(row, { onRowClick }) : valueText(column.value?.(row))}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          )
        })}
        {!visibleRows.length ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-8 text-center text-sm text-slate-400">
            {loading ? 'Loading records...' : emptyMessage}
          </p>
        ) : null}
      </div>

      <div className="hidden max-w-full overflow-x-auto overscroll-x-contain sm:block">
        <table className="w-full divide-y divide-slate-800 text-left text-sm" style={{ minWidth }}>
          <thead className="sticky top-0 z-10 bg-slate-950 text-xs uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="w-12 px-4 py-4"><input type="checkbox" checked={Boolean(allVisibleSelected)} onChange={toggleVisible} /></th>
              <th className="w-20 px-4 py-4">S.No</th>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-4">
                  <button type="button" onClick={() => toggleSort(column)} className="inline-flex items-center gap-1 text-left">
                    {column.label}
                    {sort.key === column.key ? (sort.direction === 'asc' ? <FiChevronUp /> : <FiChevronDown />) : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {visibleRows.map((row, index) => {
              const id = rowId(row)
              return (
                <tr key={id} className="hover:bg-slate-900/70">
                  <td className="px-4 py-4"><input type="checkbox" checked={selected.includes(id)} onChange={() => toggleRow(id)} /></td>
                  <td className="px-4 py-4 text-slate-500">{(safePage - 1) * pageSize + index + 1}</td>
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-4 align-top">
                      {column.render ? column.render(row, { onRowClick }) : valueText(column.value?.(row))}
                    </td>
                  ))}
                </tr>
              )
            })}
            {!visibleRows.length ? (
              <tr><td className="px-5 py-10 text-center text-slate-400" colSpan={columns.length + 2}>{loading ? 'Loading records...' : emptyMessage}</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-800 p-4 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <span>Page {safePage} of {totalPages}</span>
        <div className="flex flex-wrap items-center gap-2">
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }} className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
            {pageSizeOptions.map((size) => <option key={size} value={size}>{size} rows</option>)}
          </select>
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-2xl border border-slate-700 px-4 py-2 disabled:opacity-40" disabled={safePage === 1}>Prev</button>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-2xl border border-slate-700 px-4 py-2 disabled:opacity-40" disabled={safePage === totalPages}>Next</button>
        </div>
      </div>
    </section>
  )
}

export default AdvancedDataTable
