import { motion } from "framer-motion";

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
      <motion.span
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="inline"
      >
        {text}
      </motion.span>
      {isStreaming && (
        <motion.span
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.15, 1] }}
          className="inline-block w-0.5 h-[1.1em] ml-0.5 bg-white align-text-bottom"
          transition={{
            opacity: {
              repeat: Infinity,
              duration: 1,
              ease: "easeInOut",
            },
          }}
        />
      )}
    </div>
  );
}
