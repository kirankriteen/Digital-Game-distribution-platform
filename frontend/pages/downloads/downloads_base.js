const downloadingList = document.getElementById("downloading-list");
const purchasedList = document.getElementById("purchased-list");

const queueEl = document.getElementById("queue");
const speedEl = document.getElementById("speed");

let downloading = [];
let purchased = [];

let controllers = {};

async function loadDownloads() {
  const res = await fetch("/my/mygames", {
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
    },
  });

  const data = await res.json();
  purchased = data.mygames || [];
  console.log(purchased)
  renderAll();
}

function renderAll() {
  renderPurchased();
  renderDownloading();
  updateStats();
}

function renderPurchased() {
  purchasedList.innerHTML = "";

  purchased.forEach((g, i) => {
    const isDownloading = downloading.find(d => d.game_id === g.game_id);

    purchasedList.innerHTML += `
      <div class="dl-card">
        <img src="${g.coverUrl || "https://via.placeholder.com/80"}" class="dl-thumb">

        <div>
          <h3>${g.title}</h3>
          <div class="dl-meta">
            <span>Purchased</span>
          </div>
        </div>

        <div class="dl-actions">
          ${
            isDownloading
              ? `<button disabled class="icon-btn">⬇ Downloading</button>`
              : `<button class="icon-btn" onclick="startDownload(${i})">⬇</button>`
          }
        </div>
      </div>
    `;
  });
}

function startDownload(i) {
  const g = purchased[i];

  if (downloading.find(d => d.game_id === g.game_id)) return;

  g.progress = 0;
  g.status = "downloading";

  downloading.push(g);

  downloadFromMinio(g);

  renderAll();
}

function renderDownloading() {
  downloadingList.innerHTML = "";

  downloading.forEach((g) => {
    downloadingList.innerHTML += `
      <div class="dl-card">
        <img src="${g.thumbnail || ""}" class="dl-thumb">

        <div>
          <h3>${g.title}</h3>

          <div class="progress-container">
            <div class="progress-fill" style="width:${g.progress}%"></div>
          </div>

          <div class="dl-meta">
            <span>${g.progress}%</span>
            <span>${g.status === "paused" ? "Paused" : "Downloading..."}</span>
          </div>
        </div>

        <div class="dl-actions">
          ${
            g.status === "downloading"
              ? `<button onclick="pauseDownload(${g.game_id})">⏸</button>`
              : `<button onclick="resumeDownload(${g.game_id})">▶</button>`
          }
          <button onclick="cancel(${g.game_id})">✕</button>
        </div>
      </div>
    `;
  });
}

async function downloadFromMinio(g) {
  const controller = new AbortController();
  controllers[g.game_id] = controller;

  try {
    console.log(g.title)
    const res = await fetch("/games/download-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("accessToken"),
      },
      body: JSON.stringify({
        filename: g.title,
      }),
    });

    const data = await res.json();

    const response = await fetch(data.url, {
      signal: controller.signal,
    });

    const contentLength = +response.headers.get("Content-Length");

    const fileStream = streamSaver.createWriteStream(g.title + ".zip", {
      size: contentLength,
    });

    const writer = fileStream.getWriter();
    const reader = response.body.getReader();

    let receivedLength = 0;
    let startTime = Date.now();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      await writer.write(value);

      receivedLength += value.length;

      if (contentLength) {
        g.progress = Math.floor((receivedLength / contentLength) * 100);
      }

      let timeElapsed = (Date.now() - startTime) / 1000;
      let speedMbps = ((receivedLength / timeElapsed) / (1024 * 1024)).toFixed(2);
      speedEl.innerText = `${speedMbps} Mbps`;

      renderAll();
    }

    await writer.close();

    downloading = downloading.filter(x => x.game_id !== g.game_id);

    g.progress = 100;
    g.status = "completed";

    speedEl.innerText = "0 Mbps";

    renderAll();

  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Paused");
    } else {
      console.error(err);
      alert("Download failed");
    }
  }
}

function cancel(id) {
  const i = downloading.findIndex(g => g.game_id === id);
  downloading.splice(i, 1);
  renderAll();
}

function pauseDownload(id) {
  if (controllers[id]) controllers[id].abort();

  const g = downloading.find(x => x.game_id === id);
  if (g) g.status = "paused";

  renderAll();
}

function resumeDownload(id) {
  const g = downloading.find(x => x.game_id === id);

  if (g) {
    g.status = "downloading";
    downloadFromMinio(g);
  }
}

function updateStats() {
  queueEl.innerText = downloading.length;
  if (downloading.length === 0) speedEl.innerText = "0 Mbps";
}

loadDownloads();