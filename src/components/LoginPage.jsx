import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import toast from "react-hot-toast";
import AuthContext from "../context/authContext";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signInUser, googleSignIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!formData.email.includes("@")) {
      toast.error("Enter a valid email address");
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    let loginSuccessful = false;

    try {
      // Sign in with Firebase
      const result = await signInUser(formData.email, formData.password);

      // Check if login was successful
      if (result && (result.user || result.uid)) {
        loginSuccessful = true;
        toast.success("Login successful! 🎉");
        navigate("/dashboard");
      } else {
        throw new Error("Login failed - no user returned");
      }
    } catch (error) {
      // Only show error if login was not successful
      if (!loginSuccessful) {
        console.error("Login error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);

        // Handle specific Firebase errors
        const errorCode = error.code || error.message;

        if (errorCode.includes('user-not-found') || errorCode.includes('invalid-credential')) {
          toast.error("No account found with this email or invalid credentials.");
        } else if (errorCode.includes('wrong-password') || errorCode.includes('invalid-password')) {
          toast.error("Incorrect password. Please try again.");
        } else if (errorCode.includes('invalid-email')) {
          toast.error("Please enter a valid email address.");
        } else if (errorCode.includes('user-disabled')) {
          toast.error("This account has been disabled.");
        } else if (errorCode.includes('too-many-requests')) {
          toast.error("Too many failed attempts. Please try again later.");
        } else if (errorCode.includes('network-request-failed')) {
          toast.error("Network error. Please check your connection.");
        } else {
          // Fallback error message
          toast.error("Invalid credentials or user does not exist");
        }
      }
    } finally {
      // Ensure loading is always set to false
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    let loginSuccessful = false;

    try {
      const result = await googleSignIn();

      if (result && (result.user || result.uid)) {
        loginSuccessful = true;
        toast.success("Google login successful! 🎉");
        navigate("/dashboard");
      } else {
        throw new Error("Google login failed - no user returned");
      }
    } catch (error) {
      if (!loginSuccessful) {
        console.error("Google login error:", error);
        const errorCode = error.code || error.message;

        if (errorCode.includes('popup-closed-by-user')) {
          toast.error("Google login was cancelled.");
        } else if (errorCode.includes('account-exists-with-different-credential')) {
          toast.error("An account already exists with this email using a different sign-in method.");
        } else if (errorCode.includes('network-request-failed')) {
          toast.error("Network error. Please check your connection.");
        } else {
          toast.error("Google login failed. Please try again.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-[#161B22] rounded-2xl shadow-2xl p-8 border border-slate-600">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-[#443C22] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-[#FBBF24]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">AI Job Coach</h1>
            <p className="text-slate-300">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#808E8F] mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-[#0D1117] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#FBBF24] focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#808E8F] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-[#0D1117] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#FBBF24] focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors disabled:opacity-50"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  disabled={loading}
                  className="w-4 h-4 text-[#FBBF24] bg-slate-600 border-slate-500 rounded focus:ring-[#FBBF24] focus:ring-2 disabled:opacity-50"
                />
                <span className="ml-2 text-sm text-slate-300">Remember me</span>
              </label>
              <Link
                to="#"
                className="text-sm text-[#FBBF24] hover:text-yellow-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-70 disabled:transform-none cursor-pointer"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-center text-slate-400 mb-3">Or continue with</p>
            <div className="flex gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-900 py-2 rounded-lg font-medium hover:bg-slate-200 transition disabled:opacity-50 cursor-pointer"
              >
                <FcGoogle size={20} /> Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-[#FBBF24] hover:text-yellow-300 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;