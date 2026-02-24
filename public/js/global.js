// ===== Stabilize UI (Prevent Zoom) =====
document.addEventListener('wheel', (e) => {
  if (e.ctrlKey) e.preventDefault();
}, { passive: false });

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')) {
    e.preventDefault();
  }
});

document.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

// ===== Fix mobile back cache (bfcache) =====
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    window.location.reload();
  }
});

// ===== Toggle hamburger =====
function toggleMenu() {
  const menu = document.getElementById("navMenu");
  if (menu) {
    menu.classList.toggle("show");
  }
}

// ===== ⭐ FORCE MENU CLOSED ON LOAD (VERY IMPORTANT) =====
document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("navMenu");
  if (menu) {
    menu.classList.remove("show");
  }
  updateNavbar();
  initCustomCursor();
});

// ===== Custom Cursor (Wand SVG) =====
function initCustomCursor() {
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';

  // Inline SVG Wand (Refined & Detailed)
  cursor.innerHTML = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wandBodyGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#2c003e;" />
          <stop offset="100%" style="stop-color:#6a0096;" />
        </linearGradient>
        <linearGradient id="wandHandleGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#e0e0e0;" />
          <stop offset="100%" style="stop-color:#ffffff;" />
        </linearGradient>
      </defs>
      <!-- Wand Handle -->
      <path d="M10 90 L30 70" stroke="url(#wandHandleGradient)" stroke-width="8" stroke-linecap="round" />
      <!-- Wand Body (Tapered) -->
      <path d="M30 70 L85 15" stroke="url(#wandBodyGradient)" stroke-width="5" stroke-linecap="round" />
      <!-- Magical Tip Glow (Refined) -->
      <circle cx="85" cy="15" r="3.5" fill="#ff99cc">
        <animate attributeName="r" values="2.5;5;2.5" dur="1.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <!-- Tiny Sparkle -->
      <circle cx="85" cy="15" r="1.5" fill="#ffffff">
        <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  `;

  document.body.appendChild(cursor);

  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  // Handle hover states
  const interactives = 'a, button, .gold-btn, .view-btn, .menu-toggle';
  document.querySelectorAll(interactives).forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}


// ===== Session & Navbar Update =====
async function updateNavbar() {
  try {
    const res = await fetch('/api/auth/session');

    // Safety check: Don't parse if it's a 404 HTML page
    if (!res.ok) return;
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) return;

    const data = await res.json();
    const navMenu = document.getElementById("navMenu");

    if (navMenu && data.loggedIn) {
      const items = navMenu.getElementsByTagName('li');
      let loginItem;

      for (let li of items) {
        const text = li.textContent.toLowerCase();
        if (text.includes('login')) loginItem = li;
      }

      if (loginItem) {
        loginItem.innerHTML = `<a href="profile.html">Profile (${data.user.username})</a>`;

        // Since Signin is gone, append Logout dynamically next to Profile
        let hasLogout = false;
        for (let li of items) {
          if (li.textContent.toLowerCase().includes('logout')) hasLogout = true;
        }

        if (!hasLogout) {
          const logoutLi = document.createElement("li");
          logoutLi.innerHTML = `<a href="#" onclick="handleLogout(event)">Logout</a>`;
          loginItem.parentNode.insertBefore(logoutLi, loginItem.nextSibling);
        }
      }
    }
  } catch (err) {
    console.error("Session check failed:", err);
  }
}

async function handleLogout(e) {
  if (e) e.preventDefault();
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      // Clear local storage if any and redirect
      window.location.href = 'login.html';
    }
  } catch (err) {
    alert("Logout failed");
  }
}