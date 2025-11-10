// Map Manager for Tactical Dashboard using Leaflet.js

class MapManager {
    constructor(mapId, options = {}) {
        this.mapId = mapId;
        this.map = null;
        this.markers = new Map();
        this.options = {
            center: CONFIG.MAP_CONFIG.center,
            zoom: CONFIG.MAP_CONFIG.zoom,
            ...options
        };
    }

    initialize() {
        // Initialize map
        this.map = L.map(this.mapId, {
            zoomControl: false
        }).setView(this.options.center, this.options.zoom);

        // Add tile layer with dark theme
        L.tileLayer(CONFIG.MAP_TILES.dark.url, {
            attribution: CONFIG.MAP_TILES.dark.attribution,
            minZoom: CONFIG.MAP_CONFIG.minZoom,
            maxZoom: CONFIG.MAP_CONFIG.maxZoom
        }).addTo(this.map);

        console.log(`✅ Map initialized: ${this.mapId}`);
    }

    addOffenderMarker(offender) {
        if (!offender.current_location) {
            console.warn(`No location for offender: ${offender.id}`);
            return;
        }

        const { lat, lon } = offender.current_location;
        
        // Create custom icon based on risk level
        const iconColor = CONFIG.RISK_COLORS[offender.risk_level];
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background: ${iconColor};
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 3px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: white;
                    font-size: 14px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                    cursor: pointer;
                ">
                    ${offender.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        // Create marker
        const marker = L.marker([lat, lon], { icon })
            .addTo(this.map)
            .bindPopup(`
                <div style="color: #0a0e1a; min-width: 200px;">
                    <h3 style="margin: 0 0 10px 0; color: #1e88e5;">${offender.name}</h3>
                    <p style="margin: 5px 0;"><strong>ID:</strong> ${offender.id_number}</p>
                    <p style="margin: 5px 0;"><strong>Risk:</strong> <span style="color: ${iconColor}; font-weight: bold;">${offender.risk_level.toUpperCase()}</span></p>
                    <p style="margin: 5px 0;"><strong>Crime:</strong> ${CONFIG.CRIME_TYPES[offender.crime_type]}</p>
                    <p style="margin: 5px 0;"><strong>Officer:</strong> ${offender.case_officer}</p>
                    <button onclick="showOffenderDetail('${offender.id}')" style="
                        margin-top: 10px;
                        padding: 8px 16px;
                        background: #1e88e5;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        width: 100%;
                    ">View Details</button>
                </div>
            `);

        // Store marker reference
        this.markers.set(offender.id, marker);

        // Add geofence zones if any
        if (offender.geofence_zones && offender.geofence_zones.length > 0) {
            this.addGeofenceZones(offender.geofence_zones);
        }

        return marker;
    }

    addUnassignedDeviceMarker(device, location) {
        if (!location || !location.lat || !location.lon) {
            console.warn(`No location for unassigned device: ${device.id}`);
            return;
        }

        const { lat, lon } = location;
        
        // Create custom icon for unassigned device (gray)
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background: #78909c;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    border: 3px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: white;
                    font-size: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
                    cursor: pointer;
                ">
                    <i class="fas fa-microchip"></i>
                </div>
            `,
            iconSize: [35, 35],
            iconAnchor: [17.5, 17.5]
        });

        // Remove old marker if exists
        if (this.markers.has(device.id)) {
            this.map.removeLayer(this.markers.get(device.id));
        }

        // Create marker
        const marker = L.marker([lat, lon], { icon })
            .addTo(this.map)
            .bindPopup(`
                <div style="color: #0a0e1a; min-width: 200px;">
                    <h3 style="margin: 0 0 10px 0; color: #78909c;">Unassigned Device</h3>
                    <p style="margin: 5px 0;"><strong>Device ID:</strong> ${device.id}</p>
                    <p style="margin: 5px 0;"><strong>Type:</strong> ${device.device_type}</p>
                    <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #4caf50; font-weight: bold;">ONLINE</span></p>
                    <p style="margin: 5px 0;"><strong>Battery:</strong> ${device.battery_level}%</p>
                    <p style="margin: 8px 0; padding: 8px; background: #fff3cd; border-radius: 4px; font-size: 12px;">
                        ⚠️ This device is not assigned to any offender
                    </p>
                </div>
            `);

        // Store marker reference
        this.markers.set(device.id, marker);

        return marker;
    }

    updateMarkerPosition(offenderId, lat, lon) {
        const marker = this.markers.get(offenderId);
        if (marker) {
            marker.setLatLng([lat, lon]);
            console.log(`📍 Updated marker for offender: ${offenderId}`);
        }
    }

    removeMarker(offenderId) {
        const marker = this.markers.get(offenderId);
        if (marker) {
            this.map.removeLayer(marker);
            this.markers.delete(offenderId);
        }
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers.clear();
    }

    addGeofenceZones(zones) {
        zones.forEach(zone => {
            const circle = L.circle([zone.lat, zone.lon], {
                color: zone.type === 'exclusion' ? '#f44336' : '#4caf50',
                fillColor: zone.type === 'exclusion' ? '#f44336' : '#4caf50',
                fillOpacity: 0.2,
                radius: zone.radius
            }).addTo(this.map);

            // Add label
            const label = L.marker([zone.lat, zone.lon], {
                icon: L.divIcon({
                    className: 'geofence-label',
                    html: `<div style="
                        background: rgba(0,0,0,0.7);
                        color: white;
                        padding: 5px 10px;
                        border-radius: 4px;
                        font-size: 12px;
                        white-space: nowrap;
                    ">${zone.name}</div>`,
                    iconSize: [0, 0]
                })
            }).addTo(this.map);
        });
    }

    centerOn(lat, lon, zoom = 15) {
        this.map.setView([lat, lon], zoom);
    }

    fitBounds(offenders) {
        if (offenders.length === 0) return;

        const bounds = L.latLngBounds(
            offenders
                .filter(o => o.current_location)
                .map(o => [o.current_location.lat, o.current_location.lon])
        );

        if (bounds.isValid()) {
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    zoomIn() {
        this.map.zoomIn();
    }

    zoomOut() {
        this.map.zoomOut();
    }

    recenter() {
        this.map.setView(this.options.center, this.options.zoom);
    }
}

// Initialize main map (will be created when DOM is loaded)
let mainMap = null;
let detailMap = null;