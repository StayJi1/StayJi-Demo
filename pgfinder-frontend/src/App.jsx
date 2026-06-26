import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'
import ScrollManager from './components/common/ScrollManager'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollManager />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
