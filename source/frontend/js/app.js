// Main Application Logic for Tactical Dashboard - Enhanced with Prisoner Registration and POI

// ==================== STATE MANAGEMENT ====================
const appState = {
    offenders: [],
    devices: [],
    alerts: [],
    pois: [],
    stats: null,
    currentView: 'dashboard',
    selectedOffender: null,
    filteredOffenders: [],
    currentRiskFilter: 'all',
    editingDevice: null,
    showPOIs: true
};

// ==================== NOTIFICATION SOUND ====================
let notificationSound = null;
let isAudioUnlocked = false;

// Initialize notification sound
document.addEventListener('DOMContentLoaded', () => {
    if (typeof SimpleNotificationSounds !== 'undefined') {
        notificationSound = SimpleNotificationSounds;
        console.log('✅ Notification sound library loaded');
    }
});

function playAlertSound(type = 'alert') {
    if (notificationSound && isAudioUnlocked) {
        try {
            switch(type) {
                case 'critical':
                    notificationSound.playAlert('long');
                    break;
                case 'warning':
                    notificationSound.playWarning('medium');
                    break;
                case 'success':
                    notificationSound.playSuccess('short');
                    break;
                default:
                    notificationSound.playAttention('medium');
            }
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Enhanced Tactical Dashboard...');
    
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

    // Audio unlock
    const unlockAudio = () => {
        if (isAudioUnlocked) return;
        isAudioUnlocked = true;
        console.log('Audio unlocked by user gesture.');
        if (notificationSound) {
            notificationSound.playSuccess('short');
        }
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    
    console.log('✅ Dashboard initialized successfully');
});

// ==================== DATA LOADING ====================
async function loadInitialData() {
    console.log('📊 Loading initial data...');
    
    try {
        // Load offenders
        console.log('  Loading offenders...');
        appState.offenders = await api.getOffenders();
        appState.filteredOffenders = [...appState.offenders];
        console.log(`  ✅ Loaded ${appState.offenders.length} offenders`);
        renderOffenderList(appState.offenders);
        renderOffendersTable(appState.offenders);
        
        // Load devices
        console.log('  Loading devices...');
        appState.devices = await api.getDevices();
        console.log(`  ✅ Loaded ${appState.devices.length} devices`);
        renderDeviceList(appState.devices);
        
        // Load POIs
        console.log('  Loading POIs...');
        appState.pois = await api.getPOIs();
        console.log(`  ✅ Loaded ${appState.pois.length} POIs`);
        renderPOIList(appState.pois);
        
        // Load alerts
        console.log('  Loading alerts...');
        appState.alerts = await api.getAlerts();
        console.log(`  ✅ Loaded ${appState.alerts.length} alerts`);
        renderAlerts(appState.alerts);
        
        // Load stats
        console.log('  Loading stats...');
        appState.stats = await api.getStats();
        console.log('  ✅ Loaded stats:', appState.stats);
        updateDashboardStats(appState.stats);
        
        // Add markers to map
        console.log('  Adding offender markers to map...');
        let offenderMarkersAdded = 0;
        appState.offenders.forEach(offender => {
            if (offender.current_location) {
                mainMap.addOffenderMarker(offender);
                offenderMarkersAdded++;
            }
        });
        console.log(`  ✅ Added ${offenderMarkersAdded} offender markers to map`);
        
        // Add POI markers to map
        console.log('  Adding POI markers to map...');
        let poiMarkersAdded = 0;
        appState.pois.forEach(poi => {
            if (poi.is_active) {
                mainMap.addPOIMarker(poi);
                poiMarkersAdded++;
            }
        });
        console.log(`  ✅ Added ${poiMarkersAdded} POI markers to map`);
        
        // Add unassigned device markers
        console.log('  Adding unassigned device markers...');
        let unassignedDeviceMarkersAdded = 0;
        appState.devices.forEach(device => {
            const isAssigned = appState.offenders.some(o => o.device_id === device.id);
            if (!isAssigned && device.last_location) {
                mainMap.addUnassignedDeviceMarker(device, device.last_location);
                unassignedDeviceMarkersAdded++;
            }
        });
        console.log(`  ✅ Added ${unassignedDeviceMarkersAdded} unassigned device markers`);
        
        // Fit map
        if (appState.offenders.length > 0) {
            mainMap.fitBounds(appState.offenders);
        }
        
        console.log('✅ Dashboard loaded successfully');
        showToast('Dashboard loaded successfully', 'success');
    } catch (error) {
        console.error('❌ Error loading initial data:', error);
        showToast('Error loading data. Please check console for details.', 'error');
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
    
    // Map controls
    document.getElementById('center-map')?.addEventListener('click', () => mainMap.recenter());
    document.getElementById('zoom-in')?.addEventListener('click', () => mainMap.zoomIn());
    document.getElementById('zoom-out')?.addEventListener('click', () => mainMap.zoomOut());
    
    const togglePOIsBtn = document.getElementById('toggle-pois');
    if (togglePOIsBtn) {
        togglePOIsBtn.addEventListener('click', togglePOIs);
        console.log('✅ Toggle POIs button listener attached');
    }
    
    // Back button
    const backBtn = document.getElementById('back-to-dashboard');
    if (backBtn) {
        backBtn.addEventListener('click', () => switchView('dashboard'));
    }
    
    // Use event delegation for form buttons (they might be in hidden views)
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        // Offender form buttons
        if (target.id === 'show-offender-form') {
            e.preventDefault();
            showOffenderForm();
        } else if (target.id === 'cancel-offender-form') {
            e.preventDefault();
            hideOffenderForm();
        }
        // Device form buttons
        else if (target.id === 'show-device-form') {
            e.preventDefault();
            showDeviceForm();
        } else if (target.id === 'cancel-device-form') {
            e.preventDefault();
            hideDeviceForm();
        }
        // POI form buttons
        else if (target.id === 'show-poi-form') {
            e.preventDefault();
            showPOIForm();
        } else if (target.id === 'cancel-poi-form') {
            e.preventDefault();
            hidePOIForm();
        }
    });
    
    // Form submissions
    const offenderForm = document.getElementById('register-offender-form');
    if (offenderForm) {
        offenderForm.addEventListener('submit', handleOffenderRegistration);
        console.log('✅ Offender form submission listener attached');
    }
    
    const deviceForm = document.getElementById('register-device-form');
    if (deviceForm) {
        deviceForm.addEventListener('submit', handleDeviceRegistration);
        console.log('✅ Device form submission listener attached');
    }
    
    const poiForm = document.getElementById('register-poi-form');
    if (poiForm) {
        poiForm.addEventListener('submit', handlePOIRegistration);
        console.log('✅ POI form submission listener attached');
    }
    
    // Search and filter
    const searchBox = document.getElementById('search-offenders');
    if (searchBox) {
        searchBox.addEventListener('input', handleSearch);
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleRiskFilter);
    });
    
    console.log('✅ All event listeners set up');
}

