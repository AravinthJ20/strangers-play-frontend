export default function ActionSuggestChips({ prompts, onSelect, disabled }) {
  return (
    <div className="agent-quick-prompts">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="agent-prompt-chip"
          onClick={() => onSelect(prompt)}
          disabled={disabled}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
