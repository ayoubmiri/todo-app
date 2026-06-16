import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app import models, crud, schemas
from app.database import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_create_todo_in_db(db_session):
    todo = schemas.TodoCreate(title="DB Test")
    db_todo = crud.create_todo(db_session, todo)
    
    assert db_todo.id is not None
    assert db_todo.title == "DB Test"

def test_get_todos_from_db(db_session):
    crud.create_todo(db_session, schemas.TodoCreate(title="Todo 1"))
    crud.create_todo(db_session, schemas.TodoCreate(title="Todo 2"))
    
    todos = crud.get_todos(db_session)
    assert len(todos) == 2

def test_update_todo_in_db(db_session):
    todo = crud.create_todo(db_session, schemas.TodoCreate(title="Original"))
    updated = crud.update_todo(db_session, todo.id, schemas.TodoUpdate(title="Updated"))
    
    assert updated.title == "Updated"

def test_delete_todo_from_db(db_session):
    todo = crud.create_todo(db_session, schemas.TodoCreate(title="To Delete"))
    result = crud.delete_todo(db_session, todo.id)
    
    assert result == True
    assert crud.get_todo(db_session, todo.id) is None

def test_toggle_complete_in_db(db_session):
    todo = crud.create_todo(db_session, schemas.TodoCreate(title="Toggle"))
    toggled = crud.toggle_complete(db_session, todo.id)
    
    assert toggled.completed == True