# Tactical Dashboard for High-Risk Offender Monitoring

A comprehensive real-time monitoring system for tracking high-risk offenders using GPS ankle monitors and other tracking devices. Built with FastAPI backend and vanilla JavaScript frontend.

## 🎯 Overview

This system provides law enforcement and probation officers with a tactical dashboard to monitor high-risk offenders in real-time, including:

- **Real-time GPS tracking** via WebSocket connections
- **Device management** for ankle monitors and GPS trackers
- **Offender profile management** with risk assessment
- **Geofencing** with violation alerts
- **Alert system** for device tampering, battery, and zone violations
- **Interactive map** with Leaflet.js showing live offender locations
- **Dashboard statistics** and analytics

## 📋 Features (MVP Phase)

### Core Capabilities

1. **Device Registration & Management**
   - Register new tracking devices dynamically
   - Monitor device status (online/offline/tampered)
   - Track battery levels
   - Detect tampering

2. **Real-Time GPS Tracking**
   - WebSocket connection to external GPS service
   - Live location updates on interactive map
   - Location history tracking
   - Geofence monitoring

3. **Offender Profile Management**
   - Complete offender information management
   - Risk level assessment (Critical/High/Medium/Low)
   - Crime type classification
   - Case officer assignment
   - Monitoring period tracking

4. **Alert System**
   - Device tampering alerts
   - Geofence violation alerts
   - Low battery warnings
   - Device offline notifications
   - Real-time push notifications

5. **Interactive Dashboard**
   - Real-time map view with all offender locations
   - List view with risk-based filtering
   - Individual offender detail pages
   - Statistics and analytics

## 🛠 Technology Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **WebSockets** - Real-time bidirectional communication
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **HTML5/CSS3** - Modern web standards
- **Vanilla JavaScript** - No framework dependencies
- **Leaflet.js** - Interactive maps
- **Font Awesome** - Icons

## 📦 Project Structure

```
tactical-dashboard/
├── backend/
│   ├── main.py              # FastAPI application
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── css/
│   │   └── styles.css      # Complete styling
│   └── js/
│       ├── config.js       # Configuration
│       ├── api.js          # API client
│       ├── websocket.js    # WebSocket manager
│       ├── map.js          # Map management
│       └── app.js          # Main application logic
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites

- Python 3.11 or higher
- Modern web browser (Chrome, Firefox, Edge)
- Internet connection (for map tiles and GPS service)

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start the FastAPI server:**
   ```bash
   python main.py
   ```
   
   The server will start on `http://localhost:8000`

3. **Verify the API is running:**
   - Open `http://localhost:8000/docs` for interactive API documentation
   - API endpoints are available at `http://localhost:8000/api/`
   - WebSocket endpoint at `ws://localhost:8000/ws/`

### Frontend Setup

1. **Open the frontend:**
   ```bash
   cd ../frontend
   ```

2. **Serve the frontend** (choose one method):
   
   **Option A: Using Python's HTTP server:**
   ```bash
   python -m http.server 8080
   ```
   Then open `http://localhost:8080` in your browser

   **Option B: Using VS Code Live Server:**
   - Install "Live Server" extension
   - Right-click on `index.html` and select "Open with Live Server"

   **Option C: Direct file access:**
   - Open `index.html` directly in your browser
   - Note: Some features may be limited due to CORS restrictions

## 📖 Usage Guide

### Dashboard Overview

1. **Main Map View**
   - Shows all monitored offenders with color-coded markers
   - Critical: Red | High: Orange | Medium: Yellow | Low: Green
   - Click on markers for quick information popup
   - Use map controls to zoom and center

2. **Left Sidebar**
   - Navigation menu
   - Offender list with risk indicators
   - Search and filter functionality
   - Risk-based filtering (All/Critical/High/Medium/Low)

3. **Right Sidebar**
   - WebSocket connection status
   - Risk distribution chart
   - Recent alerts panel

4. **Top Header**
   - Dashboard statistics (Total offenders, Active devices, Alerts)
   - User information
   - Notification bell with alert count

### Device Registration

1. Click **"Device Management"** in the sidebar
2. Click **"Register New Device"** button
3. Fill in the form:
   - Device ID (e.g., device-003)
   - Device Type (Ankle Monitor/GPS Tracker/Mobile App)
   - Case ID (e.g., case-2024-003)
   - Optional: Assign to an offender
4. Click **"Register Device"**

### Connecting to GPS Service

1. Go to **Device Management**
2. Find your registered device in the table
3. Click the **Link button** (🔗) to connect to GPS service
4. Device will connect to: `wss://api.ebdeskfusion.ai/ws/v1/communication-ws`
5. Location updates will appear in real-time on the map

### Viewing Offender Details

