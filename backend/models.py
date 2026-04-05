from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean
from sqlalchemy.sql import func
from database import Base


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    camera_id = Column(String, default="cam_01")
    # Polygon points as list of [x, y] pairs (normalized 0-1)
    polygon = Column(JSON, nullable=False)
    assigned_worker = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class DetectionEvent(Base):
    __tablename__ = "detection_events"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, nullable=False)
    zone_name = Column(String, nullable=False)
    status = Column(String, nullable=False)  # "active" or "idle"
    person_count = Column(Integer, default=0)
    confidence = Column(Float, nullable=True)
    timestamp = Column(DateTime, server_default=func.now())


class ProductivityLog(Base):
    __tablename__ = "productivity_logs"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, nullable=False)
    zone_name = Column(String, nullable=False)
    date = Column(String, nullable=False)  # YYYY-MM-DD
    hour = Column(Integer, nullable=False)  # 0-23
    active_minutes = Column(Float, default=0.0)
    idle_minutes = Column(Float, default=0.0)
    total_detections = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())


class PPEEvent(Base):
    """Safety compliance events — PPE violations."""
    __tablename__ = "ppe_events"

    id = Column(Integer, primary_key=True, index=True)
    worker_name = Column(String, nullable=False)
    zone_name = Column(String, nullable=False)
    missing_items = Column(JSON, nullable=False)  # ["capacete", "oculos"]
    timestamp = Column(DateTime, server_default=func.now())


class MovementPoint(Base):
    """Worker position samples for heatmap generation."""
    __tablename__ = "movement_points"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, nullable=False)
    x = Column(Float, nullable=False)  # normalized 0-1
    y = Column(Float, nullable=False)  # normalized 0-1
    zone_name = Column(String, nullable=True)
    timestamp = Column(DateTime, server_default=func.now())


class ShiftReport(Base):
    """Generated shift report records."""
    __tablename__ = "shift_reports"

    id = Column(Integer, primary_key=True, index=True)
    shift = Column(String, nullable=False)  # "A", "B", "C"
    date = Column(String, nullable=False)  # YYYY-MM-DD
    productivity = Column(Float, default=0.0)
    report_json = Column(JSON, nullable=True)  # Full report data
    sent = Column(Boolean, default=False)
    sent_to = Column(JSON, nullable=True)  # Phone numbers
    created_at = Column(DateTime, server_default=func.now())
