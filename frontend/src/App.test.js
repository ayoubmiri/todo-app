import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders todo list', async () => {
  render(<App />);
  
  // Attendre que le chargement soit terminé et que "Todo List" apparaisse
  await waitFor(() => {
    const titleElement = screen.getByText(/Todo List/i);
    expect(titleElement).toBeInTheDocument();
  });
});