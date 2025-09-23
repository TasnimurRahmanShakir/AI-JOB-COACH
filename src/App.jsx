import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useState } from "react"
import LoginPage from "./components/LoginPage"
import SignupPage from "./components/SignupPage"
import Dashboard from "./components/Dashboard"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-900">
        <Routes>
          <Route
            path="/login"
            element={!isAuthenticated ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/signup"
            element={!isAuthenticated ? <SignupPage onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
            }
          />
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
