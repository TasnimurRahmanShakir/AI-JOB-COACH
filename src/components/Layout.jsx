import { Link, useLocation } from "react-router-dom"
import { } from "lucide-react"

function Layout({ children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-white">
                AI Job Coach
              </Link>
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${location.pathname === "/dashboard"
                    ? "border-teal-500 text-white"
                    : "border-transparent text-slate-300 hover:text-white"
                    }`}
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  )
}

export default Layout
