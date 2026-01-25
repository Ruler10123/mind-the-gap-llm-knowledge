import type { ChangeEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { StreamingText } from "./StreamingText";
import { useSpeechRecognition } from "./useSpeechRecognition";

const wsUrl =
  (location.protocol === "https:" ? "wss:" : "ws:") + "//" + location.host + "/ws";

type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

export function App() {
  const [status, setStatus] = useState("");
  const [logLines, setLogLines] = useState<string[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [connected, setConnected] = useState(false);
  const [hasWs, setHasWs] = useState(false);
  const [input, setInput] = useState("");
  const wsRef = useRef<ReconnectingWebSocket | null>(null);
  const explicitCloseRef = useRef(false);
  const audioQueueRef = useRef<string[]>([]);
  const alignmentRef = useRef<Alignment | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const { isRecording, transcript: micTranscript, toggle: toggleMic, supported: micSupported } = useSpeechRecognition();

  const log = useCallback((msg: string) => {
    setLogLines((prev: string[]) => [...prev, msg]);
  }, []);

  const playAllChunks = useCallback(() => {
    const queue = audioQueueRef.current;
    if (queue.length === 0) {
      log("no audio chunks to play");
      return;
    }

    const align = alignmentRef.current;
    alignmentRef.current = null;

    try {
      let totalLen = 0;
      for (const b64 of queue) {
        totalLen += atob(b64).length;
      }

      const bytes = new Uint8Array(totalLen);
      let offset = 0;
      for (const b64 of queue) {
        const bin = atob(b64);
        for (let i = 0; i < bin.length; i++) {
          bytes[offset++] = bin.charCodeAt(i);
        }
      }
      audioQueueRef.current = [];

      const blob = new Blob([bytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = audioElRef.current;
      if (!audio) {
        URL.revokeObjectURL(url);
        return;
      }

      audio.src = url;
      setStreamingText("");
      setIsStreaming(true);

      let lastIdx = -1;

      const revealByTime = () => {
        if (!align || align.characters.length === 0) return;
        const t = audio.currentTime;
        let idx = lastIdx;
        while (
          idx + 1 < align.character_start_times_seconds.length &&
          align.character_start_times_seconds[idx + 1] <= t
        ) {
          idx += 1;
        }
        if (idx > lastIdx) {
          lastIdx = idx;
          setStreamingText(align.characters.slice(0, idx + 1).join(""));
        }
      };

      audio.ontimeupdate = revealByTime;
      audio.onplay = () => revealByTime();
      audio.onended = () => {
        audio.onplay = null;
        audio.ontimeupdate = null;
        if (align?.characters.length) {
          setStreamingText(align.characters.join(""));
        }
        setIsStreaming(false);
        URL.revokeObjectURL(url);
        log("audio playback complete");
      };

      audio.play().catch((e: Error) => {
        log(`play failed: ${e.message}`);
        setIsStreaming(false);
        URL.revokeObjectURL(url);
      });
      log(`playing ${bytes.length} bytes of audio`);
    } catch (e) {
      audioQueueRef.current = [];
      setIsStreaming(false);
      log(`audio decode failed: ${(e as Error).message}`);
    }
  }, [log]);

  const handleMessage = useCallback(
    (data: string) => {
      try {
        const msg = JSON.parse(data) as {
          type: string;
          content?: string;
          chunk?: string;
          message?: string;
          characters?: string[];
          character_start_times_seconds?: number[];
          character_end_times_seconds?: number[];
        };
        switch (msg.type) {
          case "text":
            log(`AI: ${msg.content ?? ""}`);
            break;
          case "audio":
            const chunk = msg.chunk ?? "";
            if (chunk && typeof chunk === "string") {
              audioQueueRef.current.push(chunk);
              log(`chunk received (${audioQueueRef.current.length} total)`);
            }
            break;
          case "alignment":
            alignmentRef.current = {
              characters: msg.characters ?? [],
              character_start_times_seconds: msg.character_start_times_seconds ?? [],
              character_end_times_seconds: msg.character_end_times_seconds ?? [],
            };
            break;
          case "done":
            log("done - playing all collected audio chunks");
            playAllChunks();
            break;
          case "error":
            audioQueueRef.current = [];
            alignmentRef.current = null;
            log(`error: ${msg.message ?? ""}`);
            break;
          default:
            log(`? ${msg.type}`);
        }
      } catch {
        log(`parse error: ${data.slice(0, 80)}...`);
      }
    },
    [log, playAllChunks]
  );

  const connect = useCallback(() => {
    if (wsRef.current) return;
    explicitCloseRef.current = false;
    setStatus("connecting...");
    const ws = new ReconnectingWebSocket(wsUrl);
    wsRef.current = ws;

    setHasWs(true);
    ws.onopen = () => {
      setStatus("connected");
      setConnected(true);
      log("connected");
    };

    ws.onclose = () => {
      setConnected(false);
      if (explicitCloseRef.current) {
        wsRef.current = null;
        explicitCloseRef.current = false;
        setHasWs(false);
        setStatus("disconnected");
        log("disconnected");
      } else {
        setStatus("reconnecting...");
        log("connection lost, reconnecting...");
      }
    };

    ws.onerror = () => {
      setStatus("error");
      log("ws error");
    };

    ws.onmessage = (e) => handleMessage(e.data);
  }, [log, handleMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      explicitCloseRef.current = true;
      wsRef.current.close();
    }
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      audioQueueRef.current = [];
      alignmentRef.current = null;
      setStreamingText("");
      wsRef.current.send(JSON.stringify({ message: t }));
      log(`You: ${t}`);
    },
    [log]
  );

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput("");
  }, [input, sendMessage]);

  const handleMicComplete = useCallback(
    (finalTranscript: string) => {
      if (finalTranscript) sendMessage(finalTranscript);
    },
    [sendMessage]
  );

  useEffect(() => {
    const logEl = document.getElementById("log");
    if (logEl) logEl.scrollTop = logEl.scrollHeight;
  }, [logLines]);

  return (
    <>
      <div>
        <button onClick={connect} disabled={hasWs}>
          Connect
        </button>
        <button onClick={disconnect} disabled={!connected}>
          Disconnect
        </button>
        <span style={{ marginLeft: 8 }}>{status}</span>
      </div>
      <div>
        <input
          type="text"
          value={input}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && send()}
          placeholder="Message..."
          disabled={!connected}
        />
        <button onClick={send} disabled={!connected}>
          Send
        </button>
        {micSupported && (
          <button
            onClick={() => toggleMic(handleMicComplete)}
            disabled={!connected || (isStreaming && !isRecording)}
            type="button"
            title={isRecording ? "Stop recording and send" : "Start microphone input"}
            style={isRecording ? { background: "#e57373", color: "#fff" } : undefined}
          >
            {isRecording ? "Stop" : "Mic"}
          </button>
        )}
      </div>
      <pre id="log" style={{ maxHeight: 200, overflowY: "auto" }}>
        {logLines.join("\n")}
      </pre>
      <StreamingText
        text={isRecording ? micTranscript : streamingText}
        isStreaming={isRecording || isStreaming}
      />
      <audio ref={audioElRef} style={{ display: "none" }} />
    </>
  );
}
