import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChartScatter,
  Upload,

} from "lucide-react";
export default function InterviewSession({
  interviewQuestions,
  interviewType = "audio",
  redirectToProgress,
}) {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showStartButton, setShowStartButton] = useState(true);
  const [recordings, setRecordings] = useState([]); // Store all recordings
  const [toast, setToast] = useState({ show: false, message: "" });
  const [interviewFinished, setInterviewFinished] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    isUploading: false,
    currentFile: 0,
    totalFiles: 0,
    currentFileName: "",
    uploadedFiles: [],
    failedFiles: []
  });

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

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: "" });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message) => {
    setToast({ show: true, message });
  };

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
      showToast("Failed to start recording. Please check your camera/microphone permissions.");
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

    // Show toast if interview is already finished
    if (interviewFinished) {
      showToast("Interview finished! Please click 'End Interview' to complete.");
      return;
    }

    if (isRecording) stopRecordingAndStore();

    // Check if we're at the last question
    if (currentQuestion >= interviewQuestions.length - 1) {
      setInterviewFinished(true);
      return;
    }

    setCurrentQuestion((prev) => prev + 1);
    console.log("[Interview] moved to question", currentQuestion + 1);
  };

  const handleEndInterview = async () => {
    console.log("[Interview] End interview");
    if (isRecording) stopRecordingAndStore();

    // Wait a moment for any ongoing recording to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if we have any recordings
    if (recordings.length === 0) {
      showToast("No recordings found. Please record at least one answer.");
      return;
    }

    // Initialize upload progress
    setUploadProgress({
      isUploading: true,
      currentFile: 0,
      totalFiles: recordings.length,
      currentFileName: "",
      uploadedFiles: [],
      failedFiles: []
    });

    // Send all recordings to backend
    console.log("[Upload] Starting upload of all recordings");

    for (let i = 0; i < recordings.length; i++) {
      const { blob, question, questionIndex } = recordings[i];

      const fileName = interviewType === "video"
        ? `interview_video_${questionIndex}.webm`
        : `interview_audio_${questionIndex}.webm`;

      // Update current upload progress BEFORE starting upload
      setUploadProgress(prev => ({
        ...prev,
        currentFile: i + 1,
        currentFileName: fileName
      }));

      try {
        // Validate blob before upload
        if (!blob || blob.size === 0) {
          throw new Error("Empty or invalid recording");
        }

        const form = new FormData();
        form.append("file", blob, fileName);

        form.append("question", question || "No question provided");

        const url = interviewType === "video"
          ? "https://rdxf7rzg-8000.inc1.devtunnels.ms/analyze-video"
          : "https://rdxf7rzg-8000.inc1.devtunnels.ms/transcribe";

        console.log(`[Upload] uploading question ${questionIndex}, blob size: ${blob.size} bytes`);

        const response = await fetch(url, {
          method: "POST",
          body: form,
          headers: {
            // Don't set Content-Type header - let the browser set it for FormData
          }
        });

        console.log(`[Upload] Response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Upload] Server error: ${response.status} - ${errorText}`);
          throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        }

        // Try to parse response
        let responseData;
        try {
          const responseText = await response.text();
          console.log(`[Upload] Raw response: ${responseText}`);

          if (responseText.trim()) {
            responseData = JSON.parse(responseText);
          } else {
            responseData = { success: true, message: "Upload completed" };
          }
        } catch (parseError) {
          console.warn(`[Upload] Failed to parse response as JSON, treating as success`);
          responseData = { success: true, message: "Upload completed" };
        }

        console.log(`[Upload] uploaded question ${questionIndex} successfully`);

        // Add to uploaded files AFTER successful upload
        setUploadProgress(prev => ({
          ...prev,
          uploadedFiles: [...prev.uploadedFiles, fileName]
        }));

      } catch (err) {
        console.error(`[Upload] failed for question ${questionIndex}:`, err);

        // Add to failed files
        setUploadProgress(prev => ({
          ...prev,
          failedFiles: [...prev.failedFiles, { fileName, error: err.message }]
        }));
      }
    }

    // Upload completed
    setUploadProgress(prev => ({ ...prev, isUploading: false }));

    // Wait a moment to show completion, then redirect to ProgressReports
    setTimeout(() => {
      navigate('/progress-reports', {
        state: {
          interviewType: interviewType,
          justCompleted: true
        }
      });
    }, 2000);
  };

  const progressPercentage =
    ((currentQuestion + 1) / interviewQuestions.length) * 100;

  // Fixed upload percentage calculation - only count successfully uploaded files
  const uploadPercentage = uploadProgress.totalFiles > 0
    ? (uploadProgress.uploadedFiles.length / uploadProgress.totalFiles) * 100
    : 0;

  const currentQ = interviewQuestions[currentQuestion] || {};

  // Upload Modal/Overlay
  if (uploadProgress.isUploading || (uploadProgress.totalFiles > 0 && !uploadProgress.isUploading)) {
    return (
      <div className="min-h-screen bg-[#101622] text-white p-6 flex items-center justify-center">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-auto">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">
              {uploadProgress.isUploading ? "" : "✅"}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {uploadProgress.isUploading ? "Analyzing Interview" : "Upload Complete!"}
            </h2>
            <p className="text-slate-300">
              {uploadProgress.isUploading
                ? "Please wait while we process your interview..."
                : uploadProgress.failedFiles.length > 0
                  ? `Upload completed with ${uploadProgress.failedFiles.length} error(s).`
                  : "Your interview has been processed successfully."
              }
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-slate-300 mb-2">
              <span>Progress</span>
              <span>{Math.round(uploadPercentage)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Current File */}
          {uploadProgress.isUploading && (
            <div className="mb-4">
              <p className="text-sm text-slate-300 mb-1">Currently Analyzing:</p>
              <p className="text-white font-medium">{uploadProgress.currentFileName}</p>
              <p className="text-sm text-slate-400">
                File {uploadProgress.currentFile} of {uploadProgress.totalFiles}
              </p>
            </div>
          )}

          {/* Upload Status */}
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {uploadProgress.uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center text-sm">
                <span className="text-green-400 mr-2">✓</span>
                <span className="text-slate-300">{file}</span>
              </div>
            ))}

            {uploadProgress.failedFiles.map((fileData, index) => (
              <div key={index} className="flex items-center text-sm">
                <span className="text-red-400 mr-2">✗</span>
                <span className="text-slate-300">
                  {typeof fileData === 'string' ? fileData : fileData.fileName}
                  {typeof fileData === 'object' && fileData.error && (
                    <span className="text-xs text-red-300 block ml-4">
                      {fileData.error}
                    </span>
                  )}
                </span>
              </div>
            ))}

            {/* Show currently uploading file */}
            {uploadProgress.isUploading && uploadProgress.currentFileName && (
              <div className="flex items-center text-sm">
                <span className="text-yellow-400 mr-2">⏳</span>
                <span className="text-slate-300">{uploadProgress.currentFileName}</span>
              </div>
            )}
          </div>

          {!uploadProgress.isUploading && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Redirecting to progress reports in 2 seconds...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101622] text-white p-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300">
          {toast.message}
        </div>
      )}

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

      <h1 className="text-lg font-medium mb-6">
        {currentQ.question || "Loading question..."}
      </h1>

      <div className="bg-black rounded-2xl aspect-video max-w-2xl mx-auto flex flex-col items-center justify-center text-slate-500">
        {interviewType === "video" ? (
          <video
            ref={videoRef}
            className="rounded-2xl w-full h-full object-cover"
            autoPlay
            muted
          />
        ) : (
          <span className="text-3xl mb-4"> Audio Interview</span>
        )}

        {showStartButton && !interviewFinished && (
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

        {interviewFinished && (
          <span className="text-green-400 mt-2">All questions completed!</span>
        )}
      </div>

      <div className="flex justify-between max-w-3xl mx-auto mt-6">
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