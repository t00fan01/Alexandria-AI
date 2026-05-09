import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Video, 
  FileText, 
  Layers, 
  Play, 
  Upload, 
  Search, 
  Sparkles,
  ArrowRight,
  Send,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react';

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoId, setVideoId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [questionInput, setQuestionInput] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const fileInputRef = useRef(null);
  const youtubeInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleNavClick = (e, section) => {
    e.preventDefault();
    showToast(`${section} section coming soon!`);
  };

  const handleStartBuilding = () => {
    youtubeInputRef.current?.focus();
    youtubeInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      showToast('File Uploading... (Coming Soon in V2)');
      // Reset input so the same file can be selected again
      e.target.value = null;
    }
  };

  const handleAnalyze = async () => {
    if (!youtubeUrl.trim()) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('http://localhost:8000/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: youtubeUrl.trim() })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setVideoId(data.video_id);
        setChatHistory([{ sender: 'ai', text: 'Lecture analyzed successfully! What would you like to know?' }]);
      } else {
        setErrorMsg(data.message || data.error || 'Failed to analyze video.');
      }
    } catch (err) {
      setErrorMsg('Network error. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!questionInput.trim() || !videoId) return;
    
    const userQ = questionInput.trim();
    setQuestionInput('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userQ }]);
    
    // Add empty placeholder for AI response
    setChatHistory(prev => [...prev, { sender: 'ai', text: '' }]);
    
    try {
      const res = await fetch('http://localhost:8000/ask/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, question: userQ })
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch response');
      }
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');
        
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.chunk) {
              setChatHistory(prev => {
                const newHistory = [...prev];
                newHistory[newHistory.length - 1].text += data.chunk;
                return newHistory;
              });
            }
          } catch (e) {
            // Ignore incomplete chunks
          }
        }
      }
    } catch (err) {
      setChatHistory(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1].text = 'Error generating response. Please try again.';
        return newHistory;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-orange-50 font-sans text-slate-900 selection:bg-blue-200 relative">
      
      {/* Global Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-full text-sm font-medium shadow-lg animate-in slide-in-from-top-4 fade-in duration-300">
          <Info className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">VidyaSync</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#platform" onClick={(e) => handleNavClick(e, 'Platform')} className="hover:text-slate-900 transition-colors">Platform</a>
          <a href="#solutions" onClick={(e) => handleNavClick(e, 'Solutions')} className="hover:text-slate-900 transition-colors">Solutions</a>
          <a href="#pricing" onClick={(e) => handleNavClick(e, 'Pricing')} className="hover:text-slate-900 transition-colors">Pricing</a>
        </div>
        
        <button onClick={handleStartBuilding} className="hidden md:flex px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm">
          Start Building
        </button>
      </nav>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center flex flex-col items-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-slate-200/60 shadow-sm backdrop-blur-sm text-sm font-medium text-slate-600 mb-8">
          <Sparkles className="w-4 h-4 text-orange-500" />
          Powered by RAG & Vector Search
        </div>

        {/* Headlines */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
          Cultivate Knowledge with <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
            Interactive AI
          </span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-slate-500 mb-10 leading-relaxed">
          Transform static lectures into dynamic, conversational experiences. Paste any YouTube link or upload your materials, and let VidyaSync build your personalized AI tutor instantly.
        </p>

        {/* Action Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button onClick={() => setQuestionInput('Can you give me step-by-step homework help for this topic?')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:shadow-sm hover:border-slate-300 transition-all">
            <Search className="w-4 h-4 text-blue-500" />
            Homework Help
          </button>
          <button onClick={() => setQuestionInput('Summarize the key takeaways from this live recording.')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:shadow-sm hover:border-slate-300 transition-all">
            <Video className="w-4 h-4 text-green-500" />
            Live Recording
          </button>
          <button onClick={() => setQuestionInput('Generate comprehensive notes for this lecture.')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:shadow-sm hover:border-slate-300 transition-all">
            <FileText className="w-4 h-4 text-orange-500" />
            AI Notes
          </button>
          <button onClick={() => setQuestionInput('Create 5 flashcards based on this lecture.')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:shadow-sm hover:border-slate-300 transition-all">
            <Layers className="w-4 h-4 text-purple-500" />
            AI Flashcards
          </button>
        </div>

        {/* Core Inputs */}
        <div className="w-full max-w-3xl flex flex-col gap-4 text-left">
          
          {/* YouTube Input Bar */}
          <div className="relative group flex items-center bg-white rounded-full p-2 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="pl-4 pr-2 text-slate-400">
              <Play className="w-5 h-5" />
            </div>
            <input 
              ref={youtubeInputRef}
              type="text" 
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="Paste YouTube URL or lecture link..." 
              className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 text-base min-w-0"
            />
            <button 
              onClick={handleAnalyze}
              disabled={isLoading || !youtubeUrl.trim()}
              className="px-6 py-3 rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze Lecture
                  <ArrowRight className="w-4 h-4 hidden sm:block" />
                </>
              )}
            </button>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 rounded-2xl bg-white/50 backdrop-blur-sm p-8 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-white hover:border-blue-300 cursor-pointer mt-2"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.png,.jpg,.jpeg"
            />
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-1">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-slate-600 font-medium text-center">Drag & drop your PDFs or Images</p>
            <p className="text-slate-400 text-sm mb-2 text-center">Supported formats: PDF, PNG, JPG (up to 50MB)</p>
            <button className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors pointer-events-none">
              Select file
            </button>
          </div>
        </div>
      </main>

      {/* Workspace Area */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        {!videoId ? (
          /* Skeleton Container */
          <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-3xl bg-white/40 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl overflow-hidden flex flex-col items-center justify-center relative transition-all duration-500">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            <div className="w-16 h-16 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center mb-4 relative z-10 border border-slate-100">
              <Video className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 relative z-10">Workspace Preview</h3>
            <p className="text-slate-500 mt-2 text-center max-w-md relative z-10">
              The interactive video player and intelligent chat interface will seamlessly integrate here.
            </p>
          </div>
        ) : (
          /* Active Workspace */
          <div className="w-full h-[600px] rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200 overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-500">
            
            {/* Video Player Area */}
            <div className="flex-1 bg-slate-950 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 relative group">
              <iframe 
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen>
              </iframe>
            </div>

            {/* Chat Sidebar Area */}
            <div className="w-full md:w-[400px] bg-slate-50 flex flex-col h-[400px] md:h-full">
              
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-2 shadow-sm z-10 shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-slate-800">VidyaSync AI Tutor</h3>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {chatHistory.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`max-w-[85%] rounded-2xl p-3 text-[15px] leading-relaxed shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white self-end rounded-tr-sm' 
                        : 'bg-white border border-slate-200 text-slate-700 self-start rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                    placeholder="Ask a question about the lecture..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-full pl-4 pr-12 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  <button 
                    onClick={handleAsk}
                    disabled={!questionInput.trim()}
                    className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </section>

    </div>
  );
}

export default App;
