// frontend/src/TodoList.js
import React, { useState, useEffect } from 'react';
import { getTodos, createTodo, updateTodo, deleteTodo, toggleTodo } from './api';

function TodoList() {
  // IMPORTANT: This MUST be initialized with an empty array []
  const [todos, setTodos] = useState([]);  // <-- Make sure this is []
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const data = await getTodos();
      setTodos(data || []); // Fallback to empty array if data is undefined
      setError(null);
    } catch (err) {
      setError('Failed to fetch todos');
      if (process.env.NODE_ENV !== 'test') {
        console.error(err);
      }
      setTodos([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const newTodo = await createTodo({
        title: newTitle,
        description: newDescription || null,
      });
      setTodos([...todos, newTodo]);
      setNewTitle('');
      setNewDescription('');
    } catch (err) {
      setError('Failed to create todo');
      if (process.env.NODE_ENV !== 'test') {
        console.error(err);
      }
    }
  };

  const handleToggleTodo = async (id) => {
    try {
      const updatedTodo = await toggleTodo(id);
      setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
    } catch (err) {
      setError('Failed to toggle todo');
      if (process.env.NODE_ENV !== 'test') {
        console.error(err);
      }
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await deleteTodo(id);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      setError('Failed to delete todo');
      if (process.env.NODE_ENV !== 'test') {
        console.error(err);
      }
    }
  };

  const handleStartEdit = (todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
  };

  const handleUpdateTodo = async (id) => {
    if (!editTitle.trim()) return;

    try {
      const updatedTodo = await updateTodo(id, { title: editTitle });
      setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
      setEditingId(null);
      setEditTitle('');
    } catch (err) {
      setError('Failed to update todo');
      if (process.env.NODE_ENV !== 'test') {
        console.error(err);
      }
    }
  };

  if (loading) return <div style={styles.loading} data-testid="loading">Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📝 Todo List</h1>
      
      {error && (
        <div style={styles.error} data-testid="error">
          ❌ Error: {error}
        </div>
      )}

      <form onSubmit={handleCreateTodo} style={styles.form} data-testid="todo-form">
        <input
          type="text"
          placeholder="What needs to be done?"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={styles.input}
          data-testid="todo-input"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          style={styles.input}
          data-testid="description-input"
        />
        <button type="submit" style={styles.button} data-testid="add-button">
          ➕ Add Todo
        </button>
      </form>

      <ul style={styles.list} data-testid="todo-list">
        {todos && todos.map(todo => (  // Add safety check
          <li key={todo.id} style={styles.listItem} data-testid={`todo-item-${todo.id}`}>
            {editingId === todo.id ? (
              <div style={styles.editContainer} data-testid={`edit-container-${todo.id}`}>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={styles.editInput}
                  data-testid={`edit-input-${todo.id}`}
                />
                <button 
                  onClick={() => handleUpdateTodo(todo.id)} 
                  style={styles.saveButton}
                  data-testid={`save-button-${todo.id}`}
                >
                  💾 Save
                </button>
                <button 
                  onClick={() => setEditingId(null)} 
                  style={styles.cancelButton}
                  data-testid={`cancel-button-${todo.id}`}
                >
                  ❌ Cancel
                </button>
              </div>
            ) : (
              <div style={styles.todoContent}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id)}
                  style={styles.checkbox}
                  data-testid={`checkbox-${todo.id}`}
                />
                <div style={styles.todoText}>
                  <span style={{
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    {todo.title}
                  </span>
                  {todo.description && (
                    <span style={{
                      color: '#666',
                      fontSize: '14px',
                      marginTop: '5px'
                    }}>
                      {todo.description}
                    </span>
                  )}
                </div>
                <div>
                  <button 
                    onClick={() => handleStartEdit(todo)} 
                    style={styles.editButton}
                    data-testid={`edit-button-${todo.id}`}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteTodo(todo.id)} 
                    style={styles.deleteButton}
                    data-testid={`delete-button-${todo.id}`}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {(!todos || todos.length === 0) && !loading && (
        <div style={styles.empty} data-testid="empty-state">
          🎉 No todos yet! Add one above.
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '700px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
  },
  loading: {
    textAlign: 'center',
    fontSize: '20px',
    color: 'white',
    marginTop: '50px',
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '16px',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  listItem: {
    backgroundColor: '#f9f9f9',
    marginBottom: '10px',
    padding: '15px',
    borderRadius: '5px',
    transition: 'all 0.3s',
  },
  todoContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    flexWrap: 'wrap',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  todoText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  editButton: {
    padding: '5px 10px',
    backgroundColor: '#ffc107',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    marginRight: '5px',
  },
  deleteButton: {
    padding: '5px 10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  editContainer: {
    display: 'flex',
    gap: '10px',
  },
  editInput: {
    flex: 1,
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '3px',
  },
  saveButton: {
    padding: '5px 10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  cancelButton: {
    padding: '5px 10px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    fontSize: '18px',
  },
};

export default TodoList;