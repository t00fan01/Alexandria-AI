document.addEventListener('DOMContentLoaded', () => {
    const summarizeBtn = document.getElementById('summarizeBtn');

    summarizeBtn.addEventListener('click', async () => {
        const statusText = document.getElementById('status');
        const summaryBox = document.getElementById('summaryBox');

        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const urlParams = new URL(tab.url).searchParams;
        const videoId = urlParams.get('v');

        if (!videoId) {
            statusText.innerText = "Error: Not a valid YouTube video URL.";
            return;
        }

        const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;

        statusText.innerText = "1/3: Sending to backend... ⏳";
        summaryBox.style.display = "none";

        try {
            // 1. Kick off the heavy processing job
            const ingestResponse = await fetch('https://alexandria-ai-1ppc.onrender.com/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ video_url: cleanUrl })
            });

            if (!ingestResponse.ok) {
                statusText.innerText = `API Error: ${ingestResponse.status}`;
                return;
            }

            // 2. The polling loop (Upgraded to 2.5 minutes for long videos)
            statusText.innerText = "2/3: AI is processing (can take 1-2 mins)... 🧠";

            let attempts = 0;
            const maxAttempts = 30; // 30 attempts * 5 seconds = 2.5 minutes

            while (attempts < maxAttempts) {
                attempts++;

                try {
                    const sumRes = await fetch(`https://alexandria-ai-1ppc.onrender.com/summary/${videoId}`);

                    if (sumRes.ok) {
                        const data = await sumRes.json();
                        const text = data.summary || data.content || data.response || JSON.stringify(data);

                        // Check if it's a real summary (longer than 50 chars) and not a pending message
                        if (text.length > 50 && !text.toLowerCase().includes("not available")) {
                            statusText.innerText = "3/3: Done! ✨";
                            summaryBox.style.display = "block";
                            // Make the text formatting look clean
                            summaryBox.innerHTML = text.replace(/\n/g, '<br><br>');
                            return; // SUCCESS: Exit the function completely
                        }
                    }
                } catch (e) {
                    // Silently catch 404s/network errors while waiting for the backend to finish
                }

                // Wait 5 seconds before knocking on the backend's door again
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            // If it hits 2.5 minutes and still isn't done
            statusText.innerText = "Timeout: Video is very long! Check localhost:5173 in a minute.";

        } catch (error) {
            statusText.innerText = "Fatal Error: Backend is offline. Is Uvicorn running?";
        }
    });
});