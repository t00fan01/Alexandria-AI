# 🌿 Alexandria – AI Video Learning Companion

<div align="center">

![Alexandria Banner](https://img.shields.io/badge/Alexandria-AI%20Learning%20Companion-06b6d4?style=for-the-badge&logo=leaflet&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)

**The #1 Free AI-powered video summarizer — get expert-level summaries, key moments, and interactive Q&A from any YouTube video in one click.**

[🚀 Live Demo](#) · [📖 Docs](#api-reference) · [🐛 Report Bug](https://github.com/your-username/AI-Learning-Companion/issues) · [✨ Request Feature](https://github.com/your-username/AI-Learning-Companion/issues)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎬 **YouTube Ingestion** | Paste any YouTube URL — captions extracted instantly |
| 📁 **File Upload** | Upload `.mp4`, `.mp3`, `.webm` for AssemblyAI transcription |
| 🧠 **AI Summaries** | Gemini-powered overall, topic-wise, and last-N-minutes summaries |
| 💬 **Contextual Q&A** | RAG-based chat with streaming responses and timestamp citations |
| ⏱️ **Timeline Navigation** | Click any timestamp to jump to that exact moment in the video |
| 🗺️ **Topic Mind Map** | Visual breakdown of key concepts from the video |
| 📱 **Fully Responsive** | Works beautifully on desktop, tablet, and mobile |
| 🔌 **Chrome Extension Ready** | Architecture designed for seamless extension integration |

---

## 🏗️ Architecture

```
AI-Learning-Companion/
├── backend/                  # FastAPI Python backend
│   ├── main.py               # API routes & job orchestration
│   ├── ingest.py             # YouTube & file ingestion pipeline
│   ├── rag.py                # Retrieval-Augmented Generation (Q&A)
│   ├── summarizer.py         # Multi-mode AI summarization
│   ├── session.py            # Conversation memory
│   ├── requirements.txt      # Python dependencies
│   └── utils/
│       ├── chunker.py        # Transcript segmentation
│       ├── transcript_store.py
│       ├── quick_summary.py
│       └── env_loader.py
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx           # Main application layout
│   │   ├── index.css         # Design system & global styles
│   │   ├── responsive.css    # Mobile/tablet breakpoints
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── IngestPanel.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── ChatPanel.jsx
│   │   │   ├── SummaryDashboard.jsx
│   │   │   ├── Timeline.jsx
│   │   │   └── SkeletonLoader.jsx
│   │   └── api/              # API client helpers
│   └── index.html
├── render.yaml               # One-click Render.com deploy config
├── .env.example              # Environment variable template
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- A **Google Gemini API key** → [Get one free](https://aistudio.google.com/app/apikey)
- An **AssemblyAI API key** *(optional, for file upload)* → [Get one free](https://www.assemblyai.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/AI-Learning-Companion.git
cd AI-Learning-Companion
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your API keys:

```env
GOOGLE_API_KEY=your_google_gemini_api_key_here
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

### 3. Run the Backend

```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate    # macOS/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Start the API server
uvicorn backend.main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`  
Swagger docs: `http://localhost:8000/docs`

### 4. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`
or https://alexandria-ai-1ppc.onrender.com

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check & feature list |
| `POST` | `/ingest` | Ingest a YouTube video by URL |
| `POST` | `/ingest-file` | Upload a local audio/video file |
| `GET` | `/ingest-status/{job_id}` | Poll ingestion job progress |
| `POST` | `/ask` | Ask a question about a video |
| `POST` | `/ask/stream` | Streaming Q&A with NDJSON response |
| `GET` | `/summary/{video_id}` | Get overall AI summary |
| `GET` | `/topic-summaries/{video_id}` | Get topic-wise breakdown |
| `GET` | `/timestamps/{video_id}` | Get chapter timeline |
| `GET` | `/analysis/{video_id}` | Full analysis (summary + topics + timeline) |
| `GET` | `/health` | Service health status |

---

## ☁️ Deployment

### Deploy to Render (Recommended — Free Tier)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your GitHub repo — Render will auto-detect `render.yaml`
4. Add your environment variables (`GOOGLE_API_KEY`, `ASSEMBLYAI_API_KEY`) in the Render dashboard
5. Deploy! 🎉

### Deploy Frontend to Vercel / Netlify

```bash
cd frontend
npm run build
# Upload the `dist/` folder to Vercel, Netlify, or any static host
```

### Deploy Backend to Railway / Fly.io

```bash
# Railway
railway init
railway up

# Fly.io
fly launch
fly deploy
```

---

## 🔧 Configuration

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | ✅ Yes | Google Gemini API key for AI summarization & Q&A |
| `ASSEMBLYAI_API_KEY` | ⚠️ Optional | AssemblyAI key for file upload transcription |
| `ENABLE_CHROMA` | ❌ No | Set to `1` to enable persistent ChromaDB vector store |

---

## 🗺️ Roadmap

- [x] YouTube ingestion pipeline
- [x] Local file upload with AssemblyAI
- [x] Streaming Q&A chat
- [x] Timeline navigation
- [x] Topic-wise summaries
- [x] Fully responsive design
- [ ] **Chrome Extension** *(coming soon)*
- [ ] User accounts & saved sessions
- [ ] Multi-language support
- [ ] Podcast & Spotify episode support
- [ ] Export to Notion / Markdown

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgments

- [Google Gemini](https://deepmind.google/technologies/gemini/) — AI summarization & Q&A
- [AssemblyAI](https://www.assemblyai.com/) — Audio transcription
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — YouTube audio extraction
- [FastAPI](https://fastapi.tiangolo.com/) — Python web framework
- [Vite + React](https://vitejs.dev/) — Frontend tooling
---------------

extesion 

🟦 Frontend Layer
User + Chrome Extension
Handles interaction + data capture
🟩 Backend Layer
API Server
Routes requests + manages logic
🧠 AI Layer
Processing Engine
Analysis + embeddings + scoring
🗄️ Data Layer
Vector DB / Storage
Stores processed content for retrieval
⚡ Output Layer
Q&A + Guidance
Final user-facing intelligence
---


<div align="center">
<<<<<<< HEAD
  Made with 🌿 by Team Lemon
=======
  Made with 🌿 by Team Lemon</a>
>>>>>>> 24a52244a16beeae461be84b04d7c7b16b56d6f6
</div>
