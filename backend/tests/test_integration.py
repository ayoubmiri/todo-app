import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import get_db, Base

import os
import time

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://testuser:testpass@localhost:5432/testdb")

# Retry logic to wait for database to be ready
def wait_for_db(url, max_retries=30):
    engine = create_engine(url)
    for attempt in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return engine
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(1)
            else:
                raise

engine = wait_for_db(DATABASE_URL)
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


class TestIntegrationWorkflow:
    def test_complete_crud_workflow(self):
        # Create
        create = client.post("/todos", json={"title": "Integration Test"})
        assert create.status_code == 201
        todo_id = create.json()["id"]
        
        # Read
        read = client.get(f"/todos/{todo_id}")
        assert read.status_code == 200
        
        # Update
        update = client.put(f"/todos/{todo_id}", json={"title": "Updated"})
        assert update.status_code == 200
        assert update.json()["title"] == "Updated"
        
        # Toggle
        toggle = client.patch(f"/todos/{todo_id}/toggle")
        assert toggle.status_code == 200
        assert toggle.json()["completed"] == True
        
        # Delete
        delete = client.delete(f"/todos/{todo_id}")
        assert delete.status_code == 204
        
        # Verify deleted
        verify = client.get(f"/todos/{todo_id}")
        assert verify.status_code == 404

    def test_bulk_operations(self):
        # Create 5 todos
        ids = []
        for i in range(5):
            response = client.post("/todos", json={"title": f"Todo {i}"})
            ids.append(response.json()["id"])
        
        # Get all
        all_todos = client.get("/todos").json()
        assert len(all_todos) == 5
        
        # Update all
        for todo_id in ids:
            client.put(f"/todos/{todo_id}", json={"completed": True})
        
        # Delete all
        for todo_id in ids:
            client.delete(f"/todos/{todo_id}")
        
        # Verify empty
        final = client.get("/todos").json()
        assert len(final) == 0

    def test_error_handling(self):
        # 404 on non-existent
        response = client.get("/todos/99999")
        assert response.status_code == 404
        
        # 422 on invalid data
        response = client.post("/todos", json={})
        assert response.status_code == 422



        