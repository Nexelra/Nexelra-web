# VietChain React App - Docker Setup Guide

## 📋 Yêu cầu hệ thống

- **Docker Desktop** (Windows/macOS) hoặc **Docker Engine** (Linux)
- **Git** với SSH key đã cấu hình
- **Node.js 18+** (tùy chọn, để development)
- **Yarn** (tùy chọn, để development)

## 🔑 Chuẩn bị SSH Key cho GitHub

### 1. Tạo SSH Key (nếu chưa có)
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 2. Thêm SSH Key vào SSH Agent
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### 3. Copy Public Key và thêm vào GitHub
```bash
cat ~/.ssh/id_ed25519.pub
```
- Vào GitHub → Settings → SSH and GPG keys → New SSH key
- Paste public key và lưu

### 4. Test kết nối
```bash
ssh -T git@github.com
```

## 📦 Clone Repository

```bash
# Clone repository với SSH
git clone git@github.com:YOUR_USERNAME/VietChain.git
cd VietChain/react
```

## 📦 Cài đặt Dependencies (Bắt buộc)

**⚠️ Quan trọng**: Phải chạy yarn install trước khi build Docker!

```bash
# Cài đặt dependencies
yarn install

# Kiểm tra các file cần thiết đã được tạo
ls -la yarn.lock node_modules/
```

## 🐳 Docker Setup

### Kiểm tra Docker
```bash
docker --version
docker-compose --version
```

### Build Docker Image
```bash
docker build -t vietchain-react-app .
```

### Chạy Container
```bash
# Chạy foreground (xem logs trực tiếp)
docker run -p 4200:4200 vietchain-react-app

# Hoặc chạy background
docker run -d -p 4200:4200 --name vietchain-app vietchain-react-app
```

### Truy cập ứng dụng
Mở trình duyệt: **http://localhost:4200**

## 🛠️ Quản lý Container

### Xem Container đang chạy
```bash
docker ps
```

### Xem logs
```bash
docker logs vietchain-app
docker logs -f vietchain-app  # Follow logs
```

### Dừng và khởi động
```bash
# Dừng container
docker stop vietchain-app

# Khởi động lại
docker start vietchain-app

# Restart container
docker restart vietchain-app
```

### Xóa container
```bash
docker stop vietchain-app
docker rm vietchain-app
```

## 🔄 Update và Rebuild

### Cập nhật code mới
```bash
# Pull latest changes
git pull origin main

# Rebuild Docker image
docker build -t vietchain-react-app .

# Stop old container
docker stop vietchain-app
docker rm vietchain-app

# Run new container
docker run -d -p 4200:4200 --name vietchain-app vietchain-react-app
```

## 🚀 Script tự động (Tùy chọn)

Tạo file `docker-run.sh`:
```bash
#!/bin/bash
chmod +x docker-run.sh

# Sử dụng
./docker-run.sh start    # Khởi động
./docker-run.sh stop     # Dừng
./docker-run.sh restart  # Khởi động lại
./docker-run.sh logs     # Xem logs
./docker-run.sh rebuild  # Build lại và restart
```

## 🔧 Troubleshooting

### Docker không chạy được
```bash
# Restart Docker service (Linux)
sudo systemctl restart docker

# Hoặc restart Docker Desktop (Windows/macOS)
```

### Port 4200 bị chiếm
```bash
# Kiểm tra process đang dùng port
lsof -i :4200  # macOS/Linux
netstat -ano | findstr :4200  # Windows

# Sử dụng port khác
docker run -p 3000:4200 vietchain-react-app
```

### Xóa tất cả Docker cache
```bash
docker system prune -a -f
```

### Container không start
```bash
# Xem logs chi tiết
docker logs vietchain-app

# Vào bên trong container để debug
docker exec -it vietchain-app sh
```

## 📁 Cấu trúc Project

```
VietChain/react/
├── Dockerfile              # Docker build instructions
├── docker-compose.yml      # Docker Compose config (optional)
├── nginx.conf              # Nginx server config
├── package.json             # Node.js dependencies
├── yarn.lock               # Yarn lock file
├── src/                    # Source code
├── public/                 # Public assets
└── dist/                   # Built files (generated)
```

## 🌐 Production Deployment

### Sử dụng Docker Compose
```bash
docker-compose up -d
```

### Chạy với custom domain
```bash
docker run -d -p 80:4200 --name vietchain-app vietchain-react-app
```

