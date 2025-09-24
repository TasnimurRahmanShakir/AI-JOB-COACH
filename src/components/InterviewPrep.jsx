import { useState, useRef } from "react";

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
  const [interviewType, setInterviewType] = useState("audio"); // audio or video
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  // Audio recording
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Audio recording not supported in this browser");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const audioUrl = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = "interview_audio.webm";
      a.click();
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (isInterviewStarted) {
    return (
      <div className="min-h-screen bg-[#101622] text-white">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">💡</span>
            </div>
            <span className="font-semibold">CareerBoost AI</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">?</span>
            </div>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">JS</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2 max-w-5xl mx-auto">
            <div className="flex-1 bg-slate-700 rounded-full h-2 mr-4">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    ((currentQuestion + 1) / (InterviewQuestion?.length || 1)) *
                    100
                  }%`,
                }}
              ></div>
            </div>
            <span className="text-slate-400 text-sm">
              {currentQuestion + 1}/{InterviewQuestion?.length || 0}
            </span>
          </div>
        </div>

        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">
                {InterviewQuestion[currentQuestion].difficulty}
              </span>
              <span className="text-slate-400">|</span>
              <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">
                {InterviewQuestion[currentQuestion].type}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-8 max-w-4xl mx-auto leading-relaxed">
              {InterviewQuestion[currentQuestion].question ||
                "Loading question..."}
            </h1>
          </div>

          <div className="mb-8 flex flex-col items-center gap-6">
            {interviewType === "video" ? (
              <div className="bg-black rounded-2xl aspect-video max-w-5xl mx-auto relative overflow-hidden flex items-center justify-center text-slate-500">
                <span className="text-6xl">🎥 Video Interview Placeholder</span>
              </div>
            ) : (
              <div className="bg-black rounded-2xl aspect-video max-w-5xl mx-auto relative overflow-hidden flex flex-col items-center justify-center text-slate-500">
                <span className="text-6xl mb-4">🎤 Audio Interview</span>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`px-6 py-3 rounded-full text-white font-semibold ${
                    isRecording
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <button
              onClick={handleNextQuestion}
              disabled={currentQuestion >= (InterviewQuestion?.length || 0) - 1}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors"
            >
              Next Question
            </button>

            <button
              onClick={handleEndInterview}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              End Interview
            </button>
          </div>
        </div>
      </div>
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
