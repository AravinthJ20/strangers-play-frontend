import { FiZap } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { appConfig } from '../../config';
import '../../agent.css';

export default function AgentFab() {
  const navigate = useNavigate();

  if (!appConfig.features?.agent) return null;

  return (
    <button className="agent-fab" type="button" onClick={() => navigate('/agent')}>
      <span>
        <FiZap className="ui-icon" />
      </span>
      <strong>Agent</strong>
    </button>
  );
}
