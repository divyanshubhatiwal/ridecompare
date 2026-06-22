# Deployment Guide

## Prerequisites

- Ubuntu 22.04 server (AWS EC2 t3.medium or GCP e2-standard-2)
- Docker + Docker Compose installed
- Domain name pointing to server IP
- SSL certificate (Let's Encrypt recommended)

---

## Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Create app directory
sudo mkdir -p /srv/ridecompare
sudo chown ubuntu:ubuntu /srv/ridecompare
```

---

## SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d api.ridecompare.app

# Copy certs to nginx ssl directory
cp /etc/letsencrypt/live/api.ridecompare.app/fullchain.pem infra/nginx/ssl/cert.pem
cp /etc/letsencrypt/live/api.ridecompare.app/privkey.pem infra/nginx/ssl/key.pem
```

---

## Production Environment

```bash
# Clone repo
cd /srv/ridecompare
git clone https://github.com/yourorg/ridecompare.git .

# Configure
cp .env.example .env
nano .env  # Fill in all production values — strong SECRET_KEY, real API keys

# Generate strong secret key
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

---

## Deploy

```bash
# Start all services
cd /srv/ridecompare/infra
docker-compose up -d

# Run database migrations
docker-compose exec api alembic upgrade head

# Verify
curl http://localhost:8000/health
# → {"status": "ok", "version": "1.0.0"}
```

---

## Production docker-compose differences

For production, set these overrides:

```yaml
# infra/docker-compose.prod.yml
services:
  api:
    image: ghcr.io/yourorg/ridecompare/api:${IMAGE_TAG:-latest}
    restart: always
    environment:
      DEBUG: "false"
      ENVIRONMENT: production
```

---

## Database Backups

```bash
# Automated daily backup to S3
docker-compose exec postgres pg_dump -U ridecompare ridecompare \
  | gzip \
  | aws s3 cp - s3://your-bucket/ridecompare/backup-$(date +%Y%m%d).sql.gz
```

Add to crontab:
```
0 2 * * * /srv/ridecompare/scripts/backup.sh
```

---

## Monitoring

Recommended stack:
- **Logs**: Ship container logs to CloudWatch or Papertrail
- **Metrics**: Prometheus + Grafana
- **Uptime**: UptimeRobot or Pingdom hitting `/health`
- **Errors**: Sentry (add `sentry-sdk[fastapi]` to requirements)

---

## Flutter App Distribution

### Android
```bash
cd mobile_app
flutter build apk --release \
  --dart-define=API_BASE_URL=https://api.ridecompare.app \
  --dart-define=GOOGLE_MAPS_API_KEY=your_key
```

### iOS
```bash
flutter build ios --release \
  --dart-define=API_BASE_URL=https://api.ridecompare.app \
  --dart-define=GOOGLE_MAPS_API_KEY=your_key
```

---

## Scaling

When you need to scale beyond a single server:

1. **API**: Add more Uvicorn workers (`--workers 8`) or horizontal scale behind load balancer
2. **Celery**: Run multiple worker containers (`replicas: 3` in Docker Swarm / Kubernetes)
3. **Database**: Switch to RDS Multi-AZ
4. **Cache**: Switch to ElastiCache Redis cluster
5. **Files**: Move to S3 if serving static assets

The Kubernetes manifests in `infra/k8s/` provide a starting point for K8s deployment.
