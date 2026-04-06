const token = localStorage.getItem("accessToken");

if (!token) {
  alert("You must login first");
  window.location.href = "../login/signup_login.htm";
}

const themeSelector = document.getElementById("themeSelector");
const projectSearch = document.getElementById("projectSearch");
const projectsTable = document.getElementById("projectsTable");
const mainContainer = document.querySelector(".main-container");

let allProjects = [];

function filterAndRenderProjects(themeFilter, searchFilter) {
  projectsTable.innerHTML = "";

  // Normalize filters for comparison
  const theme = themeFilter.toLowerCase();
  const search = searchFilter.toLowerCase();

  // Filter by theme (genre) and search (title)
  const filtered = allProjects.filter(p => {
    const genreMatch = theme === "all" || (p.genre || "").toLowerCase() === theme;
    const titleMatch = (p.title || "").toLowerCase().includes(search);
    return genreMatch && titleMatch;
  });

  if (filtered.length === 0) {
    projectsTable.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; color: var(--text-dim); padding: 20px;">
          No projects found for these filters.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(project => {
    const row = document.createElement("tr");
    row.style.borderBottom = "1px solid #222a66";

    row.innerHTML = `
      <td style="padding: 10px 15px; font-weight: 600;">${project.title || "Untitled"}</td>
      <td style="padding: 10px 15px;">${project.genre || "Unknown"}</td>
      <td style="padding: 10px 15px; text-align: right;">${project.sales || 0}</td>
      <td style="padding: 10px 15px; text-align: center;">
        <span class="badge ${project.status === "Pending" ? "status-pending" : ""}" style="
          background-color: ${project.status === "Pending" ? '#bfbf00' : '#4CAF50'};
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.85rem;
          display: inline-block;">
          ${project.status || "Live"}
        </span>
      </td>
    `;
    projectsTable.appendChild(row);
  });
}

function updateThemeBackground(theme) {
  mainContainer.classList.remove("default-theme", "action-theme", "rpg-theme", "horror-theme");

  switch (theme) {
    case "Action":
      mainContainer.classList.add("action-theme");
      break;
    case "RPG":
      mainContainer.classList.add("rpg-theme");
      break;
    case "Horror":
      mainContainer.classList.add("horror-theme");
      break;
    default:
      mainContainer.classList.add("default-theme");
      break;
  }
}

async function loadDashboard() {
  try {
    const response = await fetch("http://localhost:3000/dev/dashboard", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (!response.ok) {
      throw new Error("Unauthorized");
    }

    const data = await response.json();
    console.log("Dashboard Data:", data);

    // Update top stats
    document.getElementById("revVal").innerText = "$" + Number(data.total_revenue).toLocaleString();
    document.getElementById("downloadsVal").innerText = Number(data.downloads).toLocaleString();
    document.getElementById("activePlayersVal").innerText = Number(data.active_players).toLocaleString();

    allProjects = data.projects || [];

    // Initialize theme and render projects
    const initialTheme = themeSelector.value;
    updateThemeBackground(initialTheme);
    filterAndRenderProjects(initialTheme, "");

  } catch (error) {
    console.error("Dashboard load failed:", error);

    document.getElementById("revVal").innerText = "$0";
    document.getElementById("downloadsVal").innerText = "0";
    document.getElementById("activePlayersVal").innerText = "0";

    projectsTable.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; color: var(--text-dim); padding: 20px;">
          Failed to load projects.
        </td>
      </tr>
    `;
  }
}

themeSelector.addEventListener("change", () => {
  updateThemeBackground(themeSelector.value);
  filterAndRenderProjects(themeSelector.value, projectSearch.value);
});

projectSearch.addEventListener("input", () => {
  filterAndRenderProjects(themeSelector.value, projectSearch.value);
});

const themeTextColors = {
  All: '#ffffff',       // white for all/default
  RPG: '#8b5cf6',       // purple
  Action: '#f43f5e',    // red
  Horror: '#450a0a',    // dark red/brown
};

selector.addEventListener("change", (e) => {
  const color = themeTextColors[e.target.value] || '#ffffff';
  document.documentElement.style.setProperty("--text-theme-color", color);
});

loadDashboard();