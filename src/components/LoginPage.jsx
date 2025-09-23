import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react"
import { FcGoogle } from "react-icons/fc" // Google logo
import { FaLinkedin } from "react-icons/fa" // LinkedIn logo
import toast from "react-hot-toast"

function LoginPage({ onLogin }) {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    // Basic validation
    if (!formData.email.includes("@")) {
      toast.error("Enter a valid email address")
      setLoading(false)
      return
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    // Simulate API login
    setTimeout(() => {
      setLoading(false)
      onLogin({ email: formData.email, name: "John Doe" })
      toast.success("Login successful 🎉")
      navigate("/dashboard")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-[#161B22] rounded-2xl shadow-2xl p-8 border border-slate-600">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-[#443C22] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-[#FBBF24]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">AI Job Coach</h1>
            <div>
              <p className="text-slate-300">Sign in to your account</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#808E8F] mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#0D1117] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#FBBF24] focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#808E8F] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#0D1117] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#FBBF24] focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#FBBF24] bg-slate-600 border-slate-500 rounded focus:ring-[#FBBF24] focus:ring-2"
                />
                <span className="ml-2 text-sm text-slate-300">Remember me</span>
              </label>
              <Link to="#" className="text-sm text-[#FBBF24] hover:text-yellow-300 transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-6">
            <p className="text-center text-slate-400 mb-3">Or continue with</p>
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-900 py-2 rounded-lg font-medium hover:bg-slate-200 transition">
                <FcGoogle size={20} /> Google
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                <FaLinkedin size={20} /> LinkedIn
              </button>
            </div>
          </div>

          {/* Sign up link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#FBBF24] hover:text-yellow-300 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
