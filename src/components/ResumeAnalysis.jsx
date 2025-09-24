import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  X,
} from "lucide-react";
import { useState, useRef, useContext } from "react";
import { jsPDF } from "jspdf";
import AuthContext from "../context/authContext";
import toast from "react-hot-toast";

function ResumeAnalysis() {
  const { token } = useContext(AuthContext);
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
    const pageWidth = 210;
    const pageHeight = 297;
    const leftMargin = 15;
    const rightMargin = 195;
    const lineHeight = 6;
    let currentPage = 1;
    const maxPages = 2;

    // Colors
    const primaryColor = [41, 128, 185];
    const secondaryColor = [52, 73, 94];
    const lightGray = [149, 165, 166];

    // Helper Functions
    const addHeader = () => {
      // Simple professional header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 25, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('IMPROVED RESUME', pageWidth / 2, 16, { align: 'center' });

      y = 35;
    };

    const addFooter = () => {
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setFontSize(8);
      doc.text(`Page ${currentPage} of 2`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    const checkPageBreak = (requiredSpace) => {
      if (y + requiredSpace > pageHeight - 25) {
        if (currentPage < maxPages) {
          addFooter();
          doc.addPage();
          currentPage++;
          addHeader();
          return true;
        }
        return false;
      }
      return true;
    };

    const addSectionHeader = (title) => {
      if (!checkPageBreak(15)) return false;

      y += 5;
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, y, rightMargin, y);
      y += 5;

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), leftMargin, y);
      y += 10;

      doc.setTextColor(0, 0, 0);
      return true;
    };

    const addText = (text, fontSize = 10, fontStyle = 'normal') => {
      if (!text || !checkPageBreak(6)) return false;

      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      doc.setTextColor(0, 0, 0);

      const maxWidth = rightMargin - leftMargin;
      const textLines = doc.splitTextToSize(text, maxWidth);

      textLines.forEach(line => {
        if (!checkPageBreak(6)) return false;
        doc.text(line, leftMargin, y);
        y += lineHeight;
      });

      return true;
    };

    const addBulletPoint = (text) => {
      if (!checkPageBreak(6)) return false;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const maxWidth = rightMargin - leftMargin - 10;
      const textLines = doc.splitTextToSize(text, maxWidth);

      textLines.forEach((line, index) => {
        if (!checkPageBreak(6)) return false;
        if (index === 0) {
          doc.text('•', leftMargin + 5, y);
          doc.text(line, leftMargin + 12, y);
        } else {
          doc.text(line, leftMargin + 12, y);
        }
        y += lineHeight;
      });

      return true;
    };

    // Start building PDF
    addHeader();
    addFooter();

    // Clean the text - remove HTML tags and fix formatting
    let cleanText = improved_resume
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();

    const lines = cleanText.split('\n');
    let processedLines = 0;
    const maxLines = 150; // Limit total lines for 2-page format

    for (let i = 0; i < lines.length && processedLines < maxLines; i++) {
      let line = lines[i].trim();
      if (!line) continue;

      // Skip if we've reached page limit
      if (currentPage > maxPages) break;

      if (line.startsWith('###')) {
        // Section header
        const title = line.replace(/###\s*/, '').trim();
        if (addSectionHeader(title)) {
          processedLines++;
        }

      } else if (line.startsWith('##')) {
        // Subsection
        const title = line.replace(/##\s*/, '').trim();
        if (checkPageBreak(8)) {
          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(title, leftMargin, y);
          y += 8;
          doc.setTextColor(0, 0, 0);
          processedLines++;
        }

      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        const text = line.replace(/\*\*/g, '');
        if (addText(text, 11, 'bold')) {
          processedLines++;
        }

      } else if (line.startsWith('-') || line.startsWith('•')) {
        // Bullet point
        const text = line.replace(/^[-•]\s*/, '');
        if (addBulletPoint(text)) {
          processedLines++;
        }

      } else if (line.startsWith('---')) {
        // Horizontal line
        if (checkPageBreak(4)) {
          doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.setLineWidth(0.3);
          doc.line(leftMargin, y, rightMargin, y);
          y += 6;
          processedLines++;
        }

      } else if (line.length > 0) {
        // Regular text
        if (addText(line, 10, 'normal')) {
          processedLines++;
        }
      }
    }

    // Add final branding
    if (checkPageBreak(20)) {
      y += 10;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(leftMargin, y, rightMargin - leftMargin, 15, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ENHANCED BY AI JOB COACH', pageWidth / 2, y + 10, { align: 'center' });
    }

    // Save PDF
    const fileName = uploadedFile ?
      `Improved_${uploadedFile.name.replace(/\.[^/.]+$/, "")}.pdf` :
      'Improved_Resume.pdf';

    doc.save(fileName);
    toast.success('Professional resume PDF downloaded successfully!');
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
      toast.error("Please upload a resume first");
      return;
    }

    if (!token) {
      toast.error("You must be logged in to analyze a resume");
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

      const analysis = result.analysis_report || null;

      // Update state
      setAnalysisResults(analysis);
      setShowResults(true);

      // ✅ Send ATS score to backend for saving with authorization
      if (analysis && token) {
        try {
          const saveResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ats-score`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
              ats_score: analysis.ats_score,
              strengths: analysis.strengths || [],
              weaknesses: analysis.weaknesses || [],
              final_report: analysis.final_report || "",
              resume_name: uploadedFile.name || "Untitled Resume",
            }),
          });

          if (!saveResponse.ok) {
            console.error("Failed to save ATS score:", saveResponse.status);
            toast.error("Failed to save analysis results");
          } else {
            const saveResult = await saveResponse.json();
            console.log("ATS score saved successfully:", saveResult);
            toast.success("Resume analyzed and saved successfully!");
          }
        } catch (saveError) {
          console.error("Error saving ATS score:", saveError);
          toast.error("Analysis completed but failed to save results");
        }
      }
    } catch (error) {
      console.error("Error analyzing resume:", error);
      toast.error("Error analyzing resume. Please try again.");
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
          className={`relative border-2 border-dashed rounded-2xl p-8 lg:p-12 text-center transition-colors ${dragActive
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
            className="bg-blue-600 cursor-pointer hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors"
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
              className="bg-green-600 cursor-pointer hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
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
