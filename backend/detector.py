import cv2
import numpy as np
import time
import base64
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from ultralytics import YOLO
from config import (
    YOLO_MODEL, CONFIDENCE_THRESHOLD, TARGET_CLASSES,
    FRAME_SKIP, DEMO_VIDEO_PATH, IDLE_THRESHOLD
)

logger = logging.getLogger(__name__)


class ZoneDetector:
    """Handles YOLOv8 person detection and zone-based productivity monitoring."""

    def __init__(self):
        self.model = None
        self.zones = []
        self.zone_status = {}  # zone_id -> {status, last_seen, person_count}
        self.frame_count = 0
        self.is_running = False
        self.current_source = None
        self.cap = None
        self._callbacks = []

    def load_model(self):
        """Load YOLOv8 model."""
        logger.info(f"Loading YOLOv8 model: {YOLO_MODEL}")
        self.model = YOLO(YOLO_MODEL)
        logger.info("Model loaded successfully")

    def set_zones(self, zones: list):
        """Update detection zones. Each zone: {id, name, polygon: [[x,y], ...]}"""
        self.zones = zones
        for zone in zones:
            if zone["id"] not in self.zone_status:
                self.zone_status[zone["id"]] = {
                    "status": "idle",
                    "last_seen": None,
                    "person_count": 0,
                    "idle_since": time.time()
                }

    def _point_in_polygon(self, point, polygon):
        """Check if a point is inside a polygon using ray casting."""
        x, y = point
        n = len(polygon)
        inside = False
        j = n - 1
        for i in range(n):
            xi, yi = polygon[i]
            xj, yj = polygon[j]
            if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
                inside = not inside
            j = i
        return inside

    def _denormalize_polygon(self, polygon, frame_w, frame_h):
        """Convert normalized (0-1) polygon coordinates to pixel coordinates."""
        return [(int(p[0] * frame_w), int(p[1] * frame_h)) for p in polygon]

    def detect_frame(self, frame):
        """Run detection on a single frame and return annotated frame + zone status."""
        if self.model is None:
            self.load_model()

        h, w = frame.shape[:2]

        results = self.model(frame, conf=CONFIDENCE_THRESHOLD, classes=TARGET_CLASSES, verbose=False)

        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = float(box.conf[0])
                center_x = (x1 + x2) / 2
                center_y = (y1 + y2) / 2
                detections.append({
                    "bbox": [int(x1), int(y1), int(x2), int(y2)],
                    "center": (center_x, center_y),
                    "confidence": conf
                })

        # Check each zone
        zone_results = {}
        for zone in self.zones:
            pixel_polygon = self._denormalize_polygon(zone["polygon"], w, h)
            persons_in_zone = 0

            for det in detections:
                if self._point_in_polygon(det["center"], pixel_polygon):
                    persons_in_zone += 1

            now = time.time()
            zone_id = zone["id"]

            if persons_in_zone > 0:
                self.zone_status[zone_id] = {
                    "status": "active",
                    "last_seen": now,
                    "person_count": persons_in_zone,
                    "idle_since": None
                }
            else:
                prev = self.zone_status.get(zone_id, {})
                idle_since = prev.get("idle_since") or now
                idle_duration = now - idle_since

                self.zone_status[zone_id] = {
                    "status": "idle" if idle_duration >= IDLE_THRESHOLD else "warning",
                    "last_seen": prev.get("last_seen"),
                    "person_count": 0,
                    "idle_since": idle_since,
                    "idle_duration": idle_duration
                }

            zone_results[zone_id] = {
                "zone_id": zone_id,
                "zone_name": zone["name"],
                "status": self.zone_status[zone_id]["status"],
                "person_count": persons_in_zone,
                "idle_duration": self.zone_status[zone_id].get("idle_duration", 0)
            }

        # Draw annotations on frame
        annotated = self._draw_annotations(frame.copy(), detections, zone_results)

        return annotated, zone_results, detections

    def _draw_annotations(self, frame, detections, zone_results):
        """Draw bounding boxes, zones, and status on frame."""
        h, w = frame.shape[:2]

        # Draw zones
        for zone in self.zones:
            pixel_polygon = self._denormalize_polygon(zone["polygon"], w, h)
            pts = np.array(pixel_polygon, np.int32).reshape((-1, 1, 2))

            zone_id = zone["id"]
            status = zone_results.get(zone_id, {}).get("status", "idle")

            color = (0, 255, 0) if status == "active" else (0, 255, 255) if status == "warning" else (0, 0, 255)

            # Semi-transparent overlay
            overlay = frame.copy()
            cv2.fillPoly(overlay, [pts], color)
            cv2.addWeighted(overlay, 0.15, frame, 0.85, 0, frame)

            cv2.polylines(frame, [pts], True, color, 2)

            # Zone label
            label_pos = pixel_polygon[0]
            label = f"{zone['name']}: {status.upper()}"
            person_count = zone_results.get(zone_id, {}).get("person_count", 0)
            if person_count > 0:
                label += f" ({person_count})"

            cv2.putText(frame, label, (label_pos[0], label_pos[1] - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        # Draw person bounding boxes
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 200, 0), 2)
            cv2.putText(frame, f"Person {det['confidence']:.0%}",
                        (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 200, 0), 1)

        # Timestamp
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, ts, (10, h - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        return frame

    def open_video(self, source=None):
        """Open video source. Uses demo video if source is 'demo' or None."""
        if self.cap is not None:
            self.cap.release()

        if source is None or source == "demo":
            video_path = DEMO_VIDEO_PATH
            if not Path(video_path).exists():
                logger.warning(f"Demo video not found at {video_path}, generating synthetic feed")
                self.current_source = "synthetic"
                return True
            self.cap = cv2.VideoCapture(video_path)
            self.current_source = "demo"
        else:
            self.cap = cv2.VideoCapture(source)
            self.current_source = source

        if self.cap and not self.cap.isOpened():
            logger.error(f"Failed to open video source: {source}")
            self.current_source = "synthetic"
            return True

        return True

    def _generate_synthetic_frame(self):
        """Generate a synthetic factory floor frame for demo purposes."""
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        frame[:] = (40, 40, 45)

        # Floor grid
        for i in range(0, 640, 80):
            cv2.line(frame, (i, 0), (i, 480), (50, 50, 55), 1)
        for i in range(0, 480, 80):
            cv2.line(frame, (0, i), (640, i), (50, 50, 55), 1)

        # Machine placeholders
        cv2.rectangle(frame, (50, 50), (200, 200), (80, 80, 90), -1)
        cv2.putText(frame, "CNC-01", (80, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 160), 1)

        cv2.rectangle(frame, (300, 50), (450, 200), (80, 80, 90), -1)
        cv2.putText(frame, "TORNO-01", (320, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 160), 1)

        cv2.rectangle(frame, (50, 280), (200, 430), (80, 80, 90), -1)
        cv2.putText(frame, "FRESA-01", (70, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 160), 1)

        cv2.rectangle(frame, (300, 280), (450, 430), (80, 80, 90), -1)
        cv2.putText(frame, "SOLDA-01", (320, 360), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 160), 1)

        # Simulated persons (moving)
        t = time.time()
        px1 = int(125 + 30 * np.sin(t * 0.5))
        py1 = int(150 + 20 * np.cos(t * 0.3))
        cv2.rectangle(frame, (px1 - 15, py1 - 40), (px1 + 15, py1 + 40), (0, 180, 255), -1)
        cv2.circle(frame, (px1, py1 - 50), 12, (0, 180, 255), -1)

        px2 = int(375 + 25 * np.cos(t * 0.4))
        py2 = int(140 + 15 * np.sin(t * 0.6))
        cv2.rectangle(frame, (px2 - 15, py2 - 40), (px2 + 15, py2 + 40), (0, 200, 180), -1)
        cv2.circle(frame, (px2, py2 - 50), 12, (0, 200, 180), -1)

        # Title
        cv2.putText(frame, "FloorCheck - DEMO MODE", (150, 470),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (100, 100, 110), 2)

        return frame

    def get_frame(self):
        """Get next frame from video source."""
        if self.current_source == "synthetic":
            return True, self._generate_synthetic_frame()

        if self.cap is None or not self.cap.isOpened():
            return True, self._generate_synthetic_frame()

        ret, frame = self.cap.read()
        if not ret:
            # Loop demo video
            if self.current_source == "demo":
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = self.cap.read()
            if not ret:
                return True, self._generate_synthetic_frame()

        return True, frame

    def frame_to_base64(self, frame, quality=70):
        """Encode frame as JPEG base64 string."""
        encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
        _, buffer = cv2.imencode('.jpg', frame, encode_params)
        return base64.b64encode(buffer).decode('utf-8')

    async def stream_loop(self, callback):
        """Main detection loop. Calls callback with (frame_b64, zone_results) each cycle."""
        self.is_running = True
        frame_count = 0

        while self.is_running:
            ret, frame = self.get_frame()
            if not ret:
                await asyncio.sleep(0.1)
                continue

            frame_count += 1
            if frame_count % FRAME_SKIP != 0:
                await asyncio.sleep(0.01)
                continue

            annotated, zone_results, _ = self.detect_frame(frame)
            frame_b64 = self.frame_to_base64(annotated)

            await callback(frame_b64, zone_results)
            await asyncio.sleep(1.0 / 15)  # ~15 fps max

    def stop(self):
        """Stop the detection loop."""
        self.is_running = False
        if self.cap is not None:
            self.cap.release()


# Singleton instance
detector = ZoneDetector()
