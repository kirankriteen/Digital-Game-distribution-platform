const chatFeed = document.getElementById('chatFeed');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const matchToggle = document.getElementById('matchToggle');

const socket = io();

const botName = 'Nebula_Bot'

socket.on('message', message => {
    console.log(message)
    if(message.username === botName) {
        appendMessage(message.username, message.text, true)
    } else {
        appendMessage(message.username, message.text)
    }
    chatFeed.scrollTop = chatFeed.scrollHeight;
})




// --- Basic Chat Logic ---
function appendMessage(user, text, isBot = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg';
    const color = isBot ? 'var(--accent)' : '#444';

    msgDiv.innerHTML = `
                <div class="avatar" style="background: ${color};"></div>
                <div class="msg-content">
                    <h4>${user} <span class="timestamp">Just now</span></h4>
                    <p>${text}</p>
                </div>
            `;
    chatFeed.appendChild(msgDiv);
    chatFeed.scrollTop = chatFeed.scrollHeight;
}

sendBtn.addEventListener('click', () => {
    const msg = userInput.value
    socket.emit('chatMessage', msg);

    userInput.value = ''
    userInput.focus()
    
    // if (userInput.value.trim() !== "") {
    //     appendMessage("You", userInput.value);
    //     userInput.value = "";
    // }
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// --- Matchmaking System Toggle ---
matchToggle.addEventListener('change', () => {
    const status = matchToggle.checked ? "Activated" : "Deactivated";
    appendMessage("System", `Recommendation engine ${status}.`, true);
});

// --- Simple Drag and Drop Feature ---
const workspace = document.querySelector('.main-workspace');

workspace.addEventListener('dragover', (e) => {
    e.preventDefault();
    workspace.style.background = "rgba(99, 102, 241, 0.05)";
});

workspace.addEventListener('dragleave', () => {
    workspace.style.background = "var(--panel-main)";
});

workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    workspace.style.background = "var(--panel-main)";
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        appendMessage("System", `Uploading ${files[0].name} to group repository...`, true);
        setTimeout(() => {
            appendMessage("Nebula_Bot", `Scan complete: No vulnerabilities found in ${files[0].name}. Build ready.`, true);
        }, 2000);
    }
});