// WebSocket Connection Manager for Real-time Tracking

class WebSocketManager {
    constructor(wsURL) {
        this.wsURL = wsURL;
        this.ws = null;
        this.clientId = `dashboard-${Date.now()}`;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.isConnected = false;
        this.messageHandlers = [];
    }

    connect() {
        try {
            this.ws = new WebSocket(`${this.wsURL}/tracking/${this.clientId}`);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus(true);
                this.onConnect();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📩 WebSocket message:', data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };

            this.ws.onclose = () => {
                console.log('❌ WebSocket disconnected');
                this.isConnected = false;
                this.updateConnectionStatus(false);
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => {
                this.connect();
            }, CONFIG.WS_RECONNECT_DELAY);
        } else {
            console.error('❌ Max reconnection attempts reached');
            showToast('Connection lost. Please refresh the page.', 'error');
        }
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket is not connected');
        }
    }

    registerDevice(deviceId, deviceType, caseId) {
        this.send({
            type: 'register_device',
            device_id: deviceId,
            device_type: deviceType,
            case_id: caseId
        });
        console.log(`📡 Registering device: ${deviceId}`);
    }

    handleMessage(data) {
        // Call all registered message handlers
        this.messageHandlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error('Error in message handler:', error);
            }
        });
    }

    onMessage(handler) {
        this.messageHandlers.push(handler);
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('ws-status');
        if (statusElement) {
            const statusDot = statusElement.querySelector('.status-dot');
            const statusText = statusElement.querySelector('span:last-child');
            
            if (connected) {
                statusDot.classList.remove('offline');
                statusDot.classList.add('online');
                statusText.textContent = 'Connected';
            } else {
                statusDot.classList.remove('online');
                statusDot.classList.add('offline');
                statusText.textContent = 'Disconnected';
            }
        }
    }

    onConnect() {
        // Override this method to add custom connection logic
        console.log('WebSocket connection established');
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Initialize WebSocket manager
const wsManager = new WebSocketManager(CONFIG.WS_BASE_URL);