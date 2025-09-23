import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { FaLinkedin } from "react-icons/fa"
import toast from "react-hot-toast"

function SignupPage({ onLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Full name is required")
      return false
    }

    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      toast.error("Please enter a valid email address")
      return false
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      // Simulate API signup
      await new Promise((resolve) => setTimeout(resolve, 1500))

      onLogin({
        email: formData.email,
        name: formData.name,
        id: Date.now().toString(),
      })

      toast.success("Account created successfully! 🎉")
      navigate("/dashboard")
    } catch (error) {
      toast.error("Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider) => {
    toast.success(`Redirecting to ${provider} signup...`)
    // Implement actual social login logic here
  }

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-[#161B22] rounded-2xl shadow-2xl p-8 border border-gray-700">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-[#443C22] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-[#FBBF24]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-gray-400">Join AI Job Coach today</p>
          </div>
          {/* Header
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-gray-400">Join AI Job Coach today</p>
          </div> */}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#808E8F] mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#0D1117] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#FBBF24] focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#808E8F] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#0D1117] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#FBBF24] focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#808E8F] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-3 bg-[#0D1117] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#FBBF24] focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                  placeholder="Create a password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#808E8F] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-3 bg-[#0D1117] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#FBBF24] focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-[#FBBF24] hover:bg-yellow-500 text-slate-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Social Signup */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#161B22] text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSocialLogin("Google")}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-white text-gray-900 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <FcGoogle size={20} />
                <span>Google</span>
              </button>
              <button
                onClick={() => handleSocialLogin("LinkedIn")}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <FaLinkedin size={20} />
                <span>LinkedIn</span>
              </button>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Already have an account?{" "}
              <Link to="/login" className="text-[#FBBF24] hover:text-yellow-500 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
