import re
import os
import time
import uuid
import chromadb
import yt_dlp
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

try:
    from youtube_transcript_api import YouTubeTranscriptApi
except ImportError:
    YouTubeTranscriptApi = None

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="vidyasync_transcripts")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def _extract_youtube_id(url: str):
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'(?:be\/)([0-9A-Za-z_-]{11}).*'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return url if len(url) == 11 else None

def _generate_transcript_with_gemini(url: str):
    print("No CC found. Initiating Gemini Auto-Transcription Fallback...")
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

    # WINERROR 32 FIX: Unique filename using UUID
    unique_filename = f"temp_vidyasync_{uuid.uuid4().hex}.mp4"

    ydl_opts = {
        'format': 'worst[ext=mp4]',
        'outtmpl': unique_filename,
        'quiet': True
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    print("Uploading to Gemini...")
    video_file = genai.upload_file(path=unique_filename)

    while video_file.state.name == "PROCESSING":
        time.sleep(2)
        video_file = genai.get_file(video_file.name)

    print("Generating Transcript...")
    # 404 ERROR FIX: Standard model tag
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content([video_file, "Please transcribe the spoken audio of this video exactly. If there is no speech, describe what is happening in detail."])

    # Clean up
    if os.path.exists(unique_filename):
        try:
            os.remove(unique_filename)
        except Exception as e:
            print(f"Warning: Could not remove temp file: {e}")
    genai.delete_file(video_file.name)

    return [{'text': response.text, 'start': 0.0, 'duration': 999.0}]

def ingest_youtube_video(url: str) -> str:
    video_id = _extract_youtube_id(url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")

    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        raw_transcript = next(iter(transcript_list)).fetch()
    except Exception:
        raw_transcript = _generate_transcript_with_gemini(url)

    chunks = []
    current_text = []
    start_time = raw_transcript[0]['start']
    
    for entry in raw_transcript:
        current_text.append(entry['text'])
        current_duration = (entry['start'] + entry.get('duration', 0)) - start_time
        
        if current_duration >= 30.0:
            chunks.append({
                'text': " ".join(current_text).replace('\n', ' '),
                'start_time': start_time,
                'end_time': entry['start'] + entry.get('duration', 0)
            })
            current_text = []
            start_time = entry['start']
            
    if current_text:
        chunks.append({
            'text': " ".join(current_text).replace('\n', ' '),
            'start_time': start_time,
            'end_time': raw_transcript[-1]['start'] + raw_transcript[-1].get('duration', 0)
        })

    documents = [c['text'] for c in chunks]
    metadatas = [{"video_id": video_id, "start_time": c['start_time'], "end_time": c['end_time']} for c in chunks]
    ids = [f"{video_id}_{idx}" for idx in range(len(chunks))]
    
    embeddings = embedder.encode(documents).tolist()
    
    collection.upsert(
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids
    )
    
    return video_id