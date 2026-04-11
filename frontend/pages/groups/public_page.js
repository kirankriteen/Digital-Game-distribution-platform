const chatFeed = document.getElementById('chatFeed');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const matchToggle = document.getElementById('matchToggle');

const socket = io("/", {
    auth: { token: localStorage.accessToken,
        groupId: '69d339c3404274711b8cdc9e'
     }
})

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

matchToggle.addEventListener('change', () => {
    const status = matchToggle.checked ? "Activated" : "Deactivated";
    appendMessage("System", `✨ Peer matching engine ${status}.`, true);
});

socket.on('message', (messageObj) => {
    console.log(messageObj)
    appendMessage(messageObj.username, messageObj.text, messageObj.username === 'Nebula_Bot');
});