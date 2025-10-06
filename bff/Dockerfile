# ==========================================
# Dockerfile cho service bff_api (FastAPI + odoorpc)
# ==========================================

# Sử dụng Python slim để tối ưu dung lượng
FROM python:3.11-slim

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# -----------------------------
# Cài các gói hệ thống cần thiết
# -----------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libxml2-dev \
    libxslt-dev \
    python3-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# -----------------------------
# Copy và cài đặt các thư viện Python
# -----------------------------
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# -----------------------------
# Copy toàn bộ mã nguồn ứng dụng
# -----------------------------
COPY . .

# -----------------------------
# Cấu hình môi trường
# -----------------------------
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    OLLAMA_HOST=http://ollama:11434 \
    OLLAMA_MODEL=mistral

# -----------------------------
# Expose cổng 8000 (FastAPI)
# -----------------------------
EXPOSE 8000

# -----------------------------
# Lệnh chạy chính
# -----------------------------
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
