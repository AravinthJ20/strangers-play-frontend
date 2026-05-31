import StatusPanelDefault, { StatusPanel as StatusPanelNamed } from './StatusPanel';

export default function StatusPage({ user }) {
  const token = localStorage.getItem('token');
  const StatusPanel = StatusPanelDefault || StatusPanelNamed;
  return <StatusPanel user={user} token={token} embedded />;
}
