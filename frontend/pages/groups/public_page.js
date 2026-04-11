const chatFeed = document.getElementById('chatFeed');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const matchToggle = document.getElementById('matchToggle');
const groupList = document.getElementById('groupList');
const groupSearch = document.getElementById('groupSearch');
const newGroupName = document.getElementById('newGroupName');
const createGroupBtn = document.getElementById('createGroupBtn');
const groupError = document.getElementById('groupError');

let allGroups = [];
let currentGroupId = null;

const socket = io("/", {
    auth: { token: localStorage.accessToken,
        groupId: '69d339c3404274711b8cdc9e'
     }
})

async function loadGroups() {
    try {
        const res = await fetch('/group/get-user-groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.accessToken}`
            }
        });

        const data = await res.json();
        console.log(data)

        if (!data.success) return;

        allGroups = data.groups;
        renderGroups(allGroups);

    } catch (err) {
        console.error(err);
    }
}

createGroupBtn.addEventListener('click', async () => {
    const name = newGroupName.value.trim();

    groupError.style.display = "none";

    if (!name) {
        showError("Group name cannot be empty");
        return;
    }

    const exists = allGroups.some(
        g => g.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
        showError("Group name already exists");
        return;
    }

    try {
        const res = await fetch('/group/create-user-group', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.accessToken}`
            },
            body: JSON.stringify({ "group": name })
        });

        const data = await res.json();

        if (!res.ok || data.error) {
    showError(data.error || "Failed to create group");
    return;
}

        newGroupName.value = "";
        loadGroups(); // refresh sidebar

    } catch (err) {
        console.error(err);
        showError("Server error");
    }
});

function showError(msg) {
    groupError.textContent = msg;
    groupError.style.display = "block";
}

groupSearch.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase();

    const filtered = allGroups.filter(group =>
        group.name.toLowerCase().includes(value)
    );

    renderGroups(filtered);
});

function renderGroups(groups) {
    groupList.innerHTML = '';

    groups.forEach(group => {
        const div = document.createElement('div');
        div.className = 'channel-item';
        div.textContent = `# ${group.name}`;

        div.onclick = () => selectGroup(group);

        groupList.appendChild(div);
    });
}

function selectGroup(group) {
    currentGroupId = group._id;

    document.querySelector('.glass-header h3').textContent = group.name;

    const joinBtn = document.querySelector('.btn-action');

    const isMember = group.members?.some(
        m => m.user_id === localStorage.user_id
    );

    chatFeed.innerHTML = '';

    if (!isMember) {
        // ❌ NOT JOINED STATE
        joinBtn.textContent = "Join Group";
        joinBtn.disabled = false;

        joinBtn.onclick = () => joinGroup(group._id);

        appendMessage("System", "🔒 Join this group to view messages", true);

        return;
    }

    // ✅ JOINED STATE
    joinBtn.textContent = "Joined";
    joinBtn.disabled = true;

    joinBtn.onclick = null;

    loadMessages(group._id);
}

async function joinGroup(groupId) {
    try {
        const res = await fetch('/group/join-user-group', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.accessToken}`
            },
            body: JSON.stringify({ groupId })
        });
        const data = await res.json();
        console.log(data)

        if (!data.success) return alert(data.error || "Failed to join");

        document.querySelector('.btn-action').textContent = "Joined";
        document.querySelector('.btn-action').disabled = true;

        loadMessages(groupId);

    } catch (err) {
        console.error(err);
    }
}

async function loadMessages(groupId) {
    try {
        const res = await fetch('/group/get-user-messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.accessToken}`
            },
            body: JSON.stringify({ groupId })
        });

        const data = await res.json();
        console.log(data)
        if (!data.messages) return;

        chatFeed.innerHTML = '';

        data.messages.reverse().forEach(msg => {
            appendMessage(
                msg.sender.username,
                msg.text
            );
        });

    } catch (err) {
        console.error(err);
    }
}

function appendMessage(user, text, isSystem = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg';

    if (isSystem) {
        msgDiv.style.justifyContent = 'center';
        msgDiv.innerHTML = `<span style="background: var(--card-bg); padding: 6px 18px; border-radius: 20px; font-size: 11px; color: var(--accent); border: 1px solid var(--border);">${text}</span>`;
    } else {
        msgDiv.innerHTML = `
                    <div class="avatar" style="background: #444;"></div>
                    <div class="msg-content">
                        <h4>${user} <span class="timestamp">Just now</span></h4>
                        <p style="margin:0; opacity: 0.9;">${text}</p>
                    </div>
                `;
    }

    chatFeed.appendChild(msgDiv);
    chatFeed.scrollTop = chatFeed.scrollHeight;
}

sendBtn.addEventListener('click', () => {
    const msg = userInput.value.trim();
    if (msg !== "") {
        // appendMessage("You", msg);  
        socket.emit('chatMessage', msg); 
        userInput.value = "";
    }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// matchToggle.addEventListener('change', () => {
//     const status = matchToggle.checked ? "Activated" : "Deactivated";
//     appendMessage("System", `✨ Peer matching engine ${status}.`, true);
// });

socket.on('message', (messageObj) => {
    console.log(messageObj)
    appendMessage(messageObj.username, messageObj.text, messageObj.username === 'Nebula_Bot');
});

loadGroups();