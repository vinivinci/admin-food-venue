import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';

test('renders not found message', () => {
  render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>
  );
  expect(screen.getByText(/voltar para o início/i)).toBeInTheDocument();
});
