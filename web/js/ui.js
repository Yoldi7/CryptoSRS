
// Templates HTML
const authTemplate = `
<div id="auth-page">
<div class="auth-container">
    <div class="auth-box">
        <div class="auth-tabs">
            <button class="tab-btn active" data-tab="login">Login</button>
            <button class="tab-btn" data-tab="register">Register</button>
        </div>
        
        <div id="login-tab" class="tab-content active">
            <form id="login-form">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="login-username" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="login-password" required>
                </div>
                <div id="login-error" class="alert alert-error" style="display:none;"></div>
                <button type="submit" class="btn btn-primary btn-block">Login</button>
            </form>
        </div>
        
        <div id="register-tab" class="tab-content">
            <form id="register-form">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="register-username" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="register-email" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="register-password" required>
                </div>
                <div class="form-group">
                    <label>Confirm Password</label>
                    <input type="password" id="register-password2" required>
                </div>
                <div id="register-error" class="alert alert-error" style="display:none;"></div>
                <button type="submit" class="btn btn-primary btn-block">Register</button>
            </form>
        </div>
        <div class="auth-actions" style="margin-top: 12px; display:flex; gap:8px; justify-content:space-between;">
            <button id="auth-close" class="btn btn-secondary">Close</button>
            <button id="auth-demo" class="btn btn-primary">Skip (Demo)</button>
        </div>
    </div>
</div>
</div>
`;

