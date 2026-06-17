// frontend/src/TodoList.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TodoList from './TodoList';
import * as api from './api';

// Mock the API module
jest.mock('./api');

const mockTodos = [
  { id: 1, title: 'Test Todo 1', description: 'Desc 1', completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, title: 'Test Todo 2', description: 'Desc 2', completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Suppress console errors in tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

describe('TodoList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    api.getTodos.mockResolvedValue(mockTodos);
    api.createTodo.mockResolvedValue({ 
      id: 3, 
      title: 'New Todo', 
      description: 'Test description', 
      completed: false, 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString() 
    });
    api.toggleTodo.mockImplementation((id) => {
      const todo = mockTodos.find(t => t.id === id);
      return Promise.resolve({ ...todo, completed: !todo.completed });
    });
    api.deleteTodo.mockResolvedValue();
    api.updateTodo.mockImplementation((id, updates) => {
      const todo = mockTodos.find(t => t.id === id);
      return Promise.resolve({ ...todo, ...updates });
    });
  });

  test('renders todos after loading', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    
    // Check if todos are rendered using data-testid
    await waitFor(() => {
      expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('todo-item-2')).toBeInTheDocument();
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
    });
  });

  test('creates a new todo', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Use data-testid to find elements
    const input = screen.getByTestId('todo-input');
    const descriptionInput = screen.getByTestId('description-input');
    const button = screen.getByTestId('add-button');

    // Fill in the form
    fireEvent.change(input, { target: { value: 'New Todo' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    fireEvent.click(button);

    // Verify createTodo was called with correct data
    await waitFor(() => {
      expect(api.createTodo).toHaveBeenCalledWith({
        title: 'New Todo',
        description: 'Test description'
      });
    });
  });

  test('creates a todo without description', async () => {
    render(<TodoList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const input = screen.getByTestId('todo-input');
    const button = screen.getByTestId('add-button');

    fireEvent.change(input, { target: { value: 'Todo without description' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(api.createTodo).toHaveBeenCalledWith({
        title: 'Todo without description',
        description: null
      });
    });
  });

  test('deletes a todo', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Wait for todos to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
    });

    // Use data-testid to find delete button
    const deleteButton = screen.getByTestId('delete-button-1');
    fireEvent.click(deleteButton);

    // Verify deleteTodo was called with correct ID
    await waitFor(() => {
      expect(api.deleteTodo).toHaveBeenCalledWith(1);
    });
  });

  test('toggles a todo completion status', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Wait for todos to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
    });

    // Use data-testid to find checkbox
    const checkbox = screen.getByTestId('checkbox-1');
    fireEvent.click(checkbox);

    // Verify toggleTodo was called with correct ID
    await waitFor(() => {
      expect(api.toggleTodo).toHaveBeenCalledWith(1);
    });
  });

  test('edits a todo', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Wait for todos to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByTestId('edit-button-1');
    fireEvent.click(editButton);

    // Find edit input and change value
    const editInput = await screen.findByTestId('edit-input-1');
    fireEvent.change(editInput, { target: { value: 'Updated Todo 1' } });

    // Click save button
    const saveButton = screen.getByTestId('save-button-1');
    fireEvent.click(saveButton);

    // Verify updateTodo was called with correct data
    await waitFor(() => {
      expect(api.updateTodo).toHaveBeenCalledWith(1, {
        title: 'Updated Todo 1'
      });
    });
  });

  test('cancels editing a todo', async () => {
    render(<TodoList />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByTestId('edit-button-1');
    fireEvent.click(editButton);

    // Find cancel button and click it
    const cancelButton = await screen.findByTestId('cancel-button-1');
    fireEvent.click(cancelButton);

    // Verify edit mode is cancelled
    await waitFor(() => {
      expect(screen.queryByTestId('edit-input-1')).not.toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    // Override the mock to reject
    api.getTodos.mockRejectedValueOnce(new Error('Network error'));

    render(<TodoList />);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch todos')).toBeInTheDocument();
    });
  });

  test('shows empty state when no todos', async () => {
    // Override mock to return empty array
    api.getTodos.mockResolvedValue([]);

    render(<TodoList />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Check for empty state
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No todos yet! Add one above.')).toBeInTheDocument();
    });
  });
});