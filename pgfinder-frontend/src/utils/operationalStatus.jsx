import { FiArchive, FiCheckCircle, FiClock, FiEye, FiEyeOff, FiShield, FiSlash } from 'react-icons/fi'

export const statusDefinitions = {
  LIVE: {
    label: 'LIVE',
    title: 'LIVE properties are publicly searchable and counted in real analytics.',
    className: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
    icon: FiEye,
  },
  DEMO: {
    label: 'DEMO',
    title: 'DEMO properties are sample inventory used before official city launch.',
    className: 'border-amber-500/50 bg-amber-500/10 text-amber-200',
    icon: FiShield,
  },
  HIDDEN: {
    label: 'HIDDEN',
    title: 'Hidden properties are not publicly visible.',
    className: 'border-slate-500/50 bg-slate-500/10 text-slate-200',
    icon: FiEyeOff,
  },
  PENDING: {
    label: 'PENDING',
    title: 'Pending properties need admin review before they go live.',
    className: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-200',
    icon: FiClock,
  },
  VERIFIED: {
    label: 'VERIFIED',
    title: 'Verified properties have passed admin checks.',
    className: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200',
    icon: FiCheckCircle,
  },
  SUSPENDED: {
    label: 'SUSPENDED',
    title: 'Suspended properties are blocked from public discovery.',
    className: 'border-rose-500/50 bg-rose-500/10 text-rose-200',
    icon: FiSlash,
  },
  ARCHIVED: {
    label: 'ARCHIVED',
    title: 'Archived properties are removed from active operations.',
    className: 'border-zinc-500/50 bg-zinc-500/10 text-zinc-200',
    icon: FiArchive,
  },
}

export function getOperationalStatus(property = {}) {
  if (property.operationalStatus) return property.operationalStatus
  if (property.status === 'archived') return 'ARCHIVED'
  if (property.status === 'suspended' || property.approvalStatus === 'Suspended') return 'SUSPENDED'
  if (property.isActive === false) return 'HIDDEN'
  if (property.isDummy) return 'DEMO'
  if (property.isVerified || property.approvalStatus === 'Verified') return 'VERIFIED'
  if (property.approvalStatus === 'Approved') return 'LIVE'
  return 'PENDING'
}

export function StatusChip({ status, title }) {
  const definition = statusDefinitions[status] || statusDefinitions.PENDING
  const Icon = definition.icon
  return (
    <span title={title || definition.title} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${definition.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {definition.label}
    </span>
  )
}

export function FieldNote({ children }) {
  return <p className="mt-1 text-xs text-slate-500">{children}</p>
}