1. Click on an offender in the **sidebar list** OR
2. Click on their **marker on the map**
3. Click **"View Details"** button
4. Detailed view shows:
   - Profile photo and information
   - Risk level and crime type
   - Contact information
   - Assigned device
   - Current location on dedicated map
   - Action buttons (Edit, Report, Create Alert)

### Managing Alerts

1. Click **"Alert Management"** in sidebar
2. View all alerts with severity levels
3. Click **"Acknowledge"** to mark alerts as read
4. Recent alerts appear in the right sidebar

### Search and Filter

- **Search Box**: Enter offender name or ID number
- **Risk Filters**: Click on risk level buttons to filter
- Combine search with filters for precise results

## 🔌 API Endpoints

### Devices
- `POST /api/devices/register` - Register new device
- `GET /api/devices` - Get all devices
- `GET /api/devices/{device_id}` - Get specific device
- `PUT /api/devices/{device_id}` - Update device
- `DELETE /api/devices/{device_id}` - Delete device

### Offenders
- `POST /api/offenders` - Create offender profile
- `GET /api/offenders` - Get all offenders
- `GET /api/offenders/{offender_id}` - Get specific offender
- `PUT /api/offenders/{offender_id}` - Update offender
- `DELETE /api/offenders/{offender_id}` - Delete offender

### Alerts
- `GET /api/alerts` - Get all alerts
- `POST /api/alerts/{alert_id}/acknowledge` - Acknowledge alert

### Stats
- `GET /api/stats` - Get dashboard statistics

### WebSocket
- `WS /ws/tracking/{client_id}` - Real-time tracking connection

## 📡 WebSocket Integration

### External GPS Service

The system connects to an external GPS service:

```
wss://api.ebdeskfusion.ai/ws/v1/communication-ws?id={device_id}&deviceType={device_type}&caseId={case_id}
```

### Message Format

**Connection Message:**
```json
{
  "type": "location",
  "data": {
    "action": "connection",
    "sender": "device-id",
    "parameters": {
      "location": {
        "lat": -6.2683,
        "lon": 106.6871,
        "alt": 0
      },
      "connected": true,
      "user": {...},
      "team": {...}
    }
  }
}
```

## 🎨 UI Theme

The dashboard uses a **dark theme** with:
- **Primary Color**: Dark Blue (#0a0e1a)
- **Accent Color**: Bright Blue (#1e88e5)
- **Text Color**: White (#ffffff)
- **Risk Colors**:
  - Critical: Red (#d32f2f)
  - High: Orange (#ff5722)
  - Medium: Yellow (#ff9800)
  - Low: Green (#4caf50)

## 🔐 Security Considerations

**For Production Deployment:**

1. **Authentication**: Implement JWT tokens
2. **Authorization**: Role-based access control (Admin/Officer)
3. **HTTPS**: Use SSL/TLS encryption
4. **Database**: Replace in-memory storage with PostgreSQL
5. **API Keys**: Secure external service credentials
6. **Input Validation**: Enhanced server-side validation
7. **Rate Limiting**: Prevent API abuse
8. **Audit Logging**: Track all system actions

## 🐛 Troubleshooting

### Backend Issues

**Problem: Server won't start**
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill the process if needed
kill -9 <PID>

# Restart the server
python main.py
```

**Problem: WebSocket connection fails**
- Check if backend is running on port 8000
- Verify WebSocket URL in `frontend/js/config.js`
- Check browser console for errors

### Frontend Issues

**Problem: Map doesn't display**
- Check internet connection (map tiles require internet)
- Open browser console and check for errors
- Verify Leaflet.js is loading properly

**Problem: No real-time updates**
- Check WebSocket connection status (right sidebar)
- Verify device is registered and connected
- Check if GPS service is responding

## 🚧 Future Enhancements (Phase 2 & 3)

### Phase 2
- Multi-agent monitoring system
- Advanced geofencing with time-based restrictions
- Heatmap visualization
- Reporting and analytics module
- Communication module

### Phase 3
- AI/ML integration for predictive analytics
- Computer vision for body camera integration
- External system integration (police/court databases)
- Mobile application for officers
- Advanced case management

## 📝 Sample Data

The system includes sample data for testing:

**Offender 1:**
- Name: Ahmad Wijaya
- Risk: High
- Crime: Sexual Offense
- Location: Jakarta (-6.2088, 106.8456)

**Offender 2:**
- Name: Budi Setiawan
- Risk: Medium
- Crime: Drug Offense
- Location: Jakarta (-6.1751, 106.8650)

## 📄 License

This project is developed for law enforcement and security purposes.

## 👥 Support

For questions or issues, please refer to the documentation or contact the development team.

---

**Built with ❤️ for Indonesia's Security System**
