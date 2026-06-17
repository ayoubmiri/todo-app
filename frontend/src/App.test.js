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

// Import the mocked module to verify calls if needed
import * as api from './api';

test('renders todo list', async () => {
  render(<App />);
  
  // Wait for the component to load
  await waitFor(() => {
    expect(screen.getByText(/Todo List/i)).toBeInTheDocument();
  });
  
  // Verify the API was called
  expect(api.getTodos).toHaveBeenCalled();
});

test('shows loading state initially', () => {
  render(<App />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});