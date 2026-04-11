const cartList = document.getElementById("cart-list");
const cartCount = document.getElementById("cart-count");

// --- Load Cart ---
function loadCart() {
    const cart = JSON.parse(sessionStorage.getItem("cart")) || [];

    cartList.innerHTML = "";

    if (cart.length === 0) {
        cartList.innerHTML = "<p style='color:#444; padding: 2rem;'>Your cart is empty.</p>";
        cartCount.innerText = 0;
        updateSummary(0);
        return;
    }

    let total = 0;

    cart.forEach((item, index) => {
        const priceNumber = parseFloat(item.price.replace("$", ""));
        total += priceNumber;

        const card = document.createElement("div");
        card.className = "item-card";

        card.innerHTML = `
            <img src="${item.image}" class="item-img">
            <div class="item-details">
                <div>
                    <div class="item-category">${item.category}</div>
                    <div class="item-title">${item.title}</div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:flex-end;">
                    <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
                    <div class="item-price">${item.price}</div>
                </div>
            </div>
        `;
        
        cartList.appendChild(card);
    });

    cartCount.innerText = cart.length;
    updateSummary(total);
}

// --- Remove Item ---
function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    sessionStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// --- Update Summary ---
function updateSummary(total) {
    const summaryRows = document.querySelectorAll(".summary-row span:last-child");

    summaryRows[0].innerText = `$${total.toFixed(2)}`;
    summaryRows[1].innerText = `$0.00`;

    document.querySelector(".total-row span:last-child").innerText = `$${total.toFixed(2)}`;
}

async function proceedToCheckout() {
    const cart = JSON.parse(sessionStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    try {
        const response = await fetch("/pay/games-checkout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("accessToken") // IMPORTANT
            },
            body: JSON.stringify({
                games: cart.map(item => ({
                    title: item.title
                }))
            })
        });
        const data = await response.json();
        

        if (!response.ok) {
            alert(data.error || "Checkout failed");
            return;
        }

        // Redirect to Stripe Checkout
        window.location.href = data.url;

    } catch (err) {
        console.error(err);
        alert("Something went wrong");
    }
}

// --- Init ---
loadCart();