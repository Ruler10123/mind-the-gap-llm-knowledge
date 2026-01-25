import React from 'react';

type MarkdownOptions = {
  codeClassName?: string;
};

/**
 * Simple markdown renderer for basic formatting.
 * Handles streaming text gracefully - incomplete markdown will render as plain text.
 * Supports: **bold**, *italic*, `code`
 */
export function renderMarkdown(
  text: string,
  options: MarkdownOptions = {}
): React.ReactNode {
  if (!text) return text;

  const { codeClassName } = options;
  const parts: React.ReactNode[] = [];
  let key = 0;

  // Split by markdown patterns (non-greedy)
  // Matches: **bold**, __bold__, *italic*, _italic_, `code`
  const segments = text.split(/(\*\*.*?\*\*|__.*?__|(?<!\*)\*(?!\*).*?(?<!\*)\*(?!\*)|_.*?_|`.*?`)/g);

  segments.forEach((segment) => {
    if (!segment) return;

    // Bold: **text** or __text__
    if (segment.match(/^\*\*.*\*\*$/) || segment.match(/^__.*__$/)) {
      const content = segment.slice(2, -2);
      parts.push(<strong key={key++}>{content}</strong>);
    }
    // Italic: *text* or _text_ (but not **text**)
    else if (segment.match(/^(?<!\*)\*(?!\*).*(?<!\*)\*(?!\*)$/) || segment.match(/^_.*_$/)) {
      const content = segment.slice(1, -1);
      parts.push(<em key={key++}>{content}</em>);
    }
    // Inline code: `code`
    else if (segment.match(/^`.*`$/)) {
      const content = segment.slice(1, -1);
      const defaultCodeClass = codeClassName || "px-1.5 py-0.5 bg-white/20 rounded text-xs font-mono text-white";
      parts.push(
        <code key={key++} className={defaultCodeClass}>
          {content}
        </code>
      );
    }
    // Plain text
    else {
      parts.push(segment);
    }
  });

  return parts.length > 0 ? parts : text;
}
