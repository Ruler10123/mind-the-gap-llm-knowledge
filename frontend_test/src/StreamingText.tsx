import { motion } from "framer-motion";

type Props = {
  text: string;
  isStreaming: boolean;
};

export function StreamingText({ text, isStreaming }: Props) {
  return (
    <div
      className="streaming-text"
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: "2em",
        marginTop: 8,
        whiteSpace: "pre-wrap",
        fontFamily: "monospace",
        fontSize: "1rem",
        lineHeight: 1.5,
      }}
    >
      <span style={{ display: "inline" }}>{text}</span>
      {isStreaming && (
        <motion.span
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.15, 1] }}
          style={{
            display: "inline-block",
            width: 2,
            height: "1.1em",
            marginLeft: 1,
            backgroundColor: "currentColor",
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
