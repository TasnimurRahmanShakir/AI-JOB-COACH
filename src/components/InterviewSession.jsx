import { useState, useRef } from "react";
import * as FFmpeg from "@ffmpeg/ffmpeg"; // <- correct import

const { createFFmpeg, fetchFile } = FFmpeg;

export default function InterviewSession({
  interviewQuestions,
  interviewType,
  onEndInterview,
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const ffmpeg = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    mediaRecorderRef.current.stop();

    mediaRecorderRef.current.onstop = async () => {
      const webmBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      if (!ffmpeg.current) {
        ffmpeg.current = createFFmpeg({ log: true });
        await ffmpeg.current.load();
      }

      setIsConverting(true);

      ffmpeg.current.FS(
        "writeFile",
        "recording.webm",
        await fetchFile(webmBlob)
      );
      await ffmpeg.current.run(
        "-i",
        "recording.webm",
        "-vn",
        "-ar",
        "44100",
        "-ac",
        "2",
        "-b:a",
        "128k",
        "recording.mp3"
      );

      const mp3Data = ffmpeg.current.FS("readFile", "recording.mp3");
      const mp3Blob = new Blob([mp3Data.buffer], { type: "audio/mp3" });

      // Send MP3 to backend
      const form = new FormData();
      form.append("file", mp3Blob, "interview_audio.mp3");
      form.append(
        "question",
        interviewQuestions[currentQuestion]?.question || ""
      );

      try {
        const resp = await fetch("http://localhost:8000/transcribe", {
          method: "POST",
          body: form,
        });
        const data = await resp.json();
        console.log("Transcription result:", data);
      } catch (err) {
        console.error("Error sending audio to backend:", err);
      }

      setIsConverting(false);
    };
  };

  const handleNextQuestion = () => {
    if (currentQuestion < interviewQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#101622] text-white p-6">
      <h1 className="text-2xl font-bold mb-6">
        {interviewQuestions[currentQuestion]?.question || "Loading question..."}
      </h1>

      {interviewType === "video" ? (
        <div className="bg-black rounded-2xl aspect-video max-w-5xl mx-auto flex items-center justify-center text-slate-500">
          🎥 Video Interview Placeholder
        </div>
      ) : (
        <div className="bg-black rounded-2xl aspect-video max-w-5xl mx-auto flex flex-col items-center justify-center text-slate-500">
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
          {isConverting && (
            <span className="mt-2">Converting & sending to server... 🎵</span>
          )}
        </div>
      )}

      <div className="flex justify-between max-w-5xl mx-auto mt-6">
        <button
          onClick={handleNextQuestion}
          disabled={currentQuestion >= interviewQuestions.length - 1}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 rounded-lg"
        >
          Next Question
        </button>
        <button
          onClick={onEndInterview}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          End Interview
        </button>
      </div>
    </div>
  );
}
