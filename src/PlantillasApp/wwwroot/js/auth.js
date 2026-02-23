/* ═══════════════════════════════════════════════
   Auth Module — Login/Logout logic
   ═══════════════════════════════════════════════ */

const Auth = (() => {
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('login-password');
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');

    function init() {
        loginForm.addEventListener('submit', handleLogin);
        logoutBtn.addEventListener('click', handleLogout);
        togglePassword.addEventListener('click', togglePasswordVisibility);

        // Listen for expired token
        window.addEventListener('auth:expired', () => {
            showToast('Sesión expirada. Por favor, inicie sesión nuevamente.', 'error');
            showLogin();
        });

        // Check existing session
        if (API.isAuthenticated()) {
            showDashboard();
        } else {
            showLogin();
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            showError('Por favor, complete todos los campos');
            return;
        }

        setLoading(loginBtn, true);
        hideError();

        try {
            const data = await API.login(username, password);
            API.setToken(data.token);
            localStorage.setItem('plantillas_user', data.username);
            showDashboard();
            showToast(`¡Bienvenido, ${data.username}!`, 'success');
        } catch (err) {
            showError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(loginBtn, false);
        }
    }

    function handleLogout() {
        API.clearToken();
        showLogin();
        showToast('Sesión cerrada correctamente', 'info');
    }

    function showLogin() {
        loginView.classList.remove('hidden');
        dashboardView.classList.add('hidden');
        loginForm.reset();
        hideError();
    }

    function showDashboard() {
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');

        const user = localStorage.getItem('plantillas_user') || 'Admin';
        userName.textContent = user;
        userAvatar.textContent = user.charAt(0).toUpperCase();

        // Trigger data load
        if (typeof App !== 'undefined' && App.loadPlantillas) {
            App.loadPlantillas();
        }
    }

    function togglePasswordVisibility() {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
    }

    function showError(msg) {
        loginError.textContent = msg;
        loginError.classList.remove('hidden');
    }

    function hideError() {
        loginError.classList.add('hidden');
    }

    function setLoading(btn, loading) {
        const text = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.btn-loader');
        if (loading) {
            text.classList.add('hidden');
            loader.classList.remove('hidden');
            btn.disabled = true;
        } else {
            text.classList.remove('hidden');
            loader.classList.add('hidden');
            btn.disabled = false;
        }
    }

    return { init, showLogin, showDashboard, setLoading };
})();

/* ═══════ Toast Notification ═══════ */
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Boot
document.addEventListener('DOMContentLoaded', () => Auth.init());
