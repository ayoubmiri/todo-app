import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import get_db, Base

# Base de données de test SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
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

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Todo API is running"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_create_todo():
    response = client.post("/todos", json={"title": "Test Todo"})
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Todo"
    assert data["completed"] == False
    assert "id" in data

def test_create_todo_with_description():
    response = client.post("/todos", json={
        "title": "Test Todo",
        "description": "This is a test"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["description"] == "This is a test"

def test_get_empty_todos():
    response = client.get("/todos")
    assert response.status_code == 200
    assert response.json() == []

def test_get_todos():
    client.post("/todos", json={"title": "Todo 1"})
    client.post("/todos", json={"title": "Todo 2"})
    
    response = client.get("/todos")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

def test_get_single_todo():
    create_response = client.post("/todos", json={"title": "Single Todo"})
    todo_id = create_response.json()["id"]
    
    response = client.get(f"/todos/{todo_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Single Todo"

def test_get_nonexistent_todo():
    response = client.get("/todos/9999")
    assert response.status_code == 404

def test_update_todo():
    create_response = client.post("/todos", json={"title": "Old Title"})
    todo_id = create_response.json()["id"]
    
    response = client.put(f"/todos/{todo_id}", json={"title": "New Title"})
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"

def test_update_completed_status():
    create_response = client.post("/todos", json={"title": "Todo"})
    todo_id = create_response.json()["id"]
    
    response = client.put(f"/todos/{todo_id}", json={"completed": True})
    assert response.status_code == 200
    assert response.json()["completed"] == True

def test_delete_todo():
    create_response = client.post("/todos", json={"title": "To Delete"})
    todo_id = create_response.json()["id"]
    
    response = client.delete(f"/todos/{todo_id}")
    assert response.status_code == 204
    
    get_response = client.get(f"/todos/{todo_id}")
    assert get_response.status_code == 404

def test_toggle_complete():
    create_response = client.post("/todos", json={"title": "Toggle Todo"})
    todo_id = create_response.json()["id"]
    
    response = client.patch(f"/todos/{todo_id}/toggle")
    assert response.status_code == 200
    assert response.json()["completed"] == True
    
    response = client.patch(f"/todos/{todo_id}/toggle")
    assert response.status_code == 200
    assert response.json()["completed"] == False

@pytest.mark.parametrize("title", [
    "Simple todo",
    "Todo with spaces",
    "Todo with numbers 123",
    "Todo with @special!chars"
])
def test_create_multiple_todos_parametrized(title):
    response = client.post("/todos", json={"title": title})
    assert response.status_code == 201
    assert response.json()["title"] == title