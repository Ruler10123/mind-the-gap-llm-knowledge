import { motion } from "framer-motion";
import { renderMarkdown } from "@/utils/markdown";

type Props = {
  text: string;
  isStreaming: boolean;
};

/**
 * Displays text with a blinking cursor when streaming.
 * Text reveal is handled by useAudioReveal hook, this component just displays.
 * Supports markdown rendering for **bold**, *italic*, and `code`.
 */
export function StreamingText({ text, isStreaming }: Props) {
  return (
    <div className="text-sm leading-relaxed text-white whitespace-pre-wrap">
      <span className="inline">
        {renderMarkdown(text)}
        {isStreaming && (
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.15, 1] }}
            className="inline-block w-0.5 h-[1em] ml-0.5 bg-white align-baseline"
            style={{ verticalAlign: 'baseline' }}
            transition={{
              opacity: {
                repeat: Infinity,
                duration: 1,
                ease: "easeInOut",
              },
            }}
          />
        )}
      </span>
    </div>
  );
}
