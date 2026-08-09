import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Loader from './Loader'

function RoleProtectedRoute({ children, role }) {
  const { authReady, user, role: userRole, isAuthenticated } = useAuth()
  const rawRole = (userRole || user?.role || user?.userType || '').toString().toLowerCase()
  const currentRole = ['owner', 'host', 'hostel', 'vendor'].includes(rawRole)
    ? 'owner'
    : ['personal', 'student'].includes(rawRole)
      ? 'user'
      : rawRole

  if (!authReady) {
    return <div className="min-h-screen bg-slate-950 p-6 text-white"><Loader message="Restoring your session..." /></div>
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  const allowedRoles = Array.isArray(role) ? role : [role]
  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to="/" replace />
  }
  return children
}

export default RoleProtectedRoute
