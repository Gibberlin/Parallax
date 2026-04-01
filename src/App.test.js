import { render, screen } from '@testing-library/react';
import App from './App';

test('renders loading screen', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /bucky portal boot/i })).toBeInTheDocument();
});
