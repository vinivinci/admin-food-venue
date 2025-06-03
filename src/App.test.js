import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login screen', () => {
  render(<App />);
  const loginText = screen.getByText(/cadastre-se aqui/i);
  expect(loginText).toBeInTheDocument();
});