const dashboardTemplate = `
<div class="dashboard-container">
    <div class="app-grid">
        <aside class="sidebar">
            <div class="brand"><h2>CryptoSRS</h2><p class="tag">Modern Trading</p></div>
            <div class="profile-card">
                <div class="avatar">CS</div>
                <div>
                        <div id="profile-name">Usuario</div>
                        <div id="profile-email" class="hint">user@crypto.srs</div>
                        <div id="account-level-badge" class="badge basic">Basic</div>
                </div>
            </div>
            <nav class="sidebar-nav">
                <a href="#" class="nav-link" data-page="trading">Trading</a>
                <a href="#" class="nav-link" data-page="bot" style="display:none;">Bot</a>
                <a href="#" class="nav-link" data-page="profile">Profile</a>
                <a href="#" class="nav-link" id="logout-btn">Logout</a>
            </nav>
            <div class="balance-card">
                <div class="balance-label">Portfolio</div>
                <div id="portfolio-balance" class="balance-amount">$0.00</div>
            </div>
        </aside>
        <main class="main-content">
            <header class="main-header">
                <div class="search"><input id="global-search" placeholder="Search coins, pairs or addresses..." /></div>
                <div class="top-stats">
                    <div class="stat"><div class="stat-title">Total Balance</div><div id="total-balance" class="stat-value">$0.00</div></div>
                    <div class="stat"><div class="stat-title">24h Change</div><div id="day-change" class="stat-value">+0.00%</div></div>
                </div>
            </header>
            <section id="trading-section" class="section active">
                <h1>Markets</h1>
                <div class="content-row">
                    <div class="left-column">
                        <div id="coins-grid" class="coins-grid"></div>
                    </div>
                    <aside class="right-column">
                        <div class="section-box order-card">
                            <h3>Place Order</h3>
                            <div class="selected-coin">Selected: <strong id="selected-coin-name">—</strong></div>
                            <form id="order-form">
                                <div class="form-group"><label>Coin</label><select id="order-coin"><option value="">Select coin</option></select></div>
                                <div class="form-row">
                                    <div class="form-group"><label>Amount</label><input type="number" id="order-amount" placeholder="Amount"></div>
                                    <div class="form-group"><label>Order Type</label><select id="order-type"><option value="BUY">Buy</option><option value="SELL">Sell</option></select></div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group"><label>Price Type</label><select id="price-type"><option value="market">Market</option><option value="limit">Limit</option></select></div>
                                    <div class="form-group"><label>Target Price</label><input type="number" id="order-price" placeholder="Target price" /></div>
                                </div>
                                <div id="order-error" class="alert alert-error" style="display:none"></div>
                                <div id="order-success" class="alert alert-success" style="display:none"></div>
                                <div class="form-row"><button type="submit" class="btn btn-primary btn-block">Place Order</button></div>
                            </form>
                        </div>
                        <div id="wallet-quick" class="section-box">
                            <h3>Wallet</h3>
                            <div id="wallet-container"></div>
                        </div>
                        <div id="orders-section" class="section-box">
                            <h3>Orders</h3>
                            <div id="orders-list"></div>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    </div>
    
    <!-- Bot Section -->
    <div id="bot-section" class="section">
        <div class="grid-layout">
            <div class="card">
                <div class="card-header">
                    <h3>Create Trading Bot</h3>
                </div>
                <div class="card-body">
                    <form id="bot-form">
                        <div class="form-group">
                            <label>Bot Name</label>
                            <input type="text" id="bot-name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Configuration (JSON)</label>
                            <textarea id="bot-config" class="form-control" rows="5" required>{"strategy": "simple_moving_average", "period": 14}</textarea>
                        </div>
                        <div id="bot-error" class="alert alert-error" style="display:none;"></div>
                        <div id="bot-success" class="alert alert-success" style="display:none;"></div>
                        <button type="submit" class="btn btn-primary btn-block">Create Bot</button>
                    </form>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3>My Bots</h3>
                    <button onclick="loadBots()" class="btn btn-sm btn-secondary">Refresh</button>
                </div>
                <div class="card-body">
                    <div id="bots-list">
                        <!-- Bots inserted here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Profile Section -->
    <div id="profile-section" class="section">
        <div class="card">
            <div class="card-header">
                <h3>User Profile</h3>
            </div>
            <div class="card-body">
                <div class="profile-info">
                    <p><strong>Username:</strong> <span id="profile-username"></span></p>
                    <p><strong>Email:</strong> <span id="profile-email"></span></p>
                    <p><strong>Account Level:</strong> <span id="profile-account-level" class="badge"></span></p>
                </div>
                
                <hr>
                
                <h4>Update Profile</h4>
                <form id="profile-form">
                    <div class="form-group">
                        <label>New Email</label>
                        <input type="email" id="profile-email-input" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Current Password (required to change password)</label>
                        <input type="password" id="profile-current-password" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>New Password</label>
                        <input type="password" id="profile-new-password" class="form-control">
                    </div>
                    <div id="profile-error" class="alert alert-error" style="display:none;"></div>
                    <div id="profile-success" class="alert alert-success" style="display:none;"></div>
                    <button type="submit" class="btn btn-primary">Update Profile</button>
                </form>
                
                <hr>
                
                <div id="flags-container" style="margin-top: 20px;">
                    <h4>CTF Flags</h4>
                    <div id="user-flag-display" class="alert alert-info" style="display:none;"></div>
                    <div id="admin-flag-display" class="alert alert-warning" style="display:none;"></div>
                    <button onclick="checkFlags()" class="btn btn-secondary">Check Flags</button>
                </div>
            </div>
        </div>
    </div>
</div>
`;

