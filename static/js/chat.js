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
    const searchBar = document.querySelector('.search-bar');

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
            // ===== PERSON 3: MEDIA FEATURES =====
            const img = document.createElement('img');
            img.src = msgData.content;
            img.className = 'chat-image';
            img.alt = 'Image message';
            img.addEventListener('click', () => {
                const lightboxModal = document.getElementById('lightbox-modal');
                const lightboxImg = document.getElementById('lightbox-img');
                const lightboxCaption = document.getElementById('lightbox-caption');
                lightboxImg.src = msgData.content;
                lightboxCaption.textContent = `Sent by ${isSentByMe ? 'Me' : 'User'}`;
                lightboxModal.classList.add('active');
            });
            contentDiv.innerHTML = '';
            contentDiv.appendChild(img);
        } else if (msgData.msg_type === 'voice') {
            contentDiv.innerHTML = '<span style="color:var(--text-muted);font-style:italic;">[Voice message removed]</span>';
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
                allUsers = users;
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

    // ===== PERSON 3: MEDIA FEATURES =====

    const attachmentBtn = document.getElementById('attachment-btn');
    const mediaFileInput = document.getElementById('media-file-input');
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeLightbox = document.getElementById('close-lightbox');

    // Image Upload Click Trigger
    attachmentBtn.addEventListener('click', () => {
        if (!currentRoom) {
            alert('Please select a chat first.');
            return;
        }
        mediaFileInput.click();
    });

    // Handle Image Selection and Upload
    mediaFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Client-side validation: mime type and extension
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
        const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
        const ext = file.name.split('.').pop().toLowerCase();

        if (!allowedMimeTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
            alert('Invalid file type. Only PNG, JPG, GIF, and WEBP images are allowed.');
            mediaFileInput.value = '';
            return;
        }

        // Show upload progress indicator
        const progressOverlay = document.createElement('div');
        progressOverlay.className = 'upload-progress-overlay';
        progressOverlay.innerHTML = `
            <div class="progress-spinner"></div>
            <div class="progress-text">Uploading image...</div>
        `;
        document.querySelector('.chat-area').appendChild(progressOverlay);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            progressOverlay.remove();
            mediaFileInput.value = '';

            if (res.ok) {
                const data = await res.json();
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'message',
                        room: currentRoom,
                        content: data.url,
                        msg_type: 'image',
                        sender_id: currentUser.id
                    }));
                }
            } else {
                const errData = await res.json();
                alert(`Upload failed: ${errData.error || 'Unknown error'}`);
            }
        } catch (err) {
            progressOverlay.remove();
            mediaFileInput.value = '';
            console.error('Image upload error:', err);
            alert('An error occurred during file upload.');
        }
    });

    // Lightbox Close Handlers
    closeLightbox.addEventListener('click', () => {
        lightboxModal.classList.remove('active');
    });

    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
            lightboxModal.classList.remove('active');
        }
    });

    // ===== PERSON 3: GROUPS UI =====

    const newGroupBtn = document.getElementById('new-group-btn');
    const groupModal = document.getElementById('group-modal');
    const closeGroupModal = document.getElementById('close-group-modal');
    const cancelGroupBtn = document.getElementById('cancel-group-btn');
    const submitGroupBtn = document.getElementById('submit-group-btn');
    const groupNameInput = document.getElementById('group-name-input');
    const memberSearchInput = document.getElementById('member-search-input');
    const memberSelectList = document.getElementById('member-select-list');

    const groupInfoPanel = document.getElementById('group-info-panel');
    const closeGroupInfoBtn = document.getElementById('close-group-info-btn');
    const groupInfoName = document.getElementById('group-info-name');
    const groupMembersList = document.getElementById('group-members-list');
    const chatHeaderInfo = document.getElementById('chat-header-info');

    const addMemberSelect = document.getElementById('add-member-select');
    const addMemberSubmitBtn = document.getElementById('add-member-submit-btn');

    let allUsers = [];

    // Open Create Group Modal
    newGroupBtn.addEventListener('click', async () => {
        groupNameInput.value = '';
        memberSearchInput.value = '';
        memberSelectList.innerHTML = '<div class="progress-text" style="text-align: center;">Loading users...</div>';
        groupModal.classList.add('active');

        try {
            const res = await apiFetch('/api/users');
            if (res.ok) {
                allUsers = await res.json();
                renderMemberList();
            } else {
                memberSelectList.innerHTML = '<div class="progress-text" style="color: #ef4444;">Failed to load users.</div>';
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
            memberSelectList.innerHTML = '<div class="progress-text" style="color: #ef4444;">Failed to load users.</div>';
        }
    });

    // Render users with checkboxes in the Create Group Modal
    function renderMemberList(filterText = '') {
        memberSelectList.innerHTML = '';
        const query = filterText.toLowerCase();

        allUsers.forEach(user => {
            if (user.id === currentUser.id) return; // Skip self
            if (query && !user.username.toLowerCase().includes(query)) return;

            const div = document.createElement('label');
            div.className = 'member-select-item';
            div.innerHTML = `
                <input type="checkbox" value="${user.id}" data-username="${escapeHTML(user.username)}">
                <span class="member-select-name">${escapeHTML(user.username)}</span>
            `;
            memberSelectList.appendChild(div);
        });

        if (memberSelectList.children.length === 0) {
            memberSelectList.innerHTML = '<div class="progress-text" style="text-align: center;">No users found.</div>';
        }
    }

    // Modal Search Filter Listener
    memberSearchInput.addEventListener('input', (e) => {
        renderMemberList(e.target.value);
    });

    // Close Modals
    function closeGroupCreationModal() {
        groupModal.classList.remove('active');
    }

    closeGroupModal.addEventListener('click', closeGroupCreationModal);
    cancelGroupBtn.addEventListener('click', closeGroupCreationModal);

    groupModal.addEventListener('click', (e) => {
        if (e.target === groupModal) {
            closeGroupCreationModal();
        }
    });

    // Submit Group Creation
    submitGroupBtn.addEventListener('click', async () => {
        const name = groupNameInput.value.trim();
        if (!name) {
            alert('Group name is required.');
            return;
        }

        const selectedCheckboxes = memberSelectList.querySelectorAll('input[type="checkbox"]:checked');
        const member_ids = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));

        // Submit to API
        try {
            const res = await apiFetch('/api/groups', {
                method: 'POST',
                body: JSON.stringify({ name, member_ids })
            });

            if (res.ok) {
                const data = await res.json();
                closeGroupCreationModal();
                
                // Reload sidebar to show the new group
                await loadSidebar();

                const room = `group_${data.group.id}`;
                
                // Join the room locally and select it
                selectRoom(room, data.group.name);
            } else {
                const errData = await res.json();
                alert(`Failed to create group: ${errData.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Group creation error:', err);
            alert('An error occurred while creating the group.');
        }
    });

    // Toggle Group Info Side Panel
    async function loadGroupMembers(groupId) {
        groupMembersList.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted);">Loading members...</div>';
        try {
            const res = await apiFetch(`/api/groups/${groupId}/members`);
            if (res.ok) {
                const members = await res.json();
                groupMembersList.innerHTML = '';
                
                if (addMemberSelect) {
                    addMemberSelect.innerHTML = '<option value="">Select user...</option>';
                    const memberIds = new Set(members.map(m => m.user_id));
                    allUsers.forEach(user => {
                        if (user.id !== currentUser.id && !memberIds.has(user.id)) {
                            const opt = document.createElement('option');
                            opt.value = user.id;
                            opt.textContent = user.username;
                            addMemberSelect.appendChild(opt);
                        }
                    });
                }

                members.forEach(member => {
                    const name = member.username || 'Unknown';
                    const div = document.createElement('div');
                    div.className = 'member-item';
                    div.innerHTML = `
                        <div class="member-avatar">${name.charAt(0).toUpperCase()}</div>
                        <div class="member-name">${escapeHTML(name)}</div>
                    `;
                    groupMembersList.appendChild(div);
                });
            } else {
                groupMembersList.innerHTML = '<div style="font-size:0.85rem; color:#ef4444;">Failed to load members.</div>';
            }
        } catch (err) {
            console.error('Failed to load group members:', err);
            groupMembersList.innerHTML = '<div style="font-size:0.85rem; color:#ef4444;">Error loading members.</div>';
        }
    }

    if (addMemberSubmitBtn) {
        addMemberSubmitBtn.addEventListener('click', async () => {
            const userId = addMemberSelect.value;
            if (!userId) return;
            const groupId = currentRoom.split('_')[1];

            addMemberSubmitBtn.disabled = true;
            try {
                const res = await apiFetch(`/api/groups/${groupId}/members`, {
                    method: 'POST',
                    body: JSON.stringify({ user_id: parseInt(userId) })
                });

                if (res.ok) {
                    loadGroupMembers(groupId);
                } else {
                    const errData = await res.json();
                    alert(`Failed to add member: ${errData.error || 'Unknown error'}`);
                }
            } catch (err) {
                console.error('Failed to add member:', err);
            } finally {
                addMemberSubmitBtn.disabled = false;
            }
        });
    }

    chatHeaderInfo.addEventListener('click', () => {
        if (!currentRoom || !currentRoom.startsWith('group_')) {
            // Only toggle for groups
            groupInfoPanel.classList.remove('active');
            return;
        }

        const active = groupInfoPanel.classList.toggle('active');
        if (active) {
            const groupId = currentRoom.split('_')[1];
            groupInfoName.textContent = chatHeaderTitle.textContent;
            loadGroupMembers(groupId);
        }
    });

    closeGroupInfoBtn.addEventListener('click', () => {
        groupInfoPanel.classList.remove('active');
    });

    // Update selectRoom to also update or close the group info panel
    const originalSelectRoom = selectRoom;
    selectRoom = function(roomId, title) {
        originalSelectRoom(roomId, title);
        
        // Hide panel if not a group, or update it if already open
        if (roomId.startsWith('group_')) {
            if (groupInfoPanel.classList.contains('active')) {
                const groupId = roomId.split('_')[1];
                groupInfoName.textContent = title;
                loadGroupMembers(groupId);
            }
        } else {
            groupInfoPanel.classList.remove('active');
        }
    };

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

    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.contact-item').forEach(item => {
                const name = item.querySelector('.contact-name').textContent.toLowerCase();
                if (name.includes(query)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    // Init
    loadSidebar();
    initWebSocket();
});
