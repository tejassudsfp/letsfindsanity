"""Background task to keep database connection alive and prevent Neon auto-suspend"""

import threading
import time
from .database import db


def ping_database():
    """Ping database to prevent auto-suspend"""
    try:
        db.execute("SELECT 1", fetch_one=True)
        print("Database ping successful")
    except Exception as e:
        print(f"Database ping failed: {e}")


def keep_alive_worker():
    """Background worker that pings database every 4 minutes"""
    while True:
        try:
            time.sleep(240)  # 4 minutes
            ping_database()
        except Exception as e:
            print(f"Keep-alive worker error: {e}")


def start_keep_alive():
    """Start the keep-alive background thread"""
    thread = threading.Thread(target=keep_alive_worker, daemon=True)
    thread.start()
    print("Database keep-alive worker started (pings every 4 minutes)")
