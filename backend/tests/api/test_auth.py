import pytest
from fastapi.testclient import TestClient


def test_register_success(client: TestClient):
    resp = client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "full_name": "New User",
        "password": "strongpass123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_register_duplicate_email(client: TestClient, test_user):
    resp = client.post("/api/v1/auth/register", json={
        "email": test_user.email,
        "full_name": "Dup",
        "password": "pass12345",
    })
    assert resp.status_code == 400


def test_login_success(client: TestClient, test_user):
    resp = client.post("/api/v1/auth/login", json={
        "email": test_user.email,
        "password": "password123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client: TestClient, test_user):
    resp = client.post("/api/v1/auth/login", json={
        "email": test_user.email,
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


def test_get_me(client: TestClient, auth_headers):
    resp = client.get("/api/v1/users/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


def test_get_me_unauthorized(client: TestClient):
    resp = client.get("/api/v1/users/me")
    assert resp.status_code == 403  # HTTPBearer returns 403 when no credentials
