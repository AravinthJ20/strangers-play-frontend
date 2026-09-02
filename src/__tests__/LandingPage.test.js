import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';

test('renders landing page hero copy and CTA links', () => {
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );

  
  expect(screen.getByText(/Built For Real Connections/i)).toBeTruthy();
  expect(screen.getByText(/Create Your Account/i)).toBeTruthy();
  expect(screen.getByText(/I already have an account/i)).toBeTruthy();
});
