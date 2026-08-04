import StatusPanelDefault, { StatusPanel as StatusPanelNamed } from '../components/feed/StatusPanel';

export default function StatusPage({ user }) {
  const token = localStorage.getItem('token');
  const StatusPanel = StatusPanelDefault || StatusPanelNamed;
  return <StatusPanel user={user} token={token} embedded />;
}
