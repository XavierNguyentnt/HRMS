# Sử dụng image Python 3.11 slim
FROM python:3.11-slim

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Cài đặt các thư viện cần thiết
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép code vào container
COPY . .

# Lệnh để chạy ứng dụng khi container khởi động
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]