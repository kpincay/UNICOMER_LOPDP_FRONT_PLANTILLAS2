/* ═══════════════════════════════════════════════
   API Module — Fetch wrapper with JWT
   ═══════════════════════════════════════════════ */

const API = (() => {
    const BASE = '/api';

    function getToken() {
        return localStorage.getItem('plantillas_token');
    }

    function setToken(token) {
        localStorage.setItem('plantillas_token', token);
    }

    function clearToken() {
        localStorage.removeItem('plantillas_token');
        localStorage.removeItem('plantillas_user');
    }

    function isAuthenticated() {
        const token = getToken();
        if (!token) return false;

        // Check expiration
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    }

    async function request(method, path, body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = { method, headers };
        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${BASE}${path}`, options);

        // Token expired or invalid
        if (response.status === 401) {
            clearToken();
            window.dispatchEvent(new Event('auth:expired'));
            throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
        }

        if (!response.ok) {
            let errorMessage = `Error ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.detail || errorMessage;
            } catch { }
            throw new Error(errorMessage);
        }

        // No content
        if (response.status === 204) return null;

        return response.json();
    }

    return {
        getToken,
        setToken,
        clearToken,
        isAuthenticated,

        // Auth
        login: (username, password) =>
            request('POST', '/auth/login', { username, password }),

        // Plantillas CRUD
        getPlantillas: () => request('GET', '/plantillas'),
        getPlantilla: (id) => request('GET', `/plantillas/${id}`),
        createPlantilla: (data) => request('POST', '/plantillas', data),
        updatePlantilla: (id, data) => request('PUT', `/plantillas/${id}`, data),
        deletePlantilla: (id) => request('DELETE', `/plantillas/${id}`)
    };
})();
