import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AgentAssistantPage from '../pages/AgentAssistantPage';
import { fetchPremiumInsights, fetchProfile } from '../services/api';

jest.mock('../services/api', () => ({
  fetchProfile: jest.fn(),
  fetchPremiumInsights: jest.fn()
}));

jest.mock('../hooks/useAgentChat', () => () => ({
  messages: [],
  loading: false,
  bootError: '',
  sendMessage: jest.fn()
}));

jest.mock('../components/ai/AgentChatWindow', () => () => <div data-testid="agent-chat-window" />);

describe('AgentAssistantPage premium experience', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'demo-token');
  });

  it('shows the premium briefing card when the user has premium access', async () => {
    fetchProfile.mockResolvedValue({ premium: true });
    fetchPremiumInsights.mockResolvedValue({
      title: 'Premium AI Briefing',
      summary: 'Your weekly match recap is ready.',
      highlights: ['Priority introductions', 'Smart reminders']
    });

    render(
      <MemoryRouter>
        <AgentAssistantPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Premium AI Briefing/i)).toBeTruthy();
    expect(screen.getByText(/Your weekly match recap is ready/i)).toBeTruthy();
  });
});
