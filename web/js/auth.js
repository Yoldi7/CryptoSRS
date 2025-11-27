// Manejo de autenticación modular para carga dinámica

window.setupAuthUI = function() {
    // Elementos del DOM
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');

    // Event listeners para tabs
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            // Remover active de todos
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            // Agregar active al seleccionado
            btn.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });

    // Manejo de login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error');
            try {
                errorDiv.style.display = 'none';
                const response = await api.login(username, password);
                sessionStorage.setItem('user', JSON.stringify(response.user));
                // Cambiar a dashboard
                if (typeof loadDashboard === 'function') {
                    await loadDashboard();
                }
                loginForm.reset();
            } catch (error) {
                errorDiv.textContent = error.message || 'Error al iniciar sesión';
                errorDiv.style.display = 'block';
            }
        });
    }

    // Manejo de registro
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const password2 = document.getElementById('register-password2').value;
            const errorDiv = document.getElementById('register-error');
            if (password !== password2) {
                errorDiv.textContent = 'Las contraseñas no coinciden';
                errorDiv.style.display = 'block';
                return;
            }
            try {
                errorDiv.style.display = 'none';
                const response = await api.register(username, email, password);
                alert('Registro exitoso. Inicia sesión ahora.');
                document.querySelector('[data-tab="login"]').click();
                registerForm.reset();
            } catch (error) {
                errorDiv.textContent = error.message || 'Error al registrarse';
                errorDiv.style.display = 'block';
            }
        });
    }

    // Manejo de logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            api.clearToken();
            sessionStorage.removeItem('user');
            if (typeof showAuthPage === 'function') {
                showAuthPage();
            }
            if (loginForm) loginForm.reset();
            if (registerForm) registerForm.reset();
            const loginError = document.getElementById('login-error');
            const registerError = document.getElementById('register-error');
            if (loginError) loginError.style.display = 'none';
            if (registerError) registerError.style.display = 'none';
        });
    }

    // Optional debug/demo helpers on the auth overlay
    const authClose = document.getElementById('auth-close');
    if (authClose) {
        authClose.addEventListener('click', (e) => {
            e.preventDefault();
            const overlay = document.getElementById('auth-overlay');
            if (overlay) overlay.remove();
            document.body.style.overflow = 'auto';
        });
    }
    const authDemo = document.getElementById('auth-demo');
    if (authDemo) {
        authDemo.addEventListener('click', async (e) => {
            e.preventDefault();
            // Remove overlay and load dashboard for demo purposes
            const overlay = document.getElementById('auth-overlay');
            if (overlay) overlay.remove();
            document.body.style.overflow = 'auto';
            if (typeof loadDashboard === 'function') loadDashboard();
        });
    }
};