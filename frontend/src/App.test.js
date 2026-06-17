// frontend/src/App.test.js
import { render, screen } from '@testing-library/react';
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
  
  // Use findByText which automatically waits
  const title = await screen.findByText(/Todo List/i);
  expect(title).toBeInTheDocument();
  
  // Verify the API was called
  expect(api.getTodos).toHaveBeenCalled();
});

test('shows loading state initially', () => {
  render(<App />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});