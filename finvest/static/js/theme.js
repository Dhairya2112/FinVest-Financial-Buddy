// Mouse Move Effect for Glow
document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.metric-card, .card, .btn').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// 3D Tilt Effect for Cards
document.addEventListener('mousemove', (e) => {
    // Only apply to desktop (width > 768px) to save battery on mobile
    if (window.innerWidth > 768) {
        document.querySelectorAll('.card, .metric-card').forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;

            // Check if mouse is near the card to activate (optimization)
            if (
                x > rect.left - 50 &&
                x < rect.right + 50 &&
                y > rect.top - 50 &&
                y < rect.bottom + 50
            ) {
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const rotateX = ((y - centerY) / (rect.height / 2)) * -2; // Max 2deg rotation
                const rotateY = ((x - centerX) / (rect.width / 2)) * 2;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            } else {
                // Reset if mouse is far
                card.style.transform = '';
            }
        });
    }
});

// Theme toggle button
const toggle = document.getElementById("themeToggle");

// Update icon based on current theme
function updateToggleIcon() {
    const theme = document.body.getAttribute("data-theme");
    const icon = toggle.querySelector('i');
    if (theme === "dark") {
        icon.className = "fas fa-sun";
        toggle.title = "Switch to Light Mode";
    } else {
        icon.className = "fas fa-moon";
        toggle.title = "Switch to Dark Mode";
    }
}

// Update dashboard UI based on theme
function updateDashboardTheme() {
    const theme = document.body.getAttribute("data-theme");
    const metricsCards = document.getElementById('metrics-cards');

    if (metricsCards) {
        metricsCards.innerHTML = `
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="metric-card h-100">
                     <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="metric-label mb-1">Total Balance</div>
                            <div class="metric-value">₹${balance}</div>
                        </div>
                        <div class="metric-icon">
                            <i class="fas fa-wallet fa-2x text-primary" style="opacity: 0.8"></i>
                        </div>
                    </div>
                    <div class="progress mt-3" style="height: 6px; background: rgba(0,0,0,0.1);">
                        <div class="progress-bar bg-primary" role="progressbar" style="width: 75%"></div>
                    </div>
                </div>
            </div>
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="metric-card h-100">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="metric-label mb-1">Monthly Income</div>
                            <div class="metric-value">₹${monthly_income}</div>
                            <div class="text-muted small mt-2">
                                <i class="fas fa-arrow-up text-success me-1"></i>This month
                            </div>
                        </div>
                        <div class="metric-icon">
                            <i class="fas fa-chart-line fa-2x text-success" style="opacity: 0.8"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="metric-card h-100">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="metric-label mb-1">Total Expenses</div>
                            <div class="metric-value">₹${monthly_expenses}</div>
                            <div class="text-muted small mt-2">
                                <i class="fas fa-arrow-down text-danger me-1"></i>This month
                            </div>
                        </div>
                        <div class="metric-icon">
                            <i class="fas fa-file-invoice-dollar fa-2x text-danger" style="opacity: 0.8"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="metric-card h-100">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="metric-label mb-1">Budget Status</div>
                            <div class="metric-value">${budget_status}</div>
                            <div class="text-muted small mt-2">
                                <i class="fas fa-piggy-bank text-warning me-1"></i>Remaining
                            </div>
                        </div>
                        <div class="metric-icon">
                            <i class="fas fa-chart-pie fa-2x text-warning" style="opacity: 0.8"></i>
                        </div>
                    </div>
                    <div class="progress mt-3" style="height: 6px; background: rgba(0,0,0,0.1);">
                        <div class="progress-bar bg-warning" role="progressbar" style="width: ${budget_percentage}%"></div>
                    </div>
                </div>
            </div>
        `;
    }
}
// Toggle theme on button click
toggle.addEventListener("click", () => {
    const theme = document.body.getAttribute("data-theme");
    if (theme === "dark") {
        document.body.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
    } else {
        document.body.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
    }
    updateToggleIcon();
    // The theme's visual changes are handled by CSS. We don't re-render the metric cards here.
});

// Load saved theme on page load
window.addEventListener("load", () => {
    if (localStorage.getItem("theme") === "dark") {
        document.body.setAttribute("data-theme", "dark");
    }
    updateToggleIcon();
    updateDashboardTheme(); // Essential to populate the cards initially
});
