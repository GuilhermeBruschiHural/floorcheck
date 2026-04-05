import asyncio
import json
import logging
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from pydantic import BaseModel
from database import get_db, init_db
from models import Zone, DetectionEvent, ProductivityLog
from detector import detector
from config import VIDEO_SOURCE, HOST, PORT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- Pydantic Schemas ---

class ZoneCreate(BaseModel):
    name: str
    polygon: list[list[float]]
    camera_id: str = "cam_01"
    assigned_worker: str | None = None

class ZoneResponse(BaseModel):
    id: int
    name: str
    polygon: list[list[float]]
    camera_id: str
    assigned_worker: str | None
    is_active: bool

class CameraConfig(BaseModel):
    source: str  # "demo", RTSP URL, or HTTP URL


# --- WebSocket Manager ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active_connections.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active_connections.remove(ws)

    async def broadcast(self, data: dict):
        for conn in self.active_connections[:]:
            try:
                await conn.send_json(data)
            except Exception:
                self.active_connections.remove(conn)

manager = ConnectionManager()


# --- App Lifecycle ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    detector.load_model()
    detector.open_video(VIDEO_SOURCE)

    # Load zones from DB
    db = next(get_db())
    zones = db.query(Zone).filter(Zone.is_active == True).all()
    zone_list = [{"id": z.id, "name": z.name, "polygon": z.polygon} for z in zones]

    if not zone_list:
        # Create default demo zones
        default_zones = [
            Zone(name="CNC-01", polygon=[[0.05, 0.08], [0.33, 0.08], [0.33, 0.44], [0.05, 0.44]], camera_id="cam_01"),
            Zone(name="Torno-01", polygon=[[0.45, 0.08], [0.73, 0.08], [0.73, 0.44], [0.45, 0.44]], camera_id="cam_01"),
            Zone(name="Fresa-01", polygon=[[0.05, 0.56], [0.33, 0.56], [0.33, 0.92], [0.05, 0.92]], camera_id="cam_01"),
            Zone(name="Solda-01", polygon=[[0.45, 0.56], [0.73, 0.56], [0.73, 0.92], [0.45, 0.92]], camera_id="cam_01"),
        ]
        for z in default_zones:
            db.add(z)
        db.commit()
        zone_list = [{"id": z.id, "name": z.name, "polygon": z.polygon} for z in default_zones]

    detector.set_zones(zone_list)
    db.close()

    # Start detection loop in background
    detection_task = asyncio.create_task(run_detection_loop())

    yield

    detector.stop()
    detection_task.cancel()


async def run_detection_loop():
    """Background task that runs detection and broadcasts results."""
    event_buffer = []
    last_log_time = datetime.now()

    async def on_detection(frame_b64, zone_results):
        nonlocal event_buffer, last_log_time

        await manager.broadcast({
            "type": "frame",
            "frame": frame_b64,
            "zones": zone_results,
            "timestamp": datetime.now().isoformat()
        })

        # Buffer events for batch DB insert
        for zid, zdata in zone_results.items():
            event_buffer.append(DetectionEvent(
                zone_id=zid,
                zone_name=zdata["zone_name"],
                status=zdata["status"],
                person_count=zdata["person_count"]
            ))

        # Flush to DB every 30 seconds
        now = datetime.now()
        if (now - last_log_time).seconds >= 30 and event_buffer:
            db = next(get_db())
            try:
                db.bulk_save_objects(event_buffer)
                db.commit()
                _update_productivity_logs(db, zone_results)
            finally:
                db.close()
            event_buffer = []
            last_log_time = now

    try:
        await detector.stream_loop(on_detection)
    except asyncio.CancelledError:
        pass


def _update_productivity_logs(db: Session, zone_results: dict):
    """Update hourly productivity logs."""
    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    hour = now.hour

    for zid, zdata in zone_results.items():
        log = db.query(ProductivityLog).filter(
            ProductivityLog.zone_id == zid,
            ProductivityLog.date == date_str,
            ProductivityLog.hour == hour
        ).first()

        if not log:
            log = ProductivityLog(
                zone_id=zid,
                zone_name=zdata["zone_name"],
                date=date_str,
                hour=hour
            )
            db.add(log)

        if zdata["status"] == "active":
            log.active_minutes += 0.5
        else:
            log.idle_minutes += 0.5
        log.total_detections += 1

    db.commit()


