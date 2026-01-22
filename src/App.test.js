import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Hawk Fuel header', () => {
  render(<App />);
  const headerElement = screen.getByText(/Hawk Fuel/i);
  expect(headerElement).toBeInTheDocument();
});
