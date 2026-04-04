const token = localStorage.getItem("accessToken");

// if (!token) {
//     alert("You must login first");
//     window.location.href = "../login/signup_login.htm";
// }

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
        console.log(data);

        document.getElementById("revVal").innerText = "$" + data.total_revenue;
        document.getElementById("downloadsVal").innerText = data.downloads;
        document.getElementById("activePlayersVal").innerText = data.active_players;
        
        const table = document.getElementById("projectsTable");
        table.innerHTML = "";
        data.projects.forEach(project => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${project}</strong></td>
                <td>Unknown</td>
                <td>0</td>
                <td><span class="badge">Live</span></td>
            `;
            table.appendChild(row);
        });
    } catch (error) {
        console.error("Dashboard load failed:", error);
        // TEMP: do NOT logout or redirect
        console.log("Running in no-auth mode");
        // Optional fallback UI
        document.getElementById("revVal").innerText = "$0";
        document.getElementById("downloadsVal").innerText = "0";
        document.getElementById("activePlayersVal").innerText = "0";
    }
    // } catch (error) {
    //     console.error("Dashboard load failed:", error);
    //     alert("Session expired. Please login again.");
    //     localStorage.removeItem("accessToken");
    //     localStorage.removeItem("refreshToken");
    //     window.location.href = "../../login.html";
    // }
}
// Run dashboard loader
loadDashboard();