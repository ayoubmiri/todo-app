// frontend/src/TodoList.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TodoList from './TodoList';
import * as api from './api';

// Mock the API
jest.mock('./api');

// Sample todo data
const mockTodos = [
  { id: 1, title: 'Test Todo 1', description: 'Desc 1', completed: false },
  { id: 2, title: 'Test Todo 2', description: 'Desc 2', completed: true },
];

describe('TodoList', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock responses
    api.getTodos.mockResolvedValue(mockTodos);
    api.createTodo.mockResolvedValue({ id: 3, title: 'New Todo', description: '', completed: false });
    api.deleteTodo.mockResolvedValue();
    api.toggleTodo.mockResolvedValue({ id: 1, title: 'Test Todo 1', description: 'Desc 1', completed: true });
    api.updateTodo.mockResolvedValue({ id: 1, title: 'Updated Todo', description: 'Desc 1', completed: false });
  });

  test('displays todos after loading', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Check if todos are displayed
    expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    expect(screen.getByText('Test Todo 2')).toBeInTheDocument();
    expect(screen.getByText('Desc 1')).toBeInTheDocument();
    expect(screen.getByText('Desc 2')).toBeInTheDocument();
  });

  test('creates a new todo', async () => {
    render(<TodoList />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Find input and button
    const input = screen.getByPlaceholderText('What needs to be done?');
    const button = screen.getByText(/Add Todo/i);

    // Type and submit
    fireEvent.change(input, { target: { value: 'New Todo' } });
    fireEvent.click(button);

    // Verify API was called
    await waitFor(() => {
      expect(api.createTodo).toHaveBeenCalledWith({
        title: 'New Todo',
        description: null
      });
    });
  });

  test('deletes a todo', async () => {
    render(<TodoList />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Find delete buttons
    const deleteButtons = screen.getAllByText(/Delete/i);
    fireEvent.click(deleteButtons[0]);

    // Verify API was called
    await waitFor(() => {
      expect(api.deleteTodo).toHaveBeenCalledWith(1);
    });
  });

  test('toggles a todo', async () => {
    render(<TodoList />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Find checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // Verify API was called
    await waitFor(() => {
      expect(api.toggleTodo).toHaveBeenCalledWith(1);
    });
  });
});