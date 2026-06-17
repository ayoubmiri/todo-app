// frontend/src/TodoList.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TodoList from './TodoList';
import * as api from './api';

// Mock BEFORE any imports that use it
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
    // Reset all mocks
    jest.clearAllMocks();
    
    // Configure all mocks BEFORE rendering
    api.getTodos.mockResolvedValue(mockTodos);
    api.createTodo.mockResolvedValue({ 
      id: 3, 
      title: 'New Todo', 
      description: '', 
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
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Check if todos are rendered
    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
      expect(screen.getByText('Desc 1')).toBeInTheDocument();
      expect(screen.getByText('Desc 2')).toBeInTheDocument();
    });
  });

  test('creates a new todo', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Find input and button - use the exact text with emoji
    const input = screen.getByPlaceholderText('What needs to be done?');
    const descriptionInput = screen.getByPlaceholderText('Description (optional)');
    const button = screen.getByText('➕ Add Todo'); // Updated to match actual button text

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

  test('deletes a todo', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Wait for todos to be rendered
    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    // Find delete buttons - use the exact text with emoji
    const deleteButtons = screen.getAllByText('🗑️ Delete'); // Updated to match actual button text
    expect(deleteButtons).toHaveLength(2); // Should have 2 delete buttons
    
    fireEvent.click(deleteButtons[0]);

    // Verify deleteTodo was called with correct ID
    await waitFor(() => {
      expect(api.deleteTodo).toHaveBeenCalledWith(1);
    });
  });

  test('toggles a todo completion status', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Wait for todos to be rendered
    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    // Find checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    
    // Click the first checkbox (for Test Todo 1)
    fireEvent.click(checkboxes[0]);

    // Verify toggleTodo was called with correct ID
    await waitFor(() => {
      expect(api.toggleTodo).toHaveBeenCalledWith(1);
    });
  });

  test('edits a todo', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Wait for todos to be rendered
    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    // Find edit buttons - use the exact text with emoji
    const editButtons = screen.getAllByText('✏️ Edit'); // Updated to match actual button text
    expect(editButtons).toHaveLength(2);
    
    fireEvent.click(editButtons[0]);

    // After clicking edit, the input should appear with the current title
    const editInput = await screen.findByDisplayValue('Test Todo 1');
    fireEvent.change(editInput, { target: { value: 'Updated Todo 1' } });

    // Find save button - you might need to adjust this based on your component
    const saveButton = screen.getByText('💾 Save'); // Adjust if your save button text is different
    fireEvent.click(saveButton);

    // Verify updateTodo was called with correct data
    await waitFor(() => {
      expect(api.updateTodo).toHaveBeenCalledWith(1, {
        title: 'Updated Todo 1',
        description: 'Desc 1'
      });
    });
  });

  test('handles API error gracefully', async () => {
    // Override the mock to reject
    api.getTodos.mockRejectedValueOnce(new Error('Network error'));

    render(<TodoList />);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch todos')).toBeInTheDocument();
    });
  });
});