import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  X,
} from "lucide-react";
import { useState, useRef } from "react";
import { jsPDF } from "jspdf";

function ResumeAnalysis() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const fileInputRef = useRef(null);

  // ----- PDF Download -----
  const downloadPDF = (improved_resume) => {
    if (!improved_resume) return;

    const doc = new jsPDF();
    let y = 20;
    const lines = improved_resume.split("\n");

    lines.forEach((line) => {
      if (line.startsWith("### ")) {
        // Section heading
        doc.setFontSize(16);
        doc.setFont(undefined, "bold");
        doc.text(line.replace("### ", ""), 105, y, { align: "center" });
        y += 10;
      } else if (line.startsWith("- ")) {
        // Bullet point
        doc.setFontSize(12);
        doc.setFont(undefined, "normal");
        doc.text("• " + line.substring(2), 20, y);
        y += 7;
      } else if (line.startsWith("---")) {
        // Horizontal line
        doc.setLineWidth(0.5);
        doc.line(15, y, 195, y);
        y += 5;
      } else {
        // Regular text
        doc.setFontSize(12);
        doc.setFont(undefined, "normal");
        doc.text(line, 20, y);
        y += 7;
      }

      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("Improved_Resume.pdf");
  };

  // ----- File Handling -----
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0])
      handleFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      alert("Please upload only PDF or DOCX files");
      return;
    }

    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return;
    }

    setUploadedFile(file);
  };

  // ----- Analyze Resume -----
  const handleAnalyze = async () => {
    if (!uploadedFile) {
      alert("Please upload a resume first");
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("resume", uploadedFile);

      const response = await fetch(
        "https://cmfrsjvayoda7o3wtn2idsjc6.agent.a.smyth.ai/api/resume_analyzer",
        {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok)
        throw new Error(`Failed to analyze resume: ${response.statusText}`);

      const result = await response.json();
      console.log("analysis report", result.analysis_report);
      // Update state
      setAnalysisResults(result.analysis_report || null);
      setShowResults(true);
    } catch (error) {
      console.error("Error analyzing resume:", error);
      alert("Error analyzing resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ----- Remove File -----
  const removeFile = () => {
    setUploadedFile(null);
    setShowResults(false);
    setAnalysisResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ----- Helpers -----
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreStroke = (score) => {
    if (score >= 80) return "rgb(34 197 94)";
    if (score >= 60) return "rgb(234 179 8)";
    return "rgb(239 68 68)";
  };

  return (
    <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Resume Analysis</h1>
        <p className="text-slate-400">
          Upload your resume to get detailed feedback and suggestions for
          improvement.
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-8">
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 lg:p-12 text-center transition-colors ${
            dragActive
              ? "border-blue-400 bg-blue-400/5"
              : uploadedFile
              ? "border-green-400 bg-green-400/5"
              : "border-slate-600 bg-slate-800/30"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploadedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <FileText className="w-12 h-12 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">{uploadedFile.name}</p>
                <p className="text-slate-400 text-sm">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={removeFile}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Upload className="w-12 h-12 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium text-lg mb-2">
                  Drag and drop your resume here
                </p>
                <p className="text-slate-400 text-sm">
                  PDF or DOCX files only, up to 10MB
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Or Select a File
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Analyze Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={handleAnalyze}
            disabled={!uploadedFile || isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            {isAnalyzing ? "Analyzing Resume..." : "Analyze Resume"}
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {showResults && analysisResults && (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white">Analysis Results</h2>

          {/* ATS Score */}
          {analysisResults.ats_score && (
            <div className="bg-[#101622] rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">ATS Score</h3>
                <span
                  className={`text-2xl font-bold ${getScoreColor(
                    analysisResults.ats_score
                  )}`}
                >
                  {analysisResults.ats_score}%
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-1000"
                  style={{
                    width: `${analysisResults.ats_score}%`,
                    backgroundColor: getScoreStroke(analysisResults.ats_score),
                  }}
                />
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#101622] rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Strengths
              </h3>
              <ul className="space-y-3">
                {analysisResults.strengths?.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#101622] rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Weaknesses
              </h3>
              <ul className="space-y-3">
                {analysisResults.weaknesses?.map((w, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Report */}
          {analysisResults.final_report && (
            <div className="bg-[#101622] rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                AI Report
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {analysisResults.final_report}
              </p>
            </div>
          )}

          {/* Download Button */}
          <div className="flex justify-center">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
              onClick={() => downloadPDF(analysisResults.improved_resume.improved_resume)}
            >
              <Download className="w-5 h-5" />
              Download Improved Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeAnalysis;
