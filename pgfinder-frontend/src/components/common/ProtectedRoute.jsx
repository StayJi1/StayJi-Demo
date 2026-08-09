import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Loader from './Loader'

function ProtectedRoute({ children }) {
  const { authReady, isAuthenticated } = useAuth()
  if (!authReady) {
    return <div className="min-h-screen bg-slate-950 p-6 text-white"><Loader message="Restoring your session..." /></div>
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default ProtectedRoute
