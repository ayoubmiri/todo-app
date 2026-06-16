import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TodoList from './TodoList';
import * as api from './api';

jest.mock('./api');

const mockTodos = [
  { id: 1, title: 'Test Todo 1', description: 'Desc 1', completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, title: 'Test Todo 2', description: 'Desc 2', completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

describe('TodoList', () => {
  beforeEach(() => {
    api.getTodos.mockResolvedValue(mockTodos);
    api.createTodo.mockResolvedValue({ id: 3, title: 'New Todo', description: null, completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
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
    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });
  });

  test('creates a new todo', async () => {
    render(<TodoList />);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('What needs to be done?');
    const button = screen.getByText('Add Todo');

    fireEvent.change(input, { target: { value: 'New Todo' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(api.createTodo).toHaveBeenCalled();
    });
  });

  test('deletes a todo', async () => {
    render(<TodoList />);
    await waitFor(() => {
      expect(screen.getByText('Test Todo 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.deleteTodo).toHaveBeenCalledWith(1);
    });
  });
});