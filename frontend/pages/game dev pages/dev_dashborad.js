const token = localStorage.getItem("accessToken");

if (!token) {
    alert("You must login first");
    window.location.href = "../login/signup_login.htm";
}

async function loadDashboard() {
    try {
        const response = await fetch("http://localhost:3000/dev/dashboard", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            throw new Error("Unauthorized");
        }

        const data = await response.json();
        console.log("Dashboard Data:", data);

        // ✅ Top Stats (formatted)
        document.getElementById("revVal").innerText =
            "$" + Number(data.total_revenue).toLocaleString();

        document.getElementById("downloadsVal").innerText =
            Number(data.downloads).toLocaleString();

        document.getElementById("activePlayersVal").innerText =
            Number(data.active_players).toLocaleString();

        // ✅ Projects Table
        const table = document.getElementById("projectsTable");
        table.innerHTML = "";

        if (!data.projects || data.projects.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center; color: var(--text-dim); padding: 20px;">
                        No projects yet. Click "+ New Game" to get started.
                    </td>
                </tr>
            `;
            return;
        }

        data.projects.forEach(project => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td><strong>${project.title || "Untitled"}</strong></td>
                <td>${project.genre || "Unknown"}</td>
                <td>${project.sales || 0}</td>
                <td>
                    <span class="badge ${project.status === "Pending" ? "status-pending" : ""}">
                        ${project.status || "Live"}
                    </span>
                </td>
            `;

            table.appendChild(row);
        });

    } catch (error) {
        console.error("Dashboard load failed:", error);

        // ❌ Fallback UI (no crash)
        document.getElementById("revVal").innerText = "$0";
        document.getElementById("downloadsVal").innerText = "0";
        document.getElementById("activePlayersVal").innerText = "0";

        const table = document.getElementById("projectsTable");
        table.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; color: var(--text-dim); padding: 20px;">
                    Failed to load projects.
                </td>
            </tr>
        `;
    }
}

// 🚀 Run dashboard
loadDashboard();