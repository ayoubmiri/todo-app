// frontend/src/App.test.js
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

jest.mock('./api', () => ({
  getTodos: jest.fn().mockResolvedValue([]),
  createTodo: jest.fn(),
  updateTodo: jest.fn(),
  deleteTodo: jest.fn(),
  toggleTodo: jest.fn(),
}));

import * as api from './api';

test('renders todo list', async () => {
  render(<App />);
  
  // Wait for loading to finish - this handles the async updates
  await waitFor(() => {
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });
  
  const title = screen.getByText(/Todo List/i);
  expect(title).toBeInTheDocument();
  expect(api.getTodos).toHaveBeenCalled();
});

test('shows loading state initially', () => {
  render(<App />);
  expect(screen.getByTestId('loading')).toBeInTheDocument();
});