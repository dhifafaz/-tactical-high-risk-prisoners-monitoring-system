// Main Application Logic for Tactical Dashboard

// ==================== STATE MANAGEMENT ====================
const appState = {
    offenders: [],
    devices: [],
    alerts: [],
    stats: null,
    currentView: 'dashboard',
    selectedOffender: null,
    filteredOffenders: [],
    currentRiskFilter: 'all'
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Tactical Dashboard...');
    
    // Initialize maps
    mainMap = new MapManager('map');
    mainMap.initialize();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    await loadInitialData();
    
    // Connect WebSocket
    wsManager.connect();
    
    // Setup WebSocket message handler
    wsManager.onMessage(handleWebSocketMessage);
    
    // Start periodic updates
    startPeriodicUpdates();
    
    console.log('✅ Dashboard initialized successfully');
});

// ==================== DATA LOADING ====================
async function loadInitialData() {
    try {
        // Load offenders
        appState.offenders = await api.getOffenders();
        appState.filteredOffenders = [...appState.offenders];
        renderOffenderList(appState.offenders);
        
        // Load devices
        appState.devices = await api.getDevices();
        renderDeviceList(appState.devices);
        
        // Load alerts
        appState.alerts = await api.getAlerts();
        renderAlerts(appState.alerts);
        
        // Load stats
        appState.stats = await api.getStats();
        updateDashboardStats(appState.stats);
        
        // Add markers to map for assigned offenders
        appState.offenders.forEach(offender => {
            if (offender.current_location) {
                mainMap.addOffenderMarker(offender);
            }
        });
        
        // Add markers for unassigned devices with locations
        appState.devices.forEach(device => {
            // Check if device is not assigned to any offender
            const isAssigned = appState.offenders.some(o => o.device_id === device.id);
            
            if (!isAssigned && device.last_location) {
                mainMap.addUnassignedDeviceMarker(device, device.last_location);
            }
        });
        
        // Fit map to show all offenders
        mainMap.fitBounds(appState.offenders);
        
        showToast('Dashboard loaded successfully', 'success');
    } catch (error) {
        console.error('Error loading initial data:', error);
        showToast('Error loading data', 'error');
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Map controls
    document.getElementById('center-map')?.addEventListener('click', () => mainMap.recenter());
    document.getElementById('zoom-in')?.addEventListener('click', () => mainMap.zoomIn());
    document.getElementById('zoom-out')?.addEventListener('click', () => mainMap.zoomOut());
    
    // Back button
    document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
        switchView('dashboard');
    });
    
    // Device form
    document.getElementById('show-device-form')?.addEventListener('click', showDeviceForm);
    document.getElementById('cancel-device-form')?.addEventListener('click', hideDeviceForm);
    document.getElementById('register-device-form')?.addEventListener('submit', handleDeviceRegistration);
    
    // Search and filter
    document.getElementById('search-offenders')?.addEventListener('input', handleSearch);
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleRiskFilter);
    });
}

function handleNavigation(e) {
    e.preventDefault();
    const view = e.currentTarget.dataset.view;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Switch view
    switchView(view);
}

function switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    const viewElement = document.getElementById(`${viewName}-view`);
    if (viewElement) {
        viewElement.classList.add('active');
        appState.currentView = viewName;
        
        // View-specific actions
        if (viewName === 'dashboard') {
            // Refresh map
            setTimeout(() => {
                mainMap.map.invalidateSize();
            }, 100);
        }
    }
}

// ==================== WEBSOCKET MESSAGE HANDLING ====================
function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'location_update':
            handleLocationUpdate(data);
            break;
        case 'alert':
            handleNewAlert(data.alert);
            break;
        case 'registration_success':
            showToast(`Device ${data.device_id} connected to GPS service`, 'success');
            break;
        case 'error':
            showToast(data.message, 'error');
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
}

function handleLocationUpdate(data) {
    const { device_id, location, user } = data;
    
    // Find offender with this device
    const offender = appState.offenders.find(o => o.device_id === device_id);
    
    if (offender) {
        // Update offender location
        offender.current_location = location;
        
        // Update marker on map
        mainMap.updateMarkerPosition(offender.id, location.lat, location.lon);
        
        console.log(`📍 Location updated for ${offender.name}:`, location);
    } else {
        // This is an unassigned device - still show it on the map
        const device = appState.devices.find(d => d.id === device_id);
        
        if (device) {
            // Update device location
            device.last_location = location;
            device.last_update = new Date().toISOString();
            device.status = 'online';
            
            // Add or update marker on map for unassigned device
            mainMap.addUnassignedDeviceMarker(device, location);
            
            console.log(`📍 Location updated for unassigned device ${device_id}:`, location);
        } else {
            console.warn(`⚠️ Received location for unknown device: ${device_id}`);
        }
    }
}

function handleNewAlert(alert) {
    // Add alert to state
    appState.alerts.unshift(alert);
    
    // Update alerts display
    renderAlerts(appState.alerts);
    
    // Update alert badge
    const unacknowledgedCount = appState.alerts.filter(a => !a.acknowledged).length;
    document.getElementById('alert-badge').textContent = unacknowledgedCount;
    document.getElementById('total-alerts').textContent = unacknowledgedCount;
    
    // Show toast notification
    showToast(`New alert: ${alert.message}`, 'warning');
}

