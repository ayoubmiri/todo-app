// frontend/src/App.test.js
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the entire API module
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
  
  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });
  
  // Now check for the title
  const title = screen.getByText(/Todo List/i);
  expect(title).toBeInTheDocument();
  
  // Verify the API was called
  expect(api.getTodos).toHaveBeenCalled();
});

test('shows loading state initially', () => {
  render(<App />);
  expect(screen.getByTestId('loading')).toBeInTheDocument();
});