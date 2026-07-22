FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app
COPY docker-entrypoint.sh ./
RUN useradd --create-home --uid 10001 agentlens && chmod 755 /app/docker-entrypoint.sh

USER agentlens
EXPOSE 8001
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD sh -c 'python -c "import os, urllib.request; urllib.request.urlopen(\"http://127.0.0.1:\" + os.getenv(\"PORT\", \"8001\") + \"/health\", timeout=2)"'
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8001}"]
