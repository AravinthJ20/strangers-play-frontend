export default function ToolCallBadge({ tool }) {
  if (!tool) return null;
  return <span className="tool-call-badge">{tool}</span>;
}
