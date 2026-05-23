import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function RoleProtectedRoute({ children, role }) {
  const { user, role: userRole, isAuthenticated } = useAuth()
  const rawRole = (userRole || user?.role || user?.userType || '').toString().toLowerCase()
  const currentRole = ['owner', 'host', 'hostel', 'vendor'].includes(rawRole)
    ? 'owner'
    : ['personal', 'student'].includes(rawRole)
      ? 'user'
      : ['super admin', 'super_admin', 'superadmin'].includes(rawRole)
        ? 'super-admin'
        : rawRole

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  const allowedRoles = Array.isArray(role) ? role : [role]
  const effectiveRoles = currentRole === 'super-admin'
    ? Array.from(new Set([...allowedRoles, 'admin', 'super-admin']))
    : allowedRoles
  if (!effectiveRoles.includes(currentRole) && !(currentRole === 'super-admin' && allowedRoles.includes('admin'))) {
    return <Navigate to="/" replace />
  }
  return children
}

export default RoleProtectedRoute
