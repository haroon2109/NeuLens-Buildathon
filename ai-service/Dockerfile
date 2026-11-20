# Two stages: the compiler toolchain is needed only while installing the Python
# dependencies, so it must not end up in the image that runs the service.
FROM python:3.12-slim AS builder

# build-essential is required because praat-parselmouth ships as a source
# distribution (Praat is compiled during the pip install).
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# A venv at a fixed path, so the copied interpreter and console scripts still
# resolve after the packages are moved into the runtime stage.
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# ffmpeg decodes the browser's WebM/Opus recordings for librosa/Praat.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app
COPY app ./app

# Runs as a non-root user; secrets arrive at runtime, never baked into the image.
RUN useradd --create-home --uid 10001 neulens
USER neulens

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
