import os
import sys
from fastapi.testclient import TestClient

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)

def test_login_wrong_credentials():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@jcb.com", "password": "wrongpassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"

def test_login_success_and_read_me():
    # 1. Login
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@jcb.com", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    
    token = data["access_token"]
    
    # 2. Get profile details using authorization token
    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == "admin@jcb.com"
    assert me_data["role"] == "admin"
    assert me_data["is_active"] is True
    print("Authentication unit tests passed successfully!")
