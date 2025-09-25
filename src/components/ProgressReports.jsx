import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ProgressReports() {
  const location = useLocation();

  // Get interview type from navigation state, default to checking latest from backend
  const navigatedInterviewType = location.state?.interviewType;
  const justCompleted = location.state?.justCompleted || false;

  console.log("🎯 ProgressReports navigated interview type:", navigatedInterviewType);
  console.log("🎯 Just completed interview:", justCompleted);

  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interviewData, setInterviewData] = useState(null);
  const [currentInterviewType, setCurrentInterviewType] = useState(navigatedInterviewType || 'audio');

  // Get auth token from localStorage
  const getAuthToken = () => {
    const token = localStorage.getItem("authToken");

    console.log(
      "🔑 Token from localStorage:",
      token ? "Token exists" : "No token found"
    );

    if (!token) {
      console.log(
        "💡 Make sure you're logged in! Token is saved as 'authToken' in localStorage"
      );
    }

    return token;
  };

  // Save interview analysis to backend - ENHANCED
  const saveInterviewToBackend = async (interviewType, processedData, rawApiData = null) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.log("❌ No token available, skipping save");
        return false;
      }

      console.log("💾 Saving interview to backend...");
      console.log("💾 Interview Type:", interviewType);
      console.log("💾 Processed Data:", processedData);

      const response = await fetch("http://localhost:5000/api/interview-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          interviewType: interviewType,
          questions: processedData.questions || [],
          averages: processedData.averages || {},
          final_report: processedData.final_report || "",
          raw_api_data: rawApiData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Save failed:", errorData);
        return false;
      }

      const result = await response.json();
      console.log("✅ Interview saved successfully:", result);
      return true;
    } catch (err) {
      console.error("❌ Failed to save to backend:", err);
      return false;
    }
  };

  // Get latest interview from backend (any type)
  const getLatestInterviewFromBackend = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.log("❌ No token available, skipping backend fetch");
        return null;
      }

      console.log("🔍 Fetching latest interview from backend...");

      const response = await fetch("http://localhost:5000/api/interview-analysis/latest", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log("📭 No saved interviews found");
          return null;
        }
        const errorData = await response.json();
        console.error("❌ Backend fetch failed:", errorData);
        return null;
      }

      const data = await response.json();
      console.log("📚 Retrieved latest interview:", data);

      if (data && data.interviewType) {
        setCurrentInterviewType(data.interviewType);
      }

      return data;
    } catch (err) {
      console.error("❌ Error fetching from backend:", err);
      return null;
    }
  };

  // Get specific interview type from backend
  const getInterviewByTypeFromBackend = async (type) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.log("❌ No token available");
        return null;
      }

      console.log(`🔍 Fetching ${type} interview from backend...`);

      const response = await fetch(`http://localhost:5000/api/interview-analysis/type/${type}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`📭 No ${type} interviews found`);
          return null;
        }
        const errorData = await response.json();
        console.error("❌ Backend fetch failed:", errorData);
        return null;
      }

      const data = await response.json();
      console.log(`📚 Retrieved ${type} interview:`, data);
      return data;
    } catch (err) {
      console.error("❌ Error fetching from backend:", err);
      return null;
    }
  };

  // Fetch fresh data from external APIs
  const fetchFreshInterviewData = async (interviewType) => {
    try {
      console.log(`🌐 Fetching fresh ${interviewType} data from external API...`);

      const apiUrl = interviewType === "video"
        ? "https://cmfyav9wl668z23qu1t8xralg.agent.a.smyth.ai/api/video_feedback"
        : "https://cmfr1sf28nenwo3wtknm6a6y9.agent.a.smyth.ai/api/auto_analyze";

      console.log(`🌐 API URL: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        cache: "no-cache",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      console.log(`✅ ${interviewType} API data fetched:`, rawData);

      setApiData(rawData);

      // Process the data
      if (Array.isArray(rawData) && rawData.length > 0) {
        const interviewOutput = rawData.find(
          (item) => item.id === "M1INTERVIEW_OUTPUT"
        );

        if (interviewOutput?.result?.Output?.result) {
          const processedData = interviewOutput.result.Output.result;
          console.log(`✅ Processed ${interviewType} data:`, processedData);

          // Save to backend immediately
          const saved = await saveInterviewToBackend(interviewType, processedData, rawData);

          if (saved) {
            // If saved successfully, fetch it back to ensure consistency
            const savedData = await getInterviewByTypeFromBackend(interviewType);
            if (savedData) {
              setInterviewData(savedData);
              setCurrentInterviewType(interviewType);
              return true;
            }
          }

          // Fallback: use processed data directly
          setInterviewData(processedData);
          setCurrentInterviewType(interviewType);
          return true;
        } else {
          console.log(`❌ No valid interview output found in ${interviewType} API response`);
          return false;
        }
      } else {
        console.log(`❌ ${interviewType} API returned invalid data structure`);
        return false;
      }
    } catch (err) {
      console.error(`❌ Error fetching ${interviewType} data:`, err);
      throw err;
    }
  };

  // Main data fetching logic
  useEffect(() => {
    const fetchInterviewData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🚀 Starting interview data fetch process...");
        console.log("🚀 Navigated type:", navigatedInterviewType);
        console.log("🚀 Just completed:", justCompleted);

        // If user just completed an interview, fetch fresh data for that type
        if (justCompleted && navigatedInterviewType) {
          console.log(`📱 User just completed ${navigatedInterviewType} interview, fetching fresh data...`);

          try {
            await fetchFreshInterviewData(navigatedInterviewType);
            return;
          } catch (err) {
            console.error(`❌ Failed to fetch fresh ${navigatedInterviewType} data:`, err);
            setError(`Failed to load ${navigatedInterviewType} interview data`);
            return;
          }
        }

        // Otherwise, try to load existing data first
        console.log("📚 Loading existing interview data...");

        const existingData = navigatedInterviewType
          ? await getInterviewByTypeFromBackend(navigatedInterviewType)
          : await getLatestInterviewFromBackend();

        if (existingData) {
          console.log("✅ Using existing interview data:", existingData);
          setInterviewData(existingData);
          setCurrentInterviewType(existingData.interviewType);
          return;
        }

        // If no existing data, fetch fresh data
        console.log("🌐 No existing data found, fetching fresh data...");
        const typeToFetch = navigatedInterviewType || 'audio';

        try {
          await fetchFreshInterviewData(typeToFetch);
        } catch (err) {
          console.error(`❌ Failed to fetch fresh data:`, err);
          setError(`Failed to load interview data`);
        }

      } catch (err) {
        console.error("❌ Error in main fetch process:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewData();
  }, [navigatedInterviewType, justCompleted]);

  // Switch between audio and video data
  const switchInterviewType = async (type) => {
    if (type === currentInterviewType) return;

    setLoading(true);
    console.log(`🔄 Switching to ${type} interview...`);

    const data = await getInterviewByTypeFromBackend(type);
    if (data) {
      setInterviewData(data);
      setCurrentInterviewType(type);
    } else {
      console.log(`📭 No ${type} interview found, fetching fresh data...`);
      try {
        await fetchFreshInterviewData(type);
      } catch (err) {
        setError(`Failed to load ${type} interview data`);
      }
    }

    setLoading(false);
  };

  // UI Data Preparation
  const interviewQuestions = interviewData?.questions?.map((q, index) => ({
    question: q.question || `Question ${index + 1}`,
    correctness: `${q.correctness}/10`,
    confidence: `${Math.round(q.confidence / 10)}/10`,
    clarity: `${q.clarity > 1000 ? Math.round(q.clarity / 1000) : q.clarity}/10`,
    pace: "N/A",
    nervousness: `${q.nervousness}/10`,
  })) || [
      {
        question: "Tell me about yourself.",
        correctness: "8/10",
        confidence: "9/10",
        clarity: "7/10",
        pace: "6/10",
        nervousness: "3/10",
      },
      {
        question: "Describe a challenging project and how you handled it.",
        correctness: "7/10",
        confidence: "8/10",
        clarity: "8/10",
        pace: "7/10",
        nervousness: "4/10",
      },
    ];

  const demoScores = interviewData?.averages
    ? [
      interviewData.averages.overall_score,
      interviewData.averages.correctness * 10,
      interviewData.averages.confidence / 10,
      Math.min(interviewData.averages.clarity, 100),
      75, 80, 85,
    ]
    : [70, 75, 80, 78, 85, 82, 90];

  const last7Scores = demoScores.map((score, i) => ({
    label: `${i + 1}`,
    score: Math.round(Math.min(score, 100)),
  }));

  return (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-white">
            Interview Feedback
          </h1>

          {/* Interview Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => switchInterviewType('audio')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentInterviewType === 'audio'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
              🎤 Audio
            </button>
            <button
              onClick={() => switchInterviewType('video')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentInterviewType === 'video'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
              🎥 Video
            </button>
          </div>
        </div>

        <p className="text-slate-400">
          {interviewData
            ? `AI-powered analysis from your recent ${currentInterviewType} interview`
            : `Review your ${currentInterviewType} interview performance.`}
        </p>

        {/* Status Indicator */}
        <div className="mt-4 space-y-2">
          {loading && (
            <div className="flex items-center text-yellow-400 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-2"></div>
              Loading {currentInterviewType} interview data...
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm">Error: {error}</div>
          )}

          {interviewData && !loading && (
            <div className="text-green-400 text-sm">
              ✓ {currentInterviewType} interview data loaded successfully
              {justCompleted && " (Just completed)"}
            </div>
          )}

          <div className="text-slate-400 text-xs">
            Current: {currentInterviewType} interview
            {interviewData?.createdAt && (
              <span> • Completed: {new Date(interviewData.createdAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Question Breakdown */}
        <div className="xl:col-span-2">
          <div className="bg-[#101622] rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">
                Question Breakdown
              </h2>
              {interviewData && (
                <p className="text-xs text-green-400 mt-1">
                  ✓ Using AI analysis data ({currentInterviewType})
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">
                      Question
                    </th>
                    <th className="text-center p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">
                      Correctness
                    </th>
                    <th className="text-center p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="text-center p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">
                      Clarity
                    </th>
                    <th className="text-center p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">
                      Pace
                    </th>
                    <th className="text-center p-4 text-slate-400 font-medium text-sm uppercase tracking-wider">
                      Nervousness
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {interviewQuestions.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4 text-white text-sm max-w-xs">
                        {item.question}
                      </td>
                      <td className="p-4 text-center text-slate-300 text-sm font-medium">
                        {item.correctness}
                      </td>
                      <td className="p-4 text-center text-slate-300 text-sm font-medium">
                        {item.confidence}
                      </td>
                      <td className="p-4 text-center text-slate-300 text-sm font-medium">
                        {item.clarity}
                      </td>
                      <td className="p-4 text-center text-slate-300 text-sm font-medium">
                        {item.pace}
                      </td>
                      <td className="p-4 text-center text-slate-300 text-sm font-medium">
                        {item.nervousness}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Overall Performance */}
        <div className="space-y-6">
          <div className="bg-[#101622] rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-6">
              Overall Performance
            </h2>

            {interviewData?.averages && (
              <div className="mb-6 p-4 bg-slate-800 rounded-lg">
                <h3 className="text-slate-300 text-sm font-medium mb-3">
                  AI Analysis Scores ({currentInterviewType})
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Overall Score:</span>
                    <span className="text-white">
                      {interviewData.averages.overall_score}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Correctness:</span>
                    <span className="text-white">
                      {interviewData.averages.correctness}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Confidence:</span>
                    <span className="text-white">
                      {Math.round(interviewData.averages.confidence / 10)}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Clarity:</span>
                    <span className="text-white">
                      {interviewData.averages.clarity > 1000
                        ? Math.round(interviewData.averages.clarity / 1000)
                        : interviewData.averages.clarity}
                      /10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nervousness:</span>
                    <span className="text-white">
                      {interviewData.averages.nervousness}/10
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-slate-300 text-sm font-medium mb-3">
                Performance Metrics
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Scores}>
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" domain={[0, 100]} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                    <Bar
                      dataKey="score"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-blue-400 font-medium mb-2">
                Need more practice?
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Start another mock interview to hone your skills.
              </p>
              <Link
                to="/interview-prep"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
              >
                Start New Interview
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Report Summary */}
      <div className="mt-8">
        <div className="bg-[#101622] rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            AI Analysis Report ({currentInterviewType})
          </h2>
          <div className="text-slate-300 text-sm leading-relaxed">
            {interviewData?.final_report ? (
              <p>{interviewData.final_report}</p>
            ) : (
              <p>
                Your {currentInterviewType} interview showcased strong correctness and clarity.
                Focus on improving confidence and pace while managing nervousness for better performance.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressReports;