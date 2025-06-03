import { render, screen, fireEvent } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { LoadingProvider } from '../../context/LoadingContexts';
import { RestaurantContext } from '../../context/RestauranteContext';
import Login from './Login';

const renderWithProviders = (ui, { history } = {}) => {
  history = history || createMemoryHistory();
  const wrapper = (
    <LoadingProvider>
      <RestaurantContext.Provider value={{ setUsuario: jest.fn(), setRestaurante: jest.fn() }}>
        <Router history={history}>{ui}</Router>
      </RestaurantContext.Provider>
    </LoadingProvider>
  );
  return { ...render(wrapper), history };
};

test('redirects to register page when clicking register button', () => {
  const history = createMemoryHistory();
  const { history: hist } = renderWithProviders(<Login />, { history });
  fireEvent.click(screen.getByText(/cadastre-se aqui/i));
  expect(hist.location.pathname).toBe('/cadastro');
});
