const token = localStorage.getItem("accessToken");

if (!token) {
  alert("You must login first");
  window.location.href = "../login/signup_login.htm";
}

// Elements (make sure IDs exist in HTML)
const availableEl = document.getElementById("availableBalance");
const pendingEl = document.getElementById("pendingBalance");
const lifetimeEl = document.getElementById("lifetimeEarnings");
const withdrawBtn = document.getElementById("withdrawBtn");

// Convert cents → formatted currency
function formatMoney(amount, currency) {
  return (amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
}

// ===== LOAD PAYOUT DATA =====
async function loadPayouts() {
  try {
    const response = await fetch("http://localhost:3000/dev/payouts", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch payouts");
    }

    const data = await response.json();
    console.log("Payout Data:", data);

    // Update UI
    availableEl.innerText = formatMoney(
      data.availableForWithdrawal,
      data.currency
    );

    pendingEl.innerText = formatMoney(
      data.pendingClearance,
      data.currency
    );

    lifetimeEl.innerText = formatMoney(
      data.lifetimeEarningsCents,
      data.currency
    );

  } catch (err) {
    console.error(err);

    availableEl.innerText = "$0";
    pendingEl.innerText = "$0";
    lifetimeEl.innerText = "$0";
  }
}

// ===== WITHDRAW FUNCTION =====
async function handleWithdraw() {
  try {
    withdrawBtn.disabled = true;
    withdrawBtn.innerText = "Processing...";

    const response = await fetch("http://localhost:3000/dev/withdraw", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Withdrawal failed");
    }

    alert(data.message);

    // Reload balances after withdrawal
    loadPayouts();

  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    withdrawBtn.disabled = false;
    withdrawBtn.innerText = "Withdraw";
  }
}

// ===== EVENT LISTENER =====
if (withdrawBtn) {
  withdrawBtn.addEventListener("click", handleWithdraw);
}

// ===== INIT =====
loadPayouts();