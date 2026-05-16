import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function RoleProtectedRoute({ children, role }) {
  const { user, role: userRole, isAuthenticated } = useAuth()
  const rawRole = (userRole || user?.userType || '').toString().toLowerCase()
  const currentRole = rawRole === 'owner' ? 'vendor' : rawRole

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (currentRole !== role) {
    return <Navigate to="/" replace />
  }
  return children
}

export default RoleProtectedRoute
