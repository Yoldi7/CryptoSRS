// Cliente HTTP para comunicarse con la API
class APIClient {
    // Ejecutar manualmente una orden pendiente (vulnerable a race condition)
    async executeOrder(orderId) {
        return this.request('POST', `/trading/execute-order/${orderId}`, {});
    }
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('auth_token');
    }

    // Métodos de autenticación
    async register(username, email, password) {
        return this.request('POST', '/auth/register', {
            username,
            email,
            password
        });
    }

    async login(username, password) {
        const response = await this.request('POST', '/auth/login', {
            username,
            password
        });
        if (response.access_token) {
            this.setToken(response.access_token);
        }
        return response;
    }

    async getProfile() {
        return this.request('GET', '/auth/profile');
    }

    async updateProfile(data) {
        return this.request('PUT', '/auth/profile', data);
    }

    // Métodos de trading
    async getCoins() {
        return this.request('GET', '/trading/coins');
    }

    async getWallet() {
        return this.request('GET', '/trading/wallet');
    }

    async createOrder(orderType, coin, amount, priceType = 'limit', targetPrice = 0) {
        return this.request('POST', '/trading/create-order', {
            coin,
            amount: parseFloat(amount),
            order_type: orderType,
            price_type: priceType,
            target_price: parseFloat(targetPrice)
        });
    }

    async cancelOrder(orderId) {
        return this.request('POST', `/trading/cancel-order/${orderId}`, {});
    }

    async getOrders() {
        return this.request('GET', '/trading/orders');
    }

    async getOrder(orderId) {
        return this.request('GET', `/trading/order/${orderId}`);
    }

    // Métodos de bots
    async configureBot(name, config) {
        return this.request('POST', '/bot/configure', {
            name,
            config
        });
    }

    async listBots() {
        return this.request('GET', '/bot/list');
    }

    async getBot(botId) {
        return this.request('GET', `/bot/${botId}`);
    }

    async activateBot(botId) {
        return this.request('POST', `/bot/${botId}/activate`, {});
    }

    async deactivateBot(botId) {
        return this.request('POST', `/bot/${botId}/deactivate`, {});
    }

    async deleteBot(botId) {
        return this.request('DELETE', `/bot/${botId}`, {});
    }

    // Métodos de flags
    async getUserFlag() {
        return this.request('GET', '/flags/user');
    }

    async getAdminFlag() {
        return this.request('GET', '/flags/admin');
    }

    async getProgress() {
        return this.request('GET', '/flags/status');
    }

    // Métodos de utilidad
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
        console.log('[API] Token guardado:', token.substring(0, 20) + '...');
    }

    getToken() {
        return this.token;
    }

    loadTokenFromStorage() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            this.token = token;
            console.log('[API] Token cargado del localStorage');
            return true;
        }
        return false;
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
        console.log('[API] Token eliminado');
    }

    isAuthenticated() {
        return !!this.token;
    }

    // Método HTTP genérico
    async request(method, endpoint, body = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            // Agregar token si existe
            if (this.token) {
                options.headers['Authorization'] = `Bearer ${this.token}`;
            }

            // Agregar body si es una solicitud con datos
            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, options);
            const data = await response.json();

            if (!response.ok) {
                // If unauthorized, clear token and show login page if available
                if (response.status === 401) {
                    this.clearToken();
                    console.warn('[API] Unauthorized (401). Clearing token and redirecting to auth.');
                    if (typeof window !== 'undefined' && window.showAuthPage) {
                        try { window.showAuthPage(); } catch (e) { /* ignore */ }
                    }
                }
                throw {
                    status: response.status,
                    message: data.error || 'Error en la solicitud'
                };
            }

            return data;
        } catch (error) {
            console.error('[API] Error en la solicitud:', error);
            throw error;
        }
    }
}

// Instancia global del cliente API
const api = new APIClient();