// Funciones globales
window.showAuthPage = function () {
    console.log('[UI] Showing Auth page');
    const navbar = document.getElementById('main-navbar');
    if (navbar) navbar.style.display = 'none';

    // Create or reuse a fullscreen overlay for auth
    let overlay = document.getElementById('auth-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'auth-overlay';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = authTemplate;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Remove any debug overlay if present
    const devO = document.getElementById('dev-auth-overlay');
    if (devO) devO.remove();

    if (window.setupAuthUI) window.setupAuthUI();
};

// (debugging helpers removed)

window.loadDashboard = async function () {
    console.log('[UI] Loading Dashboard');
    const navbar = document.getElementById('main-navbar');
    if (navbar) navbar.style.display = 'flex';
    const content = document.getElementById('content-container');
    if (content) content.innerHTML = dashboardTemplate; else console.warn('[UI] content-container not found');
    // Remove auth overlay and restore scroll
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        overlay.remove();
    }
    try { document.body.style.overflow = 'auto'; } catch (e) {}

    // Setup Navigation
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;

            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show section
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${page}-section`).classList.add('active');

            // Load data if needed
            if (page === 'bot') loadBots();
            if (page === 'profile') loadProfile();
        });
    });

    // Activar primera tab
    document.querySelector('.nav-link[data-page="trading"]').click();

    // Setup UIs
    if (window.setupAuthUI) window.setupAuthUI(); // Para logout
    if (window.setupTradingUI) window.setupTradingUI();
    if (window.setupBotUI) window.setupBotUI();

    // Load Data
    if (typeof loadTradingData === 'function') {
        await loadTradingData();
    }

    // Load Profile for header/check
    loadProfile();
};

async function loadProfile() {
    try {
        const response = await api.getProfile();
        const user = response;

        const usernameEl = document.getElementById('profile-username');
        if (usernameEl) {
            usernameEl.textContent = user.username;
            document.getElementById('profile-email').textContent = user.email;
            document.getElementById('profile-account-level').textContent = user.account_level;
            document.getElementById('profile-email-input').value = user.email;
        }
        // Display account badge and toggle bots link visibility
        const accountBadge = document.getElementById('account-level-badge');
        const botLink = document.querySelector('.nav-link[data-page="bot"]');
        const level = (user.account_level || 'basic').toLowerCase();
        if (accountBadge) {
            if (level === 'premium') {
                accountBadge.textContent = 'Premium';
                accountBadge.classList.remove('basic');
                accountBadge.classList.add('premium');
            } else {
                accountBadge.textContent = 'Basic';
                accountBadge.classList.remove('premium');
                accountBadge.classList.add('basic');
            }
        }
        if (botLink) {
            if (level === 'premium') {
                botLink.style.display = '';
            } else {
                botLink.style.display = 'none';
            }
        }
        // Also update sidebar quick profile if present
        const profileNameSidebar = document.getElementById('profile-name');
        const profileEmailSidebar = document.getElementById('profile-email');
        if (profileNameSidebar) profileNameSidebar.textContent = user.username || user.name || 'Usuario';
        if (profileEmailSidebar) profileEmailSidebar.textContent = user.email || '';
    } catch (error) {
        console.error('Error loading profile', error);
    }
}

window.checkFlags = async function () {
    try {
        const userFlag = await api.getUserFlag();
        const userDiv = document.getElementById('user-flag-display');
        if (userFlag.flag) {
            userDiv.textContent = `User Flag: ${userFlag.flag}`;
            userDiv.style.display = 'block';
        }

        try {
            const adminFlag = await api.getAdminFlag();
            const adminDiv = document.getElementById('admin-flag-display');
            if (adminFlag.flag) {
                adminDiv.textContent = `Admin Flag: ${adminFlag.flag}`;
                adminDiv.style.display = 'block';
            }
        } catch (e) {
            // No admin flag or not authorized
        }
    } catch (error) {
        console.error('Error checking flags', error);
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('[UI] DOMContentLoaded');
    const hasToken = api.loadTokenFromStorage();
    const content = document.getElementById('content-container');
    if (content) content.innerHTML = '<div id="app-loading" style="padding:24px; color:var(--text);">Initializing application…</div>';
    console.log('[UI] Token loaded from storage? ', hasToken);
    if (hasToken) {
        loadDashboard();
    } else {
        showAuthPage();
    }
    // Small guard: if content didn't render, show a helpful message for debugging
    const contentNow = document.getElementById('content-container');
    setTimeout(() => {
        if (contentNow && contentNow.children.length === 0) {
            console.warn('[UI] content-container still empty after rendering.');
            contentNow.innerHTML = '<div style="padding:32px; color: var(--text);">No content rendered. Revisa la consola para diagnósticos.</div>';
        }
    }, 250);
});
