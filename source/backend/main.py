"""
Tactical Dashboard for High-Risk Offender Monitoring
FastAPI Backend - MVP Phase
"""

from fastapi import FastAPI, WebSocket, HTTPException, Depends, status, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import asyncio
import json
import uuid
import websockets
from enum import Enum

app = FastAPI(title="Tactical Dashboard API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# ==================== MODELS ====================

class RiskLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class CrimeType(str, Enum):
    SEXUAL_OFFENSE = "sexual_offense"
    DRUG_OFFENSE = "drug_offense"
    VIOLENT_CRIME = "violent_crime"
    ROBBERY = "robbery"
    HOMICIDE = "homicide"
    KIDNAPPING = "kidnapping"

class DeviceStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    TAMPERED = "tampered"
    LOW_BATTERY = "low_battery"

class Device(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_type: str
    case_id: str
    offender_id: Optional[str] = None
    status: DeviceStatus = DeviceStatus.OFFLINE
    battery_level: int = 100
    last_location: Optional[Dict] = None
    last_update: datetime = Field(default_factory=datetime.now)
    tamper_detected: bool = False

class Offender(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    id_number: str
    crime_type: CrimeType
    risk_level: RiskLevel
    photo_url: Optional[str] = None
    date_of_birth: str
    address: str
    phone: str
    case_officer: str
    monitoring_start: datetime
    monitoring_end: datetime
    device_id: Optional[str] = None
    current_location: Optional[Dict] = None
    geofence_zones: List[Dict] = []
    notes: str = ""

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    offender_id: str
    alert_type: str
    severity: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.now)
    acknowledged: bool = False

class User(BaseModel):
    username: str
    role: str = "officer"
    full_name: str

# ==================== IN-MEMORY STORAGE ====================

devices_db: Dict[str, Device] = {}
offenders_db: Dict[str, Offender] = {}
alerts_db: Dict[str, Alert] = {}
users_db: Dict[str, User] = {
    "admin": User(username="admin", role="admin", full_name="System Administrator"),
    "officer1": User(username="officer1", role="officer", full_name="Officer Budi Santoso")
}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.external_ws_connections: Dict[str, websockets.WebSocketClientProtocol] = {}
    
    async def connect(self, client_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[client_id] = websocket
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.external_ws_connections:
            del self.external_ws_connections[client_id]
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        for connection in self.active_connections.values():
            try:
                await connection.send_json(message)
            except:
                pass
    
    async def send_to_client(self, client_id: str, message: dict):
        """Send message to specific client"""
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)

manager = ConnectionManager()

# ==================== AUTHENTICATION ====================

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Simple token verification (in production, use JWT)"""
    # For MVP, accept any token that starts with 'Bearer'
    # In production, implement proper JWT verification
    return credentials.credentials

# ==================== DEVICE ENDPOINTS ====================

@app.post("/api/devices/register", status_code=status.HTTP_201_CREATED)
async def register_device(device: Device):
    """Register a new tracking device"""
    if device.id in devices_db:
        raise HTTPException(status_code=400, detail="Device already registered")
    
    devices_db[device.id] = device
    return {"message": "Device registered successfully", "device": device}

@app.get("/api/devices")
async def get_devices():
    """Get all registered devices"""
    return list(devices_db.values())

@app.get("/api/devices/{device_id}")
async def get_device(device_id: str):
    """Get device by ID"""
    if device_id not in devices_db:
        raise HTTPException(status_code=404, detail="Device not found")
    return devices_db[device_id]

@app.put("/api/devices/{device_id}")
async def update_device(device_id: str, device: Device):
    """Update device information"""
    if device_id not in devices_db:
        raise HTTPException(status_code=404, detail="Device not found")
    
    devices_db[device_id] = device
    return {"message": "Device updated successfully", "device": device}

@app.delete("/api/devices/{device_id}")
async def delete_device(device_id: str):
    """Delete a device"""
    if device_id not in devices_db:
        raise HTTPException(status_code=404, detail="Device not found")
    
    del devices_db[device_id]
    return {"message": "Device deleted successfully"}

# ==================== OFFENDER ENDPOINTS ====================

@app.post("/api/offenders", status_code=status.HTTP_201_CREATED)
async def create_offender(offender: Offender):
    """Create a new offender profile"""
    offenders_db[offender.id] = offender
    return {"message": "Offender created successfully", "offender": offender}

@app.get("/api/offenders")
async def get_offenders():
    """Get all offenders"""
    return list(offenders_db.values())

@app.get("/api/offenders/{offender_id}")
async def get_offender(offender_id: str):
    """Get offender by ID"""
    if offender_id not in offenders_db:
        raise HTTPException(status_code=404, detail="Offender not found")
    return offenders_db[offender_id]

@app.put("/api/offenders/{offender_id}")
async def update_offender(offender_id: str, offender: Offender):
    """Update offender information"""
    if offender_id not in offenders_db:
        raise HTTPException(status_code=404, detail="Offender not found")
    
    offenders_db[offender_id] = offender
    return {"message": "Offender updated successfully", "offender": offender}

@app.delete("/api/offenders/{offender_id}")
async def delete_offender(offender_id: str):
    """Delete an offender"""
    if offender_id not in offenders_db:
        raise HTTPException(status_code=404, detail="Offender not found")
    
    del offenders_db[offender_id]
    return {"message": "Offender deleted successfully"}

# ==================== ALERT ENDPOINTS ====================

@app.get("/api/alerts")
async def get_alerts():
    """Get all alerts"""
    return sorted(alerts_db.values(), key=lambda x: x.timestamp, reverse=True)

@app.post("/api/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Acknowledge an alert"""
    if alert_id not in alerts_db:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alerts_db[alert_id].acknowledged = True
    return {"message": "Alert acknowledged"}

# ==================== DASHBOARD STATS ====================

@app.get("/api/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    total_offenders = len(offenders_db)
    total_devices = len(devices_db)
    active_devices = len([d for d in devices_db.values() if d.status == DeviceStatus.ONLINE])
    total_alerts = len([a for a in alerts_db.values() if not a.acknowledged])
    
    risk_distribution = {
        "critical": len([o for o in offenders_db.values() if o.risk_level == RiskLevel.CRITICAL]),
        "high": len([o for o in offenders_db.values() if o.risk_level == RiskLevel.HIGH]),
        "medium": len([o for o in offenders_db.values() if o.risk_level == RiskLevel.MEDIUM]),
        "low": len([o for o in offenders_db.values() if o.risk_level == RiskLevel.LOW]),
    }
    
    return {
        "total_offenders": total_offenders,
        "total_devices": total_devices,
        "active_devices": active_devices,
        "unacknowledged_alerts": total_alerts,
        "risk_distribution": risk_distribution
    }

# ==================== WEBSOCKET ENDPOINTS ====================

@app.websocket("/ws/tracking/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time tracking"""
    await manager.connect(client_id, websocket)
    print(f"Client {client_id} connected")
    
    try:
        while True:
            # Receive data from client
            data = await websocket.receive_json()
            
            # Handle different message types
            if data.get("type") == "register_device":
                # Client wants to register for GPS tracking
                device_id = data.get("device_id")
                device_type = data.get("device_type")
                case_id = data.get("case_id")
                
                # Connect to external GPS service
                try:
                    external_ws_url = f"wss://api.ebdeskfusion.ai/ws/v1/communication-ws?id={device_id}&deviceType={device_type}&caseId={case_id}"
                    external_ws = await websockets.connect(external_ws_url)
                    manager.external_ws_connections[device_id] = external_ws
                    
                    # Start listening to external WebSocket
                    asyncio.create_task(listen_to_external_ws(device_id, external_ws))
                    
                    await websocket.send_json({
                        "type": "registration_success",
                        "device_id": device_id,
                        "message": "Connected to GPS service"
                    })
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Failed to connect to GPS service: {str(e)}"
                    })
            
            elif data.get("type") == "location_update":
                # Receive location update from client
                await manager.broadcast(data)
    
    except WebSocketDisconnect:
        manager.disconnect(client_id)
        print(f"Client {client_id} disconnected")
    except Exception as e:
        print(f"WebSocket error for {client_id}: {str(e)}")
        manager.disconnect(client_id)

async def listen_to_external_ws(device_id: str, external_ws):
    """Listen to external GPS WebSocket and relay messages"""
    try:
        async for message in external_ws:
            data = json.loads(message)
            
            # Process location data
            if data.get("type") == "location":
                location_data = data.get("data", {}).get("parameters", {}).get("location")
                user_data = data.get("data", {}).get("parameters", {}).get("user")
                
                if location_data:
                    # Update device location
                    if device_id in devices_db:
                        devices_db[device_id].last_location = location_data
                        devices_db[device_id].last_update = datetime.now()
                        devices_db[device_id].status = DeviceStatus.ONLINE
                    
                    # Find associated offender and update location
                    for offender in offenders_db.values():
                        if offender.device_id == device_id:
                            offender.current_location = location_data
                            
                            # Check geofence violations
                            await check_geofence_violations(offender, location_data)
                    
                    # Broadcast to all connected clients
                    await manager.broadcast({
                        "type": "location_update",
                        "device_id": device_id,
                        "location": location_data,
                        "user": user_data,
                        "timestamp": datetime.now().isoformat()
                    })
    
    except websockets.exceptions.ConnectionClosed:
        print(f"External WebSocket connection closed for device {device_id}")
        if device_id in devices_db:
            devices_db[device_id].status = DeviceStatus.OFFLINE
    except Exception as e:
        print(f"Error listening to external WebSocket: {str(e)}")

async def check_geofence_violations(offender: Offender, location: Dict):
    """Check if offender violated any geofence zones"""
    # Simple geofence check (can be enhanced with more sophisticated algorithms)
    for zone in offender.geofence_zones:
        zone_lat = zone.get("lat")
        zone_lon = zone.get("lon")
        zone_radius = zone.get("radius", 100)  # meters
        zone_type = zone.get("type", "exclusion")
        
        # Calculate distance (simplified - use haversine in production)
        lat_diff = abs(location["lat"] - zone_lat)
        lon_diff = abs(location["lon"] - zone_lon)
        distance = ((lat_diff ** 2) + (lon_diff ** 2)) ** 0.5 * 111000  # rough conversion to meters
        
        if zone_type == "exclusion" and distance < zone_radius:
            # Create alert for geofence violation
            alert = Alert(
                offender_id=offender.id,
                alert_type="geofence_violation",
                severity="high",
                message=f"Offender {offender.name} entered restricted zone: {zone.get('name', 'Unknown')}"
            )
            alerts_db[alert.id] = alert
            
            # Broadcast alert
            await manager.broadcast({
                "type": "alert",
                "alert": alert.dict()
            })

# ==================== SEED DATA ====================

@app.on_event("startup")
async def startup_event():
    """Initialize with sample data"""
    
    # Sample devices
    device1 = Device(
        id="device-001",
        device_type="ankle-monitor",
        case_id="case-2024-001",
        status=DeviceStatus.ONLINE,
        battery_level=85
    )
    devices_db[device1.id] = device1
    
    device2 = Device(
        id="device-002",
        device_type="ankle-monitor",
        case_id="case-2024-002",
        status=DeviceStatus.ONLINE,
        battery_level=92
    )
    devices_db[device2.id] = device2
    
    # Sample offenders
    offender1 = Offender(
        id="offender-001",
        name="Ahmad Wijaya",
        id_number="3174051980120001",
        crime_type=CrimeType.SEXUAL_OFFENSE,
        risk_level=RiskLevel.HIGH,
        date_of_birth="1980-12-15",
        address="Jl. Sudirman No. 123, Jakarta Selatan",
        phone="021-555-0123",
        case_officer="Officer Budi Santoso",
        monitoring_start=datetime.now(),
        monitoring_end=datetime.now() + timedelta(days=365),
        device_id="device-001",
        current_location={"lat": -6.2088, "lon": 106.8456, "alt": 0},
        geofence_zones=[
            {
                "name": "School Zone - SDN 01",
                "lat": -6.2100,
                "lon": 106.8500,
                "radius": 500,
                "type": "exclusion"
            }
        ],
        notes="High-risk sexual offender. Requires 24/7 monitoring."
    )
    offenders_db[offender1.id] = offender1
    
    offender2 = Offender(
        id="offender-002",
        name="Budi Setiawan",
        id_number="3175021975080002",
        crime_type=CrimeType.DRUG_OFFENSE,
        risk_level=RiskLevel.MEDIUM,
        date_of_birth="1975-08-20",
        address="Jl. Thamrin No. 45, Jakarta Pusat",
        phone="021-555-0456",
        case_officer="Officer Siti Nurhaliza",
        monitoring_start=datetime.now(),
        monitoring_end=datetime.now() + timedelta(days=180),
        device_id="device-002",
        current_location={"lat": -6.1751, "lon": 106.8650, "alt": 0},
        notes="Drug trafficking case. Curfew from 22:00 to 06:00."
    )
    offenders_db[offender2.id] = offender2
    
    print("✅ Sample data initialized")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=18021)