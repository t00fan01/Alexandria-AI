import chromadb
import json
import os
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from dotenv import load_dotenv

# Load API Key from your .env file
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def ask_question_stream(video_id: str, question: str):
    try:
        # 1. Retrieve the best matching chunks from ChromaDB
        client = chromadb.PersistentClient(path="./chroma_db")
        collection = client.get_collection(name="vidyasync_transcripts")
        
        embedder = SentenceTransformer("all-MiniLM-L6-v2")
        q_emb = embedder.encode([question]).tolist()
        
        results = collection.query(
            query_embeddings=q_emb,
            where={"video_id": video_id},
            n_results=3
        )
        
        if not results['documents'] or not results['documents'][0]:
            yield json.dumps({"chunk": "I need to analyze a video first before answering."}) + "\n"
            yield json.dumps({"timestamps": [0, 0], "done": True}) + "\n"
            return
            
        context_texts = results['documents'][0]
        best_meta = results['metadatas'][0][0]
        combined_context = "\n\n".join(context_texts)
        
        # 2. Ask Gemini to answer using ONLY the video context
        prompt = f"""You are VidyaSync, an AI Learning Companion. 
        Answer the student's question using ONLY the provided video transcript context.
        Be concise, accurate, and helpful.
        
        Context:
        {combined_context}
        
        Question: {question}
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt, stream=True)
        
        # 3. Stream the characters back to the UI in real-time
        for chunk in response:
            if chunk.text:
                yield json.dumps({"chunk": chunk.text}) + "\n"
                
        # 4. Finish the stream and send the clickable timestamps
        yield json.dumps({
            "timestamps": [best_meta['start_time'], best_meta['end_time']], 
            "done": True
        }) + "\n"
        
    except Exception as e:
        yield json.dumps({"chunk": f"Error: {str(e)}"}) + "\n"
        yield json.dumps({"timestamps": [0, 0], "done": True}) + "\n"