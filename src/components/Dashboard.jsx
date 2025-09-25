import {
  FileText,
  Video,
  BarChart3,
  ArrowRight,
  TrendingUp,
  Star,
  Target,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Calendar,
  Award,
  Mic,
  VideoIcon,
  Users

} from "lucide-react"
import { useState, useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import ResumeAnalysis from "./ResumeAnalysis"
import ProgressReports from "./ProgressReports"
import AuthContext from "../context/authContext"
import toast from "react-hot-toast"
import InterviewPrep from "./InterviewPrep"
import overlay from "../assets/overlay.png"
import Mentor from "./Mentor"

function Dashboard({ activeView = "Dashboard" }) {
  const { user, signOutUser, token } = useContext(AuthContext)
  const navigate = useNavigate()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [latestATSScore, setLatestATSScore] = useState(null)
  const [isLoadingScore, setIsLoadingScore] = useState(false)
  const [latestInterview, setLatestInterview] = useState(null)
  const [isLoadingInterview, setIsLoadingInterview] = useState(false)

  const sidebarItems = [
    { name: "Dashboard", icon: BarChart3, active: activeView === "Dashboard", path: "/dashboard" },
    { name: "Resume Analysis", icon: FileText, active: activeView === "Resume Analysis", path: "/resume-analysis" },
    { name: "Interview Prep", icon: Video, active: activeView === "Interview Prep", path: "/interview-prep" },
    { name: "Progress & Reports", icon: TrendingUp, active: activeView === "Progress & Reports", path: "/progress-reports" },
    { name: "Mentor Mode", icon: Users, active: activeView === "Mentor Mode", path: "/mentor" },
  ]

  const quickStartSteps = [
    {
      number: "1",
      title: "Upload Your Resume",
      description: "Get instant feedback on how to improve it.",
      color: "text-cyan-400",
    },
    {
      number: "2",
      title: "Start an Interview",
      description: "Practice with our AI to build confidence.",
      color: "text-cyan-400",
    },
    {
      number: "3",
      title: "Track Your Progress",
      description: "See your scores improve over time.",
      color: "text-cyan-400",
    },
  ]

  const mainFeatures = [
    {
      title: "Resume Analysis",
      description: "Get AI-powered feedback to optimize your resume and beat the applicant tracking systems.",
      icon: FileText,
      buttonText: "Analyze Now",
      bgColor: "bg-blue-600",
      path: "/resume-analysis",
    },
    {
      title: "Interview Prep",
      description: "Practice common interview questions with our AI simulator and get instant, personalized feedback.",
      icon: Video,
      buttonText: "Start Practicing",
      bgColor: "bg-blue-600",
      path: "/interview-prep",
    },
    {
      title: "Progress & Reports",
      description: "Track your improvement over time with detailed reports on your application performance.",
      icon: BarChart3,
      buttonText: "View Reports",
      bgColor: "bg-blue-600",
      path: "/progress-reports",
    },
  ]

  // Fetch latest ATS score
  useEffect(() => {
    if (!token) return

    const fetchLatestATSScore = async () => {
      setIsLoadingScore(true)
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ats-score/latest`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        })

        if (response.ok) {
          const data = await response.json()
          setLatestATSScore(data)
          console.log("Latest ATS score fetched:", data)
        } else if (response.status === 401) {
          console.error("Unauthorized access - token may be invalid")
          toast.error("Session expired. Please login again.")
        } else {
          console.log("No ATS score found or error fetching score:", response.status)
        }
      } catch (error) {
        console.error("Error fetching latest ATS score:", error)
        toast.error("Failed to load ATS score")
      } finally {
        setIsLoadingScore(false)
      }
    }

    fetchLatestATSScore()
  }, [token])

  // Fetch latest interview data
  useEffect(() => {
    if (!token) return

    const fetchLatestInterview = async () => {
      setIsLoadingInterview(true)
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/interview-analysis/latest`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        })

        if (response.ok) {
          const data = await response.json()
          setLatestInterview(data)
          console.log("Latest interview data fetched:", data)
        } else if (response.status === 401) {
          console.error("Unauthorized access - token may be invalid")
        } else {
          console.log("No interview data found:", response.status)
        }
      } catch (error) {
        console.error("Error fetching latest interview:", error)
      } finally {
        setIsLoadingInterview(false)
      }
    }

    fetchLatestInterview()
  }, [token])

  const handleLogout = async () => {
    try {
      await signOutUser()
      toast.success("Logged out successfully!")
      // Navigation is handled automatically by the AuthContext
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Error logging out. Please try again.")
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const handleNavigation = (path) => {
    navigate(path)
    if (window.innerWidth < 1024) {
      closeSidebar()
    }
  }

  const renderCurrentView = () => {
    switch (activeView) {
      case "Resume Analysis":
        return <ResumeAnalysis />
      case "Interview Prep":
        return <InterviewPrep />
      case "Progress & Reports":
        return <ProgressReports />
      case "Mentor Mode":
        return <Mentor />
      default:
        return renderDashboardContent()
    }
  }

  const renderDashboardContent = () => (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back! Let's boost your career today.</p>
      </div>

      {/* Quick-Start Guide */}
      <div className="mb-8 border border-[#0F1A2E] rounded-2xl bg-[#162238]">
        <h2 className="text-xl font-semibold text-white mb-6 mt-3 ml-5">Quick-Start Guide</h2>
        <div className="max-w-[900px] mx-auto mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {quickStartSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 bg-[#102248] rounded-full flex items-center justify-center">
                    <span className="text-[#3D889C] font-bold text-lg">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg mb-2">{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Features - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {mainFeatures.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div
              key={index}
              className="bg-[#101622] rounded-xl p-6 border border-slate-700"
            >
              <div className="mb-4">
                <div className="w-12 h-12 bg-[#102248] rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#3f3d9c]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>
              </div>
              <button
                onClick={() => handleNavigation(feature.path)}
                className="w-full bg-[#0C40A5] hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {feature.buttonText}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Stats Section - 2 columns with Latest ATS Score and Interview Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest ATS Score Widget */}
        <div className="bg-[#101622] rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-6 text-center">Latest ATS Score</h3>
          {isLoadingScore ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            </div>
          ) : !latestATSScore ? (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-400 text-sm">No ATS score yet.</p>
              <p className="text-slate-500 text-xs mt-1">Upload a resume to get started!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgb(51 65 85)"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={
                      latestATSScore.ats_score >= 80 ? "rgb(34 197 94)" :
                        latestATSScore.ats_score >= 60 ? "rgb(234 179 8)" :
                          "rgb(239 68 68)"
                    }
                    strokeWidth="2"
                    strokeDasharray={`${latestATSScore.ats_score}, 100`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${latestATSScore.ats_score >= 80 ? "text-green-400" :
                    latestATSScore.ats_score >= 60 ? "text-yellow-400" :
                      "text-red-400"
                    }`}>
                    {latestATSScore.ats_score}%
                  </span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-slate-300 text-sm mb-1">
                  {latestATSScore.resume_name || "Recent Resume"}
                </p>
                <p className="text-slate-500 text-xs">
                  {latestATSScore.createdAt
                    ? new Date(latestATSScore.createdAt).toLocaleDateString()
                    : "Today"
                  }
                </p>
              </div>

              <div className="mt-3 text-center">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${latestATSScore.ats_score >= 80
                  ? "bg-green-900 text-green-300"
                  : latestATSScore.ats_score >= 60
                    ? "bg-yellow-900 text-yellow-300"
                    : "bg-red-900 text-red-300"
                  }`}>
                  {latestATSScore.ats_score >= 80 ? "Excellent" :
                    latestATSScore.ats_score >= 60 ? "Good" : "Needs Improvement"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Past Interview Performance - ENHANCED */}
        <div className="bg-[#101622] rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Latest Interview Performance</h3>
            {latestInterview && (
              <div className="flex items-center gap-1">
                {latestInterview.interviewType === 'video' ? (
                  <VideoIcon className="w-4 h-4 text-blue-400" />
                ) : (
                  <Mic className="w-4 h-4 text-green-400" />
                )}
                <span className="text-xs text-slate-400 capitalize">
                  {latestInterview.interviewType}
                </span>
              </div>
            )}
          </div>

          {isLoadingInterview ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : !latestInterview ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center">
                <Video className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-400 text-sm mb-1">No interviews completed yet</p>
              <p className="text-slate-500 text-xs">Start your first mock interview!</p>
              <button
                onClick={() => handleNavigation("/interview-prep")}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
              >
                Start Interview
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Overall Score */}
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Overall Score</p>
                    <p className="text-slate-400 text-xs">Latest performance</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${latestInterview.averages?.overall_score >= 80 ? "text-green-400" :
                    latestInterview.averages?.overall_score >= 60 ? "text-yellow-400" : "text-red-400"
                    }`}>
                    {latestInterview.averages?.overall_score || 'N/A'}
                    {latestInterview.averages?.overall_score && '/100'}
                  </span>
                </div>
              </div>

              {/* Individual Metrics */}
              {latestInterview.averages && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-xs mb-1">Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min((latestInterview.averages.confidence / 10), 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-white text-xs font-medium">
                        {Math.round(latestInterview.averages.confidence / 10)}/10
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-xs mb-1">Correctness</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(latestInterview.averages.correctness * 10, 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-white text-xs font-medium">
                        {latestInterview.averages.correctness}/10
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-xs mb-1">Clarity</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              latestInterview.averages.clarity > 1000
                                ? (latestInterview.averages.clarity / 1000) * 10
                                : latestInterview.averages.clarity * 10,
                              100
                            )}%`
                          }}
                        />
                      </div>
                      <span className="text-white text-xs font-medium">
                        {latestInterview.averages.clarity > 1000
                          ? Math.round(latestInterview.averages.clarity / 1000)
                          : latestInterview.averages.clarity}/10
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-xs mb-1">Nervousness</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(latestInterview.averages.nervousness * 10, 100)}%`
                          }}
                        />
                      </div>
                      <span className="text-white text-xs font-medium">
                        {latestInterview.averages.nervousness}/10
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Interview Details */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {latestInterview.createdAt
                      ? new Date(latestInterview.createdAt).toLocaleDateString()
                      : "Today"
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <span>{latestInterview.questions?.length || 0} questions</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleNavigation("/progress-reports")}
                className="w-full mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                View Detailed Report
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#101622] flex">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        w-64 bg-[#101622] border-r border-slate-800 flex flex-col
        fixed lg:relative inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
      `}
      >
        <div className="lg:hidden absolute top-4 right-4">
          <button
            onClick={closeSidebar}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#102248] rounded-lg flex items-center justify-center">
              <img src={overlay} alt="" />
            </div>
            <div>
              <h1 className="text-white font-semibold">CareerBoost AI</h1>
              <p className="text-slate-400 text-xs">Boost up your career</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 px-3 py-2 rounded-2xl cursor-pointer transition-colors ${item.active
                    ? "bg-[#0C40A5] text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700 relative">
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-700 rounded-lg p-2 transition-colors"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">
                {user?.email || user?.displayName || "User"}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${showProfileDropdown ? "rotate-180" : ""
                }`}
            />
          </div>

          {/* Dropdown menu for logout */}
          {showProfileDropdown && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-700 rounded-lg border border-slate-600 shadow-lg">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0">
        <div className="lg:hidden bg-[#101622] border-b border-slate-800 p-4 flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#102248] rounded-lg flex items-center justify-center">
              <img src={overlay} alt="" />
            </div>
            <h1 className="text-white font-semibold text-sm">CareerBoost AI</h1>
          </div>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {renderCurrentView()}
      </div>
    </div>
  );
}

export default Dashboard