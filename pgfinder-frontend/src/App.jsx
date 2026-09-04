import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'
import ScrollManager from './components/common/ScrollManager'
import ChatAssistant from './components/common/ChatAssistant'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollManager />
        <AppRoutes />
        <ChatAssistant />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
