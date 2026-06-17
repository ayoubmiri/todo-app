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
                raise e

engine = wait_for_db(DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the database dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="function", autouse=True)
def setup_database():
    # Create all tables at the start of each test
    Base.metadata.create_all(bind=engine)
    yield
    # Drop all tables at the end of each test
    Base.metadata.drop_all(bind=engine)

class TestIntegrationWorkflow:
    def test_complete_crud_workflow(self, setup_database):
        # Create
        create = client.post("/todos", json={"title": "Integration Test"})
        assert create.status_code == 201
        todo_id = create.json()["id"]
        
        # Read
        read = client.get(f"/todos/{todo_id}")
        assert read.status_code == 200
        assert read.json()["title"] == "Integration Test"
        
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

    def test_bulk_operations(self, setup_database):
        # Create 5 todos
        ids = []
        for i in range(5):
            response = client.post("/todos", json={"title": f"Todo {i}"})
            assert response.status_code == 201
            ids.append(response.json()["id"])
        
        # Get all
        all_todos = client.get("/todos").json()
        assert len(all_todos) == 5
        
        # Update all
        for todo_id in ids:
            response = client.put(f"/todos/{todo_id}", json={"completed": True})
            assert response.status_code == 200
        
        # Delete all
        for todo_id in ids:
            response = client.delete(f"/todos/{todo_id}")
            assert response.status_code == 204
        
        # Verify empty
        final = client.get("/todos").json()
        assert len(final) == 0

    def test_error_handling(self, setup_database):
        # Create a todo to test with
        create = client.post("/todos", json={"title": "Test Error"})
        assert create.status_code == 201
        todo_id = create.json()["id"]
        
        # 404 on non-existent todo
        response = client.get("/todos/99999")
        assert response.status_code == 404
        
        # 404 on non-existent todo for update
        response = client.put("/todos/99999", json={"title": "Does not exist"})
        assert response.status_code == 404
        
        # 404 on non-existent todo for delete
        response = client.delete("/todos/99999")
        assert response.status_code == 404
        
        # 422 on invalid data (empty title)
        response = client.post("/todos", json={"title": ""})
        assert response.status_code == 422
        
        # 422 on invalid data (missing title)
        response = client.post("/todos", json={})
        assert response.status_code == 422
        
        # 404 on non-existent todo for toggle
        response = client.patch("/todos/99999/toggle")
        assert response.status_code == 404

        # Verify the created todo still works
        response = client.get(f"/todos/{todo_id}")
        assert response.status_code == 200
        assert response.json()["title"] == "Test Error"