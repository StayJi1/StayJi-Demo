import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function RoleProtectedRoute({ children, role }) {
  const { user, role: userRole, isAuthenticated } = useAuth()
  const rawRole = (userRole || user?.role || user?.userType || '').toString().toLowerCase()
  const currentRole = ['owner', 'host', 'hostel'].includes(rawRole)
    ? 'vendor'
    : ['personal', 'student'].includes(rawRole)
      ? 'user'
      : rawRole

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (currentRole !== role) {
    return <Navigate to="/" replace />
  }
  return children
}

export default RoleProtectedRoute
