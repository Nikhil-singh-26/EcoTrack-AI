import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import Insights from './pages/Insights'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Leaderboard from './pages/Leaderboard'
import Analytics from './pages/Analytics'
import SavingsSimulator from './pages/SavingsSimulator'
import UsageInsights from './pages/UsageInsights'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, loading, isAuthenticated } = useAuth()

  console.log("AUTH DEBUG:", {
    loading,
    isAuthenticated,
    user
  });

  // Wait for auth initialization
  if (loading || isAuthenticated === null) {
    return <div style={{ color: 'white', padding: '20px' }}>Loading EcoTrack AI...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
      />
      <Route 
        path="/register" 
        element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} 
      />
      
      {/* Protected Layout Routes */}
      {/* Root Layout - Always Rendered */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/login" replace />} />
        
        {/* Child Routes with Auth Checks */}
        <Route 
          path="dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="devices" 
          element={isAuthenticated ? <Devices /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="leaderboard" 
          element={isAuthenticated ? <Leaderboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="analytics" 
          element={isAuthenticated ? <Analytics /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="simulator" 
          element={isAuthenticated ? <SavingsSimulator /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="usage-insights" 
          element={isAuthenticated ? <UsageInsights /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="profile" 
          element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} 
        />
        {user?.role === 'admin' && (
          <Route 
            path="admin" 
            element={isAuthenticated ? <Admin /> : <Navigate to="/login" replace />} 
          />
        )}
      </Route>
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
console.log("API URL:", import.meta.env.VITE_API_URL);
