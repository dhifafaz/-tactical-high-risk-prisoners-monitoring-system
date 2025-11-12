// Configuration settings for the Tactical Dashboard

const CONFIG = {
    // API Configuration
    API_BASE_URL: 'http://10.12.1.180:18021/api',
    WS_BASE_URL: 'ws://10.12.1.180:18021/ws',
    
    // External GPS Service
    EXTERNAL_GPS_WS: 'wss://api.ebdeskfusion.ai/ws/v1/communication-ws',
    
    // Map Configuration
    MAP_CONFIG: {
        center: [-6.2088, 106.8456], // Jakarta coordinates
        zoom: 12,
        minZoom: 10,
        maxZoom: 18
    },
    
    // Map Tiles
    MAP_TILES: {
        // Dark theme OSM
        dark: {
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        },
        // Standard OSM
        standard: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    },
    
    // Risk Level Colors
    RISK_COLORS: {
        critical: '#d32f2f',
        high: '#ff5722',
        medium: '#ff9800',
        low: '#4caf50'
    },
    
    // Update Intervals (in milliseconds)
    INTERVALS: {
        statsUpdate: 5000,      // 5 seconds
        locationUpdate: 2000,   // 2 seconds
        alertCheck: 3000        // 3 seconds
    },
    
    // Toast notification duration
    TOAST_DURATION: 3000, // 3 seconds
    
    // WebSocket reconnection
    WS_RECONNECT_DELAY: 5000, // 5 seconds
    
    // Device types
    DEVICE_TYPES: [
        { value: 'ankle-monitor', label: 'Ankle Monitor' },
        { value: 'gps-tracker', label: 'GPS Tracker' },
        { value: 'mobile-app', label: 'Mobile Application' },
        { value: 'desktop', label: 'Desktop' },
        { value: 'other', label: 'Other' }
    ],
    
    // Crime types
    CRIME_TYPES: {
        sexual_offense: 'Sexual Offense',
        drug_offense: 'Drug Offense',
        violent_crime: 'Violent Crime',
        robbery: 'Robbery',
        homicide: 'Homicide',
        kidnapping: 'Kidnapping'
    },
    
    // Risk levels
    RISK_LEVELS: {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low'
    },
    
    // POI Types
    POI_TYPES: {
        school: 'School',
        playground: 'Playground',
        victim_residence: 'Victim Residence',
        restricted_zone: 'Restricted Zone',
        hospital: 'Hospital',
        government_building: 'Government Building',
        other: 'Other'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}