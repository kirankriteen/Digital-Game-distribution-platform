const downloadingList = document.getElementById("downloading-list");
const availableList = document.getElementById("available-list");
const completedList = document.getElementById("completed-list");

const queueEl = document.getElementById("queue");
const speedEl = document.getElementById("speed");

let downloading = [];
let available = [];
let completed = [];

// FETCH OWNED GAMES
async function loadDownloads() {
    const res = await fetch("http://localhost:3000/my-games", {
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });

    const games = await res.json();
    available = games;
    renderAll();
}

// RENDER
function renderAll() {
    renderAvailable();
    renderDownloading();
    renderCompleted();
    updateStats();
}

// AVAILABLE
function renderAvailable() {
    availableList.innerHTML = "";

    available.forEach((g,i) => {
        availableList.innerHTML += `
        <div class="dl-card">
            <img src="${g.thumbnail || 'https://via.placeholder.com/80'}" class="dl-thumb">
            <div>
                <h3>${g.title}</h3>
                <div class="dl-meta">
                    <span>Ready to download</span>
                    <span>-</span>
                </div>
            </div>
            <div class="dl-actions">
                <button class="icon-btn" onclick="startDownload(${i})">⬇</button>
            </div>
        </div>`;
    });
}

// START DOWNLOAD
function startDownload(i){
    const g = available.splice(i,1)[0];
    g.progress = 0;
    downloading.push(g);
    simulate(g);
    renderAll();
}

// DOWNLOADING
function renderDownloading(){
    downloadingList.innerHTML = "";

    downloading.forEach(g=>{
        downloadingList.innerHTML += `
        <div class="dl-card">
            <img src="${g.thumbnail || ''}" class="dl-thumb">
            <div>
                <h3>${g.title}</h3>
                <div class="progress-container">
                    <div class="progress-fill" style="width:${g.progress}%"></div>
                </div>
                <div class="dl-meta">
                    <span>${g.progress}%</span>
                    <span>Downloading...</span>
                </div>
            </div>
            <div class="dl-actions">
                <button class="icon-btn" onclick="cancel(${g.game_id})">✕</button>
            </div>
        </div>`;
    });
}

// SIMULATE DOWNLOAD
function simulate(g){
    const int = setInterval(()=>{
        g.progress += 10;

        if(g.progress >= 100){
            clearInterval(int);
            downloading = downloading.filter(x=>x.game_id !== g.game_id);
            completed.push(g);
        }

        renderAll();
    },500);
}

// COMPLETED
function renderCompleted(){
    completedList.innerHTML = "";

    completed.forEach(g=>{
        completedList.innerHTML += `
        <div class="dl-card" style="opacity:0.8;">
            <img src="${g.thumbnail || ''}" class="dl-thumb">
            <div>
                <h3>${g.title}</h3>
                <div class="dl-meta">
                    <span style="color:#22c55e;">Completed</span>
                    <span>Ready</span>
                </div>
            </div>
            <div class="dl-actions">
                <button class="icon-btn play-btn">PLAY</button>
            </div>
        </div>`;
    });
}

// CANCEL
function cancel(id){
    const i = downloading.findIndex(g=>g.game_id===id);
    const g = downloading.splice(i,1)[0];
    available.push(g);
    renderAll();
}

// STATS
function updateStats(){
    queueEl.innerText = downloading.length;
    speedEl.innerText = downloading.length > 0 ? "120 Mbps" : "0 Mbps";
}

// INIT
loadDownloads();
