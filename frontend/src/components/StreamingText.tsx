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
    <div
      className="streaming-text"
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: "2em",
        whiteSpace: "pre-wrap",
        fontSize: "1rem",
        lineHeight: 1.5,
        color: "white",
      }}
    >
      <motion.span
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{ display: "inline" }}
      >
        {text}
      </motion.span>
      {isStreaming && (
        <motion.span
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.15, 1] }}
          style={{
            display: "inline-block",
            width: 2,
            height: "1.1em",
            marginLeft: 1,
            backgroundColor: "white",
            verticalAlign: "text-bottom",
          }}
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
