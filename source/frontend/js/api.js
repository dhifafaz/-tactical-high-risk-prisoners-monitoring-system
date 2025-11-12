// API Client for Tactical Dashboard - Enhanced with POI Support

class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // ==================== DEVICE ENDPOINTS ====================
    
    async registerDevice(deviceData) {
        return await this.request('/devices/register', {
            method: 'POST',
            body: JSON.stringify(deviceData)
        });
    }

    async getDevices() {
        return await this.request('/devices');
    }

    async getDevice(deviceId) {
        return await this.request(`/devices/${deviceId}`);
    }

    async updateDevice(deviceId, deviceData) {
        return await this.request(`/devices/${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify(deviceData)
        });
    }

    async deleteDevice(deviceId) {
        return await this.request(`/devices/${deviceId}`, {
            method: 'DELETE'
        });
    }

    // ==================== OFFENDER ENDPOINTS ====================
    
    async createOffender(offenderData) {
        return await this.request('/offenders', {
            method: 'POST',
            body: JSON.stringify(offenderData)
        });
    }

    async getOffenders() {
        return await this.request('/offenders');
    }

    async getOffender(offenderId) {
        return await this.request(`/offenders/${offenderId}`);
    }

    async updateOffender(offenderId, offenderData) {
        return await this.request(`/offenders/${offenderId}`, {
            method: 'PUT',
            body: JSON.stringify(offenderData)
        });
    }

    async deleteOffender(offenderId) {
        return await this.request(`/offenders/${offenderId}`, {
            method: 'DELETE'
        });
    }

    // ==================== POI ENDPOINTS ====================
    
    async createPOI(poiData) {
        return await this.request('/pois', {
            method: 'POST',
            body: JSON.stringify(poiData)
        });
    }

    async getPOIs() {
        return await this.request('/pois');
    }

    async getPOI(poiId) {
        return await this.request(`/pois/${poiId}`);
    }

    async updatePOI(poiId, poiData) {
        return await this.request(`/pois/${poiId}`, {
            method: 'PUT',
            body: JSON.stringify(poiData)
        });
    }

    async deletePOI(poiId) {
        return await this.request(`/pois/${poiId}`, {
            method: 'DELETE'
        });
    }

    // ==================== ALERT ENDPOINTS ====================
    
    async getAlerts() {
        return await this.request('/alerts');
    }

    async acknowledgeAlert(alertId) {
        return await this.request(`/alerts/${alertId}/acknowledge`, {
            method: 'POST'
        });
    }

    // ==================== STATS ENDPOINTS ====================
    
    async getStats() {
        return await this.request('/stats');
    }
}

// Initialize API client
const api = new APIClient(CONFIG.API_BASE_URL);