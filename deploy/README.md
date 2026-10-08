# NV Cyclothon 2026 - VPS Production Deployment Guide

## Architecture Overview on 200 GB VPS

| Component | Technology | Memory Footprint | Storage Footprint | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Reverse Proxy & Media Server** | Nginx | ~15–30 MB | ~10 MB binary | Direct zero-overhead kernel `sendfile` serving of WebP images & static assets |
| **Frontend SPA** | React / Vite | N/A (static) | ~8 MB | High-performance pre-bundled client |
| **Backend API** | Node.js (PM2 Cluster) | ~150–300 MB | ~260 MB with deps | Business logic, Cashfree webhooks, WebP image compression pipeline |
| **Database** | PostgreSQL 16 (Docker) | ~200–500 MB | ~150 MB image + volume | Persistent ACID storage for registrations, orders, and content |
| **Total System Base** | — | **< 1 GB RAM** | **< 10 GB Disk** | Leaves **~190 GB free** for uploads and database |

---

## 1. Quick Start / Setup on VPS

### Step 1: Start PostgreSQL via Docker
```bash
cd /var/www/nv_cyclothon/deploy
docker compose up -d
```
Check health:
```bash
docker compose ps
```

### Step 2: Build Client
```bash
cd /var/www/nv_cyclothon/client
npm install
npm run build
npm run build:internal
```

### Step 3: Run Backend via PM2
```bash
cd /var/www/nv_cyclothon/backend
npm install --omit=dev
npm run migrate

# Start or reload via PM2 ecosystem
pm2 start /var/www/nv_cyclothon/deploy/ecosystem.config.js
pm2 save
pm2 startup
```

### Step 4: Configure Nginx & SSL
```bash
sudo cp /var/www/nv_cyclothon/deploy/nginx.conf /etc/nginx/sites-available/nvcyclothon
sudo ln -s /etc/nginx/sites-available/nvcyclothon /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue free SSL certificate via Let's Encrypt
sudo certbot --nginx -d nvcyclothon.in -d www.nvcyclothon.in
```

---

## 2. Storage & Upload Management

- Uploaded images are compressed on the fly to `.webp` with quality 82, resized to max 1920px, and stripped of camera GPS/EXIF data.
- Average image size is **~250 KB**.
- Your 200 GB VPS with ~185 GB free storage can store **over 700,000 photos** with zero external cloud bills.
- Images are served with `Cache-Control: public, max-age=31536000, immutable`, meaning repeat visitors load photos from their browser cache with 0 ms server delay.
