import { useState, useRef } from "react";
import InterviewSession from "./InterviewSession";

function InterviewPrep({ onInterviewStateChange }) {
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [InterviewQuestion, setInterviewQuestion] = useState([]);
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
      onInterviewStateChange?.(true);


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

        if (!response.ok)
          throw new Error(
            `Failed to generate questions: ${response.statusText}`
          );

        const result = await response.json();
        console.log(result);
        setInterviewQuestion(
          result.interview_questions.interview_questions.questions
        );
        setIsInterviewStarted(true);
        setCurrentQuestion(0);
      } catch (error) {
        console.error("Error generating interview questions:", error);
        setInterviewQuestion([]);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (InterviewQuestion?.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleEndInterview = () => {
    setIsInterviewStarted(false);
    setCurrentQuestion(0);
    setInterviewQuestion([]);
    setFormData({
      job_level: "",
      job_post: "",
      job_requirements: "",
      question_count: "5",
    });
    onInterviewStateChange?.(false);
  };

 if (isInterviewStarted) {
   return (
     <InterviewSession
       interviewQuestions={InterviewQuestion}
       interviewType={interviewType}
       onEndInterview={handleEndInterview}
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
          className={`px-6 py-3 rounded-lg font-semibold ${
            interviewType === "audio" ? "bg-blue-600" : "bg-slate-700"
          }`}
        >
          Audio Interview
        </button>
        <button
          onClick={() => setInterviewType("video")}
          className={`px-6 py-3 rounded-lg font-semibold ${
            interviewType === "video" ? "bg-blue-600" : "bg-slate-700"
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
              !formData.job_requirements
            }
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
          >
            <span className="w-4 h-4 bg-yellow-400 rounded-sm"></span>
            Start {interviewType === "audio" ? "Audio" : "Video"} Interview
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewPrep;
