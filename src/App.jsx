import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useContext } from "react"
import LoginPage from "./components/LoginPage"
import SignupPage from "./components/SignupPage"
import Dashboard from "./components/Dashboard"
import { AuthProvider } from "./context/authContext"
import AuthContext from "./context/authContext"
import { Toaster } from "react-hot-toast";
// Create a component that uses the auth context
function AppRoutes() {
  const { user, loading } = useContext(AuthContext)

  // Show loading screen while Firebase determines auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/signup"
          element={!user ? <SignupPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App