import { useState, useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { User, Lock, Mail, Eye, EyeOff, Loader2, Check, X } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import toast from "react-hot-toast"
import AuthContext from "../context/authContext"

function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { createUser, googleSignIn } = useContext(AuthContext)
  const navigate = useNavigate()

  // Password strength validation
  const validatePasswordStrength = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const strength = Object.values(requirements).filter(Boolean).length
    return { requirements, strength }
  }

  const passwordValidation = validatePasswordStrength(formData.password)

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

    // Strong password validation
    const { requirements, strength } = passwordValidation

    if (!requirements.length) {
      toast.error("Password must be at least 8 characters long")
      return false
    }

    if (!requirements.uppercase) {
      toast.error("Password must contain at least one uppercase letter")
      return false
    }

    if (!requirements.lowercase) {
      toast.error("Password must contain at least one lowercase letter")
      return false
    }

    if (!requirements.number) {
      toast.error("Password must contain at least one number")
      return false
    }

    if (!requirements.special) {
      toast.error("Password must contain at least one special character")
      return false
    }

    if (strength < 5) {
      toast.error("Please create a stronger password")
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

    let signupSuccessful = false

    try {
      console.log("Starting user creation process...")
      // Create user with Firebase
      const result = await createUser(formData.email, formData.password)
      console.log("User creation result:", result)

      // Check if user creation was actually successful
      if (result && result.user) {
        signupSuccessful = true
        console.log("User created successfully, updating profile...")

        try {
          // Update user profile with name
          await result.user.updateProfile({
            displayName: formData.name
          })
          console.log("Profile updated successfully")
        } catch (profileError) {
          console.warn("Profile update failed, but user was created:", profileError)
          // Don't treat profile update failure as signup failure
        }

        toast.success("Account created successfully! 🎉")
        navigate("/dashboard")
      } else {
        throw new Error("User creation failed - no user object returned")
      }
    } catch (error) {
      // Only show error if signup was not successful
      if (!signupSuccessful) {
        console.error("Signup error:", error)
        console.error("Error code:", error.code)
        console.error("Error message:", error.message)

        // Handle specific Firebase errors with updated error codes
        const errorCode = error.code || error.message

        if (errorCode.includes('email-already-in-use')) {
          toast.error("Email is already registered. Please use a different email.")
        } else if (errorCode.includes('weak-password')) {
          toast.error("Password is too weak. Please use a stronger password.")
        } else if (errorCode.includes('invalid-email')) {
          toast.error("Please enter a valid email address.")
        } else if (errorCode.includes('operation-not-allowed')) {
          toast.error("Email/password accounts are not enabled. Please contact support.")
        } else if (errorCode.includes('network-request-failed')) {
          toast.error("Network error. Please check your connection and try again.")
        } else if (errorCode.includes('too-many-requests')) {
          toast.error("Too many signup attempts. Please wait a moment and try again.")
        } else {
          // Only show fallback error if we have a meaningful error message
          if (error.message && error.message.trim() !== '') {
            toast.error(`Signup failed: ${error.message}`)
          } else {
            toast.error("Signup failed. Please check your information and try again.")
          }
        }
      }
    } finally {
      // Ensure loading is always set to false
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      console.log("Starting Google sign-in...")
      const result = await googleSignIn()
      console.log("Google sign-in result:", result)

      toast.success("Google signup successful! 🎉")
      navigate("/dashboard")
    } catch (error) {
      console.error("Google signup error:", error)
      console.error("Google error code:", error.code)
      console.error("Google error message:", error.message)

      const errorCode = error.code || error.message

      if (errorCode.includes('popup-closed-by-user')) {
        toast.error("Google signup was cancelled.")
      } else if (errorCode.includes('account-exists-with-different-credential')) {
        toast.error("An account already exists with this email using a different sign-in method.")
      } else if (errorCode.includes('popup-blocked')) {
        toast.error("Popup blocked. Please allow popups and try again.")
      } else if (errorCode.includes('network-request-failed')) {
        toast.error("Network error. Please check your connection.")
      } else if (errorCode.includes('unauthorized-domain')) {
        toast.error("This domain is not authorized for Google sign-in.")
      } else {
        // Fallback error message
        toast.error(`Google signup failed: ${error.message || 'Please try again.'}`)
      }
    } finally {
      // Ensure loading is always set to false
      setLoading(false)
    }
  }

  // Get password strength color and text
  const getPasswordStrengthInfo = () => {
    const { strength } = passwordValidation

    if (strength === 0) return { color: 'text-gray-400', text: 'Enter password', bgColor: 'bg-gray-600' }
    if (strength <= 2) return { color: 'text-red-400', text: 'Weak', bgColor: 'bg-red-500' }
    if (strength <= 3) return { color: 'text-yellow-400', text: 'Fair', bgColor: 'bg-yellow-500' }
    if (strength <= 4) return { color: 'text-blue-400', text: 'Good', bgColor: 'bg-blue-500' }
    return { color: 'text-green-400', text: 'Strong', bgColor: 'bg-green-500' }
  }

  const strengthInfo = getPasswordStrengthInfo()

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
                  placeholder="Create a strong password"
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

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Password strength:</span>
                    <span className={`text-sm font-medium ${strengthInfo.color}`}>
                      {strengthInfo.text}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${strengthInfo.bgColor}`}
                      style={{ width: `${(passwordValidation.strength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-400 mb-1">Password must contain:</p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className={`flex items-center gap-1 ${passwordValidation.requirements.length ? 'text-green-400' : 'text-red-400'}`}>
                      {passwordValidation.requirements.length ? <Check size={12} /> : <X size={12} />}
                      <span>At least 8 characters</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidation.requirements.uppercase ? 'text-green-400' : 'text-red-400'}`}>
                      {passwordValidation.requirements.uppercase ? <Check size={12} /> : <X size={12} />}
                      <span>One uppercase letter (A-Z)</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidation.requirements.lowercase ? 'text-green-400' : 'text-red-400'}`}>
                      {passwordValidation.requirements.lowercase ? <Check size={12} /> : <X size={12} />}
                      <span>One lowercase letter (a-z)</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidation.requirements.number ? 'text-green-400' : 'text-red-400'}`}>
                      {passwordValidation.requirements.number ? <Check size={12} /> : <X size={12} />}
                      <span>One number (0-9)</span>
                    </div>
                    <div className={`flex items-center gap-1 ${passwordValidation.requirements.special ? 'text-green-400' : 'text-red-400'}`}>
                      {passwordValidation.requirements.special ? <Check size={12} /> : <X size={12} />}
                      <span>One special character (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>
              )}
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

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className="mt-2">
                  <div className={`flex items-center gap-1 text-xs ${formData.password === formData.confirmPassword ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {formData.password === formData.confirmPassword ? <Check size={12} /> : <X size={12} />}
                    <span>
                      {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || passwordValidation.strength < 5 || formData.password !== formData.confirmPassword}
              className="w-full flex items-center justify-center bg-[#FBBF24] hover:bg-yellow-500 text-slate-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
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

            <div className="mt-4 grid grid-cols-1 gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-white text-gray-900 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <FcGoogle size={20} />
                <span>Google</span>
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