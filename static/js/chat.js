// static/js/chat.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwt');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!currentUser.id) {
        window.location.href = '/login';
        return;
    }

    // UI Elements
    const usersList = document.getElementById('users-list');
    const groupsList = document.getElementById('groups-list');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatHeaderTitle = document.getElementById('chat-header-title');
    const chatStatusText = document.getElementById('chat-status-text');
    const logoutBtn = document.getElementById('logout-btn');

    let currentRoom = null;
    let ws = null;
    let typingTimeout = null;

    // Helper: Linkify text
    function linkify(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, function(url) {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
    }

    // API Helper with auth header
    async function apiFetch(url, options = {}) {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            localStorage.removeItem('jwt');
            window.location.href = '/login';
        }
        return response;
    }

    // Initialize WebSocket
    function initWebSocket() {
        // Build WS URL based on current protocol/host
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WebSocket connected');
            chatStatusText.textContent = 'Online';
            if (currentRoom) {
                joinRoom(currentRoom);
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWsMessage(data);
            } catch (err) {
                console.error('Error parsing WS message:', err);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            chatStatusText.textContent = 'Offline - Reconnecting...';
            setTimeout(initWebSocket, 3000);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    }

    function handleWsMessage(data) {
        // Only process messages for the current room
        if (data.room !== currentRoom) return;

        if (data.type === 'message') {
            appendMessage(data);
            chatStatusText.textContent = 'Online'; // Clear typing indicator
        } else if (data.type === 'typing' && data.sender_id !== currentUser.id) {
            chatStatusText.textContent = 'typing...';
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                chatStatusText.textContent = 'Online';
            }, 3000);
        }
    }

    // Render message to UI
    function appendMessage(msgData) {
        const isSentByMe = msgData.sender_id === currentUser.id;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSentByMe ? 'sent' : 'received'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (msgData.msg_type === 'text' || !msgData.msg_type) {
            // Render text
            contentDiv.innerHTML = linkify(escapeHTML(msgData.content));
        } else if (msgData.msg_type === 'image') {
            // HOOK: Person 3 will add image rendering here (msg_type === 'image')
            contentDiv.innerHTML = `<em>[Image attached] ${linkify(escapeHTML(msgData.content))}</em>`;
        } else if (msgData.msg_type === 'voice') {
            // HOOK: Person 3 will add voice rendering here (msg_type === 'voice')
            contentDiv.innerHTML = `<em>[Voice message attached]</em>`;
        }
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        if (msgData.timestamp) {
            const date = new Date(msgData.timestamp);
            timeSpan.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            timeSpan.textContent = 'Just now';
        }
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeSpan);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Escape HTML helper to prevent XSS
    function escapeHTML(str) {
        const p = document.createElement('p');
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    }

    function generateDmRoomId(id1, id2) {
        return `dm_${Math.min(id1, id2)}_${Math.max(id1, id2)}`;
    }

    function selectRoom(roomId, title) {
        if (currentRoom === roomId) return;
        
        currentRoom = roomId;
        chatHeaderTitle.textContent = title;
        chatMessages.innerHTML = ''; // Clear messages
        chatStatusText.textContent = 'Connecting...';
        
        // Update active styling in sidebar
        document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.querySelector(`.contact-item[data-room="${roomId}"]`);
        if (activeItem) activeItem.classList.add('active');

        // Remove the empty state
        const emptyState = document.getElementById('no-chat-selected');
        if (emptyState) emptyState.style.display = 'none';

        // Send WS join event
        joinRoom(roomId);

        // Load history via REST
        loadMessageHistory(roomId);
    }

    function joinRoom(roomId) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'join',
                room: roomId
            }));
            // We consider an initial connection token here since we append it in URL
            chatStatusText.textContent = 'Online';
        }
    }

    async function loadMessageHistory(roomId) {
        try {
            const res = await apiFetch(`/api/messages/${roomId}`);
            if (res.ok) {
                const messages = await res.json();
                messages.forEach(msg => appendMessage(msg));
            }
        } catch (err) {
            console.error('Failed to load history', err);
        }
    }

    async function loadSidebar() {
        try {
            // Fetch users
            const usersRes = await apiFetch('/api/users');
            if (usersRes.ok) {
                const users = await usersRes.json();
                usersList.innerHTML = '';
                users.forEach(user => {
                    if (user.id === currentUser.id) return; // Skip self
                    
                    const room = generateDmRoomId(currentUser.id, user.id);
                    const div = document.createElement('div');
                    div.className = 'contact-item';
                    div.dataset.room = room;
                    div.innerHTML = `
                        <div class="contact-avatar">${user.username.charAt(0).toUpperCase()}</div>
                        <div class="contact-info">
                            <div class="contact-name">${escapeHTML(user.username)}</div>
                        </div>
                    `;
                    div.addEventListener('click', () => selectRoom(room, user.username));
                    usersList.appendChild(div);
                });
            }

            // Fetch groups
            const groupsRes = await apiFetch('/api/groups');
            if (groupsRes.ok) {
                const groups = await groupsRes.json();
                groupsList.innerHTML = '';
                groups.forEach(group => {
                    const room = `group_${group.id}`;
                    const div = document.createElement('div');
                    div.className = 'contact-item';
                    div.dataset.room = room;
                    div.innerHTML = `
                        <div class="contact-avatar group-avatar">#</div>
                        <div class="contact-info">
                            <div class="contact-name">${escapeHTML(group.name)}</div>
                        </div>
                    `;
                    div.addEventListener('click', () => selectRoom(room, group.name));
                    groupsList.appendChild(div);
                });
            }
        } catch (err) {
            console.error('Failed to load sidebar', err);
        }
    }

    // Sending messages
    function sendMessage() {
        if (!currentRoom) return;
        
        const content = chatInput.value.trim();
        if (!content) return;
        
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'message',
                room: currentRoom,
                content: content,
                msg_type: 'text',
                sender_id: currentUser.id
            }));
            
            chatInput.value = '';
            chatInput.focus();
        }
    }

    // Events
    sendBtn.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        } else {
            // Emit typing event
            if (ws && ws.readyState === WebSocket.OPEN && currentRoom) {
                ws.send(JSON.stringify({
                    type: 'typing',
                    room: currentRoom
                }));
            }
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        window.location.href = '/login';
    });

    // Init
    loadSidebar();
    initWebSocket();
});
