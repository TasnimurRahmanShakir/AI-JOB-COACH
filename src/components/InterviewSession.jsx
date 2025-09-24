import { useState, useRef, useEffect } from "react";

export default function InterviewSession({
  interviewQuestions,
  interviewType = "audio",
  redirectToProgress,
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [recordings, setRecordings] = useState([]); // Store all recordings

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const recordedQuestionsRef = useRef(new Set()); // Track recorded question indices

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  const startRecording = async () => {
    console.log("[Recording] start");
    const constraints =
      interviewType === "video"
        ? { video: true, audio: true }
        : { audio: true };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (interviewType === "video" && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mimeType = interviewType === "video" ? "video/webm" : "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setShowStartButton(false);
      console.log("[Recording] started");
    } catch (err) {
      console.error("[Recording] getUserMedia failed:", err);
    }
  };

  const stopRecordingAndStore = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    console.log("[Recording] stopping");
    const questionIndex = currentQuestion;

    // Skip if question was already recorded
    if (recordedQuestionsRef.current.has(questionIndex)) {
      console.log(
        `[Recording] question ${questionIndex} already recorded, skipping`
      );
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      chunksRef.current = [];
      setIsRecording(false);
      setShowStartButton(true);
      return;
    }

    recordedQuestionsRef.current.add(questionIndex); // Mark as recorded

    mediaRecorderRef.current.onstop = () => {
      console.log("[Recording] stopped");
      const blobType = interviewType === "video" ? "video/webm" : "audio/webm";
      const blob = new Blob(chunksRef.current, { type: blobType });
      chunksRef.current = [];

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;

      setRecordings((prev) => [
        ...prev,
        {
          blob,
          question: interviewQuestions[questionIndex]?.question || "",
          questionIndex,
        },
      ]);

      setIsRecording(false);
      setShowStartButton(true);
    };

    mediaRecorderRef.current.stop();
  };

  const handleNextQuestion = () => {
    console.log("[Interview] Next question");
    if (isRecording) stopRecordingAndStore();

    if (currentQuestion < interviewQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      console.log("[Interview] moved to question", currentQuestion + 1);
    }
  };

  const handleEndInterview = async () => {
    console.log("[Interview] End interview");
    if (isRecording) stopRecordingAndStore();

    // Send all recordings to backend
    console.log("[Upload] Starting upload of all recordings");
    for (const { blob, question, questionIndex } of recordings) {
      try {
        const form = new FormData();
        form.append(
          "file",
          blob,
          interviewType === "video"
            ? `interview_video_${questionIndex}.webm`
            : `interview_audio_${questionIndex}.webm`
        );
        form.append("question", question);

        const url =
          interviewType === "video"
            ? "https://rdxf7rzg-8000.inc1.devtunnels.ms/analyze-video"
            : "https://rdxf7rzg-8000.inc1.devtunnels.ms/transcribe";

        console.log(`[Upload] uploading question ${questionIndex}`);
        await fetch(url, { method: "POST", body: form });
        console.log(`[Upload] uploaded question ${questionIndex}`);
      } catch (err) {
        console.error(`[Upload] failed for question ${questionIndex}:`, err);
      }
    }

    if (redirectToProgress) redirectToProgress();
  };

  const progressPercentage =
    ((currentQuestion + 1) / interviewQuestions.length) * 100;

  const currentQ = interviewQuestions[currentQuestion] || {};

  return (
    <div className="min-h-screen bg-[#101622] text-white p-6">
      <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
        <div
          className="bg-green-500 h-3 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {currentQ.type || currentQ.difficulty ? (
        <div className="flex gap-4 mb-4 text-sm text-slate-300">
          {currentQ.type && (
            <span className="px-2 py-1 bg-slate-700 rounded-full">
              Type: {currentQ.type}
            </span>
          )}
          {currentQ.difficulty && (
            <span className="px-2 py-1 bg-slate-700 rounded-full">
              Difficulty: {currentQ.difficulty}
            </span>
          )}
        </div>
      ) : null}

      {recordings.length > 0 && (
        <div className="text-yellow-400 mb-4">
          {recordings.length} recording(s) stored
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6">
        {currentQ.question || "Loading question..."}
      </h1>

      <div className="bg-black rounded-2xl aspect-video max-w-5xl mx-auto flex flex-col items-center justify-center text-slate-500">
        {interviewType === "video" ? (
          <video
            ref={videoRef}
            className="rounded-2xl w-full h-full object-cover"
            autoPlay
            muted
          />
        ) : (
          <span className="text-6xl mb-4">🎤 Audio Interview</span>
        )}

        {showStartButton && (
          <button
            onClick={startRecording}
            className="px-6 py-3 rounded-full text-white font-semibold bg-green-600 hover:bg-green-700 mt-4"
          >
            Start Recording
          </button>
        )}

        {isRecording && (
          <span className="text-yellow-400 mt-2">Recording...</span>
        )}
      </div>

      <div className="flex justify-between max-w-5xl mx-auto mt-6">
        <button
          onClick={handleNextQuestion}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg"
        >
          Next Question
        </button>
        <button
          onClick={handleEndInterview}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          End Interview
        </button>
      </div>
    </div>
  );
}
