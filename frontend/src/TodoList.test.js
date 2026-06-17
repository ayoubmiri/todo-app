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
    jest.clearAllMocks();
    
    api.getTodos.mockResolvedValue(mockTodos);
    api.createTodo.mockResolvedValue({ id: 3, title: 'New Todo', description: '', completed: false });
    api.deleteTodo.mockResolvedValue();
    api.toggleTodo.mockResolvedValue({ id: 1, title: 'Test Todo 1', description: 'Desc 1', completed: true });
    api.updateTodo.mockResolvedValue({ id: 1, title: 'Updated Todo', description: 'Desc 1', completed: false });
  });

  test('displays todos after loading', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish first
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Then check for todos
    const todo1 = await screen.findByText('Test Todo 1');
    const todo2 = await screen.findByText('Test Todo 2');
    
    expect(todo1).toBeInTheDocument();
    expect(todo2).toBeInTheDocument();
  });

  test('creates a new todo', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('What needs to be done?');
    const button = screen.getByText(/Add Todo/i);

    fireEvent.change(input, { target: { value: 'New Todo' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(api.createTodo).toHaveBeenCalledWith({
        title: 'New Todo',
        description: null
      });
    });
  });

  test('deletes a todo', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Wait for todos to appear
    await screen.findByText('Test Todo 1');

    const deleteButtons = screen.getAllByText(/Delete/i);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.deleteTodo).toHaveBeenCalledWith(1);
    });
  });

  test('toggles a todo', async () => {
    render(<TodoList />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Wait for todos to appear
    await screen.findByText('Test Todo 1');

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(api.toggleTodo).toHaveBeenCalledWith(1);
    });
  });
});