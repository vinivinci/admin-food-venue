import { render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { LoadingProvider } from '../../context/LoadingContexts';
import Register from './Register';

const renderWithRouter = (ui) => {
  const history = createMemoryHistory();
  return { ...render(<LoadingProvider><Router history={history}>{ui}</Router></LoadingProvider>), history };
};

test('shows register button', () => {
  renderWithRouter(<Register />);
  expect(screen.getByText(/registrar/i)).toBeInTheDocument();
});
