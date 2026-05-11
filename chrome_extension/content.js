console.log('VidyaSync Injector Loaded');

let currentVideoId = null;
let isSidebarInjected = false;

function injectSidebar() {
  if (isSidebarInjected) return;

  const sidebarHTML = `
    <div id="vidyasync-sidebar" class="vidyasync-sidebar">
      <div class="vidyasync-header">
        <h2 class="vidyasync-title">✨ VidyaSync AI</h2>
        <button id="vidyasync-close" class="vidyasync-close">&times;</button>
      </div>
      
      <div id="vidyasync-status" class="vidyasync-status">
        <span class="status-dot" style="width:8px;height:8px;background:#94a3b8;border-radius:50%;display:inline-block;"></span>
        <span id="vidyasync-status-text">Ready to sync</span>
      </div>
      
      <div id="vidyasync-chat" class="vidyasync-chat-area">
        <div class="vidyasync-msg ai">Hi! Click 'Sync' to analyze this lecture.</div>
      </div>
      
      <div class="vidyasync-input-area">
        <div class="vidyasync-input-wrapper">
          <input type="text" id="vidyasync-input" class="vidyasync-input" placeholder="Ask a question..." disabled />
          <button id="vidyasync-send" class="vidyasync-send" disabled>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
        <button id="vidyasync-capture-btn" class="vidyasync-capture-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          Capture Board
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', sidebarHTML);
  isSidebarInjected = true;

  document.getElementById('vidyasync-close').addEventListener('click', () => {
    document.getElementById('vidyasync-sidebar').classList.remove('open');
  });

  const input = document.getElementById('vidyasync-input');
  const sendBtn = document.getElementById('vidyasync-send');

  const sendMessage = async () => {
    const question = input.value.trim();
    if (!question || !currentVideoId) return;

    appendMessage(question, 'user');
    input.value = '';

    const aiMsgId = 'msg-' + Date.now();
    appendMessage('...', 'ai', aiMsgId);
    const aiMsgEl = document.getElementById(aiMsgId);

    try {
      const response = await fetch('https://alexandria-ai-1ppc.onrender.com/ask/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: currentVideoId, question: question })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      aiMsgEl.textContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.text) {
                aiMsgEl.textContent += data.text;
                scrollToBottom();
              }
            } catch (e) {
              // Ignore partial JSON parsing errors
            }
          }
        }
      }
    } catch (err) {
      aiMsgEl.textContent = 'Error: Could not connect to backend.';
      console.error('VidyaSync Error:', err);
    }
  };

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  const captureBtn = document.getElementById('vidyasync-capture-btn');
  captureBtn.addEventListener('click', () => {
    const videoElements = document.getElementsByTagName('video');
    if (videoElements.length > 0) {
      const video = videoElements[0];
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');

      const chatArea = document.getElementById('vidyasync-chat');
      const msgEl = document.createElement('div');
      msgEl.className = 'vidyasync-msg user';
      msgEl.innerHTML = `Board Captured! (Image upload coming in V2)<br><img src="${dataUrl}" style="max-width: 100%; border-radius: 8px; margin-top: 8px;" alt="Captured Board" />`;
      chatArea.appendChild(msgEl);
      scrollToBottom();
    } else {
      appendMessage('Could not find video element to capture.', 'ai');
    }
  });
}

function appendMessage(text, sender, id = null) {
  const chatArea = document.getElementById('vidyasync-chat');
  const msgEl = document.createElement('div');
  msgEl.className = 'vidyasync-msg ' + sender;
  msgEl.textContent = text;
  if (id) msgEl.id = id;
  chatArea.appendChild(msgEl);
  scrollToBottom();
}

function scrollToBottom() {
  const chatArea = document.getElementById('vidyasync-chat');
  chatArea.scrollTop = chatArea.scrollHeight;
}

function updateStatus(text, color) {
  document.getElementById('vidyasync-status-text').textContent = text;
  document.querySelector('.vidyasync-status .status-dot').style.background = color;
}

async function handleSyncClick() {
  injectSidebar();
  const sidebar = document.getElementById('vidyasync-sidebar');
  sidebar.classList.add('open');

  const videoUrl = window.location.href;
  updateStatus('Analyzing Lecture...', '#f59e0b'); // amber

  try {
    const response = await fetch('https://alexandria-ai-1ppc.onrender.com/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_url: videoUrl })
    });

    const data = await response.json();
    if (data.status === 'success') {
      currentVideoId = data.video_id;
      updateStatus('Synced & Ready', '#10b981'); // green
      document.getElementById('vidyasync-input').disabled = false;
      document.getElementById('vidyasync-send').disabled = false;

      const chatArea = document.getElementById('vidyasync-chat');
      if (chatArea.children.length === 1) chatArea.innerHTML = '';

      appendMessage('Lecture synced! What are your doubts?', 'ai');
    } else {
      updateStatus('Sync Failed', '#ef4444'); // red
      appendMessage('Error: ' + data.message, 'ai');
    }
  } catch (err) {
    updateStatus('Connection Error', '#ef4444');
    appendMessage('Error: Could not reach backend server at https://alexandria-ai-1ppc.onrender.com.', 'ai');
    console.error('VidyaSync Error:', err);
  }
}

function injectButton() {
  const titleContainer = document.querySelector('h1.ytd-watch-metadata');

  if (titleContainer && !document.getElementById('vidyasync-sync-btn')) {
    const btn = document.createElement('button');
    btn.id = 'vidyasync-sync-btn';
    btn.className = 'vidyasync-btn';
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"></path></svg>
      Sync with VidyaSync
    `;

    // Insert into the title element
    titleContainer.appendChild(btn);
    btn.addEventListener('click', handleSyncClick);
  }
}

// YouTube is a SPA, so we need to observe DOM changes to reinject button on navigation
const observer = new MutationObserver(() => {
  if (window.location.href.includes('/watch')) {
    injectButton();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial injection attempt
if (window.location.href.includes('/watch')) {
  setTimeout(injectButton, 2000);
}
