import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import * as api from '../services/api';

jest.mock('../services/api');

test('shows an error popup when login fails', async () => {
  api.loginUser.mockRejectedValueOnce({ response: { data: { error: 'Invalid credentials' } } });

  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'user@example.com' } });
  fireEvent.change(screen.getByPlaceholderText(/Password/i), { target: { value: 'password' } });
  fireEvent.click(screen.getByRole('button', { name: /Login/i }));

  const errorTitle = await screen.findByText(/Login Failed/i);
  expect(errorTitle).toBeTruthy();
});