function handleNavigation(e) {
    e.preventDefault();
    const view = e.currentTarget.dataset.view;
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    switchView(view);
}

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    const viewElement = document.getElementById(`${viewName}-view`);
    if (viewElement) {
        viewElement.classList.add('active');
        appState.currentView = viewName;
        
        if (viewName === 'dashboard') {
            setTimeout(() => {
                mainMap.map.invalidateSize();
            }, 100);
        }
    }
}

function togglePOIs() {
    appState.showPOIs = !appState.showPOIs;
    
    if (appState.showPOIs) {
        appState.pois.forEach(poi => {
            if (poi.is_active) {
                mainMap.addPOIMarker(poi);
            }
        });
        showToast('POIs shown on map', 'info');
    } else {
        mainMap.clearPOIMarkers();
        showToast('POIs hidden from map', 'info');
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
    
    const offender = appState.offenders.find(o => o.device_id === device_id);
    
    if (offender) {
        offender.current_location = location;
        mainMap.updateMarkerPosition(offender.id, location.lat, location.lon);
        checkPOIProximity(offender, location);
        console.log(`📍 Location updated for ${offender.name}:`, location);
    } else {
        const device = appState.devices.find(d => d.id === device_id);
        if (device) {
            device.last_location = location;
            device.last_update = new Date().toISOString();
            device.status = 'online';
            mainMap.addUnassignedDeviceMarker(device, location);
            console.log(`📍 Location updated for unassigned device ${device_id}:`, location);
        }
    }
}

// ==================== POI PROXIMITY CHECK ====================
function checkPOIProximity(offender, location) {
    appState.pois.forEach(poi => {
        if (!poi.is_active) return;
        
        const distance = calculateDistance(
            location.lat,
            location.lon,
            poi.lat,
            poi.lon
        );
        
        if (distance < poi.radius) {
            playAlertSound('critical');
            const alertMessage = `⚠️ ${offender.name} is within ${Math.round(distance)}m of POI: ${poi.name}`;
            showToast(alertMessage, 'warning');
            console.log(`🚨 POI ALERT: ${offender.name} within ${Math.round(distance)}m of ${poi.name}`);
        }
    });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function handleNewAlert(alert) {
    appState.alerts.unshift(alert);
    
    if (alert.severity === 'critical') {
        playAlertSound('critical');
    } else if (alert.severity === 'high') {
        playAlertSound('warning');
    } else {
        playAlertSound('alert');
    }
    
    renderAlerts(appState.alerts);
    
    const unacknowledgedCount = appState.alerts.filter(a => !a.acknowledged).length;
    document.getElementById('alert-badge').textContent = unacknowledgedCount;
    document.getElementById('total-alerts').textContent = unacknowledgedCount;
    
    showToast(`New alert: ${alert.message}`, 'warning');
}

// ==================== OFFENDER REGISTRATION (PRISONER REGISTRATION) ====================
function showOffenderForm() {
    console.log('📝 Showing offender registration form...');
    
    const formContainer = document.getElementById('offender-form');
    const form = document.getElementById('register-offender-form');
    
    if (!formContainer) {
        console.error('❌ Offender form container not found!');
        return;
    }
    
    formContainer.classList.remove('hidden');
    form.reset();
    
    console.log('✅ Form container classes:', formContainer.className);
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const endDate = oneYearLater.toISOString().split('T')[0];
    
    const startDateInput = document.getElementById('offender-start-date');
    const endDateInput = document.getElementById('offender-end-date');
    
    if (startDateInput) startDateInput.value = today;
    if (endDateInput) endDateInput.value = endDate;
    
    // Populate device dropdown - only unassigned devices
    const deviceSelect = document.getElementById('offender-device');
    if (deviceSelect) {
        deviceSelect.innerHTML = '<option value="">None</option>';
        
        const assignedDeviceIds = new Set(appState.offenders.map(o => o.device_id).filter(Boolean));
        appState.devices.forEach(device => {
            if (!assignedDeviceIds.has(device.id)) {
                const option = document.createElement('option');
                option.value = device.id;
                option.textContent = `${device.id} (${device.device_type})`;
                deviceSelect.appendChild(option);
            }
        });
        console.log(`✅ Populated device dropdown with ${deviceSelect.options.length - 1} unassigned devices`);
    }
}

function hideOffenderForm() {
    document.getElementById('offender-form').classList.add('hidden');
    document.getElementById('register-offender-form').reset();
}

async function handleOffenderRegistration(e) {
    e.preventDefault();
    
    const offenderData = {
        name: document.getElementById('offender-name').value,
        id_number: document.getElementById('offender-id-number').value,
        date_of_birth: document.getElementById('offender-dob').value,
        crime_type: document.getElementById('offender-crime').value,
        risk_level: document.getElementById('offender-risk').value,
        phone: document.getElementById('offender-phone').value,
        address: document.getElementById('offender-address').value,
        case_officer: document.getElementById('offender-officer').value,
        device_id: document.getElementById('offender-device').value || null,
        monitoring_start: new Date(document.getElementById('offender-start-date').value).toISOString(),
        monitoring_end: new Date(document.getElementById('offender-end-date').value).toISOString(),
        notes: document.getElementById('offender-notes').value || '',
        current_location: null,
        geofence_zones: []
    };
    
    try {
        const result = await api.createOffender(offenderData);
        appState.offenders.push(result.offender);
        appState.filteredOffenders = [...appState.offenders];
        
        renderOffenderList(appState.offenders);
        renderOffendersTable(appState.offenders);
        hideOffenderForm();
        
        showToast(`Offender "${offenderData.name}" registered successfully`, 'success');
    } catch (error) {
        console.error('Error registering offender:', error);
        if (error.message.includes('already exists')) {
            showToast('ID number already exists', 'error');
        } else {
            showToast('Error registering offender', 'error');
        }
    }
}

function renderOffendersTable(offenders) {
    console.log(`👥 Rendering ${offenders.length} offenders to table...`);
    
    const tbody = document.getElementById('offenders-table-body');
    if (!tbody) {
        console.error('❌ Offenders table body not found!');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (offenders.length === 0) {
        console.log('ℹ️ No offenders to display');
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">No offenders registered yet. Click "Register New Offender" to get started.</td>';
        tbody.appendChild(row);
        return;
    }
    
    offenders.forEach((offender, index) => {
        const row = document.createElement('tr');
        
        const deviceName = offender.device_id || 'None';
        const status = offender.current_location ? 'Active' : 'Inactive';
        
        row.innerHTML = `
            <td>${offender.name}</td>
            <td>${offender.id_number}</td>
            <td>${CONFIG.CRIME_TYPES[offender.crime_type]}</td>
            <td><span class="risk-badge ${offender.risk_level}">${offender.risk_level.toUpperCase()}</span></td>
            <td>${offender.case_officer}</td>
            <td>${deviceName}</td>
            <td><span class="status-badge ${status.toLowerCase()}">${status}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="showOffenderDetail('${offender.id}')" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteOffender('${offender.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
        console.log(`  ✅ Rendered offender ${index + 1}: ${offender.name}`);
    });
    
    console.log(`✅ Rendered ${offenders.length} offenders to table successfully`);
}

// ==================== POI MANAGEMENT ====================
function showPOIForm() {
    console.log('📍 Showing POI registration form...');
    
    const formContainer = document.getElementById('poi-form');
    const form = document.getElementById('register-poi-form');
    
    if (!formContainer) {
        console.error('❌ POI form container not found!');
        return;
    }
    
    formContainer.classList.remove('hidden');
    form.reset();
    
    console.log('✅ POI form container classes:', formContainer.className);
    console.log('✅ POI form shown successfully');
}

function hidePOIForm() {
    const formContainer = document.getElementById('poi-form');
    const form = document.getElementById('register-poi-form');
    
    if (formContainer) {
        formContainer.classList.add('hidden');
    }
    if (form) {
        form.reset();
    }
    
    console.log('✅ POI form hidden');
}

async function handlePOIRegistration(e) {
    e.preventDefault();
    
    const poiData = {
        name: document.getElementById('poi-name').value,
        poi_type: document.getElementById('poi-type').value,
        address: document.getElementById('poi-address').value,
        lat: parseFloat(document.getElementById('poi-lat').value),
        lon: parseFloat(document.getElementById('poi-lon').value),
        radius: parseFloat(document.getElementById('poi-radius').value),
        description: document.getElementById('poi-description').value || '',
        is_active: true
    };
    
    try {
        const result = await api.createPOI(poiData);
        appState.pois.push(result.poi);
        
        renderPOIList(appState.pois);
        
        // Add to map
        if (appState.showPOIs) {
            mainMap.addPOIMarker(result.poi);
        }
        
        hidePOIForm();
        showToast(`POI "${poiData.name}" created successfully`, 'success');
        
        // Update stats
        appState.stats = await api.getStats();
        updateDashboardStats(appState.stats);
    } catch (error) {
        console.error('Error creating POI:', error);
        showToast('Error creating POI', 'error');
    }
}

function renderPOIList(pois) {
    console.log(`📍 Rendering ${pois.length} POIs to table...`);
    
    const tbody = document.getElementById('pois-table-body');
    if (!tbody) {
        console.error('❌ POI table body not found!');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (pois.length === 0) {
        console.log('ℹ️ No POIs to display');
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No POIs registered yet. Click "Add New POI" to get started.</td>';
        tbody.appendChild(row);
        return;
    }
    
    pois.forEach((poi, index) => {
        const row = document.createElement('tr');
        
        const statusClass = poi.is_active ? 'online' : 'offline';
        const statusText = poi.is_active ? 'Active' : 'Inactive';
        
        row.innerHTML = `
            <td>${poi.name}</td>
            <td>${poi.poi_type.replace('_', ' ').toUpperCase()}</td>
            <td>${poi.address}</td>
            <td>${poi.lat.toFixed(6)}, ${poi.lon.toFixed(6)}</td>
            <td>${poi.radius}m</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewPOIOnMap('${poi.id}')" title="View on Map">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
                <button class="btn btn-warning btn-sm" onclick="togglePOIStatus('${poi.id}')" title="Toggle Status">
                    <i class="fas fa-power-off"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deletePOI('${poi.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
        console.log(`  ✅ Rendered POI ${index + 1}: ${poi.name}`);
    });
    
    console.log(`✅ Rendered ${pois.length} POIs to table successfully`);
}

async function viewPOIOnMap(poiId) {
    const poi = appState.pois.find(p => p.id === poiId);
    if (!poi) return;
    
    switchView('dashboard');
    
    setTimeout(() => {
        mainMap.centerOn(poi.lat, poi.lon, 15);
        mainMap.map.invalidateSize();
        
        // Ensure POI is shown
        if (!appState.showPOIs) {
            appState.showPOIs = true;
            mainMap.addPOIMarker(poi);
        }
    }, 100);
}

async function togglePOIStatus(poiId) {
    const poi = appState.pois.find(p => p.id === poiId);
    if (!poi) return;
    
    try {
        poi.is_active = !poi.is_active;
        await api.updatePOI(poiId, poi);
        
        if (poi.is_active && appState.showPOIs) {
            mainMap.addPOIMarker(poi);
        } else {
            mainMap.removePOIMarker(poiId);
        }
        
        renderPOIList(appState.pois);
        showToast(`POI "${poi.name}" ${poi.is_active ? 'activated' : 'deactivated'}`, 'success');
    } catch (error) {
        console.error('Error toggling POI status:', error);
        showToast('Error updating POI status', 'error');
    }
}

async function deletePOI(poiId) {
    const poi = appState.pois.find(p => p.id === poiId);
    if (!poi) return;
    
    if (!confirm(`Are you sure you want to delete POI "${poi.name}"?`)) {
        return;
    }
    
    try {
        await api.deletePOI(poiId);
        
        appState.pois = appState.pois.filter(p => p.id !== poiId);
        mainMap.removePOIMarker(poiId);
        renderPOIList(appState.pois);
        
        showToast(`POI "${poi.name}" deleted successfully`, 'success');
        
        // Update stats
        appState.stats = await api.getStats();
        updateDashboardStats(appState.stats);
    } catch (error) {
        console.error('Error deleting POI:', error);
        showToast('Error deleting POI', 'error');
    }
}

window.viewPOIOnMap = viewPOIOnMap;
window.togglePOIStatus = togglePOIStatus;
window.deletePOI = deletePOI;

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
                ${offender.risk_level.substring(0, 1).toUpperCase()}
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
    
    const offenderSelect = document.getElementById('offender-select');
    if (offenderSelect) {
        offenderSelect.innerHTML = '<option value="">None</option>';
        
        const assignedOffenderIds = new Set(
            appState.devices
                .filter(d => d.offender_id && (!appState.editingDevice || d.id !== appState.editingDevice.id))
                .map(d => d.offender_id)
        );
        
        appState.offenders.forEach(offender => {
            if (!assignedOffenderIds.has(offender.id)) {
                const option = document.createElement('option');
                option.value = offender.id;
                option.textContent = `${offender.name} (${offender.id_number})`;
                offenderSelect.appendChild(option);
            }
        });
    }
    
    devices.forEach(device => {
        const row = document.createElement('tr');
        
        const assignedOffender = device.offender_id 
            ? appState.offenders.find(o => o.id === device.offender_id)
            : null;
        
        row.innerHTML = `
            <td>${device.id}</td>
            <td>${device.device_type}</td>
            <td>${device.case_id}</td>
            <td>${assignedOffender ? assignedOffender.name : 'Unassigned'}</td>
            <td><span class="status-badge ${device.status}">${device.status}</span></td>
            <td>${device.battery_level}%</td>
            <td>${new Date(device.last_update).toLocaleString()}</td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="connectDevice('${device.id}', '${device.device_type}', '${device.case_id}')" title="Connect to GPS">
                    <i class="fas fa-link"></i>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="editDevice('${device.id}')" title="Edit Device">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteDevice('${device.id}')" title="Delete Device">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderAlerts(alerts) {
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
    document.getElementById('total-pois').textContent = stats.total_pois || 0;
    document.getElementById('total-alerts').textContent = stats.unacknowledged_alerts;
    document.getElementById('alert-badge').textContent = stats.unacknowledged_alerts;
    
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

// ==================== DEVICE MANAGEMENT ====================
function showDeviceForm() {
    appState.editingDevice = null;
    document.getElementById('device-form').classList.remove('hidden');
    document.getElementById('register-device-form').reset();
}

function hideDeviceForm() {
    document.getElementById('device-form').classList.add('hidden');
    document.getElementById('register-device-form').reset();
    appState.editingDevice = null;
}

function editDevice(deviceId) {
    const device = appState.devices.find(d => d.id === deviceId);
    if (!device) return;
    
    appState.editingDevice = device;
    
    document.getElementById('device-form').classList.remove('hidden');
    document.getElementById('device-id').value = device.id;
    document.getElementById('device-id').disabled = true;
    document.getElementById('device-type').value = device.device_type;
    document.getElementById('case-id').value = device.case_id;
    document.getElementById('offender-select').value = device.offender_id || '';
    
    renderDeviceList(appState.devices);
}

async function deleteDevice(deviceId) {
    const device = appState.devices.find(d => d.id === deviceId);
    if (!device) return;
    
    if (!confirm(`Are you sure you want to delete device "${device.id}"?`)) {
        return;
    }
    
    try {
        await api.deleteDevice(deviceId);
        
        appState.devices = appState.devices.filter(d => d.id !== deviceId);
        
        appState.offenders.forEach(offender => {
            if (offender.device_id === deviceId) {
                offender.device_id = null;
            }
        });
        
        renderDeviceList(appState.devices);
        renderOffenderList(appState.offenders);
        
        showToast(`Device "${device.id}" deleted successfully`, 'success');
    } catch (error) {
        console.error('Error deleting device:', error);
        showToast('Error deleting device', 'error');
    }
}

async function handleDeviceRegistration(e) {
    e.preventDefault();
    
    const selectedOffenderId = document.getElementById('offender-select').value || null;
    
    const deviceData = {
        id: document.getElementById('device-id').value,
        device_type: document.getElementById('device-type').value,
        case_id: document.getElementById('case-id').value,
        offender_id: selectedOffenderId,
        status: 'offline',
        battery_level: 100,
        last_update: new Date().toISOString()
    };
    
    try {
        if (appState.editingDevice) {
            await api.updateDevice(deviceData.id, deviceData);
            
            const index = appState.devices.findIndex(d => d.id === deviceData.id);
            if (index !== -1) {
                appState.devices[index] = deviceData;
            }
            
            showToast('Device updated successfully', 'success');
        } else {
            await api.registerDevice(deviceData);
            appState.devices.push(deviceData);
            showToast('Device registered successfully', 'success');
        }
        
        if (selectedOffenderId) {
            const offender = appState.offenders.find(o => o.id === selectedOffenderId);
            if (offender) {
                offender.device_id = deviceData.id;
            }
        }
        
        document.getElementById('device-id').disabled = false;
        
        renderDeviceList(appState.devices);
        hideDeviceForm();
    } catch (error) {
        console.error('Error saving device:', error);
        
        if (error.message.includes('already assigned')) {
            showToast('This offender is already assigned to another device', 'error');
        } else if (error.message.includes('already registered')) {
            showToast('Device ID already exists', 'error');
        } else {
            showToast('Error saving device', 'error');
        }
    }
}

function connectDevice(deviceId, deviceType, caseId) {
    wsManager.registerDevice(deviceId, deviceType, caseId);
    showToast(`Connecting device ${deviceId} to GPS service...`, 'info');
}

window.connectDevice = connectDevice;
window.editDevice = editDevice;
window.deleteDevice = deleteDevice;

// ==================== OFFENDER DETAIL ====================
function showOffenderDetail(offenderId) {
    const offender = appState.offenders.find(o => o.id === offenderId);
    if (!offender) return;
    
    appState.selectedOffender = offender;
    
    document.getElementById('detail-name').textContent = offender.name;
    document.getElementById('detail-avatar').textContent = offender.name.split(' ').map(n => n[0]).join('').substring(0, 2);
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
    
    const detailContainer = document.querySelector('.detail-panel');
    if (detailContainer) {
        let deleteBtn = detailContainer.querySelector('.btn-delete-offender');
        if (!deleteBtn) {
            deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-delete-offender';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Offender';
            deleteBtn.onclick = () => deleteOffender(offender.id);
            
            const actionButtons = detailContainer.querySelector('.action-buttons');
            if (actionButtons) {
                actionButtons.appendChild(deleteBtn);
            }
        }
    }
    
    switchView('offender-detail');
    
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

async function deleteOffender(offenderId) {
    const offender = appState.offenders.find(o => o.id === offenderId);
    if (!offender) return;
    
    if (!confirm(`Are you sure you want to delete offender "${offender.name}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        await api.deleteOffender(offenderId);
        
        appState.offenders = appState.offenders.filter(o => o.id !== offenderId);
        appState.filteredOffenders = appState.filteredOffenders.filter(o => o.id !== offenderId);
        
        mainMap.removeMarker(offenderId);
        
        renderOffenderList(appState.offenders);
        renderOffendersTable(appState.offenders);
        
        switchView('dashboard');
        
        showToast(`Offender "${offender.name}" deleted successfully`, 'success');
    } catch (error) {
        console.error('Error deleting offender:', error);
        showToast('Error deleting offender', 'error');
    }
}

window.showOffenderDetail = showOffenderDetail;
window.deleteOffender = deleteOffender;

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
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    appState.currentRiskFilter = e.target.dataset.risk;
    applyFilters();
}

function applyFilters() {
    let filtered = [...appState.filteredOffenders];
    
    if (appState.currentRiskFilter !== 'all') {
        filtered = filtered.filter(o => o.risk_level === appState.currentRiskFilter);
    }
    
    renderOffenderList(filtered);
}

// ==================== PERIODIC UPDATES ====================
function startPeriodicUpdates() {
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
        
        if (isAudioUnlocked) {
            if (type === 'success') {
                playAlertSound('success');
            } else if (type === 'error' || type === 'warning') {
                playAlertSound('warning');
            }
        }
        
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