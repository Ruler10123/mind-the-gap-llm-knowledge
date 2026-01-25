import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

type Props = {
  text: string;
  isStreaming: boolean;
};

export function StreamingText({ text, isStreaming }: Props) {
  const [displayedText, setDisplayedText] = useState("");
  const prevTextRef = useRef("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (text === prevTextRef.current) return;

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const prevText = prevTextRef.current;
    const newText = text;

    // If text is longer and starts with previous text, it's new content being added
    if (newText.length > prevText.length && newText.startsWith(prevText)) {
      const newChars = newText.slice(prevText.length);
      let charIndex = 0;
      
      const revealNextChar = () => {
        if (charIndex < newChars.length) {
          setDisplayedText(prevText + newChars.slice(0, charIndex + 1));
          charIndex++;
          // Smooth reveal: reveal characters at ~30ms intervals (adjustable)
          timeoutRef.current = setTimeout(revealNextChar, 30);
        } else {
          setDisplayedText(newText);
          prevTextRef.current = newText;
        }
      };

      // Start revealing characters
      revealNextChar();
    } else {
      // Text was replaced entirely or shortened - update immediately
      setDisplayedText(newText);
      prevTextRef.current = newText;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text]);

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
        {displayedText}
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