// ==================== RENDERING FUNCTIONS ====================
function renderOffenderList(offenders) {
    const container = document.getElementById('offender-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    offenders.forEach(offender => {
        const item = document.createElement('div');
        item.className = 'offender-item';
        item.innerHTML = `
            <div class="offender-item-info">
                <div class="offender-item-name">${offender.name}</div>
                <div class="offender-item-id">${offender.id_number}</div>
            </div>
            <div class="risk-indicator ${offender.risk_level}">
                ${Math.floor(Math.random() * 30 + 50)}%
            </div>
        `;
        item.addEventListener('click', () => showOffenderDetail(offender.id));
        container.appendChild(item);
    });
}

function renderDeviceList(devices) {
    const tbody = document.getElementById('devices-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Populate offender select
    const offenderSelect = document.getElementById('offender-select');
    if (offenderSelect) {
        offenderSelect.innerHTML = '<option value="">None</option>';
        appState.offenders.forEach(offender => {
            const option = document.createElement('option');
            option.value = offender.id;
            option.textContent = `${offender.name} (${offender.id_number})`;
            offenderSelect.appendChild(option);
        });
    }
    
    devices.forEach(device => {
        const row = document.createElement('tr');
        
        // Find assigned offender
        const assignedOffender = appState.offenders.find(o => o.device_id === device.id);
        
        row.innerHTML = `
            <td>${device.id}</td>
            <td>${device.device_type}</td>
            <td>${device.case_id}</td>
            <td>${assignedOffender ? assignedOffender.name : 'Unassigned'}</td>
            <td><span class="status-badge ${device.status}">${device.status}</span></td>
            <td>${device.battery_level}%</td>
            <td>${new Date(device.last_update).toLocaleString()}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="connectDevice('${device.id}', '${device.device_type}', '${device.case_id}')">
                    <i class="fas fa-link"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderAlerts(alerts) {
    // Recent alerts in sidebar
    const recentAlerts = document.getElementById('recent-alerts');
    if (recentAlerts) {
        recentAlerts.innerHTML = '';
        alerts.slice(0, 5).forEach(alert => {
            const item = document.createElement('div');
            item.className = `alert-item ${alert.severity}`;
            item.innerHTML = `
                <div class="alert-item-title">${alert.alert_type.replace('_', ' ').toUpperCase()}</div>
                <div class="alert-item-time">${new Date(alert.timestamp).toLocaleTimeString()}</div>
            `;
            recentAlerts.appendChild(item);
        });
    }
    
    // Full alerts view
    const alertsContainer = document.getElementById('alerts-container');
    if (alertsContainer) {
        alertsContainer.innerHTML = '';
        alerts.forEach(alert => {
            const offender = appState.offenders.find(o => o.id === alert.offender_id);
            const card = document.createElement('div');
            card.className = `alert-card ${alert.severity}`;
            card.innerHTML = `
                <div class="alert-card-header">
                    <div class="alert-card-title">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${alert.alert_type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div class="alert-card-time">${new Date(alert.timestamp).toLocaleString()}</div>
                </div>
                <div class="alert-card-message">
                    ${alert.message}
                    ${offender ? `<br><strong>Offender:</strong> ${offender.name}` : ''}
                </div>
                <div class="alert-card-actions">
                    ${!alert.acknowledged ? `
                        <button class="btn btn-primary" onclick="acknowledgeAlert('${alert.id}')">
                            <i class="fas fa-check"></i> Acknowledge
                        </button>
                    ` : '<span style="color: #4caf50;"><i class="fas fa-check-circle"></i> Acknowledged</span>'}
                </div>
            `;
            alertsContainer.appendChild(card);
        });
    }
}

function updateDashboardStats(stats) {
    document.getElementById('total-offenders').textContent = stats.total_offenders;
    document.getElementById('active-devices').textContent = stats.active_devices;
    document.getElementById('total-alerts').textContent = stats.unacknowledged_alerts;
    document.getElementById('alert-badge').textContent = stats.unacknowledged_alerts;
    
    // Update risk distribution chart
    const total = stats.total_offenders || 1;
    
    Object.entries(stats.risk_distribution).forEach(([risk, count]) => {
        const percentage = (count / total) * 100;
        const fillElement = document.getElementById(`risk-${risk}`);
        const valueElement = document.getElementById(`risk-${risk}-value`);
        
        if (fillElement) {
            fillElement.style.width = `${percentage}%`;
        }
        if (valueElement) {
            valueElement.textContent = count;
        }
    });
}

// ==================== OFFENDER DETAIL ====================
function showOffenderDetail(offenderId) {
    const offender = appState.offenders.find(o => o.id === offenderId);
    if (!offender) return;
    
    appState.selectedOffender = offender;
    
    // Handle photo display
    const photoContainer = document.getElementById('detail-photo-container');
    if (photoContainer) {
        if (offender.photo_url) {
            photoContainer.innerHTML = `<img src="${offender.photo_url}" alt="Offender Photo">`;
        } else {
            photoContainer.innerHTML = `
                <div class="default-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        }
    }
    
    // Populate detail view
    document.getElementById('detail-name').textContent = offender.name;
    document.getElementById('detail-risk').textContent = offender.risk_level.toUpperCase();
    document.getElementById('detail-risk').className = `risk-badge ${offender.risk_level}`;
    document.getElementById('detail-crime').textContent = CONFIG.CRIME_TYPES[offender.crime_type];
    document.getElementById('detail-id-number').textContent = offender.id_number;
    document.getElementById('detail-dob').textContent = offender.date_of_birth;
    document.getElementById('detail-address').textContent = offender.address;
    document.getElementById('detail-phone').textContent = offender.phone;
    document.getElementById('detail-officer').textContent = offender.case_officer;
    document.getElementById('detail-device').textContent = offender.device_id || 'None';
    document.getElementById('detail-notes').textContent = offender.notes || 'No notes';
    
    const startDate = new Date(offender.monitoring_start).toLocaleDateString();
    const endDate = new Date(offender.monitoring_end).toLocaleDateString();
    document.getElementById('detail-period').textContent = `${startDate} - ${endDate}`;
    
    if (offender.current_location) {
        document.getElementById('detail-location').textContent = 
            `${offender.current_location.lat.toFixed(6)}, ${offender.current_location.lon.toFixed(6)}`;
        document.getElementById('detail-last-update').textContent = 
            `Last Update: ${new Date().toLocaleTimeString()}`;
    }
    
    // Switch to detail view
    switchView('offender-detail');
    
    // Initialize detail map
    setTimeout(() => {
        if (!detailMap) {
            detailMap = new MapManager('detail-map');
            detailMap.initialize();
        }
        
        if (offender.current_location) {
            detailMap.clearMarkers();
            detailMap.addOffenderMarker(offender);
            detailMap.centerOn(offender.current_location.lat, offender.current_location.lon);
        }
    }, 100);
}

// Make function global for onclick in popup
window.showOffenderDetail = showOffenderDetail;

// ==================== DEVICE MANAGEMENT ====================
function showDeviceForm() {
    document.getElementById('device-form').classList.remove('hidden');
}

function hideDeviceForm() {
    document.getElementById('device-form').classList.add('hidden');
    document.getElementById('register-device-form').reset();
}

async function handleDeviceRegistration(e) {
    e.preventDefault();
    
    const deviceData = {
        id: document.getElementById('device-id').value,
        device_type: document.getElementById('device-type').value,
        case_id: document.getElementById('case-id').value,
        offender_id: document.getElementById('offender-select').value || null,
        status: 'offline',
        battery_level: 100,
        last_update: new Date().toISOString()
    };
    
    try {
        await api.registerDevice(deviceData);
        appState.devices.push(deviceData);
        renderDeviceList(appState.devices);
        hideDeviceForm();
        showToast('Device registered successfully', 'success');
    } catch (error) {
        console.error('Error registering device:', error);
        showToast('Error registering device', 'error');
    }
}

function connectDevice(deviceId, deviceType, caseId) {
    wsManager.registerDevice(deviceId, deviceType, caseId);
    showToast(`Connecting device ${deviceId} to GPS service...`, 'info');
}

// Make function global for onclick
window.connectDevice = connectDevice;

// ==================== ALERTS ====================
async function acknowledgeAlert(alertId) {
    try {
        await api.acknowledgeAlert(alertId);
        const alert = appState.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
        }
        renderAlerts(appState.alerts);
        showToast('Alert acknowledged', 'success');
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        showToast('Error acknowledging alert', 'error');
    }
}

// Make function global for onclick
window.acknowledgeAlert = acknowledgeAlert;

// ==================== SEARCH AND FILTER ====================
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    appState.filteredOffenders = appState.offenders.filter(offender => {
        return offender.name.toLowerCase().includes(searchTerm) ||
               offender.id_number.includes(searchTerm);
    });
    applyFilters();
}

function handleRiskFilter(e) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    appState.currentRiskFilter = e.target.dataset.risk;
    applyFilters();
}

function applyFilters() {
    let filtered = [...appState.filteredOffenders];
    
    // Apply risk filter
    if (appState.currentRiskFilter !== 'all') {
        filtered = filtered.filter(o => o.risk_level === appState.currentRiskFilter);
    }
    
    renderOffenderList(filtered);
}

// ==================== PERIODIC UPDATES ====================
function startPeriodicUpdates() {
    // Update stats periodically
    setInterval(async () => {
        try {
            appState.stats = await api.getStats();
            updateDashboardStats(appState.stats);
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }, CONFIG.INTERVALS.statsUpdate);
}

// ==================== UTILITY FUNCTIONS ====================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, CONFIG.TOAST_DURATION);
    }
}

// ==================== EXPORT FOR CONSOLE DEBUGGING ====================
window.appState = appState;
window.api = api;
window.wsManager = wsManager;
window.mainMap = mainMap;