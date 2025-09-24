import { useState, useRef } from "react";
import InterviewSession from "./InterviewSession";

function InterviewPrep() {
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [InterviewQuestion, setInterviewQuestion] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    job_level: "",
    job_post: "",
    job_requirements: "",
    question_count: "5",
  });
  const [interviewType, setInterviewType] = useState("audio");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStartInterview = async () => {
    if (formData.job_level && formData.job_post && formData.job_requirements) {
      console.log("Generating question...");
      setIsLoading(true);
      setError(null); // Clear any previous errors


      try {
        const response = await fetch(
          "https://cmfoxoaokjf2y2py53m5n2pv7.agent.a.smyth.ai/api/generate_interview_questions",
          {
            method: "POST",
            body: JSON.stringify(formData),
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to generate questions: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        console.log("API Response:", result);

        // More robust error handling for the response structure
        let questions = [];

        try {
          // Try different possible paths in the response
          questions =
            result?.interview_questions?.interview_questions?.questions ||
            result?.interview_questions?.questions ||
            result?.interview_questions ||
            result?.questions ||
            [];

          // Validate that we actually got questions
          if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("No valid questions received from the API");
          }

          console.log("Extracted questions:", questions);
          setInterviewQuestion(questions);
          setIsInterviewStarted(true);
          setCurrentQuestion(0);

        } catch (parseError) {
          console.error("Error parsing questions from response:", parseError);
          throw new Error("Invalid response format from the API. Please try again.");
        }

      } catch (error) {
        console.error("Error generating interview questions:", error);
        setError(error.message || "Failed to generate interview questions. Please try again.");
        setInterviewQuestion([]);

      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    handleStartInterview();
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (InterviewQuestion?.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const redirectToProgress = () => {
    setIsInterviewStarted(false);
    setCurrentQuestion(0);
    setInterviewQuestion([]);
    setFormData({
      job_level: "",
      job_post: "",
      job_requirements: "",
      question_count: "5",
    });
  };

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-8">
            {/* Error Icon */}
            <div className="text-6xl mb-6">❌</div>

            {/* Error Message */}
            <h2 className="text-2xl font-bold text-white mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-slate-400 text-lg mb-6 max-w-md">
              {error}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => setError(null)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>

          {/* Troubleshooting Tips */}
          <div className="bg-slate-800 rounded-lg p-4 text-left max-w-md">
            <h3 className="text-white font-semibold mb-2">💡 Tips:</h3>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Check your internet connection</li>
              <li>• Make sure all fields are filled correctly</li>
              <li>• Try refreshing the page if the issue persists</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-8">
            {/* Spinner */}
            <div className="w-16 h-16 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>

            {/* Loading Text */}
            <h2 className="text-2xl font-bold text-white mb-4">
              Generating Interview Questions
            </h2>
            <p className="text-slate-400 text-lg mb-6">
              Our AI is preparing personalized questions based on your job requirements...
            </p>

            {/* Progress Dots */}
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>

          {/* Interview Type Badge */}
          <div className="bg-slate-800 px-4 py-2 rounded-full">
            <span className="text-slate-300 text-sm">
              Preparing {interviewType === "audio" ? "Audio" : "Video"} Interview
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isInterviewStarted) {
    return (
      <InterviewSession
        interviewQuestions={InterviewQuestion}
        interviewType={interviewType}
        redirectToProgress={redirectToProgress}
      />
    );
  }

  // Before starting interview: select type
  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
          Interview Practice
        </h1>
        <p className="text-slate-400 text-lg">Set up your session to begin.</p>
      </div>

      <div className="flex justify-center gap-6 mb-8">
        <button
          onClick={() => setInterviewType("audio")}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${interviewType === "audio" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
        >
          Audio Interview
        </button>
        <button
          onClick={() => setInterviewType("video")}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${interviewType === "video" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
        >
          Video Interview
        </button>
      </div>

      <div className="space-y-8">
        <div>
          <label className="block text-white font-medium mb-3">Job Level</label>
          <input
            type="text"
            name="job_level"
            value={formData.job_level}
            onChange={handleInputChange}
            placeholder="e.g., Entry Level, Mid Level, Senior Level"
            className="w-full bg-[#1a2332] border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-white font-medium mb-3">Job Post</label>
          <input
            type="text"
            name="job_post"
            value={formData.job_post}
            onChange={handleInputChange}
            placeholder="e.g., Software Engineer, Product Manager"
            className="w-full bg-[#1a2332] border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-white font-medium mb-3">
            Job Requirements
          </label>
          <textarea
            name="job_requirements"
            value={formData.job_requirements}
            onChange={handleInputChange}
            placeholder="Describe the key requirements and skills needed for this position..."
            rows={4}
            className="w-full bg-[#1a2332] border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-white font-medium mb-3">
            Question Count{" "}
            <span className="text-slate-400 text-sm">(optional)</span>
          </label>
          <input
            type="text"
            name="question_count"
            value={formData.question_count}
            onChange={handleInputChange}
            placeholder="e.g., 3 Questions, 5 Questions"
            className="w-full bg-[#1a2332] border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={handleStartInterview}
            disabled={
              !formData.job_level ||
              !formData.job_post ||
              !formData.job_requirements ||
              isLoading
            }
            className=" cursor-pointer w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
          >
            <span className="text-xl">

            </span>
            Start {interviewType === "audio" ? "Audio" : "Video"} Interview
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewPrep;