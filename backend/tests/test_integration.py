# backend/tests/test_integration.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import get_db, Base
import os

# Use PostgreSQL if available, otherwise SQLite
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

if DATABASE_URL.startswith("postgresql"):
    engine = create_engine(DATABASE_URL)
else:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

# Simple tests
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_create_todo():
    response = client.post("/todos", json={"title": "Simple Todo"})
    assert response.status_code == 201
    assert response.json()["title"] == "Simple Todo"
    assert "id" in response.json()

def test_get_empty_todos():
    response = client.get("/todos")
    assert response.status_code == 200
    assert response.json() == []

def test_update_todo():
    # Create
    create = client.post("/todos", json={"title": "Old Title"})
    todo_id = create.json()["id"]
    
    # Update
    response = client.put(f"/todos/{todo_id}", json={"title": "New Title"})
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"

def test_delete_todo():
    # Create
    create = client.post("/todos", json={"title": "To Delete"})
    todo_id = create.json()["id"]
    
    # Delete
    response = client.delete(f"/todos/{todo_id}")
    assert response.status_code == 204
    
    # Try to get it
    response = client.get(f"/todos/{todo_id}")
    assert response.status_code == 404