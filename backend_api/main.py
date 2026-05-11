from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from ingest import ingest_youtube_video
from rag import ask_question_stream

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class IngestRequest(BaseModel):
    video_url: str

class AskRequest(BaseModel):
    video_id: str
    question: str

@app.post("/ingest")
def ingest(request: IngestRequest):
    try:
        video_id = ingest_youtube_video(request.video_url)
        return {"video_id": video_id, "status": "success"}
    except Exception as e:
        # Sends the error in multiple formats so the Chrome Extension always catches it
        return JSONResponse(
            status_code=400, 
            content={"error": str(e), "message": str(e), "detail": str(e)}
        )

@app.post("/ask/stream")
def ask_stream(request: AskRequest):
    try:
        return StreamingResponse(
            ask_question_stream(request.video_id, request.question), 
            media_type="application/x-ndjson"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@app.get("/health")
def health():
    return {"status": "VidyaSync Backend Alive"}