# --- FastAPI App ---

app = FastAPI(
    title="FloorCheck API",
    description="Factory floor productivity monitoring via AI",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- REST Endpoints ---

@app.get("/api/zones", response_model=list[ZoneResponse])
def list_zones(db: Session = Depends(get_db)):
    return db.query(Zone).filter(Zone.is_active == True).all()


@app.post("/api/zones", response_model=ZoneResponse)
def create_zone(zone: ZoneCreate, db: Session = Depends(get_db)):
    db_zone = Zone(**zone.model_dump())
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)

    # Update detector zones
    zones = db.query(Zone).filter(Zone.is_active == True).all()
    detector.set_zones([{"id": z.id, "name": z.name, "polygon": z.polygon} for z in zones])

    return db_zone


@app.delete("/api/zones/{zone_id}")
def delete_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(404, "Zone not found")
    zone.is_active = False
    db.commit()

    zones = db.query(Zone).filter(Zone.is_active == True).all()
    detector.set_zones([{"id": z.id, "name": z.name, "polygon": z.polygon} for z in zones])

    return {"ok": True}


@app.get("/api/status")
def get_status():
    """Current real-time status of all zones."""
    return {
        "zones": detector.zone_status,
        "source": detector.current_source,
        "is_running": detector.is_running,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/camera")
def configure_camera(config: CameraConfig):
    """Switch video source."""
    detector.open_video(config.source)
    return {"ok": True, "source": config.source}


@app.get("/api/analytics")
def get_analytics(days: int = 7, db: Session = Depends(get_db)):
    """Get productivity analytics for the last N days."""
    since = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    logs = db.query(ProductivityLog).filter(ProductivityLog.date >= since).all()

    # Aggregate by zone
    zone_stats = {}
    for log in logs:
        if log.zone_name not in zone_stats:
            zone_stats[log.zone_name] = {"active": 0, "idle": 0, "detections": 0}
        zone_stats[log.zone_name]["active"] += log.active_minutes
        zone_stats[log.zone_name]["idle"] += log.idle_minutes
        zone_stats[log.zone_name]["detections"] += log.total_detections

    # Aggregate by day
    daily_stats = {}
    for log in logs:
        if log.date not in daily_stats:
            daily_stats[log.date] = {"active": 0, "idle": 0}
        daily_stats[log.date]["active"] += log.active_minutes
        daily_stats[log.date]["idle"] += log.idle_minutes

    # Hourly pattern (average across days)
    hourly_stats = {}
    for log in logs:
        if log.hour not in hourly_stats:
            hourly_stats[log.hour] = {"active": 0, "idle": 0, "count": 0}
        hourly_stats[log.hour]["active"] += log.active_minutes
        hourly_stats[log.hour]["idle"] += log.idle_minutes
        hourly_stats[log.hour]["count"] += 1

    return {
        "period_days": days,
        "zone_stats": zone_stats,
        "daily_stats": daily_stats,
        "hourly_stats": hourly_stats
    }


@app.get("/api/events")
def get_events(limit: int = 50, zone_id: int | None = None, db: Session = Depends(get_db)):
    """Get recent detection events."""
    query = db.query(DetectionEvent).order_by(DetectionEvent.timestamp.desc())
    if zone_id:
        query = query.filter(DetectionEvent.zone_id == zone_id)
    return query.limit(limit).all()


# --- Safety Compliance Endpoints ---

@app.get("/api/safety/status")
def get_safety_status():
    """Current PPE compliance status (mock data for MVP)."""
    return {
        "compliance": 87,
        "violations": 2,
        "workers": [
            {"name": "Carlos S.", "zone": "CNC-01", "ppe": {"capacete": True, "colete": True, "oculos": False}, "compliant": False},
            {"name": "Ana M.", "zone": "Torno-01", "ppe": {"capacete": True, "colete": True, "oculos": True}, "compliant": True},
            {"name": "Pedro L.", "zone": "Fresa-01", "ppe": {"capacete": True, "colete": False, "oculos": True}, "compliant": False},
            {"name": "Julia R.", "zone": "Solda-01", "ppe": {"capacete": True, "colete": True, "oculos": True}, "compliant": True},
        ],
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/safety/analytics")
def get_safety_analytics(days: int = 7):
    """Safety compliance analytics (mock data for MVP)."""
    return {
        "period_days": days,
        "compliance_trend": [
            {"date": (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"), "compliance": 80 + i * 2}
            for i in range(days, 0, -1)
        ],
        "violations_by_item": {"capacete": 12, "colete": 23, "oculos": 31},
        "violations_by_zone": {"CNC-01": 5, "Torno-01": 12, "Fresa-01": 22, "Solda-01": 8},
    }


# --- Heatmap Endpoints ---

@app.get("/api/heatmap")
def get_heatmap(minutes: int = 60):
    """Aggregated position heatmap grid (mock data for MVP)."""
    import random
    grid_size = 50
    grid = [[0] * grid_size for _ in range(grid_size)]
    # Simulate hotspots around zone centers
    hotspots = [(8, 12), (25, 12), (8, 37), (25, 37)]
    for cx, cy in hotspots:
        for _ in range(random.randint(20, 50)):
            gx = max(0, min(grid_size - 1, cx + random.randint(-5, 5)))
            gy = max(0, min(grid_size - 1, cy + random.randint(-5, 5)))
            grid[gy][gx] += random.randint(1, 5)
    return {"grid": grid, "grid_size": grid_size, "minutes": minutes}


@app.get("/api/bottlenecks")
def get_bottlenecks():
    """Detected bottleneck points (mock data for MVP)."""
    return {
        "bottlenecks": [
            {"zone": "Fresa-01", "density": 42, "severity": "high"},
            {"zone": "Torno-01", "density": 28, "severity": "medium"},
        ],
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/movement/stats")
def get_movement_stats():
    """Movement analytics summary (mock data for MVP)."""
    return {
        "avg_distance_per_worker": 245.3,
        "transit_time_pct": 18.5,
        "operating_time_pct": 81.5,
        "zone_dwell": {
            "CNC-01": 28, "Torno-01": 25, "Fresa-01": 22, "Solda-01": 20, "Trânsito": 5
        }
    }


# --- Shift Report Endpoints ---

@app.get("/api/reports/shift")
def get_shift_report(shift: str = "A", date: str | None = None):
    """Generate AI shift report (mock data for MVP)."""
    report_date = date or datetime.now().strftime("%Y-%m-%d")
    return {
        "shift": shift,
        "date": report_date,
        "productivity": 82.4 if shift == "A" else 78.9,
        "trend": "+3.1%" if shift == "A" else "-1.2%",
        "active_time": "6h 35min" if shift == "A" else "6h 19min",
        "idle_time": "1h 25min" if shift == "A" else "1h 41min",
        "safety_score": 87 if shift == "A" else 74,
        "highlights": [
            "CNC-01 operou 96% do tempo" if shift == "A" else "Torno-01 atingiu 92% de produtividade",
        ],
        "alerts": [
            "Solda-01 ficou ociosa por 47min entre 10h-11h" if shift == "A" else "Queda de produtividade geral de 14h30 às 15h00",
        ],
        "recommendations": [
            "Verificar disponibilidade de material para soldagem" if shift == "A" else "Implementar warm-up de 15min no início do turno",
        ],
    }


@app.post("/api/reports/send")
def send_shift_report(shift: str = "A"):
    """Send shift report via WhatsApp (mock — returns success)."""
    return {
        "ok": True,
        "message": f"Report for shift {shift} sent successfully",
        "recipients": 2,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/reports/history")
def get_report_history(limit: int = 10):
    """Report sending history (mock data for MVP)."""
    history = []
    for i in range(limit):
        d = datetime.now() - timedelta(hours=i * 8)
        history.append({
            "date": d.strftime("%Y-%m-%d"),
            "shift": "A" if i % 2 == 0 else "B",
            "productivity": round(75 + i * 1.2, 1),
            "sent": i < limit - 1,
            "sent_at": d.isoformat(),
        })
    return history


# --- WebSocket ---

@app.websocket("/ws/feed")
async def websocket_feed(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await ws.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(ws)


# --- Run ---

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
