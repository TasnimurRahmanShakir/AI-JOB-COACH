import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  X,
  Eye,
  ArrowLeft,
  ArrowRight,
  Edit3,
  Save,
} from "lucide-react";
import { useState, useRef, useContext, useEffect } from "react";
import { jsPDF } from "jspdf";
import AuthContext from "../context/authContext";
import toast from "react-hot-toast";

// Declare global for Quill
// (No need for TypeScript 'declare global' in .jsx files)

function ResumeAnalysis() {
  const { token } = useContext(AuthContext);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [originalFileURL, setOriginalFileURL] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const fileInputRef = useRef(null);

  // Quill Editor Component
  const QuillEditor = ({ content, onChange, onSave }) => {
    const editorRef = useRef(null);
    const toolbarRef = useRef(null);
    const quillRef = useRef(null);
    const scriptsLoaded = useRef({
      highlight: false,
      quill: false,
      katex: false,
    });

    const initializeQuill = () => {
      // Check if all required scripts are loaded
      if (!window.Quill || !window.hljs || !window.katex) {
        return;
      }

      // Only initialize once
      if (quillRef.current || !editorRef.current || !toolbarRef.current) {
        return;
      }

      try {
        quillRef.current = new window.Quill(editorRef.current, {
          modules: {
            syntax: true,
            toolbar: toolbarRef.current,
          },
          placeholder: "Edit your enhanced resume content...",
          theme: "snow",
        });

        // Set initial content
        if (content) {
          quillRef.current.root.innerHTML = content;
        }

        // Listen for text changes
        quillRef.current.on('text-change', () => {
          const htmlContent = quillRef.current.root.innerHTML;
          onChange(htmlContent);
        });

      } catch (error) {
        console.error("Failed to initialize Quill:", error);
      }
    };

    const handleScriptLoad = (scriptName) => {
      scriptsLoaded.current[scriptName] = true;

      // Try to initialize when all scripts are loaded
      if (Object.values(scriptsLoaded.current).every((loaded) => loaded)) {
        // Small delay to ensure DOM is ready
        setTimeout(initializeQuill, 100);
      }
    };

    useEffect(() => {
      // Load scripts if not already loaded
      if (!window.Quill) {
        const quillScript = document.createElement('script');
        quillScript.src = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js';
        quillScript.onload = () => handleScriptLoad('quill');
        document.head.appendChild(quillScript);
      } else {
        handleScriptLoad('quill');
      }

      if (!window.hljs) {
        const hlScript = document.createElement('script');
        hlScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
        hlScript.onload = () => handleScriptLoad('highlight');
        document.head.appendChild(hlScript);
      } else {
        handleScriptLoad('highlight');
      }

      if (!window.katex) {
        const katexScript = document.createElement('script');
        katexScript.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
        katexScript.onload = () => handleScriptLoad('katex');
        document.head.appendChild(katexScript);
      } else {
        handleScriptLoad('katex');
      }

      // Load CSS files
      const quillCSS = document.createElement('link');
      quillCSS.rel = 'stylesheet';
      quillCSS.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css';
      document.head.appendChild(quillCSS);

      const hlCSS = document.createElement('link');
      hlCSS.rel = 'stylesheet';
      hlCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
      document.head.appendChild(hlCSS);

      const katexCSS = document.createElement('link');
      katexCSS.rel = 'stylesheet';
      katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(katexCSS);

      // Cleanup function
      return () => {
        if (quillRef.current) {
          quillRef.current = null;
        }
      };
    }, []);

    // Update content when prop changes
    useEffect(() => {
      if (quillRef.current && content) {
        const currentContent = quillRef.current.root.innerHTML;
        if (currentContent !== content) {
          quillRef.current.root.innerHTML = content;
        }
      }
    }, [content]);

    return (
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        <div ref={toolbarRef} className="border-b border-slate-600 bg-slate-700 rounded-t-lg">
          <span className="ql-formats">
            <select className="ql-font"></select>
            <select className="ql-size"></select>
          </span>
          <span className="ql-formats">
            <button className="ql-bold"></button>
            <button className="ql-italic"></button>
            <button className="ql-underline"></button>
            <button className="ql-strike"></button>
          </span>
          <span className="ql-formats">
            <select className="ql-color"></select>
            <select className="ql-background"></select>
          </span>
          <span className="ql-formats">
            <button className="ql-header" value="1"></button>
            <button className="ql-header" value="2"></button>
            <button className="ql-blockquote"></button>
          </span>
          <span className="ql-formats">
            <button className="ql-list" value="ordered"></button>
            <button className="ql-list" value="bullet"></button>
            <button className="ql-indent" value="-1"></button>
            <button className="ql-indent" value="+1"></button>
          </span>
          <span className="ql-formats">
            <button className="ql-link"></button>
            <button className="ql-clean"></button>
          </span>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          className="flex-1 bg-slate-800 text-slate-100 min-h-[400px] border-l border-r border-b border-slate-600 rounded-b-lg"
        />

        {/* Save Button */}
        <div className="mt-2 flex justify-end">
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    );
  };

  // Enhanced PDF viewer component with editing capability
  const PDFViewer = ({ fileUrl, title, isImproved = false, improvedContent = null }) => {
    if (!fileUrl && !improvedContent) {
      return (
        <div className="bg-slate-800 rounded-lg p-8 h-full flex items-center justify-center">
          <div className="text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-4" />
            <p>No content available</p>
          </div>
        </div>
      );
    }

    // For improved resume with editing capability
    if (isImproved && improvedContent) {
      return (
        <div className="bg-slate-800 rounded-lg h-full flex flex-col">
          {/* Edit Controls */}
          <div className="flex items-center justify-between p-3 border-b border-slate-600">
            <span className="text-sm text-slate-300">Enhanced Resume Content</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (!isEditing) {
                    setEditedContent(highlightImprovedText(improvedContent));
                  }
                }}
                className={`px-3 py-1 text-white text-xs rounded flex items-center gap-1 ${isEditing
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {isEditing ? (
                  <>
                    <X className="w-3 h-3" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {isEditing ? (
              <QuillEditor
                content={editedContent || highlightImprovedText(improvedContent)}
                onChange={setEditedContent}
                onSave={() => {
                  setIsEditing(false);
                  toast.success("Changes saved!");
                }}
              />
            ) : (
              <div className="p-4 h-full overflow-y-auto">
                <div
                  className="text-slate-100 text-sm leading-relaxed improved-content-display"
                  dangerouslySetInnerHTML={{
                    __html: editedContent || highlightImprovedText(improvedContent)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    // For original PDF
    return (
      <div className="bg-slate-800 rounded-lg overflow-hidden h-full">
        {fileUrl ? (
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0"
            title={title}
          />
        ) : (
          <div className="p-8 h-full flex items-center justify-center text-center text-slate-400">
            <div>
              <FileText className="w-12 h-12 mx-auto mb-4" />
              <p>Original resume will be displayed here</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Function to highlight improvements with simple color coding
  const highlightImprovedText = (content) => {
    if (!content) return "";

    let highlightedText = content;

    // Highlight action verbs and achievements (Green)
    const actionWords = [
      'achieved', 'improved', 'increased', 'developed', 'implemented', 'managed', 'led', 'created',
      'designed', 'built', 'optimized', 'enhanced', 'streamlined', 'delivered', 'executed',
      'coordinated', 'supervised', 'analyzed', 'researched', 'collaborated', 'established',
      'contributed', 'facilitated', 'organized', 'mentored', 'trained', 'guided'
    ];

    // Highlight metrics and numbers (Blue)
    const metricPattern = /(\b\d+%|\$\d+[,\d]*|\d+\+?\s*(?:years?|months?|projects?|clients?|users?|developers?|team members?)\b)/gi;
    highlightedText = highlightedText.replace(metricPattern, '<span class="metric-highlight">$1</span>');

    // Highlight action words
    actionWords.forEach(word => {
      const pattern = new RegExp(`\\b${word}\\b`, 'gi');
      highlightedText = highlightedText.replace(pattern, `<span class="action-highlight">${word}</span>`);
    });

    // Highlight technical skills
    const techSkills = [
      'JavaScript', 'Python', 'React', 'Node\\.js', 'HTML', 'CSS', 'SQL', 'MongoDB', 'Express',
      'Git', 'GitHub', 'AWS', 'Docker', 'Kubernetes', 'Firebase', 'TypeScript', 'C\\+\\+', 'Java',
      'Angular', 'Vue', 'Laravel', 'PHP', 'C#', 'Rust', 'Swift', 'Kotlin'
    ];

    techSkills.forEach(skill => {
      const pattern = new RegExp(`\\b${skill.replace(/\\\./g, '\\.')}\\b`, 'gi');
      highlightedText = highlightedText.replace(pattern, `<span class="tech-highlight">${skill.replace(/\\\./g, '.')}</span>`);
    });

    // Highlight new content and improvements (Green background)
    const newContentPatterns = [
      /(Key Achievements|Professional Summary|Core Competencies|Technical Expertise|Notable Projects)/gi,
      /(evidence-based|patient-centered|specialized|clinical expertise|professional setting)/gi,
      /(Expected 2025|GPA \d\.\d+)/gi,
      /(Basic Life Support|Infection Prevention|American Heart Association)/gi
    ];

    newContentPatterns.forEach(pattern => {
      highlightedText = highlightedText.replace(pattern, '<span class="new-content-highlight">$1</span>');
    });

    return highlightedText;
  };

  // Preview Modal Component with Quill editor integration
  const PreviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-2">
      <div className="bg-[#0f1419] rounded-xl w-full h-full max-w-[98vw] max-h-[98vh] overflow-hidden border border-slate-600 flex flex-col">
        {/* Modal Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">Resume Comparison & Editor</h2>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-slate-300">Original</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-300">Enhanced {isEditing && "(Editing)"}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setShowPreview(false);
              setIsEditing(false);
            }}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700 flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Comparison View - Flexible */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 flex-1 min-h-0">
          {/* Original Resume Panel */}
          <div className="bg-slate-900 flex flex-col min-h-0">
            <div className="bg-slate-800 p-3 border-b border-slate-600 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white">Original Resume</h3>
              </div>
            </div>
            <div className="p-3 flex-1 min-h-0">
              <PDFViewer
                fileUrl={originalFileURL}
                title="Original Resume"
                isImproved={false}
              />
            </div>
          </div>

          {/* Enhanced Resume Panel with Editor */}
          <div className="bg-slate-900 border-l border-slate-700 flex flex-col min-h-0">
            <div className="bg-slate-800 p-3 border-b border-slate-600 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-white">Enhanced Resume</h3>
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">AI Enhanced</span>
                {isEditing && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">Editing</span>}
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <PDFViewer
                fileUrl={null}
                title="Enhanced Resume"
                isImproved={true}
                improvedContent={analysisResults?.improved_resume?.improved_resume}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer - Fixed */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-t border-slate-700 bg-slate-900 gap-4 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded inline-block"></span>
              <span>Improvements</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-400 rounded inline-block"></span>
              <span>Metrics & Skills</span>
            </div>
            {isEditing && (
              <div className="text-yellow-400 text-xs">
                ✏️ Use the rich editor to customize your resume
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => {
                setShowPreview(false);
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
            >
              Close
            </button>
            <button
              onClick={() => downloadPDF(editedContent || analysisResults?.improved_resume?.improved_resume)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Download {editedContent ? "Edited" : "Enhanced"}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced CSS Styles for highlighting and Quill */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Quill Editor Styles */
        .ql-toolbar {
          border-top: 1px solid #475569 !important;
          border-left: 1px solid #475569 !important;
          border-right: 1px solid #475569 !important;
          background: #334155 !important;
        }

        .ql-toolbar .ql-picker-label,
        .ql-toolbar .ql-picker-item,
        .ql-toolbar button {
          color: #e2e8f0 !important;
        }

        .ql-toolbar button:hover {
          color: #3b82f6 !important;
        }

        .ql-container {
          border-bottom: 1px solid #475569 !important;
          border-left: 1px solid #475569 !important;
          border-right: 1px solid #475569 !important;
          background: #1e293b !important;
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
        }

        .ql-editor {
          color: #e2e8f0 !important;
          line-height: 1.6 !important;
          font-size: 14px !important;
        }

        .ql-editor.ql-blank::before {
          color: #64748b !important;
        }

        /* Content Display Styles */
        .improved-content-display .action-highlight {
          background: linear-gradient(120deg, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.1) 100%);
          color: #4ade80;
          padding: 1px 3px;
          border-radius: 3px;
          font-weight: 600;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .improved-content-display .tech-highlight {
          background: linear-gradient(120deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.1) 100%);
          color: #60a5fa;
          padding: 1px 3px;
          border-radius: 3px;
          font-weight: 600;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .improved-content-display .metric-highlight {
          background: linear-gradient(120deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.1) 100%);
          color: #60a5fa;
          padding: 1px 4px;
          border-radius: 3px;
          font-weight: 700;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .improved-content-display .new-content-highlight {
          background: linear-gradient(120deg, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.1) 100%);
          color: #4ade80;
          padding: 1px 3px;
          border-radius: 3px;
          font-weight: 600;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .improved-content-display {
          line-height: 1.6;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .improved-content-display p {
          margin-bottom: 1em;
        }

        /* Scrollbar styling */
        .improved-content-display::-webkit-scrollbar {
          width: 8px;
        }

        .improved-content-display::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.3);
          border-radius: 4px;
        }

        .improved-content-display::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 4px;
        }

        .improved-content-display::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.7);
        }
        `
      }} />
    </div>
  );

  // ----- PDF Download with edited content support -----
  const downloadPDF = (content) => {
    if (!content) {
      toast.error("No content available to download");
      return;
    }

    const doc = new jsPDF();
    let y = 20;
    const pageWidth = 210;
    const pageHeight = 297;
    const leftMargin = 15;
    const rightMargin = 195;
    const lineHeight = 6;
    let currentPage = 1;
    const maxPages = 3;

    // Colors
    const primaryColor = [41, 128, 185];
    const secondaryColor = [52, 73, 94];
    const lightGray = [149, 165, 166];

    // Helper Functions
    const addHeader = () => {
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(editedContent ? 'EDITED RESUME' : 'ENHANCED RESUME', pageWidth / 2, 16, { align: 'center' });
      y = 35;
    };

    const addFooter = () => {
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setFontSize(8);
      doc.text(`Page ${currentPage} of ${maxPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
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
    let cleanText = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    const lines = cleanText.split('\n');
    let processedLines = 0;
    const maxLines = 200;

    for (let i = 0; i < lines.length && processedLines < maxLines; i++) {
      let line = lines[i].trim();
      if (!line) continue;

      if (currentPage > maxPages) break;

      if (line.startsWith('###')) {
        const title = line.replace(/###\s*/, '').trim();
        if (addSectionHeader(title)) {
          processedLines++;
        }
      } else if (line.startsWith('##')) {
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
        const text = line.replace(/\*\*/g, '');
        if (addText(text, 11, 'bold')) {
          processedLines++;
        }
      } else if (line.startsWith('-') || line.startsWith('•')) {
        const text = line.replace(/^[-•]\s*/, '');
        if (addBulletPoint(text)) {
          processedLines++;
        }
      } else if (line.startsWith('---')) {
        if (checkPageBreak(4)) {
          doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.setLineWidth(0.3);
          doc.line(leftMargin, y, rightMargin, y);
          y += 6;
          processedLines++;
        }
      } else if (line.length > 0) {
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
      doc.text('CREATED WITH AI JOB COACH', pageWidth / 2, y + 10, { align: 'center' });
    }

    const fileName = uploadedFile ?
      `${editedContent ? 'Edited' : 'Enhanced'}_${uploadedFile.name.replace(/\.[^/.]+$/, "")}.pdf` :
      `${editedContent ? 'Edited' : 'Enhanced'}_Resume.pdf`;

    doc.save(fileName);
    toast.success(`${editedContent ? 'Edited' : 'Enhanced'} resume downloaded successfully!`);
  };

  // Initialize edited content when analysis results are available
  useEffect(() => {
    if (analysisResults?.improved_resume?.improved_resume) {
      setEditedContent(highlightImprovedText(analysisResults.improved_resume.improved_resume));
    }
  }, [analysisResults]);

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
      toast.error("Please upload only PDF or DOCX files");
      return;
    }

    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadedFile(file);
    const fileURL = URL.createObjectURL(file);
    setOriginalFileURL(fileURL);
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
      setAnalysisResults(analysis);
      setShowResults(true);

      if (analysis && token) {
        try {
          const saveResponse = await fetch(`http://localhost:5000/api/ats-score`, {
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
    if (originalFileURL) {
      URL.revokeObjectURL(originalFileURL);
      setOriginalFileURL(null);
    }
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
          Upload your resume to get detailed feedback, AI enhancements, and edit capabilities.
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
                Select File
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
                AI Analysis Report
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {analysisResults.final_report}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowPreview(true)}
              className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Compare & Edit
            </button>
            <button
              className="bg-green-600 cursor-pointer hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              onClick={() => downloadPDF(editedContent || analysisResults?.improved_resume?.improved_resume)}
            >
              <Download className="w-5 h-5" />
              Download Resume
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && <PreviewModal />}
    </div>
  );
}

export default ResumeAnalysis;