type Props = {
  text: string;
  isStreaming: boolean;
};

/**
 * Displays text with a blinking cursor when streaming.
 * Text reveal is handled by useAudioReveal hook, this component just displays.
 */
export function StreamingText({ text, isStreaming }: Props) {
  return (
    <div className="text-sm leading-relaxed text-white inline-flex items-center min-h-[2em] whitespace-pre-wrap">
      <span className="inline animate-in fade-in duration-200">
        {text}
      </span>
      {isStreaming && (
        <span
          className="inline-block w-0.5 h-[1.1em] ml-0.5 bg-white align-text-bottom animate-pulse"
          style={{
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}
