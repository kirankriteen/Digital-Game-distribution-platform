const token = localStorage.getItem("accessToken");

if (!token) {
  alert("You must login first");
  window.location.href = "../login/signup_login.htm";
}

let revenueChartInstance = null;
let allPayments = [];

// ================= FETCH DATA =================
async function loadAnalytics() {
  try {
    const res = await fetch("/dev/payouts", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (!res.ok) throw new Error("Failed to load analytics");

    const data = await res.json();
    console.log("Analytics Data:", data);

    allPayments = data.payments;

    applyTimeFilter("All Time");
  } catch (err) {
    console.error(err);
  }
}

// ================= FILTER ENGINE =================
function applyTimeFilter(range) {
  let filtered = [...allPayments];

  const now = new Date();

  if (range === "Last 30 Days") {
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - 30);

    filtered = allPayments.filter(p => new Date(p.created_at) >= cutoff);
  }

  else if (range === "Last 6 Months") {
    const cutoff = new Date();
    cutoff.setMonth(now.getMonth() - 6);

    filtered = allPayments.filter(p => new Date(p.created_at) >= cutoff);
  }

  renderRevenueChart(filtered);
  updateAOV(filtered);
}

// ================= CHART =================
function renderRevenueChart(payments) {
  const ctx = document.getElementById("revenueChart").getContext("2d");

  const sorted = [...payments].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  const labels = sorted.map(p =>
    new Date(p.created_at).toLocaleDateString("en-IN", {
      month: "short",
      day: "2-digit",
    })
  );

  const values = sorted.map(p => p.amount / 100);

  if (revenueChartInstance) {
    revenueChartInstance.destroy();
  }

  revenueChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Revenue ($)",
          data: values,
          borderColor: "#6366f1",
          backgroundColor: "rgba(99,102,241,0.15)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

// ================= AOV =================
function calculateAOV(payments) {
  if (!payments || payments.length === 0) return 0;

  const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  return (total / payments.length) / 100;
}

function updateAOV(payments) {
  const aov = calculateAOV(payments);

  document.getElementById("conversionRate").innerText =
    "$" + aov.toFixed(2);

  document.getElementById("conversionTrend").innerText =
    `Based on ${payments.length} transactions`;
}

// ================= FILTER EVENT =================
document.getElementById("timeRangeSelect").addEventListener("change", (e) => {
  applyTimeFilter(e.target.value);
});

// ================= EXPORT REPORT =================
document.getElementById("exportReportBtn").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;

  const element = document.querySelector("main");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#0f172a",
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

  pdf.save("analytics-report.pdf");
});

// ================= INIT =================
loadAnalytics();