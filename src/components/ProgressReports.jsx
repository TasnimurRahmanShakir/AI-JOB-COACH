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

  // Get interview type from navigation state, default to 'audio'
  const interviewType = location.state?.interviewType || "audio";
  const justCompleted = location.state?.justCompleted || false;

  console.log("🎯 ProgressReports received interview type:", interviewType);
  console.log("🎯 Just completed interview:", justCompleted);

  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interviewData, setInterviewData] = useState(null);

  // Get auth token from localStorage with debugging
  const getAuthToken = () => {
    const token = localStorage.getItem("authToken");

    console.log(
      "🔑 Token from localStorage:",
      token ? "Token exists" : "No token found"
    );
    console.log(
      "🔑 Token preview:",
      token ? token.substring(0, 20) + "..." : "null"
    );
    console.log("🔑 All localStorage keys:", Object.keys(localStorage));

    if (!token) {
      console.log(
        "💡 Make sure you're logged in! Token is saved as 'authToken' in localStorage"
      );
    }

    return token;
  };

  // Save interview analysis to backend (single endpoint for both audio & video)
  const saveToBackend = async (data) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.log("❌ No token available, skipping save");
        return;
      }

      const endpoint = "http://localhost:5000/api/interview-analysis";

      console.log("💾 Saving interview data to backend...");
      console.log("💾 Data to save:", data);
      console.log("💾 Endpoint:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: interviewType, data }), // include type
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Save failed:", errorData);
        throw new Error(
          `Save failed: ${errorData.message || response.statusText}`
        );
      }

      const result = await response.json();
      console.log("✅ Interview data saved to backend:", result);
    } catch (err) {
      console.error("❌ Failed to save to backend:", err);
    }
  };

  // Get interview analysis from backend (single endpoint with ?type=)
  const getFromBackend = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.log("❌ No token available, skipping backend fetch");
        return null;
      }

      const endpoint = `http://localhost:5000/api/interview-analysis/latest?type=${interviewType}`;

      console.log(`🔍 Fetching saved ${interviewType} data from backend...`);

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Backend fetch failed:", errorData);
        return null;
      }

      const data = await response.json();
      console.log("📚 Retrieved saved data:", data);
      return data;
    } catch (err) {
      console.error("❌ Error fetching from backend:", err);
      return null;
    }
  };

  // Fetch data based on interview type
  useEffect(() => {
    const fetchInterviewAnalysisData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check if we have saved data
        const savedData = await getFromBackend();
        if (savedData) {
          setInterviewData(savedData);
          setLoading(false);
          return;
        }

        // Otherwise fetch from external API
        const apiUrl =
          interviewType === "video"
            ? "https://cmfyav9wl668z23qu1t8xralg.agent.a.smyth.ai/api/video_feedback"
            : "https://cmfr1sf28nenwo3wtknm6a6y9.agent.a.smyth.ai/api/auto_analyze";

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

        const data = await response.json();
        setApiData(data);

        if (Array.isArray(data) && data.length > 0) {
          const interviewOutput = data.find(
            (item) => item.id === "M1INTERVIEW_OUTPUT"
          );

          if (interviewOutput?.result?.Output) {
            const processedData = interviewOutput.result.Output.result;
            setInterviewData(processedData);
            await saveToBackend(processedData);
          }
        }
      } catch (err) {
        console.error(`❌ Error in ${interviewType} interview fetch process:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviewAnalysisData();
  }, [interviewType]);

  // =========================
  // Debug helpers
  // =========================
  const testAuth = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch("http://localhost:5000/api/test-auth", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Auth test successful:", result);
      } else {
        const error = await response.json();
        console.log("❌ Auth test failed:", error);
      }
    } catch (err) {
      console.error("❌ Auth test error:", err);
    }
  };

  useEffect(() => {
    console.log("🔍 Component mounted, checking authentication...");
    const token = getAuthToken();
    if (token) testAuth();
  }, []);

  // =========================
  // UI Data Preparation
  // =========================
  const interviewQuestions =
    interviewData?.questions?.map((q, index) => ({
      question: q.question || `Question ${index + 1}`,
      correctness: `${q.correctness}/10`,
      confidence: `${Math.round(q.confidence / 10)}/10`,
      clarity: `${q.clarity > 1000 ? Math.round(q.clarity / 1000) : q.clarity
        }/10`,
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
      75,
      80,
      85,
    ]
    : [70, 75, 80, 78, 85, 82, 90];

  const last7Scores = demoScores.map((score, i) => ({
    label: `${i + 1}`,
    score: Math.round(Math.min(score, 100)),
  }));

  // =========================
  // UI
  // =========================
  return (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Interview Feedback
        </h1>
        <p className="text-slate-400">
          {interviewData
            ? "AI-powered analysis from your recent interview"
            : "Review your performance from the mock interview."}
        </p>

        {/* API Status Indicator */}
        <div className="mt-4 space-y-2">
          {loading && (
            <div className="flex items-center text-yellow-400 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-2"></div>
              Loading {interviewType} interview analysis data...
            </div>
          )}
          {error && (
            <div className="text-red-400 text-sm">Error loading data: {error}</div>
          )}
          {apiData && !loading && (
            <div className="text-green-400 text-sm">
              ✓ {interviewType} interview analysis data loaded successfully
            </div>
          )}

          <div className="text-slate-400 text-xs">
            Interview Type: {interviewType}
            {justCompleted && " (Just completed)"}
          </div>

          {/* Debug buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={testAuth}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Test Auth
            </button>
            <button
              onClick={async () => {
                const result = await getFromBackend();
                console.log("🔄 Manual fetch result:", result);
              }}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
            >
              Test Fetch
            </button>
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
                  AI Analysis Scores
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
            AI Analysis Report
          </h2>
          <div className="text-slate-300 text-sm leading-relaxed">
            {interviewData?.final_report ? (
              <p>{interviewData.final_report}</p>
            ) : (
              <p>
                Your interview showcased strong correctness and clarity. Focus on
                improving confidence and pace while managing nervousness for
                better performance.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProgressReports;
