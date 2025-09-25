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

  // Function to clean and format text for Quill editor
  const prepareContentForQuill = (rawContent) => {
    if (!rawContent) return "";

    // Clean up the content and structure it properly for Quill
    let cleaned = rawContent
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize line breaks
      .trim();

    // Split into lines and rebuild with proper structure
    const lines = cleaned.split('\n').filter(line => line.trim());
    let formatted = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Detect and format different types of content
      if (i < 3 && line.match(/^[A-Z][A-Za-z\s]+$/) && !line.includes('@') && !line.includes('COMPUTER')) {
        // Name
        formatted += `<h1><strong>${line}</strong></h1><br>`;
      } else if (line.includes('@') || line.includes('Phone:') || line.includes('GitHub:') || line.includes('Portfolio:') || line.includes('Mobile:')) {
        // Contact info
        formatted += `<p>${line}</p>`;
      } else if (line.match(/^[A-Z][A-Z\s]+:?$/) || line.match(/^\*\*[A-Z][A-Z\s]+\*\*$/) || line.match(/^#{1,3}\s*[A-Z][A-Z\s]+$/)) {
        // Section headers
        const sectionTitle = line.replace(/\*\*/g, '').replace(/:$/, '').replace(/^#+\s*/, '');
        formatted += `<br><h2><strong>${sectionTitle}</strong></h2><br>`;
      } else if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
        // Bullet points
        const bulletText = line.replace(/^[-•*]\s*/, '');
        formatted += `<p>• ${bulletText}</p>`;
      } else if (line.match(/^[A-Z][a-zA-Z\s&(),-]+$/) && !line.match(/^[A-Z][A-Z\s]+$/)) {
        // Subsection headers (job titles, education, etc.)
        formatted += `<p><strong>${line}</strong></p>`;
      } else {
        // Regular content
        formatted += `<p>${line}</p>`;
      }
    }

    return formatted;
  };

  // Function to extract structured data from content (for PDF generation)
  const parseResumeContent = (content) => {
    let textContent = content;

    // If content contains HTML, extract text
    if (content.includes('<')) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      textContent = tempDiv.textContent || tempDiv.innerText || '';
    }

    const lines = textContent.split('\n').filter(line => line.trim());
    const resumeData = {
      name: '',
      contact: [],
      sections: []
    };

    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Extract name (first significant line)
      if (i < 3 && line.match(/^[A-Z][A-Za-z\s]+$/) && !line.includes('@') && !line.includes('COMPUTER') && !resumeData.name) {
        resumeData.name = line;
        continue;
      }

      // Extract contact info
      if (line.includes('@') || line.includes('Phone:') || line.includes('GitHub:') || line.includes('Portfolio:') || line.includes('Mobile:')) {
        const cleanContact = line.replace(/(Email:|Phone:|GitHub:|Portfolio:|Mobile:)/gi, '').trim();
        if (cleanContact) {
          resumeData.contact.push(cleanContact);
        }
        continue;
      }

      // Detect section headers
      if (line.match(/^[A-Z][A-Z\s]+:?$/) || line.match(/^\*\*[A-Z][A-Z\s]+\*\*$/) || line.match(/^#{1,3}\s*[A-Z][A-Z\s]+$/)) {
        const sectionTitle = line.replace(/\*\*/g, '').replace(/:$/, '').replace(/^#+\s*/, '');
        currentSection = {
          title: sectionTitle,
          content: []
        };
        resumeData.sections.push(currentSection);
        continue;
      }

      // Add content to current section
      if (currentSection && line.length > 0) {
        currentSection.content.push(line);
      }
    }

    return resumeData;
  };

  // Enhanced Quill Editor Component
  const QuillEditor = ({ content, onChange, onSave }) => {
    const editorRef = useRef(null);
    const toolbarRef = useRef(null);
    const quillRef = useRef(null);
    const [isQuillReady, setIsQuillReady] = useState(false);
    const scriptsLoaded = useRef({
      highlight: false,
      quill: false,
      katex: false,
    });

    const initializeQuill = () => {
      if (!window.Quill || !window.hljs || !window.katex) {
        return;
      }

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

        // Set content properly
        if (content) {
          const formattedContent = prepareContentForQuill(content);
          quillRef.current.root.innerHTML = formattedContent;
        }

        // Listen for changes
        quillRef.current.on('text-change', () => {
          const htmlContent = quillRef.current.root.innerHTML;
          onChange(htmlContent);
        });

        setIsQuillReady(true);
        console.log("Quill initialized successfully");

      } catch (error) {
        console.error("Failed to initialize Quill:", error);
      }
    };

    const handleScriptLoad = (scriptName) => {
      scriptsLoaded.current[scriptName] = true;
      console.log(`${scriptName} script loaded`);

      if (Object.values(scriptsLoaded.current).every((loaded) => loaded)) {
        console.log("All scripts loaded, initializing Quill...");
        setTimeout(initializeQuill, 300);
      }
    };

    useEffect(() => {
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
      if (!document.querySelector('link[href*="quill.snow.css"]')) {
        const quillCSS = document.createElement('link');
        quillCSS.rel = 'stylesheet';
        quillCSS.href = 'https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css';
        document.head.appendChild(quillCSS);
      }

      if (!document.querySelector('link[href*="highlight.js"]')) {
        const hlCSS = document.createElement('link');
        hlCSS.rel = 'stylesheet';
        hlCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css';
        document.head.appendChild(hlCSS);
      }

      if (!document.querySelector('link[href*="katex"]')) {
        const katexCSS = document.createElement('link');
        katexCSS.rel = 'stylesheet';
        katexCSS.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(katexCSS);
      }

      return () => {
        if (quillRef.current) {
          quillRef.current = null;
        }
      };
    }, []);

    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div ref={toolbarRef} className="border-b border-slate-600 bg-slate-700 rounded-t-lg p-2 flex-shrink-0">
          <span className="ql-formats">
            <select className="ql-font text-white bg-slate-600"></select>
            <select className="ql-size text-white bg-slate-600"></select>
          </span>
          <span className="ql-formats">
            <button className="ql-bold text-white hover:text-blue-400"></button>
            <button className="ql-italic text-white hover:text-blue-400"></button>
            <button className="ql-underline text-white hover:text-blue-400"></button>
            <button className="ql-strike text-white hover:text-blue-400"></button>
          </span>
          <span className="ql-formats">
            <select className="ql-color text-white bg-slate-600"></select>
            <select className="ql-background text-white bg-slate-600"></select>
          </span>
          <span className="ql-formats">
            <button className="ql-header text-white hover:text-blue-400" value="1"></button>
            <button className="ql-header text-white hover:text-blue-400" value="2"></button>
            <button className="ql-blockquote text-white hover:text-blue-400"></button>
          </span>
          <span className="ql-formats">
            <button className="ql-list text-white hover:text-blue-400" value="ordered"></button>
            <button className="ql-list text-white hover:text-blue-400" value="bullet"></button>
            <button className="ql-indent text-white hover:text-blue-400" value="-1"></button>
            <button className="ql-indent text-white hover:text-blue-400" value="+1"></button>
          </span>
          <span className="ql-formats">
            <button className="ql-link text-white hover:text-blue-400"></button>
            <button className="ql-clean text-white hover:text-blue-400"></button>
          </span>
        </div>

        <div className="flex-1 overflow-hidden">
          <div
            ref={editorRef}
            className="h-full bg-slate-800 text-slate-100 border-l border-r border-slate-600 overflow-y-auto"
            style={{ minHeight: '300px' }}
          />
        </div>

        <div className="p-3 bg-slate-700 border-t border-slate-600 rounded-b-lg flex-shrink-0">
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center gap-2 ml-auto"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    );
  };

  // Enhanced content formatting function for display
  const formatResumeContent = (content) => {
    if (!content) return "";

    let formattedContent = content
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/\r\n/g, '\n')
      .trim();

    const lines = formattedContent.split('\n');
    let formatted = '';
    let inContactSection = false;
    let inSummarySection = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) continue;

      // Detect name (first significant line)
      if (i < 3 && line.match(/^[A-Z][A-Za-z\s]+$/) && !line.includes('@') && !line.includes('COMPUTER')) {
        formatted += `<h1 class="name-header">${line}</h1>\n`;
        continue;
      }

      // Detect contact information
      if (line.includes('@') || line.includes('Phone:') || line.includes('Email:') || line.includes('GitHub:') || line.includes('Portfolio:') || line.includes('Mobile:')) {
        if (!inContactSection) {
          formatted += '<div class="contact-section">\n';
          inContactSection = true;
        }

        line = line.replace(/(Email:|Phone:|Address:|Portfolio:|GitHub:|Mobile:)/gi, '<span class="contact-label">$1</span>');
        line = line.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<span class="contact-value">$1</span>');
        line = line.replace(/(\+?\d{10,})/g, '<span class="contact-value">$1</span>');
        formatted += `<p class="contact-item">${line}</p>\n`;
        continue;
      } else if (inContactSection) {
        formatted += '</div>\n';
        inContactSection = false;
      }

      // Detect major sections
      if (line.match(/^[A-Z][A-Z\s]+:?$/) || line.match(/^\*\*[A-Z][A-Z\s]+\*\*$/) || line.match(/^#{1,3}\s*[A-Z][A-Z\s]+$/)) {
        const sectionTitle = line.replace(/\*\*/g, '').replace(/:$/, '').replace(/^#+\s*/, '');

        if (sectionTitle.includes('SUMMARY') || sectionTitle.includes('OBJECTIVE')) {
          formatted += `<h2 class="section-header summary-header">${sectionTitle}</h2>\n`;
          inSummarySection = true;
        } else {
          formatted += `<h2 class="section-header">${sectionTitle}</h2>\n`;
          inSummarySection = false;
        }
        continue;
      }

      // Format job titles, education, etc.
      if (line.match(/^[A-Z][a-zA-Z\s&(),-]+$/) && !line.match(/^[A-Z][A-Z\s]+$/)) {
        formatted += `<h3 class="sub-header">${line}</h3>\n`;
        continue;
      }

      // Format bullet points
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
        const bulletText = line.replace(/^[-•*]\s*/, '');
        formatted += `<li class="bullet-item">${bulletText}</li>\n`;
        continue;
      }

      // Format dates
      if (line.match(/\d{4}/) && line.length < 50 && (line.includes('-') || line.includes('to') || line.includes('Present'))) {
        formatted += `<p class="date-info">${line}</p>\n`;
        continue;
      }

      // Format summary/objective content
      if (inSummarySection) {
        formatted += `<p class="summary-text">${line}</p>\n`;
        continue;
      }

      // Regular paragraph
      formatted += `<p class="regular-text">${line}</p>\n`;
    }

    if (inContactSection) {
      formatted += '</div>\n';
    }

    return formatted;
  };

  // Enhanced PDF viewer component
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

    if (isImproved && improvedContent) {
      return (
        <div className="bg-slate-800 rounded-lg h-full flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-slate-600 flex-shrink-0">
            <span className="text-sm text-slate-300">Enhanced Resume Content</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (!isEditing) {
                    // Prepare content for editing - use the raw content from API
                    const rawContent = analysisResults?.improved_resume?.improved_resume || improvedContent;
                    console.log("Preparing content for editing:", rawContent.substring(0, 100) + "...");
                    setEditedContent(rawContent);
                  }
                  setIsEditing(!isEditing);
                }}
                className={`px-3 py-1 text-white text-xs rounded flex items-center gap-1 transition-colors ${isEditing
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

          <div className="flex-1 overflow-hidden">
            {isEditing ? (
              <QuillEditor
                content={editedContent || analysisResults?.improved_resume?.improved_resume || improvedContent}
                onChange={(newContent) => {
                  console.log("Content updated in editor");
                  setEditedContent(newContent);
                }}
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
                    __html: highlightImprovedText(editedContent || improvedContent)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      );
    }

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

  // Enhanced highlighting function
  const highlightImprovedText = (content) => {
    if (!content) return "";

    let highlightedText = formatResumeContent(content);

    const actionWords = [
      'achieved', 'improved', 'increased', 'developed', 'implemented', 'managed', 'led', 'created',
      'designed', 'built', 'optimized', 'enhanced', 'streamlined', 'delivered', 'executed',
      'coordinated', 'supervised', 'analyzed', 'researched', 'collaborated', 'established',
      'contributed', 'facilitated', 'organized', 'mentored', 'trained', 'guided', 'spearheaded'
    ];

    const metricPattern = /(\b\d+%|\$\d+[,\d]*|\d+\+?\s*(?:years?|months?|projects?|clients?|users?|developers?|team members?|applications?|systems?)\b)/gi;
    highlightedText = highlightedText.replace(metricPattern, '<span class="metric-highlight">$1</span>');

    actionWords.forEach(word => {
      const pattern = new RegExp(`\\b${word}\\b`, 'gi');
      highlightedText = highlightedText.replace(pattern, `<span class="action-highlight">${word}</span>`);
    });

    const techSkills = [
      'JavaScript', 'Python', 'React', 'Node\\.js', 'HTML', 'CSS', 'SQL', 'MongoDB', 'Express',
      'Git', 'GitHub', 'AWS', 'Docker', 'Kubernetes', 'Firebase', 'TypeScript', 'C\\+\\+', 'Java',
      'Angular', 'Vue', 'Laravel', 'PHP', 'C#', 'Rust', 'Swift', 'Kotlin', 'Next\\.js', 'Linux'
    ];

    techSkills.forEach(skill => {
      const pattern = new RegExp(`\\b${skill.replace(/\\\./g, '\\.')}\\b`, 'gi');
      highlightedText = highlightedText.replace(pattern, `<span class="tech-highlight">${skill.replace(/\\\./g, '.')}</span>`);
    });

    const newContentPatterns = [
      /(Professional Summary|Key Achievements|Core Competencies|Technical Expertise|Notable Projects|Career Highlights)/gi,
      /(GPA \d\.\d+|Expected \d{4}|Dean's List|Summa Cum Laude|Magna Cum Laude)/gi
    ];

    newContentPatterns.forEach(pattern => {
      highlightedText = highlightedText.replace(pattern, '<span class="new-content-highlight">$1</span>');
    });

    return highlightedText;
  };

  // Preview Modal Component (unchanged structure, just better content handling)
  const PreviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-2">
      <div className="bg-[#0f1419] rounded-xl w-full h-full max-w-[98vw] max-h-[98vh] overflow-hidden border border-slate-600 flex flex-col">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 flex-1 min-h-0">
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-t border-slate-700 bg-slate-900 gap-4 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded inline-block"></span>
              <span>Improvements & New Content</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-400 rounded inline-block"></span>
              <span>Skills & Metrics</span>
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

      {/* Enhanced CSS Styles */}
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
          background: transparent !important;
        }

        .ql-toolbar button:hover {
          color: #60a5fa !important;
          background: rgba(59, 130, 246, 0.1) !important;
        }

        .ql-toolbar button.ql-active {
          color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.2) !important;
        }

        .ql-container {
          border-bottom: 1px solid #475569 !important;
          border-left: 1px solid #475569 !important;
          border-right: 1px solid #475569 !important;
          background: #1e293b !important;
        }

        .ql-editor {
          color: #e2e8f0 !important;
          line-height: 1.6 !important;
          font-size: 14px !important;
          padding: 20px !important;
        }

        /* Resume Content Formatting */
        .improved-content-display {
          line-height: 1.6;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: #e2e8f0;
          max-width: 100%;
        }

        .improved-content-display .name-header {
          color: #ffffff;
          font-size: 24px;
          font-weight: 800;
          text-align: center;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 3px solid #3b82f6;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .improved-content-display .contact-section {
          text-align: center;
          margin: 16px 0 24px 0;
          padding: 16px;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 8px;
          border: 1px solid #334155;
        }

        .improved-content-display .contact-item {
          margin: 4px 0;
          font-size: 14px;
        }

        .improved-content-display .contact-label {
          color: #10b981;
          font-weight: 600;
          margin-right: 8px;
        }

        .improved-content-display .contact-value {
          color: #60a5fa;
          font-weight: 500;
        }

        .improved-content-display .section-header {
          color: #3b82f6;
          font-size: 18px;
          font-weight: 700;
          margin: 24px 0 12px 0;
          padding: 8px 0;
          border-bottom: 2px solid #334155;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .improved-content-display .summary-header {
          color: #10b981;
        }

        .improved-content-display .sub-header {
          color: #e2e8f0;
          font-size: 16px;
          font-weight: 600;
          margin: 16px 0 8px 0;
        }

        .improved-content-display .summary-text {
          color: #cbd5e1;
          font-size: 15px;
          line-height: 1.7;
          margin: 8px 0;
          font-style: italic;
        }

        .improved-content-display .date-info {
          color: #a78bfa;
          font-weight: 500;
          font-size: 13px;
          margin: 4px 0;
        }

        .improved-content-display .bullet-item {
          margin: 6px 0;
          padding-left: 0;
          list-style: none;
          position: relative;
          color: #cbd5e1;
          line-height: 1.5;
        }

        .improved-content-display .bullet-item::before {
          content: "▶";
          color: #3b82f6;
          font-size: 12px;
          position: absolute;
          left: -16px;
          top: 2px;
        }

        .improved-content-display ul {
          margin: 12px 0;
          padding-left: 20px;
        }

        .improved-content-display .regular-text {
          margin: 8px 0;
          line-height: 1.6;
          color: #cbd5e1;
        }

        /* Highlighting Styles */
        .improved-content-display .action-highlight {
          background: linear-gradient(120deg, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.2) 100%);
          color: #4ade80;
          padding: 2px 4px;
          border-radius: 4px;
          font-weight: 600;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .improved-content-display .tech-highlight {
          background: linear-gradient(120deg, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.2) 100%);
          color: #60a5fa;
          padding: 2px 4px;
          border-radius: 4px;
          font-weight: 600;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .improved-content-display .metric-highlight {
          background: linear-gradient(120deg, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.2) 100%);
          color: #60a5fa;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .improved-content-display .new-content-highlight {
          background: linear-gradient(120deg, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.2) 100%);
          color: #4ade80;
          padding: 2px 4px;
          border-radius: 4px;
          font-weight: 600;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        /* Scrollbar styling */
        .improved-content-display::-webkit-scrollbar,
        .ql-editor::-webkit-scrollbar {
          width: 8px;
        }

        .improved-content-display::-webkit-scrollbar-track,
        .ql-editor::-webkit-scrollbar-track {
          background: rgba(71, 85, 105, 0.3);
          border-radius: 4px;
        }

        .improved-content-display::-webkit-scrollbar-thumb,
        .ql-editor::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 4px;
        }

        .improved-content-display::-webkit-scrollbar-thumb:hover,
        .ql-editor::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.7);
        }
        `
      }} />
    </div>
  );

  // Enhanced PDF Download matching the exact format from the image
  const downloadPDF = (content) => {
    if (!content) {
      toast.error("No content available to download");
      return;
    }

    const doc = new jsPDF();
    const resumeData = parseResumeContent(content);

    let y = 20;
    const pageWidth = 210;
    const pageHeight = 297;
    const leftMargin = 20;
    const rightMargin = 190;
    const lineHeight = 5;

    // Color scheme matching the image
    const colors = {
      headerBlue: [52, 152, 219],    // Professional blue header
      darkText: [0, 0, 0],           // Black text
      white: [255, 255, 255]         // White text
    };

    // Helper functions
    const checkPageBreak = (requiredSpace) => {
      if (y + requiredSpace > pageHeight - 20) {
        doc.addPage();
        y = 20;
        return true;
      }
      return false;
    };

    const addBlueHeader = (name) => {
      // Blue header background matching the image
      doc.setFillColor(colors.headerBlue[0], colors.headerBlue[1], colors.headerBlue[2]);
      doc.rect(0, 0, pageWidth, 35, 'F');

      // "ENHANCED RESUME" title in white
      doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ENHANCED RESUME', pageWidth / 2, 22, { align: 'center' });

      y = 45;
    };

    const addPersonalInfo = (name, contacts) => {
      // Name
      doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(name || "Professional Name", leftMargin, y);
      y += 8;

      // Contact information in a clean format
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      contacts.forEach(contact => {
        if (contact.trim()) {
          doc.text(contact.trim(), leftMargin, y);
          y += 5;
        }
      });

      y += 5; // Extra space after contact info
    };

    const addSectionTitle = (title) => {
      checkPageBreak(15);

      // Section title in bold
      doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(title, leftMargin, y);
      y += 8;
    };

    const addJobTitle = (title, date = null) => {
      checkPageBreak(10);

      doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');

      if (date) {
        doc.text(title, leftMargin, y);
        doc.text(date, rightMargin, y, { align: 'right' });
      } else {
        doc.text(title, leftMargin, y);
      }

      y += 6;
    };

    const addBulletText = (text) => {
      checkPageBreak(8);

      doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // Add bullet point
      doc.text('•', leftMargin + 5, y);

      // Add text with proper wrapping
      const maxWidth = rightMargin - leftMargin - 15;
      const textLines = doc.splitTextToSize(text, maxWidth);

      textLines.forEach((line, index) => {
        doc.text(line, leftMargin + 12, y + (index * lineHeight));
      });

      y += (textLines.length * lineHeight) + 2;
    };

    const addRegularText = (text) => {
      checkPageBreak(8);

      doc.setTextColor(colors.darkText[0], colors.darkText[1], colors.darkText[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const maxWidth = rightMargin - leftMargin;
      const textLines = doc.splitTextToSize(text, maxWidth);

      textLines.forEach((line, index) => {
        doc.text(line, leftMargin, y + (index * lineHeight));
      });

      y += (textLines.length * lineHeight) + 3;
    };

    const addSkillsSection = (skills) => {
      if (!skills || skills.length === 0) return;

      checkPageBreak(20);

      // Skills in a modern grid layout
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      const skillsPerRow = 3;
      const skillWidth = (rightMargin - leftMargin) / skillsPerRow;

      skills.forEach((skill, index) => {
        const row = Math.floor(index / skillsPerRow);
        const col = index % skillsPerRow;
        const x = leftMargin + (col * skillWidth);
        const skillY = y + (row * 8);

        // Skill background
        doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
        doc.roundedRect(x, skillY - 4, skillWidth - 5, 7, 2, 2, 'F');

        // Skill text
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        doc.text(skill.trim(), x + 2, skillY);
      });

      y += Math.ceil(skills.length / skillsPerRow) * 8 + 10;
    };

    const addFooter = () => {
      // Professional footer
      doc.setFontSize(8);
      doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
      doc.setFont('helvetica', 'italic');

      // Footer line
      doc.setDrawColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
      doc.setLineWidth(0.5);
      doc.line(leftMargin, pageHeight - 20, rightMargin, pageHeight - 20);

      // Footer text
      const footerText = `Generated by AI Job Coach • ${new Date().toLocaleDateString()}`;
      doc.text(footerText, pageWidth / 2, pageHeight - 12, { align: 'center' });
    };

    // Generate the PDF matching the image format
    console.log("Generating PDF with exact format from image:", resumeData);

    // Add blue header
    addBlueHeader();

    // Add personal information
    addPersonalInfo(resumeData.name, resumeData.contact);

    // Process each section
    resumeData.sections.forEach(section => {
      if (section.title && section.content.length > 0) {
        addSectionTitle(section.title);

        section.content.forEach(item => {
          const trimmedItem = item.trim();
          if (!trimmedItem) return;

          // Parse different types of content
          if (trimmedItem.includes('—') && trimmedItem.match(/\d{4}/)) {
            // Job title with date (e.g., "Intern (Ongoing), BIRDEM General Hospital, Shahbagh, Dhaka — Expected 2025")
            const parts = trimmedItem.split('—');
            if (parts.length === 2) {
              addJobTitle(parts[0].trim(), parts[1].trim());
            } else {
              addJobTitle(trimmedItem);
            }
          }
          else if (trimmedItem.startsWith('•') || trimmedItem.startsWith('-') || trimmedItem.startsWith('*')) {
            // Bullet point
            addBulletText(trimmedItem.replace(/^[•\-*]\s*/, ''));
          }
          else if (trimmedItem.match(/^[A-Z]/)) {
            // Company names or other important lines
            addRegularText(trimmedItem);
          }
          else {
            // Regular text
            addRegularText(trimmedItem);
          }
        });

        y += 5; // Space between sections
      }
    });

    // Save the PDF
    const fileName = resumeData.name
      ? `${resumeData.name.replace(/\s+/g, '_')}_Enhanced_Resume.pdf`
      : 'Enhanced_Resume.pdf';

    doc.save(fileName);
    toast.success("PDF generated with exact format from image!");
  };

  // Initialize edited content properly
  useEffect(() => {
    if (analysisResults?.improved_resume?.improved_resume && !editedContent) {
      console.log("Initializing content for editing...");
      setEditedContent("");
    }
  }, [analysisResults]);

  // Rest of the component functions remain unchanged...
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

  const removeFile = () => {
    setUploadedFile(null);
    setShowResults(false);
    setAnalysisResults(null);
    setEditedContent("");
    if (originalFileURL) {
      URL.revokeObjectURL(originalFileURL);
      setOriginalFileURL(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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