import os

# Video source: "demo" for sample video, or RTSP/HTTP URL for real cameras
VIDEO_SOURCE = os.getenv("VIDEO_SOURCE", "demo")

# YOLOv8 model (nano for speed, larger for accuracy)
YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8n.pt")

# Detection confidence threshold
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))

# Only detect persons (COCO class 0)
TARGET_CLASSES = [0]

# Frame processing interval (process every Nth frame for performance)
FRAME_SKIP = int(os.getenv("FRAME_SKIP", "2"))

# WebSocket frame rate (frames per second to send to clients)
WS_FPS = int(os.getenv("WS_FPS", "10"))

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./floorcheck.db")

# Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Demo video path
DEMO_VIDEO_PATH = os.path.join(os.path.dirname(__file__), "sample_video", "demo.mp4")

# Idle threshold in seconds (time without detection before flagging idle)
IDLE_THRESHOLD = int(os.getenv("IDLE_THRESHOLD", "30"))

# ── Safety Compliance (PPE) ───────────────────────────────────────────
# Additional YOLO classes for PPE detection (requires trained model)
PPE_CLASSES = {
    "capacete": 0,   # hard hat class in custom model
    "colete": 1,     # safety vest
    "oculos": 2,     # safety glasses
}
REQUIRED_PPE = os.getenv("REQUIRED_PPE", "capacete,colete,oculos").split(",")

# ── WhatsApp / Shift Reports ─────────────────────────────────────────
WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "")  # Twilio or Evolution API
WHATSAPP_API_TOKEN = os.getenv("WHATSAPP_API_TOKEN", "")
SHIFT_TIMES = {
    "A": {"start": "06:00", "end": "14:00"},
    "B": {"start": "14:00", "end": "22:00"},
    "C": {"start": "22:00", "end": "06:00"},
}

# ── Heatmap ───────────────────────────────────────────────────────────
HEATMAP_GRID_SIZE = int(os.getenv("HEATMAP_GRID_SIZE", "50"))
POSITION_SAMPLE_INTERVAL = int(os.getenv("POSITION_SAMPLE_INTERVAL", "1"))  # seconds
