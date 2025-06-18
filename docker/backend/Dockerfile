# Backend Dockerfile
FROM python:3.10-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only the files needed for installation
COPY pyproject.toml .
COPY README.md .
COPY src/ii_agent/ ./src/ii_agent/

# Install dependencies into a virtual environment
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir .

FROM python:3.10-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    lsb-release \
    ffmpeg \
    xvfb

# Copy virtual environment from builder stage
COPY --from=builder /venv /venv
ENV PATH="/venv/bin:$PATH"

ENV FILE_STORE_PATH=/.ii_agent

COPY ws_server.py /app/ws_server.py

# Install Playwright in a single layer
RUN playwright install --with-deps chromium

# Set environment variables
ENV PYTHONUNBUFFERED=1

RUN mkdir -p $FILE_STORE_PATH

# Expose port for WebSocket server
EXPOSE 8000

ENTRYPOINT ["xvfb-run", "--auto-servernum", "python", "ws_server.py"]