# RideCompare

A production-grade mobile app that compares ride-hailing fares across **Uber**, **Ola**, **Rapido**, and **Namma Yatri** — side by side. Users see ETA, estimated fare, surge status, and smart badges (Cheapest / Fastest / Best Value), then deep-link directly into their preferred provider app to complete the booking.

---

## Architecture Overview

```
ridecompare/
├── mobile_app/          Flutter app (iOS + Android)
├── backend/             FastAPI REST API
│   ├── app/
│   │   ├── api/v1/      Route handlers (auth, compare, places, alerts)
│   │   ├── core/        Config, security, DI
│   │   ├── db/          SQLAlchemy models, repositories, Alembic
│   │   ├── providers/   Provider adapters (Uber, Ola, Rapido, Namma Yatri)
│   │   ├── schemas/     Pydantic request/response models
│   │   ├── services/    Business logic
│   │   └── workers/     Celery tasks (alerts, token cleanup)
│   └── tests/           pytest API + provider tests
├── infra/
│   ├── docker-compose.yml
│   ├── nginx/           Reverse proxy config
│   └── github_actions/  CI/CD pipeline
└── docs/                Architecture, API reference, deployment guide
```

### Tech Stack

| Layer        | Technology                                    |
|-------------|-----------------------------------------------|
| Mobile       | Flutter 3 · Riverpod · GoRouter · Dio · Maps  |
| Backend      | FastAPI · SQLAlchemy · Alembic · Pydantic      |
| Database     | PostgreSQL 16                                 |
| Cache        | Redis 7                                       |
| Background   | Celery · Celery Beat                          |
| Auth         | JWT (access + refresh token rotation)         |
| Proxy        | Nginx                                         |
| CI/CD        | GitHub Actions → Docker → SSH deploy          |
| Notifications| Firebase Cloud Messaging                      |

---

## Quick Start (Local)

### Prerequisites
- Docker & Docker Compose
- Flutter SDK ≥ 3.22
- Python 3.11+

### 1. Clone & configure

```bash
git clone https://github.com/yourorg/ridecompare.git
cd ridecompare
cp .env.example .env
# Edit .env — at minimum set GOOGLE_MAPS_API_KEY
```

### 2. Start backend services

```bash
cd infra
docker-compose up -d postgres redis
```

### 3. Run migrations

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
```

### 4. Start API

```bash
uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
```

### 5. Start Celery (optional — needed for alerts)

```bash
celery -A app.workers.celery_app worker --loglevel=info &
celery -A app.workers.celery_app beat --loglevel=info &
```

### 6. Run Flutter app

```bash
cd mobile_app
flutter pub get
flutter run
```

---

## Provider Adapters

All providers implement `BaseRideProvider`:

```python
class BaseRideProvider(ABC):
    async def get_estimates(route: RouteInfo) -> List[RideEstimate]: ...
    def create_deeplink(route: RouteInfo, category: str) -> str: ...
    async def health_check() -> bool: ...
```

**Live API mode**: Set the provider's API key in `.env`.  
**Mock mode** (default): Realistic fares computed from distance using Haversine formula — works out of the box with no API keys.

To add a new provider, create `backend/app/providers/mynewprovider.py` and register it in `backend/app/providers/registry.py`.

---

## API Endpoints

See [docs/api.md](docs/api.md) for full reference.

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/auth/register | Register user |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/refresh | Rotate tokens |
| POST | /api/v1/auth/logout | Revoke token |
| GET | /api/v1/users/me | Current user |
| PATCH | /api/v1/users/me | Update profile |
| GET | /api/v1/places/autocomplete | Google Places autocomplete |
| POST | /api/v1/places/save | Save a place |
| GET | /api/v1/places/saved | List saved places |
| **POST** | **/api/v1/compare/rides** | **Compare all providers** |
| GET | /api/v1/compare/history | Ride search history |
| POST | /api/v1/alerts/price | Create price/surge alert |
| GET | /api/v1/alerts | List active alerts |
| GET | /api/v1/preferences | Get preferences |
| PATCH | /api/v1/preferences | Update preferences |

---

## Running Tests

```bash
# Backend
cd backend
pytest tests/ -v --cov=app

# Flutter
cd mobile_app
flutter test
```

---

## Deployment

See [docs/deployment.md](docs/deployment.md) for full AWS/GCP guide.

**Quick production deploy:**

```bash
# Build and push image
docker build -t ghcr.io/yourorg/ridecompare/api:latest ./backend
docker push ghcr.io/yourorg/ridecompare/api:latest

# On server
docker-compose -f infra/docker-compose.prod.yml up -d
docker-compose exec api alembic upgrade head
```

---

## Security

- Passwords hashed with bcrypt
- JWT access tokens (30 min) + refresh tokens (30 days, rotated on use)
- All tokens stored hashed in DB
- Refresh token revocation on logout
- Rate limiting per IP (Nginx + SlowAPI)
- Secrets via environment variables only
- Flutter secure storage for tokens on device
- CORS configured per environment

---

## Adding a Provider

1. Create `backend/app/providers/myprovider.py` extending `BaseRideProvider`
2. Implement `get_estimates()`, `create_deeplink()`, `health_check()`
3. Add to `backend/app/providers/registry.py`
4. Add provider logo URL and display name
5. Done — the compare engine picks it up automatically
