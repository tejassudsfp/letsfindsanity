"""Gunicorn configuration file"""

import os
import multiprocessing

# Server socket
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'

# Timeout (increased for AI API calls)
# Default is 30s, but Anthropic API can take longer for analysis
# Setting to 5 minutes to handle slow API calls, retries, and network issues
timeout = 300  # 5 minutes

# Graceful timeout for cleanup
graceful_timeout = 30

# Keep alive
keepalive = 5

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# Process naming
proc_name = 'letsfindsanity'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (if needed)
keyfile = None
certfile = None
