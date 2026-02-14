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
    if (!toggle) return;
    const theme = document.body.getAttribute("data-theme");
    const icon = toggle.querySelector('i');
    if (!icon) return;

    if (theme === "dark") {
        icon.className = "fas fa-sun";
        toggle.title = "Switch to Light Mode";
    } else {
        icon.className = "fas fa-moon";
        toggle.title = "Switch to Dark Mode";
    }
}

// Toggle theme on button click
if (toggle) {
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
    });
}

// Load saved theme on page load
const applySavedTheme = () => {
    if (localStorage.getItem("theme") === "dark") {
        document.body.setAttribute("data-theme", "dark");
    } else {
        document.body.removeAttribute("data-theme");
    }
    updateToggleIcon();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySavedTheme);
} else {
    applySavedTheme();
}
