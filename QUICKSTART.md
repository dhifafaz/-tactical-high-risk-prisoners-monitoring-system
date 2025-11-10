# QUICK START GUIDE
## Tactical Dashboard for High-Risk Offender Monitoring

### ⚡ Quick Setup (5 minutes)

#### Option 1: Automatic Startup (Linux/Mac)
```bash
cd tactical-dashboard
./start.sh
```

#### Option 2: Automatic Startup (Windows)
```cmd
cd tactical-dashboard
start.bat
```

#### Option 3: Manual Setup

**Step 1: Start Backend**
```bash
cd tactical-dashboard/backend
pip install -r requirements.txt
python main.py
```

**Step 2: Start Frontend** (in new terminal)
```bash
cd tactical-dashboard/frontend
python -m http.server 8080
```

**Step 3: Open Browser**
Navigate to: http://localhost:8080

### 🎯 First Steps

1. **View the Dashboard**
   - Main map shows 2 sample offenders
   - Left sidebar lists all offenders
   - Right sidebar shows statistics

2. **Register a Device**
   - Click "Device System" in sidebar
   - Click "Register New Device"
   - Fill in: Device ID, Type, Case ID
   - Click "Register Device"

3. **Connect to GPS Service**
   - In Device Management table
   - Click the link icon (🔗) next to your device
   - Device will connect to GPS WebSocket service
   - Location updates appear in real-time

4. **View Offender Details**
   - Click on any offender in the list OR
   - Click on map marker
   - See full profile and location

### 📋 Key URLs

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **WebSocket**: ws://localhost:8000/ws

### 🔧 Test Features

**Sample Data Included:**
- 2 Offenders (Ahmad Wijaya - High Risk, Budi Setiawan - Medium Risk)
- 2 Devices (device-001, device-002)
- Located in Jakarta, Indonesia

**Test GPS Connection:**
```javascript
// Open Browser Console (F12)
connectDevice('device-001', 'ankle-monitor', 'case-2024-001')
```

### 🐛 Common Issues

**Problem: Port already in use**
```bash
# Backend (port 8000)
kill -9 $(lsof -t -i:8000)

# Frontend (port 8080)
kill -9 $(lsof -t -i:8080)
```

**Problem: WebSocket not connecting**
- Ensure backend is running on port 8000
- Check WebSocket status in right sidebar
- Should show "Connected" with green dot

**Problem: Map not loading**
- Check internet connection (needed for map tiles)
- Open browser console (F12) for errors
- Try refreshing the page

### 📱 Features Overview

✅ Real-time GPS tracking
✅ Device management & registration
✅ Offender profile management
✅ Interactive map with markers
✅ Alert system
✅ Risk-based filtering
✅ Search functionality
✅ Geofencing support
✅ Dashboard statistics
✅ Dark theme UI

### 🎨 UI Navigation

**Sidebar Menu:**
- HOME - Main dashboard with map
- Offender Registry - List all offenders
- Device System - Manage tracking devices
- Alert Management - View and acknowledge alerts
- Analysis & Reports - (Coming in Phase 2)
- Real-time Tracking - Live GPS monitoring

**Map Controls:**
- 🎯 Center Map
- ➕ Zoom In
- ➖ Zoom Out
- 🔥 Toggle Heatmap (Coming soon)

### 📞 Support

For detailed documentation, see README.md

For issues or questions:
1. Check the troubleshooting section in README
2. Inspect browser console (F12) for errors
3. Check backend logs in terminal

---

**🚀 You're ready to go! Start monitoring in real-time.**
