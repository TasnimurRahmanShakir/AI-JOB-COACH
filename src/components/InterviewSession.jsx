import { useState, useRef } from "react";

export default function InterviewSession({
  interviewQuestions,
  interviewType = "audio",
  redirectToProgress,
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null); // Keep track of media stream
  const videoRef = useRef(null); // For video preview

  const startRecording = async () => {
    console.log("[Recording] start clicked");
    const constraints =
      interviewType === "video"
        ? { video: true, audio: true }
        : { audio: true };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      console.log("[Recording] media stream obtained", stream);

      // Show video preview
      if (interviewType === "video" && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mimeType = interviewType === "video" ? "video/webm" : "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log("[Recording] chunk captured, size:", e.data.size);
        }
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

  const stopRecordingAndSend = async () => {
    if (!mediaRecorderRef.current || !isRecording) {
      console.log("[Recording] nothing to stop");
      return;
    }

    console.log("[Recording] stopping...");
    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = async () => {
        console.log("[Recording] stopped, preparing blob...");
        const blobType =
          interviewType === "video" ? "video/webm" : "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        chunksRef.current = [];

        // Stop all tracks and remove video preview
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;

        console.log("[Upload] blob prepared:", blob);

        const form = new FormData();
        form.append(
          "file",
          blob,
          interviewType === "video"
            ? "interview_video.webm"
            : "interview_audio.webm"
        );
        form.append(
          "question",
          interviewQuestions[currentQuestion]?.question || ""
        );

        try {
          const url =
            interviewType === "video"
              ? "https://rdxf7rzg-8000.inc1.devtunnels.ms/analyze-video"
              : "https://rdxf7rzg-8000.inc1.devtunnels.ms/transcribe";
          console.log("[Upload] sending request to server...");
          await fetch(url, { method: "POST", body: form });
          console.log("[Upload] upload successful");
        } catch (err) {
          console.error("[Upload] upload failed:", err);
        }

        setIsRecording(false);
        setShowStartButton(true);
        resolve();
      };

      mediaRecorderRef.current.stop();
    });
  };

  const handleNextQuestion = async () => {
    console.log("[Interview] Next question clicked");
    if (isRecording) await stopRecordingAndSend();
    if (currentQuestion < interviewQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      console.log("[Interview] moved to question", currentQuestion + 1);
    }
  };

  const handleEndInterview = async () => {
    console.log("[Interview] End interview clicked");
    if (isRecording) await stopRecordingAndSend();
    console.log("Interview ended");
    if (redirectToProgress) redirectToProgress();
  };

  return (
    <div className="min-h-screen bg-[#101622] text-white p-6">
      <h1 className="text-2xl font-bold mb-6">
        {interviewQuestions[currentQuestion]?.question || "Loading question..."}
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
